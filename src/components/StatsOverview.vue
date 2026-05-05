<template>
  <div class="stats-grid">
    <div class="stat-card success">
      <div class="stat-card-header">
        <div>
          <div class="stat-card-title">Online Sites</div>
          <div class="stat-card-value">{{ onlineCount }}</div>
          <div class="stat-card-trend up">
            <i class="bi bi-arrow-up"></i>
            {{ uptimePercentage }}% uptime
          </div>
        </div>
        <div class="stat-card-icon">
          <i class="bi bi-check-circle-fill"></i>
        </div>
      </div>
    </div>
    
    <div class="stat-card danger">
      <div class="stat-card-header">
        <div>
          <div class="stat-card-title">Offline Sites</div>
          <div class="stat-card-value">{{ offlineCount }}</div>
          <div class="stat-card-trend down" v-if="offlineCount > 0">
            <i class="bi bi-exclamation-triangle"></i>
            Requires attention
          </div>
          <div class="stat-card-trend up" v-else>
            <i class="bi bi-shield-check"></i>
            All systems go
          </div>
        </div>
        <div class="stat-card-icon">
          <i class="bi bi-x-circle-fill"></i>
        </div>
      </div>
    </div>
    
    <div class="stat-card info">
      <div class="stat-card-header">
        <div>
          <div class="stat-card-title">Total Monitored</div>
          <div class="stat-card-value">{{ totalCount }}</div>
          <div class="stat-card-trend">
            <i class="bi bi-globe"></i>
            Active monitors
          </div>
        </div>
        <div class="stat-card-icon">
          <i class="bi bi-collection-fill"></i>
        </div>
      </div>
    </div>
    
    <div class="stat-card warning">
      <div class="stat-card-header">
        <div>
          <div class="stat-card-title">Last Check</div>
          <div class="stat-card-value">{{ lastCheckTime }}</div>
          <div class="stat-card-trend">
            <i class="bi bi-clock"></i>
            {{ lastCheckDate }}
          </div>
        </div>
        <div class="stat-card-icon">
          <i class="bi bi-stopwatch-fill"></i>
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
  if (props.statuses.length === 0) return '--:--'
  const dates = props.statuses.map(s => new Date(s.date)).filter(d => !isNaN(d))
  if (dates.length === 0) return '--:--'
  const latest = new Date(Math.max(...dates))
  return latest.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
})

const lastCheckDate = computed(() => {
  if (props.statuses.length === 0) return 'No data'
  const dates = props.statuses.map(s => new Date(s.date)).filter(d => !isNaN(d))
  if (dates.length === 0) return 'No data'
  const latest = new Date(Math.max(...dates))
  return latest.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
})
</script>
