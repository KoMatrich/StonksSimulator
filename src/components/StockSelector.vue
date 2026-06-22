<template>
  <div class="stock-selector">
    <button
      v-for="s in STOCKS"
      :key="s.symbol"
      class="stock-btn"
      :class="{ active: s.symbol === modelValue }"
      @click="$emit('update:modelValue', s.symbol)"
    >
      <div class="sb-top-row">
        <div class="sb-sym">{{ s.symbol }}</div>
        <div class="sb-price mono">${{ fmt(useSymbol(s.symbol).price.value) }}</div>
        <div class="sb-change mono" :class="getDir(s.symbol)">
          {{ getChangePct(s.symbol) }}
        </div>
      </div>
      <div class="sb-range-bar-wrap">
        <div class="sb-range-track">
          <div class="sb-range-fill" :style="{ width: getRangeFillPct(s.symbol) + '%' }"></div>
          <div class="sb-range-dot" :style="{ left: getRangeFillPct(s.symbol) + '%' }" :class="getDir(s.symbol)"></div>
        </div>
      </div>
    </button>
  </div>
</template>

<script setup>
import { STOCKS, useSymbol } from '../services/stockSimulator'

defineProps({ modelValue: String })
defineEmits(['update:modelValue'])

function fmt(v) {
  return v >= 1000 ? v.toFixed(2) : v.toFixed(2)
}

function getOpen(symbol) {
  return useSymbol(symbol).candles.value[0]?.open ?? useSymbol(symbol).price.value
}

function getChangePct(symbol) {
  const p = useSymbol(symbol).price.value
  const o = getOpen(symbol)
  const pct = ((p - o) / o * 100)
  return (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%'
}

function getDir(symbol) {
  const p = useSymbol(symbol).price.value
  const o = getOpen(symbol)
  return p >= o ? 'up' : 'down'
}

function getRangeFillPct(symbol) {
  const { candles, live } = useSymbol(symbol)
  const all = live.value ? [...candles.value, live.value] : [...candles.value]
  if (all.length === 0) return 50
  const low  = all.reduce((m, c) => Math.min(m, c.low),  Infinity)
  const high = all.reduce((m, c) => Math.max(m, c.high), -Infinity)
  if (high === low) return 50
  const price = useSymbol(symbol).price.value
  return Math.max(0, Math.min(100, ((price - low) / (high - low)) * 100))
}
</script>

<style scoped>
.stock-selector {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stock-btn {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  padding: 10px 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-family: var(--font);
  color: var(--text-muted);
  transition: all var(--transition);
  text-align: left;
}

.sb-top-row {
  display: grid;
  grid-template-columns: auto 1fr 78px;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.sb-range-bar-wrap { width: 100%; }

.sb-range-track {
  position: relative;
  height: 3px;
  background: var(--border);
  border-radius: 2px;
  width: 100%;
}

.sb-range-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: var(--text-muted);
  border-radius: 2px;
  opacity: 0.4;
  transition: width 0.4s ease;
}

.sb-range-dot {
  position: absolute;
  top: 50%;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: var(--blue);
  transition: left 0.4s ease;
  z-index: 1;
}
.sb-range-dot.down { background: var(--red); }

.stock-btn:hover {
  border-color: var(--blue-dark);
  color: var(--text);
}

.stock-btn.active {
  border-color: var(--blue);
  background: rgba(0, 112, 187, 0.12);
  color: var(--text);
  box-shadow: inset 0 0 0 1px var(--blue);
}

.sb-sym {
  font-weight: 800;
  font-size: 14px;
  letter-spacing: 0.5px;
  color: var(--text);
}

.sb-price {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-align: right;
}

.sb-change {
  font-size: 11px;
  font-weight: 700;
  text-align: right;
  overflow: hidden;
}

.up   { color: var(--blue); }
.down { color: var(--red); }
</style>
