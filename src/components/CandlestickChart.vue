<template>
  <div ref="containerEl" class="chart-container"></div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { createChart } from 'lightweight-charts'
import { useSymbol } from '../services/stockSimulator'

const props = defineProps({
  symbol: { type: String, required: true },
})

const containerEl = ref(null)
let chart = null
let candleSeries = null
let volumeSeries = null

// ── Chart theme ──────────────────────────────────────────────────────────────
const CHART_OPTIONS = {
  layout: {
    background: { color: '#111111' },
    textColor:  '#888888',
    fontFamily: "'Dosis', sans-serif",
  },
  grid: {
    vertLines:  { color: '#1e1e1e' },
    horzLines:  { color: '#1e1e1e' },
  },
  crosshair: {
    mode: 0,
    vertLine:  { color: '#444', style: 2, width: 1 },
    horzLine:  { color: '#444', style: 2, width: 1 },
  },
  rightPriceScale: {
    borderColor: '#2a2a2a',
    scaleMargins: { top: 0.05, bottom: 0.25 },
  },
  timeScale: {
    borderColor:     '#2a2a2a',
    timeVisible:     true,
    secondsVisible:  false,
  },
  watermark: { visible: false },
}

const CANDLE_COLORS = {
  upColor:          '#0070BB',
  downColor:        '#E31837',
  borderUpColor:    '#0070BB',
  borderDownColor:  '#E31837',
  wickUpColor:      '#0070BB',
  wickDownColor:    '#E31837',
}

const VOLUME_COLORS = {
  upColor:   'rgba(0, 112, 187, 0.35)',
  downColor: 'rgba(227, 24, 55, 0.35)',
}

// ── Resize observer ───────────────────────────────────────────────────────────
let resizeObserver = null

function initChart() {
  if (!containerEl.value) return

  chart = createChart(containerEl.value, {
    ...CHART_OPTIONS,
    width:  containerEl.value.clientWidth,
    height: containerEl.value.clientHeight,
  })

  candleSeries = chart.addCandlestickSeries(CANDLE_COLORS)

  volumeSeries = chart.addHistogramSeries({
    priceFormat:    { type: 'volume' },
    priceScaleId:   'vol',
    scaleMargins:   { top: 0.82, bottom: 0 },
  })

  resizeObserver = new ResizeObserver(() => {
    if (chart && containerEl.value) {
      chart.applyOptions({
        width:  containerEl.value.clientWidth,
        height: containerEl.value.clientHeight,
      })
    }
  })
  resizeObserver.observe(containerEl.value)

  loadSymbol(props.symbol)
}

function loadSymbol(symbol) {
  const { candles, live } = useSymbol(symbol)

  // Set historical candles
  const all = [...candles.value, live.value].filter(Boolean)
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
    color: c.close >= c.open ? VOLUME_COLORS.upColor : VOLUME_COLORS.downColor,
  })))

  chart.timeScale().fitContent()
}

// Watch for live candle and price updates
let unwatch = null

function watchSymbol(symbol) {
  if (unwatch) unwatch()
  const { live } = useSymbol(symbol)

  unwatch = watch(live, (lv) => {
    if (!lv || !candleSeries) return
    const candle = {
      time:  lv.time,
      open:  lv.open,
      high:  lv.high,
      low:   lv.low,
      close: lv.close,
    }
    candleSeries.update(candle)
    volumeSeries.update({
      time:  lv.time,
      value: lv.volume,
      color: lv.close >= lv.open ? VOLUME_COLORS.upColor : VOLUME_COLORS.downColor,
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
  if (resizeObserver) resizeObserver.disconnect()
  if (chart) chart.remove()
})
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
  border-radius: var(--radius);
  overflow: hidden;
}
</style>
