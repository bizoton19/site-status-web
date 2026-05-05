<template>
  <div class="stats-grid">
    <div class="stat-card success-top">
      <div class="stat-card-header">
        <div>
          <div class="stat-card-title">Online</div>
          <div class="stat-card-value">{{ onlineCount }}</div>
          <div class="stat-card-trend up">
            {{ uptimePercentage }}% of monitored endpoints
          </div>
        </div>
        <div class="stat-card-icon" aria-hidden="true">
          <i class="bi bi-check-lg"></i>
        </div>
      </div>
    </div>

    <div class="stat-card danger-top">
      <div class="stat-card-header">
        <div>
          <div class="stat-card-title">Offline</div>
          <div class="stat-card-value">{{ offlineCount }}</div>
          <div class="stat-card-trend" :class="{ down: offlineCount > 0 }">
            {{ offlineCount > 0 ? 'Review failed endpoints' : 'None' }}
          </div>
        </div>
        <div class="stat-card-icon" aria-hidden="true">
          <i class="bi bi-x-lg"></i>
        </div>
      </div>
    </div>

    <div class="stat-card accent-top">
      <div class="stat-card-header">
        <div>
          <div class="stat-card-title">Monitored</div>
          <div class="stat-card-value">{{ totalCount }}</div>
          <div class="stat-card-trend">Configured URLs</div>
        </div>
        <div class="stat-card-icon" aria-hidden="true">
          <i class="bi bi-table"></i>
        </div>
      </div>
    </div>

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
