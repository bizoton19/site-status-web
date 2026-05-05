<template>
  <div class="dashboard-card">
    <div class="dashboard-card-header">
      <h3 class="dashboard-card-title">
        <i class="bi bi-journal-text"></i>
        Recent Activity Log
      </h3>
      <div style="display: flex; gap: 0.5rem;">
        <button 
          class="btn btn-secondary btn-sm"
          :class="{ active: filter === 'all' }"
          @click="filter = 'all'"
          style="padding: 0.4rem 1rem;"
        >
          All
        </button>
        <button 
          class="btn btn-secondary btn-sm"
          :class="{ active: filter === 'online' }"
          @click="filter = 'online'"
          style="padding: 0.4rem 1rem;"
        >
          Online
        </button>
        <button 
          class="btn btn-secondary btn-sm"
          :class="{ active: filter === 'offline' }"
          @click="filter = 'offline'"
          style="padding: 0.4rem 1rem;"
        >
          Offline
        </button>
      </div>
    </div>
    <div class="dashboard-card-body" style="padding: 0;">
      <div v-if="filteredStatuses.length === 0" class="empty-state">
        <i class="bi bi-inbox"></i>
        <h4>No Activity</h4>
        <p>No status updates to display.</p>
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Site</th>
            <th>URL</th>
            <th>Timestamp</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="status in filteredStatuses" :key="status.rowKey">
            <td>
              <span class="status-badge" :class="status.status === 'OK' ? 'online' : 'offline'">
                <i :class="status.status === 'OK' ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill'" class="me-1"></i>
                {{ status.status === 'OK' ? 'Online' : 'Offline' }}
              </span>
            </td>
            <td>
              <strong>{{ status.urlName }}</strong>
            </td>
            <td>
              <a :href="status.url" target="_blank" style="color: #4facfe; text-decoration: none;">
                {{ truncateUrl(status.url) }}
              </a>
            </td>
            <td style="color: var(--text-secondary);">
              <i class="bi bi-clock me-1"></i>
              {{ formatDate(status.date) }}
            </td>
            <td>
              <span v-if="status.status === 'OK'" style="color: #38ef7d;">
                <i class="bi bi-shield-check me-1"></i>
                Healthy
              </span>
              <span v-else style="color: #f45c43;">
                <i class="bi bi-exclamation-triangle me-1"></i>
                {{ status.description || 'Connection Error' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  statuses: {
    type: Array,
    default: () => []
  }
})

const filter = ref('all')

const filteredStatuses = computed(() => {
  if (filter.value === 'online') {
    return props.statuses.filter(s => s.status === 'OK')
  }
  if (filter.value === 'offline') {
    return props.statuses.filter(s => s.status !== 'OK')
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
    minute: '2-digit',
    second: '2-digit'
  })
}

function truncateUrl(url) {
  if (!url) return ''
  if (url.length > 40) {
    return url.substring(0, 40) + '...'
  }
  return url
}
</script>

<style scoped>
.btn-secondary.active {
  background: var(--primary-gradient);
  border-color: transparent;
}
</style>
