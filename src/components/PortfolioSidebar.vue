<template>
  <div class="port-sidebar">
    <!-- Summary -->
    <div class="ps-total card">
      <div class="ps-label">PORTFOLIO</div>
      <div class="ps-value mono">${{ fmtPrice(store.totalValue) }}</div>
      <div class="ps-pnl mono" :class="totalPnl >= 0 ? 'up' : 'down'">
        <span class="sign-w">{{ totalPnl >= 0 ? '+' : '−' }}</span>${{ fmt2(Math.abs(totalPnl)) }}
        &nbsp;(<span class="sign-w">{{ totalPnl >= 0 ? '+' : '−' }}</span>{{ fmt2(Math.abs(totalPnlPct)) }}%)
      </div>
    </div>

    <!-- Balance bar -->
    <div class="ps-balance card">
      <div class="bal-row">
        <span class="muted">Cash</span>
        <span class="mono">${{ fmtPrice(store.balance) }}</span>
      </div>
      <div class="bal-row">
        <span class="muted">Invested</span>
        <span class="mono">${{ fmtPrice(store.portfolioValue) }}</span>
      </div>
      <!-- Split bar -->
      <div class="split-bar">
        <div class="split-cash"  :style="{ width: cashPct + '%' }"></div>
        <div class="split-inv"   :style="{ width: invPct  + '%' }"></div>
      </div>
      <div class="bal-legend">
        <span class="legend-dot cash"></span><span class="muted">Cash {{ fmt2(cashPct) }}%</span>
        <span class="legend-dot inv"></span><span class="muted">Inv. {{ fmt2(invPct)  }}%</span>
      </div>
    </div>

    <!-- Positions  -->
    <div class="ps-label padded">MY POSITIONS</div>

    <div v-if="positions.length === 0" class="ps-empty card">
      No open positions.<br>Start trading!
    </div>

    <div
      v-for="pos in positions"
      :key="pos.symbol"
      class="pos-card card"
    >
      <div class="pos-top">
        <div class="pos-sym">{{ pos.symbol }}</div>
        <div class="pos-pct mono" :class="pos.pnl >= 0 ? 'up' : 'down'">
          <span class="sign-w">{{ pos.pnl >= 0 ? '+' : '−' }}</span>{{ fmt2(Math.abs(pos.pnlPct)) }}%
        </div>
      </div>

      <!-- Allocation bar -->
      <div class="pos-bar-wrap">
        <div class="pos-bar" :style="{ width: pos.allocPct + '%' }"></div>
      </div>

      <div class="pos-details">
        <div class="pos-det-row">
          <span class="muted">Qty</span>
          <span class="mono">{{ pos.qty }}</span>
        </div>
        <div class="pos-det-row">
          <span class="muted">Value</span>
          <span class="mono">${{ fmtPrice(pos.value) }}</span>
        </div>
        <div class="pos-det-row">
          <span class="muted">Avg</span>
          <span class="mono">${{ fmtPrice(pos.avgPrice) }}</span>
        </div>
        <div class="pos-det-row">
          <span class="muted">P&amp;L $</span>
          <span class="mono" :class="pos.pnl >= 0 ? 'up' : 'down'">
            <span class="sign-w">{{ pos.pnl >= 0 ? '+' : '−' }}</span>${{ fmt2(Math.abs(pos.pnl)) }}
          </span>
        </div>
        <div class="pos-det-row full">
          <span class="muted">Alloc.</span>
          <span class="mono">{{ fmt2(pos.allocPct) }}% of portfolio</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTradingStore } from '../stores/tradingStore'
import { useSymbol } from '../services/stockSimulator'

const store = useTradingStore()
const STARTING = 10000

function fmtPrice(v) {
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmt2(v) { return v.toFixed(2) }

const totalPnl    = computed(() => store.totalValue - STARTING)
const totalPnlPct = computed(() => (totalPnl.value / STARTING) * 100)

const cashPct = computed(() => {
  const tv = store.totalValue
  return tv > 0 ? (store.balance / tv) * 100 : 100
})
const invPct = computed(() => 100 - cashPct.value)

const positions = computed(() => {
  const tv = store.totalValue
  return Object.entries(store.positions).map(([sym, pos]) => {
    const p      = useSymbol(sym).price.value
    const value  = pos.qty * p
    const pnl    = (p - pos.avgPrice) * pos.qty
    const pnlPct = ((p - pos.avgPrice) / pos.avgPrice) * 100
    const allocPct = tv > 0 ? (value / tv) * 100 : 0
    return { symbol: sym, qty: pos.qty, avgPrice: pos.avgPrice, value, pnl, pnlPct, allocPct }
  }).sort((a, b) => b.value - a.value)
})
</script>

<style scoped>
.port-sidebar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  overflow-y: auto;
  padding: 12px;
}

.ps-label {
  font-size: 10px; font-weight: 800;
  letter-spacing: 1.5px; color: var(--text-muted);
}
.ps-label.padded { padding: 4px 0 0; }

/* Total card */
.ps-total { text-align: center; }
.ps-value { font-size: 22px; font-weight: 800; margin: 4px 0; }
.ps-pnl   { font-size: 13px; font-weight: 700; }

.up   { color: var(--blue); }
.down { color: var(--red); }

/* Balance card */
.ps-balance { display: flex; flex-direction: column; gap: 6px; }

.bal-row {
  display: flex; justify-content: space-between;
  font-size: 12px; font-weight: 600;
}

.split-bar {
  height: 6px; border-radius: 4px;
  background: var(--border);
  overflow: hidden;
  display: flex;
}
.split-cash { background: var(--text-muted); transition: width 0.4s ease; }
.split-inv  { background: var(--blue);       transition: width 0.4s ease; }

.bal-legend {
  display: flex; gap: 10px; align-items: center;
  font-size: 11px;
}
.legend-dot {
  width: 8px; height: 8px; border-radius: 50%;
  display: inline-block;
}
.legend-dot.cash { background: var(--text-muted); }
.legend-dot.inv  { background: var(--blue); }

/* Position cards */
.pos-card { display: flex; flex-direction: column; gap: 6px; }

.pos-top {
  display: flex; justify-content: space-between; align-items: center;
}
.pos-sym { font-size: 16px; font-weight: 800; letter-spacing: 0.5px; }
.pos-pct { font-size: 14px; font-weight: 700; }

.pos-bar-wrap {
  height: 4px; border-radius: 3px;
  background: var(--border); overflow: hidden;
}
.pos-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--blue-dark), var(--blue));
  border-radius: 3px;
  transition: width 0.5s ease;
  max-width: 100%;
}

.pos-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 8px;
}
.pos-det-row {
  display: flex; justify-content: space-between;
  font-size: 11px; font-weight: 600;
}
.pos-det-row.full { grid-column: 1 / -1; }

.sign-w { display: inline-block; width: 10px; text-align: center; }

.ps-empty {
  text-align: center; color: var(--text-muted);
  font-size: 12px; padding: 20px 12px; line-height: 1.8;
}

.mono { font-variant-numeric: tabular-nums; }
.muted { color: var(--text-muted); }
</style>
