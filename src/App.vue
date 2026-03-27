<template>
  <div class="app-shell">
    <!-- ── Ticker Bar ──────────────────────────────────────────────────── -->
    <header class="app-header">
      <div class="brand">
        <span class="brand-icon"></span>
        <span class="brand-name">Tour De <span class="brand-accent">Stonks</span></span>
      </div>
      <TickerBar />
      <div class="brand-time mono">{{ clock }}</div>
    </header>

    <!-- ── Main Layout ─────────────────────────────────────────────────── -->
    <div class="app-body">

      <!-- Left: Stock Selector + Trading Panel -->
      <aside class="sidebar-left">
        <div class="section-label">MARKETS</div>
        <StockSelector v-model="selectedSymbol" />
        <div class="sidebar-spacer"></div>
        <TradingPanel :symbol="selectedSymbol" />
      </aside>

      <!-- Center: Chart + Portfolio Table -->
      <main class="main-area">
        <div class="chart-area card">
          <CandlestickChart :symbol="selectedSymbol" :key="selectedSymbol" />
        </div>
        <Portfolio />
      </main>

      <!-- Right: Portfolio Sidebar (positions + %) -->
      <aside class="sidebar-right">
        <PortfolioSidebar />
      </aside>
    </div>

    <!-- ── Toasts ──────────────────────────────────────────────────────── -->
    <div class="toast">
      <div
        v-for="t in store.toasts"
        :key="t.id"
        class="toast-item"
        :class="[t.type, t.exiting ? 'exit' : '']"
      >{{ t.msg }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import TickerBar        from './components/TickerBar.vue'
import StockSelector    from './components/StockSelector.vue'
import CandlestickChart from './components/CandlestickChart.vue'
import TradingPanel     from './components/TradingPanel.vue'
import Portfolio        from './components/Portfolio.vue'
import PortfolioSidebar from './components/PortfolioSidebar.vue'
import { useTradingStore } from './stores/tradingStore'

const store          = useTradingStore()
const selectedSymbol = ref('NVDA')

const clock = ref('')
let clockId
function updateClock() {
  clock.value = new Date().toLocaleTimeString('en-US', { hour12: false })
}
onMounted(()   => { updateClock(); clockId = setInterval(updateClock, 1000) })
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

/* ── Header ──────────────────────────────────────────────────────────── */
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
  display: flex; align-items: center; gap: 6px;
  padding: 0 16px;
  border-right: 1px solid var(--border);
  height: 100%;
}
.brand-icon { font-size: 16px; }
.brand-name { font-size: 15px; font-weight: 800; letter-spacing: 1.5px; }
.brand-accent { color: #EF8A17; }

.brand-time {
  font-size: 12px; font-weight: 600; color: var(--text-muted);
  padding: 0 16px; border-left: 1px solid var(--border);
  height: 100%; display: flex; align-items: center; justify-content: center;
}

/* ── Body ─────────────────────────────────────────────────────────────── */
.app-body {
  display: grid;
  grid-template-columns: 250px 1fr 250px;
  flex: 1;
  overflow: hidden;
}

/* ── Left Sidebar ─────────────────────────────────────────────────────── */
.sidebar-left {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  overflow-y: auto;
  border-right: 1px solid var(--border);
}

.section-label {
  font-size: 10px; font-weight: 800;
  letter-spacing: 1.5px; color: var(--text-muted);
}

.sidebar-spacer { flex: 1; min-height: 12px; }

/* ── Right Sidebar ─────────────────────────────────────────────────────── */
.sidebar-right {
  border-left: 1px solid var(--border);
  overflow: hidden;
}

/* ── Main Area ───────────────────────────────────────────────────────── */
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
