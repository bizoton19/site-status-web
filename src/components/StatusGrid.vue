<template>
  <div class="dashboard-card">
    <div class="dashboard-card-header">
      <h3 class="dashboard-card-title">Endpoints</h3>
      <span class="text-secondary" style="font-size: 0.8rem;">
        Showing {{ displayedStatuses.length }} of {{ statuses.length }}
      </span>
    </div>
    <div class="dashboard-card-body">
      <div v-if="displayedStatuses.length === 0" class="empty-state">
        <h4>No data</h4>
        <p>Configure monitored URLs or run a poll to populate results.</p>
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
              {{ status.status === 'OK' ? 'OK' : 'Failed' }}
            </span>
          </div>
          <div class="status-item-url">{{ status.url }}</div>
          <div class="status-item-footer">
            <span>{{ formatDate(status.date) }}</span>
            <span v-if="status.status === 'OK'" class="status-item-detail ok">Normal</span>
            <span v-else class="status-item-detail err">{{ status.description || 'Error' }}</span>
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
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (isNaN(date)) return '—'
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
