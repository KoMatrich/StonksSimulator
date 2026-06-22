<template>
  <div class="ticker-wrap">
    <div class="ticker-inner" :style="{ animationDuration: animDuration }">
      <div
        v-for="s in displayItems"
        :key="s.key"
        class="ticker-item"
        :class="s.dir"
      >
        <span class="ticker-sym">{{ s.symbol }}</span>
        <span class="ticker-price mono">${{ fmt(s.price) }}</span>
        <span class="ticker-change mono">
          <span class="tsign">{{ s.change >= 0 ? '▲' : '▼' }}</span>{{ Math.abs(s.changePct).toFixed(2) }}%
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { STOCKS, useSymbol } from '../services/stockSimulator'

const stocks = STOCKS.map(s => {
  const sym = useSymbol(s.symbol)
  return { config: s, sym }
})

function fmt(v) {
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const items = computed(() =>
  stocks.map(({ config, sym }) => {
    const price  = sym.price.value
    const open   = sym.candles.value[0]?.open ?? price
    const change = price - open
    const pct    = (change / open) * 100
    return {
      symbol:    config.symbol,
      price,
      change,
      changePct: pct,
      dir:       change >= 0 ? 'up' : 'down',
    }
  })
)

// duplicate items for seamless loop
const displayItems = computed(() =>
  [...items.value, ...items.value].map((it, i) => ({ ...it, key: `${it.symbol}-${i}` }))
)

const animDuration = computed(() => `${STOCKS.length * 6}s`)
</script>

<style scoped>
.ticker-wrap {
  overflow: hidden;
  background: var(--panel);
  border-bottom: 1px solid var(--border);
  height: 38px;
  display: flex;
  align-items: center;
}

.ticker-inner {
  display: flex;
  gap: 0;
  animation: ticker-scroll linear infinite;
  white-space: nowrap;
  will-change: transform;
}

@keyframes ticker-scroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.ticker-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 28px;
  border-right: none;
  border-left: 1px solid var(--border);
  height: 38px;
  width: 180px;
}

.ticker-item:hover { background: var(--surface); }

.tsign { display: inline-block; width: 10px; text-align: center; }

.ticker-sym {
  font-weight: 800;
  font-size: 13px;
  letter-spacing: 0.5px;
  color: var(--text);
}

.ticker-price {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.ticker-change {
  font-size: 12px;
  font-weight: 700;
}

.ticker-item.up   .ticker-change { color: var(--blue); }
.ticker-item.down .ticker-change { color: var(--red); }
</style>
