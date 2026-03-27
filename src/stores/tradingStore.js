import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSymbol } from '../services/stockSimulator'

export const useTradingStore = defineStore('trading', () => {
  const balance   = ref(10000.00)
  const positions = ref({})  // { SYMBOL: { qty, avgPrice } }
  const toasts    = ref([])

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function currentPrice(symbol) {
    return useSymbol(symbol).price.value
  }

  // ── Trade actions ────────────────────────────────────────────────────────────
  function buy(symbol, qty, price) {
    const total = qty * price
    if (total > balance.value) {
      addToast(`Insufficient balance`, 'error')
      return false
    }
    balance.value -= total

    if (!positions.value[symbol]) {
      positions.value[symbol] = { qty: 0, avgPrice: 0 }
    }
    const pos = positions.value[symbol]
    const prevValue = pos.qty * pos.avgPrice
    pos.qty     += qty
    pos.avgPrice = (prevValue + total) / pos.qty

    addToast(`✓ Bought ${qty}× ${symbol} @ $${price.toFixed(2)}`, 'buy')
    return true
  }

  function sell(symbol, qty, price) {
    const pos = positions.value[symbol]
    if (!pos || pos.qty < qty) {
      addToast(`Not enough shares to sell`, 'error')
      return false
    }

    balance.value += qty * price
    pos.qty -= qty
    if (pos.qty === 0) delete positions.value[symbol]

    addToast(`✓ Sold ${qty}× ${symbol} @ $${price.toFixed(2)}`, 'sell')
    return true
  }

  // ── Portfolio value ──────────────────────────────────────────────────────────
  const portfolioValue = computed(() => {
    return Object.entries(positions.value).reduce((sum, [sym, pos]) => {
      return sum + pos.qty * currentPrice(sym)
    }, 0)
  })

  const totalValue = computed(() => balance.value + portfolioValue.value)

  // ── Toast system ─────────────────────────────────────────────────────────────
  function addToast(msg, type = 'buy') {
    const id = Date.now() + Math.random()
    toasts.value.push({ id, msg, type, exiting: false })
    setTimeout(() => {
      const t = toasts.value.find(t => t.id === id)
      if (t) t.exiting = true
      setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id)
      }, 400)
    }, 2600)
  }

  return {
    balance, positions, toasts,
    buy, sell, portfolioValue, totalValue, currentPrice,
  }
})
