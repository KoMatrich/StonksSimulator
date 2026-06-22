<template>
  <div class="portfolio card">
    <div class="port-header">
      <div class="port-title">PORTFOLIO</div>
      <div class="port-total">
        <span class="muted" style="font-size:11px">Total Value</span>
        <span class="port-value mono">${{ store.totalValue.toFixed(2) }}</span>
        <span class="port-pnl mono" :class="totalPnlDir">
          {{ totalPnl >= 0 ? '+' : '' }}${{ totalPnl.toFixed(2) }}
          ({{ totalPnlPct >= 0 ? '+' : '' }}{{ totalPnlPct.toFixed(2) }}%)
        </span>
      </div>
    </div>

    <div class="port-balance-row">
      <span class="muted">Cash</span>
      <span class="mono">${{ store.balance.toFixed(2) }}</span>
      <span class="muted">│</span>
      <span class="muted">Invested</span>
      <span class="mono">${{ store.portfolioValue.toFixed(2) }}</span>
    </div>

    <!-- Positions table -->
    <div v-if="Object.keys(store.positions).length > 0" class="port-table-wrap">
      <table class="port-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th class="right">Qty</th>
            <th class="right">Avg</th>
            <th class="right">Price</th>
            <th class="right">Value</th>
            <th class="right">P&amp;L</th>
            <th class="right">%</th>
            <th class="right">Day %</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(pos, sym) in store.positions" :key="sym">
            <td class="sym">{{ sym }}</td>
            <td class="right mono">{{ pos.qty }}</td>
            <td class="right mono">${{ pos.avgPrice.toFixed(2) }}</td>
            <td class="right mono">${{ price(sym).toFixed(2) }}</td>
            <td class="right mono">${{ (pos.qty * price(sym)).toFixed(2) }}</td>
            <td class="right mono" :class="pnl(pos, sym) >= 0 ? 'up' : 'down'">
              {{ pnl(pos, sym) >= 0 ? '+' : '' }}${{ Math.abs(pnl(pos, sym)).toFixed(2) }}
            </td>
            <td class="right mono" :class="pnl(pos, sym) >= 0 ? 'up' : 'down'">
              {{ pnlPct(pos, sym) >= 0 ? '+' : '' }}{{ pnlPct(pos, sym).toFixed(2) }}%
            </td>
            <td class="right mono" :class="dayChangePct(sym) >= 0 ? 'up' : 'down'">
              {{ dayChangePct(sym) >= 0 ? '+' : '' }}{{ dayChangePct(sym).toFixed(2) }}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="port-empty">
      No open positions. Start trading!
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTradingStore } from '../stores/tradingStore'
import { useSymbol } from '../services/stockSimulator'

const store = useTradingStore()

const STARTING_BALANCE = 10000

function price(sym) { return useSymbol(sym).price.value }
function pnl(pos, sym) { return (price(sym) - pos.avgPrice) * pos.qty }
function pnlPct(pos, sym) { return ((price(sym) - pos.avgPrice) / pos.avgPrice) * 100 }

function dayOpen(sym) {
  return useSymbol(sym).candles.value[0]?.open ?? price(sym)
}
function dayChangePct(sym) {
  const o = dayOpen(sym)
  return o === 0 ? 0 : ((price(sym) - o) / o) * 100
}

const totalPnl    = computed(() => store.totalValue - STARTING_BALANCE)
const totalPnlPct = computed(() => (totalPnl.value / STARTING_BALANCE) * 100)
const totalPnlDir = computed(() => totalPnl.value >= 0 ? 'up' : 'down')
</script>

<style scoped>
.portfolio { display: flex; flex-direction: column; gap: 10px; }

.port-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.port-title {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: var(--text-muted);
}

.port-total { text-align: right; display: flex; flex-direction: column; gap: 2px; }
.port-value { font-size: 18px; font-weight: 700; }
.port-pnl   { font-size: 12px; font-weight: 600; }

.up   { color: var(--blue); }
.down { color: var(--red); }
.muted { color: var(--text-muted); }

.port-balance-row {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  flex-wrap: wrap;
}

.port-table-wrap { overflow-x: auto; }

.port-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.port-table th {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.8px;
  color: var(--text-muted);
  padding: 4px 6px;
  border-bottom: 1px solid var(--border);
}

.port-table td {
  padding: 6px 6px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  font-weight: 600;
}

.port-table .sym { font-weight: 800; font-size: 13px; letter-spacing: 0.5px; }
.right { text-align: right; }
.mono  { font-variant-numeric: tabular-nums; }

.port-empty {
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
  padding: 16px 0;
}
</style>
