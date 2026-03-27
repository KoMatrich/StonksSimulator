<template>
  <div ref="containerEl" class="chart-container"></div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts'
import { useSymbol } from '../services/stockSimulator'

const props = defineProps({
  symbol: { type: String, required: true },
})

const containerEl = ref(null)
let chart         = null
let candleSeries  = null
let volumeSeries  = null

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
.chart-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: var(--radius);
}
</style>
