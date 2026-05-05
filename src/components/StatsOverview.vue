<template>
  <div class="stats-grid">
    <button
      type="button"
      class="stat-card stat-card-clickable success-top"
      @click="emit('navigate-statuses', 'online')"
    >
      <div class="stat-card-header">
        <div>
          <div class="stat-card-title">Online</div>
          <div class="stat-card-value">{{ onlineCount }}</div>
          <div class="stat-card-trend up">
            {{ uptimePercentage }}% OK in latest poll · Open list
          </div>
        </div>
        <div class="stat-card-icon" aria-hidden="true">
          <i class="bi bi-check-lg"></i>
        </div>
      </div>
    </button>

    <button
      type="button"
      class="stat-card stat-card-clickable danger-top"
      @click="emit('navigate-statuses', 'offline')"
    >
      <div class="stat-card-header">
        <div>
          <div class="stat-card-title">Offline</div>
          <div class="stat-card-value">{{ offlineCount }}</div>
          <div class="stat-card-trend" :class="{ down: offlineCount > 0 }">
            {{ offlineCount > 0 ? 'Review failed endpoints · Open list' : 'None' }}
          </div>
        </div>
        <div class="stat-card-icon" aria-hidden="true">
          <i class="bi bi-x-lg"></i>
        </div>
      </div>
    </button>

    <button
      type="button"
      class="stat-card stat-card-clickable accent-top"
      @click="emit('navigate-statuses', 'all')"
    >
      <div class="stat-card-header">
        <div>
          <div class="stat-card-title">Monitored</div>
          <div class="stat-card-value">{{ totalCount }}</div>
          <div class="stat-card-trend">All endpoints · Open list</div>
        </div>
        <div class="stat-card-icon" aria-hidden="true">
          <i class="bi bi-table"></i>
        </div>
      </div>
    </button>

    <div class="stat-card neutral-top">
      <div class="stat-card-header">
        <div>
          <div class="stat-card-title">Last check</div>
          <div class="stat-card-value">{{ lastCheckTime }}</div>
          <div class="stat-card-trend">{{ lastCheckDate }}</div>
        </div>
        <div class="stat-card-icon" aria-hidden="true">
          <i class="bi bi-calendar3"></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  statuses: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['navigate-statuses'])

const onlineCount = computed(() =>
  props.statuses.filter(s => s.status === 'OK').length
)

const offlineCount = computed(() =>
  props.statuses.filter(s => s.status !== 'OK').length
)

const totalCount = computed(() => props.statuses.length)

const uptimePercentage = computed(() => {
  if (props.statuses.length === 0) return 0
  return Math.round((onlineCount.value / props.statuses.length) * 100)
})

const lastCheckTime = computed(() => {
  if (props.statuses.length === 0) return '—'
  const dates = props.statuses.map(s => new Date(s.date)).filter(d => !isNaN(d))
  if (dates.length === 0) return '—'
  const latest = new Date(Math.max(...dates))
  return latest.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
})

const lastCheckDate = computed(() => {
  if (props.statuses.length === 0) return 'No data'
  const dates = props.statuses.map(s => new Date(s.date)).filter(d => !isNaN(d))
  if (dates.length === 0) return 'No data'
  const latest = new Date(Math.max(...dates))
  return latest.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
})
</script>

<style scoped>
.stat-card-clickable {
  width: 100%;
  text-align: left;
  cursor: pointer;
  font: inherit;
  color: inherit;
  background: var(--surface);
  appearance: none;
  -webkit-appearance: none;
  border: 1px solid var(--border);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.stat-card-clickable:hover {
  border-color: #b8c0cc;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.stat-card-clickable:focus {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
</style>
