<template>
  <div class="trading-panel card">
    <!-- Stock Header -->
    <div class="tp-header">
      <div>
        <div class="tp-sym">{{ selectedStock.symbol }}</div>
        <div class="tp-name muted">{{ selectedStock.name }}</div>
      </div>
      <div class="tp-price-block">
        <div class="tp-price mono" :class="flashClass" :key="flashKey">
          ${{ fmt(livePrice) }}
        </div>
        <div class="tp-change mono" :class="changeDir">
          {{ changeSign }}${{ Math.abs(changeAbs).toFixed(2) }}
          ({{ changeSign }}{{ Math.abs(changePct).toFixed(2) }}%)
        </div>
      </div>
    </div>

    <div class="tp-divider"></div>

    <!-- Order Entry -->
    <div class="tp-section-label">PLACE ORDER</div>

    <div class="tp-row">
      <label class="tp-label">Quantity</label>
      <input
        type="number"
        v-model.number="qty"
        min="1"
        step="1"
        placeholder="0"
      />
    </div>

    <div class="tp-row">
      <label class="tp-label">Est. Total</label>
      <div class="tp-est mono">
        ${{ (qty * livePrice).toFixed(2) }}
      </div>
    </div>

    <!-- Buttons -->
    <div class="tp-btns">
      <button
        class="btn btn-buy"
        :disabled="qty <= 0 || qty * livePrice > store.balance"
        @click="doBuy"
      >
        ▲ BUY
      </button>
      <button
        class="btn btn-sell"
        :disabled="qty <= 0 || !canSell"
        @click="doSell"
      >
        ▼ SELL
      </button>
    </div>

    <!-- Balance Info -->
    <div class="tp-divider"></div>

    <div class="tp-info-row">
      <span class="muted">Cash Balance</span>
      <span class="mono">${{ store.balance.toFixed(2) }}</span>
    </div>

    <div v-if="myPosition" class="tp-info-row">
      <span class="muted">Held Shares</span>
      <span class="mono">{{ myPosition.qty }}</span>
    </div>
    <div v-if="myPosition" class="tp-info-row">
      <span class="muted">Avg Price</span>
      <span class="mono">${{ myPosition.avgPrice.toFixed(2) }}</span>
    </div>
    <div v-if="myPosition" class="tp-info-row">
      <span class="muted">Unrealized P&amp;L</span>
      <span class="mono" :class="pnlDir">{{ pnlSign }}${{ Math.abs(myPnl).toFixed(2) }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { STOCKS, useSymbol } from '../services/stockSimulator'
import { useTradingStore } from '../stores/tradingStore'

const props  = defineProps({ symbol: String })
const store  = useTradingStore()
const qty    = ref(1)

const selectedStock = computed(() => STOCKS.find(s => s.symbol === props.symbol))
const { price, candles } = useSymbol(props.symbol)

// Recompute when symbol changes
const livePrice = computed(() => useSymbol(props.symbol).price.value)
const openPrice = computed(() => useSymbol(props.symbol).candles.value[0]?.open ?? livePrice.value)

const changeAbs = computed(() => livePrice.value - openPrice.value)
const changePct = computed(() => (changeAbs.value / openPrice.value) * 100)
const changeDir = computed(() => changeAbs.value >= 0 ? 'up' : 'down')
const changeSign = computed(() => changeAbs.value >= 0 ? '+' : '-')

function fmt(v) { return v.toFixed(2) }

// Flash animation on price change
const flashKey   = ref(0)
const flashClass = ref('')
let lastPrice = livePrice.value

watch(livePrice, (nv, ov) => {
  flashClass.value = nv >= ov ? 'flash-up' : 'flash-down'
  flashKey.value++
  setTimeout(() => { flashClass.value = '' }, 500)
})

// Position info
const myPosition = computed(() => store.positions[props.symbol] ?? null)
const canSell    = computed(() => myPosition.value && myPosition.value.qty >= qty.value)

const myPnl = computed(() => {
  if (!myPosition.value) return 0
  return (livePrice.value - myPosition.value.avgPrice) * myPosition.value.qty
})
const pnlDir  = computed(() => myPnl.value >= 0 ? 'up' : 'down')
const pnlSign = computed(() => myPnl.value >= 0 ? '+' : '-')

function doBuy()  { if (qty.value > 0) store.buy(props.symbol,  qty.value, livePrice.value) }
function doSell() { if (qty.value > 0) store.sell(props.symbol, qty.value, livePrice.value) }
</script>

<style scoped>
.trading-panel { display: flex; flex-direction: column; gap: 12px; }

.tp-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.tp-sym   { font-size: 22px; font-weight: 800; letter-spacing: 1px; }
.tp-name  { font-size: 11px; margin-top: 1px; }

.tp-price-block { text-align: right; }
.tp-price { font-size: 20px; font-weight: 700; }
.tp-change { font-size: 12px; font-weight: 600; margin-top: 2px; }

.up   { color: var(--blue); }
.down { color: var(--red); }

.tp-divider { height: 1px; background: var(--border); margin: 2px 0; }

.tp-section-label {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: var(--text-muted);
}

.tp-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tp-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.5px;
}

.tp-est {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
}

.tp-btns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.tp-btns .btn { width: 100%; }

.tp-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
}
</style>
