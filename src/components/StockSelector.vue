<template>
  <div class="stock-selector">
    <button
      v-for="s in STOCKS"
      :key="s.symbol"
      class="stock-btn"
      :class="{ active: s.symbol === modelValue }"
      @click="$emit('update:modelValue', s.symbol)"
    >
      <div class="sb-sym">{{ s.symbol }}</div>
      <div class="sb-price mono">${{ fmt(useSymbol(s.symbol).price.value) }}</div>
      <div class="sb-change mono" :class="getDir(s.symbol)">
        {{ getChangePct(s.symbol) }}
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
</script>

<style scoped>
.stock-selector {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stock-btn {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 8px;
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
  min-width: 54px;
  text-align: right;
}

.up   { color: var(--blue); }
.down { color: var(--red); }
</style>
