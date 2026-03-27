import { reactive, ref } from 'vue'

export const STOCKS = [
  { symbol: 'NVDA', name: 'NVIDIA Corp.',    price: 875.40, volatility: 0.018, trend: 0.0002 },
  { symbol: 'TSLA', name: 'Tesla Inc.',      price: 248.70, volatility: 0.025, trend: -0.0001 },
  { symbol: 'AAPL', name: 'Apple Inc.',      price: 211.50, volatility: 0.010, trend: 0.0001 },
  { symbol: 'BTC',  name: 'Bitcoin / USD',  price: 67420.0, volatility: 0.030, trend: 0.0003 },
  { symbol: 'SPX',  name: 'S&P 500 Index',  price: 5248.80, volatility: 0.008, trend: 0.0001 },
]

// ─── Random helpers ──────────────────────────────────────────────────────────
function randn() {
  // Box-Muller transform for normal distribution
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)) }

// ─── Per-symbol state ─────────────────────────────────────────────────────────
function createSymbolState(cfg) {
  const CANDLE_SECONDS = 20      // each candle = 20 real seconds
  const TICK_MS        = 250     // live price updates every 250ms

  const candles = ref([])        // completed candles
  const live    = ref(null)      // current in-progress candle
  const price   = ref(cfg.price) // tick-level current price

  let openPrice = cfg.price

  // Generate historical candles going back ~200 candles
  function generateHistory() {
    let p = cfg.price * (0.82 + Math.random() * 0.05)
    const hist = []
    const now = Math.floor(Date.now() / 1000)
    const start = now - 200 * CANDLE_SECONDS

    for (let i = 0; i < 200; i++) {
      const open = p
      // occasional news spike
      const spike = Math.random() < 0.04 ? (Math.random() < 0.5 ? 1 : -1) * cfg.volatility * 4 : 0
      const returns = randn() * cfg.volatility + cfg.trend + spike
      const closeRaw = open * (1 + returns)
      const close = Math.max(closeRaw, 0.01)

      const range = Math.abs(close - open) * (1 + Math.random() * 1.5)
      const high  = Math.max(open, close) + range * Math.random() * 0.8
      const low   = Math.min(open, close) - range * Math.random() * 0.8

      const volume = Math.floor(50000 + Math.random() * 200000 * (1 + Math.abs(returns / cfg.volatility)))

      hist.push({
        time:   start + i * CANDLE_SECONDS,
        open:   +open.toFixed(2),
        high:   +high.toFixed(2),
        low:    +Math.max(low, 0.01).toFixed(2),
        close:  +close.toFixed(2),
        volume,
      })
      p = close
    }

    candles.value = hist
    openPrice = p
    price.value = p

    // seed current live candle
    live.value = {
      time:   now - (now % CANDLE_SECONDS),
      open:   +p.toFixed(2),
      high:   +p.toFixed(2),
      low:    +p.toFixed(2),
      close:  +p.toFixed(2),
      volume: 0,
    }
  }

  generateHistory()

  // ── Tick: update live price and candle ──────────────────────────────────────
  let ticksSinceCandleOpen = 0
  const TICKS_PER_CANDLE = (CANDLE_SECONDS * 1000) / TICK_MS

  function tick() {
    const spike = Math.random() < 0.005
      ? (Math.random() < 0.5 ? 1 : -1) * cfg.volatility * 5
      : 0
    const change = (randn() * cfg.volatility * 0.15 + cfg.trend * 0.1 + spike)
    const newPrice = Math.max(price.value * (1 + change), 0.01)
    price.value = newPrice

    const lv = live.value
    lv.close  = +newPrice.toFixed(2)
    lv.high   = +Math.max(lv.high, newPrice).toFixed(2)
    lv.low    = +Math.min(lv.low,  newPrice).toFixed(2)
    lv.volume += Math.floor(200 + Math.random() * 800)

    ticksSinceCandleOpen++

    if (ticksSinceCandleOpen >= TICKS_PER_CANDLE) {
      // close candle, start new one
      candles.value.push({ ...lv })
      if (candles.value.length > 300) candles.value.shift()

      openPrice = newPrice
      ticksSinceCandleOpen = 0
      live.value = {
        time:   lv.time + CANDLE_SECONDS,
        open:   +newPrice.toFixed(2),
        high:   +newPrice.toFixed(2),
        low:    +newPrice.toFixed(2),
        close:  +newPrice.toFixed(2),
        volume: 0,
      }
    }
  }

  const intervalId = setInterval(tick, TICK_MS)

  return { candles, live, price, intervalId }
}

// ─── Singleton store of all symbols ──────────────────────────────────────────
const states = {}

export function useSymbol(symbol) {
  if (!states[symbol]) {
    const cfg = STOCKS.find(s => s.symbol === symbol)
    if (!cfg) throw new Error(`Unknown symbol: ${symbol}`)
    states[symbol] = createSymbolState(cfg)
  }
  return states[symbol]
}

// Pre-warm all symbols so ticker bar works immediately
STOCKS.forEach(s => useSymbol(s.symbol))
