<template>
  <div class="dashboard-card">
    <div class="dashboard-card-header">
      <h3 class="dashboard-card-title">Status log</h3>
      <div class="log-filters">
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          :class="{ 'is-active': filter === 'all' }"
          @click="filter = 'all'"
        >
          All
        </button>
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          :class="{ 'is-active': filter === 'online' }"
          @click="filter = 'online'"
        >
          OK
        </button>
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          :class="{ 'is-active': filter === 'offline' }"
          @click="filter = 'offline'"
        >
          Failed
        </button>
      </div>
    </div>
    <div class="dashboard-card-body" style="padding: 0;">
      <div v-if="filteredStatuses.length === 0" class="empty-state">
        <h4>No records</h4>
        <p>There is no status data to show for this filter.</p>
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Result</th>
            <th>Name</th>
            <th>URL</th>
            <th>Time</th>
            <th>Detail</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="status in filteredStatuses" :key="status.rowKey">
            <td>
              <span class="status-badge" :class="status.status === 'OK' ? 'online' : 'offline'">
                {{ status.status === 'OK' ? 'OK' : 'Failed' }}
              </span>
            </td>
            <td>
              <strong>{{ status.urlName }}</strong>
            </td>
            <td>
              <a class="link-dashboard" :href="status.url" target="_blank" rel="noopener noreferrer">
                {{ truncateUrl(status.url) }}
              </a>
            </td>
            <td class="text-secondary">
              {{ formatDate(status.date) }}
            </td>
            <td>
              <span v-if="status.status === 'OK'" class="text-ok">Normal</span>
              <span v-else class="text-err">{{ status.description || 'Error' }}</span>
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
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (isNaN(date)) return '—'
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
  if (url.length > 48) {
    return url.substring(0, 48) + '…'
  }
  return url
}
</script>

<style scoped>
.log-filters {
  display: flex;
  gap: 0.35rem;
}

.btn-secondary.is-active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.text-ok {
  color: var(--success);
}

.text-err {
  color: var(--danger);
}
</style>
