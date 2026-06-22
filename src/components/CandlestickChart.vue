<template>
  <div class="chart-wrapper">
    <!-- OHLCV Header Strip -->
    <div class="ohlcv-strip mono">
      <span class="ohlcv-sym">{{ props.symbol }}</span>
      <span class="badge badge-neutral ohlcv-tf">20s</span>
      <span class="ohlcv-sep">│</span>
      <span class="ohlcv-item">O <span class="ohlcv-val">${{ ohlcv.open }}</span></span>
      <span class="ohlcv-item">H <span class="ohlcv-val up">${{ ohlcv.high }}</span></span>
      <span class="ohlcv-item">L <span class="ohlcv-val down">${{ ohlcv.low }}</span></span>
      <span class="ohlcv-item">C <span class="ohlcv-val" :class="ohlcv.dir">${{ ohlcv.close }}</span></span>
      <span class="ohlcv-item">Vol <span class="ohlcv-val">{{ ohlcv.vol }}</span></span>
    </div>
    <!-- Chart Canvas -->
    <div ref="containerEl" class="chart-container"></div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts'
import { useSymbol } from '../services/stockSimulator'

const props = defineProps({
  symbol: { type: String, required: true },
})

const containerEl = ref(null)
let chart         = null
let candleSeries  = null
let volumeSeries  = null

// ─── OHLCV strip state ────────────────────────────────────────────────────────
const hoveredCandle = ref(null)

const latestCandle = computed(() => {
  const { candles, live } = useSymbol(props.symbol)
  return live.value ?? candles.value[candles.value.length - 1] ?? null
})

function fmtOHLCV(v) {
  if (v === null || v === undefined) return '—'
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtVol(v) {
  if (!v) return '0'
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M'
  if (v >= 1_000)     return (v / 1_000).toFixed(0) + 'K'
  return String(v)
}

const ohlcv = computed(() => {
  const c = hoveredCandle.value ?? latestCandle.value
  if (!c) return { open: '—', high: '—', low: '—', close: '—', vol: '—', dir: '' }
  return {
    open:  fmtOHLCV(c.open),
    high:  fmtOHLCV(c.high),
    low:   fmtOHLCV(c.low),
    close: fmtOHLCV(c.close),
    vol:   fmtVol(c.volume),
    dir:   c.close >= c.open ? 'up' : 'down',
  }
})

// ─── Chart theme ──────────────────────────────────────────────────────────────
const CHART_OPTIONS = {
  layout: {
    background: { color: '#111111' },
    textColor:  '#888888',
    fontFamily: "'Dosis', sans-serif",
  },
  grid: {
    vertLines: { color: '#1e1e1e' },
    horzLines: { color: '#1e1e1e' },
  },
  crosshair: {
    vertLine: { color: '#444', style: 2, width: 1 },
    horzLine: { color: '#444', style: 2, width: 1 },
  },
  rightPriceScale: {
    borderColor:  '#2a2a2a',
    scaleMargins: { top: 0.05, bottom: 0.25 },
  },
  timeScale: {
    borderColor:    '#2a2a2a',
    timeVisible:    true,
    secondsVisible: false,
  },
}

const CANDLE_OPTS = {
  upColor:         '#0070BB',
  downColor:       '#E31837',
  borderUpColor:   '#0070BB',
  borderDownColor: '#E31837',
  wickUpColor:     '#0070BB',
  wickDownColor:   '#E31837',
}

const UP_VOL   = 'rgba(0, 112, 187, 0.35)'
const DOWN_VOL = 'rgba(227, 24, 55, 0.35)'

// ─── Resize observer ───────────────────────────────────────────────────────────
let ro = null

function initChart() {
  if (!containerEl.value) return

  chart = createChart(containerEl.value, {
    ...CHART_OPTIONS,
    width:  containerEl.value.clientWidth,
    height: containerEl.value.clientHeight,
    autoSize: true,
  })

  // v5 API: chart.addSeries(SeriesType, options)
  candleSeries = chart.addSeries(CandlestickSeries, CANDLE_OPTS)

  volumeSeries = chart.addSeries(HistogramSeries, {
    priceFormat:  { type: 'volume' },
    priceScaleId: 'vol',
  })
  volumeSeries.priceScale().applyOptions({
    scaleMargins: { top: 0.82, bottom: 0 },
  })

  ro = new ResizeObserver(() => {
    if (chart && containerEl.value) {
      chart.applyOptions({
        width:  containerEl.value.clientWidth,
        height: containerEl.value.clientHeight,
      })
    }
  })
  ro.observe(containerEl.value)

  chart.subscribeCrosshairMove((param) => {
    if (!param || !param.time) {
      hoveredCandle.value = null
      return
    }
    const bar    = param.seriesData.get(candleSeries)
    const volBar = param.seriesData.get(volumeSeries)
    if (bar) {
      hoveredCandle.value = {
        open:   bar.open,
        high:   bar.high,
        low:    bar.low,
        close:  bar.close,
        volume: volBar?.value ?? 0,
      }
    } else {
      hoveredCandle.value = null
    }
  })

  loadSymbol(props.symbol)
}

function loadSymbol(symbol) {
  const { candles, live } = useSymbol(symbol)

  const completed = candles.value
  const all = live.value
    ? [...completed, live.value]
    : [...completed]

  // Sort by time to be safe
  all.sort((a, b) => a.time - b.time)

  candleSeries.setData(all.map(c => ({
    time:  c.time,
    open:  c.open,
    high:  c.high,
    low:   c.low,
    close: c.close,
  })))

  volumeSeries.setData(all.map(c => ({
    time:  c.time,
    value: c.volume,
    color: c.close >= c.open ? UP_VOL : DOWN_VOL,
  })))

  chart.timeScale().fitContent()
}

// ─── Watch live candle ────────────────────────────────────────────────────────
let unwatch = null

function watchSymbol(symbol) {
  if (unwatch) { unwatch(); unwatch = null }
  const { live } = useSymbol(symbol)

  unwatch = watch(live, (lv) => {
    if (!lv || !candleSeries) return
    candleSeries.update({
      time:  lv.time,
      open:  lv.open,
      high:  lv.high,
      low:   lv.low,
      close: lv.close,
    })
    volumeSeries.update({
      time:  lv.time,
      value: lv.volume,
      color: lv.close >= lv.open ? UP_VOL : DOWN_VOL,
    })
  }, { deep: true })
}

watch(() => props.symbol, (sym) => {
  if (!chart) return
  loadSymbol(sym)
  watchSymbol(sym)
})

onMounted(() => {
  initChart()
  watchSymbol(props.symbol)
})

onUnmounted(() => {
  if (unwatch) unwatch()
  if (ro) ro.disconnect()
  if (chart) chart.remove()
})
</script>

<style scoped>
.chart-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: var(--radius);
}

.ohlcv-strip {
  display: flex;
  align-items: center;
  gap: 14px;
  height: 30px;
  padding: 0 14px;
  background: #0e0e0e;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  border-radius: var(--radius) var(--radius) 0 0;
  overflow: hidden;
}

.ohlcv-sym {
  font-size: 13px;
  font-weight: 800;
  color: var(--text);
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.ohlcv-tf { margin-left: 2px; flex-shrink: 0; }

.ohlcv-sep { color: var(--border); margin: 0 2px; flex-shrink: 0; }

.ohlcv-item {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.3px;
  flex-shrink: 0;
}

.ohlcv-val {
  font-weight: 700;
  color: var(--text);
  margin-left: 2px;
}

.chart-container {
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.up   { color: var(--blue); }
.down { color: var(--red); }
</style>
