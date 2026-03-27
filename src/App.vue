<template>
  <div class="app-shell">
    <!-- ── Ticker Bar ────────────────────────────────────────────────────── -->
    <header class="app-header">
      <div class="brand">
        <span class="brand-icon">📈</span>
        <span class="brand-name">STONKS<span class="brand-accent">PRO</span></span>
      </div>
      <TickerBar />
      <div class="brand-time mono">{{ clock }}</div>
    </header>

    <!-- ── Main Layout ───────────────────────────────────────────────────── -->
    <div class="app-body">

      <!-- Left Sidebar: Stock Selector -->
      <aside class="sidebar-left">
        <div class="section-label">MARKETS</div>
        <StockSelector v-model="selectedSymbol" />
      </aside>

      <!-- Center: Chart + Portfolio -->
      <main class="main-area">
        <div class="chart-area card">
          <CandlestickChart :symbol="selectedSymbol" :key="selectedSymbol" />
        </div>
        <Portfolio />
      </main>

      <!-- Right Sidebar: Trading Panel -->
      <aside class="sidebar-right">
        <TradingPanel :symbol="selectedSymbol" />
      </aside>
    </div>

    <!-- ── Toast Notifications ───────────────────────────────────────────── -->
    <div class="toast">
      <div
        v-for="t in store.toasts"
        :key="t.id"
        class="toast-item"
        :class="[t.type, t.exiting ? 'exit' : '']"
      >
        {{ t.msg }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import TickerBar       from './components/TickerBar.vue'
import StockSelector   from './components/StockSelector.vue'
import CandlestickChart from './components/CandlestickChart.vue'
import TradingPanel    from './components/TradingPanel.vue'
import Portfolio       from './components/Portfolio.vue'
import { useTradingStore } from './stores/tradingStore'

const store          = useTradingStore()
const selectedSymbol = ref('NVDA')

// Live clock
const clock = ref('')
function updateClock() {
  clock.value = new Date().toLocaleTimeString('en-US', { hour12: false })
}
let clockId
onMounted(()  => { updateClock(); clockId = setInterval(updateClock, 1000) })
onUnmounted(() => clearInterval(clockId))
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: var(--bg);
}

/* ── Header ─────────────────────────────────────────────────────────────── */
.app-header {
  display: grid;
  grid-template-columns: 160px 1fr 100px;
  align-items: center;
  height: 38px;
  border-bottom: 1px solid var(--border);
  background: var(--panel);
  flex-shrink: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  border-right: 1px solid var(--border);
  height: 100%;
}

.brand-icon { font-size: 16px; }
.brand-name {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: var(--text);
}
.brand-accent { color: var(--red); }

.brand-time {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  padding: 0 16px;
  border-left: 1px solid var(--border);
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Body ────────────────────────────────────────────────────────────────── */
.app-body {
  display: grid;
  grid-template-columns: 180px 1fr 240px;
  flex: 1;
  overflow: hidden;
  gap: 0;
}

/* ── Sidebars ─────────────────────────────────────────────────────────────── */
.sidebar-left,
.sidebar-right {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  overflow-y: auto;
  border-right: 1px solid var(--border);
}

.sidebar-right { border-right: none; border-left: 1px solid var(--border); }

.section-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: var(--text-muted);
  padding-bottom: 4px;
}

/* ── Main ─────────────────────────────────────────────────────────────────── */
.main-area {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  gap: 10px;
  padding: 12px;
}

.chart-area {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 0;
}
</style>
