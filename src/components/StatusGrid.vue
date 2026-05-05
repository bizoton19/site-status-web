<template>
  <div class="dashboard-card">
    <div class="dashboard-card-header">
      <h3 class="dashboard-card-title">
        <i class="bi bi-heart-pulse"></i>
        Site Status Monitor
      </h3>
      <span class="text-secondary" style="font-size: 0.85rem;">
        {{ displayedStatuses.length }} of {{ statuses.length }} sites
      </span>
    </div>
    <div class="dashboard-card-body">
      <div v-if="displayedStatuses.length === 0" class="empty-state">
        <i class="bi bi-inbox"></i>
        <h4>No Sites Monitored</h4>
        <p>Add some URLs to start monitoring their status.</p>
      </div>
      <div v-else class="status-grid">
        <div 
          v-for="status in displayedStatuses" 
          :key="status.rowKey"
          class="status-item"
          :class="status.status === 'OK' ? 'online' : 'offline'"
        >
          <div class="status-item-header">
            <span class="status-item-name">{{ status.urlName }}</span>
            <span class="status-badge" :class="status.status === 'OK' ? 'online' : 'offline'">
              {{ status.status === 'OK' ? 'Online' : 'Offline' }}
            </span>
          </div>
          <div class="status-item-url">{{ status.url }}</div>
          <div class="status-item-footer">
            <span class="status-item-time">
              <i class="bi bi-clock"></i>
              {{ formatDate(status.date) }}
            </span>
            <span v-if="status.status === 'OK'" style="color: #38ef7d;">
              <i class="bi bi-check2-all"></i> Healthy
            </span>
            <span v-else style="color: #f45c43;">
              <i class="bi bi-exclamation-diamond"></i> {{ status.description || 'Error' }}
            </span>
          </div>
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
  },
  limit: {
    type: Number,
    default: 0
  }
})

const displayedStatuses = computed(() => {
  if (props.limit > 0) {
    return props.statuses.slice(0, props.limit)
  }
  return props.statuses
})

function formatDate(dateString) {
  if (!dateString) return 'Unknown'
  const date = new Date(dateString)
  if (isNaN(date)) return 'Unknown'
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
