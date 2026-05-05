<template>
  <div class="dashboard-card">
    <div class="dashboard-card-header">
      <h3 class="dashboard-card-title">Endpoints</h3>
      <span class="text-secondary" style="font-size: 0.8rem;">
        Showing {{ displayedStatuses.length }} of {{ baseCount }}
        <template v-if="resultFilter !== 'all'"> (filtered)</template>
      </span>
    </div>
    <div class="dashboard-card-body">
      <div v-if="displayedStatuses.length === 0" class="empty-state">
        <h4>No data</h4>
        <p v-if="resultFilter === 'offline'">No failed endpoints in the latest poll.</p>
        <p v-else-if="resultFilter === 'online'">No online endpoints match this view.</p>
        <p v-else>Configure monitored URLs or run a poll to populate results.</p>
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
            <span
              v-if="status.status === 'OK'"
              class="status-icon-ok"
              title="OK"
              aria-label="OK"
            >
              <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
            </span>
            <span
              v-else
              class="status-badge offline"
              title="Failed"
            >
              Failed
            </span>
          </div>
          <div class="status-item-url">
            <a
              class="link-dashboard"
              :href="hrefForUrl(status.url)"
              target="_blank"
              rel="noopener noreferrer"
            >{{ status.url }}</a>
          </div>
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
  },
  /** 'all' | 'online' | 'offline' — filter before optional limit */
  resultFilter: {
    type: String,
    default: 'all',
    validator: (v) => ['all', 'online', 'offline'].includes(v)
  }
})

const filtered = computed(() => {
  if (props.resultFilter === 'online') {
    return props.statuses.filter(s => s.status === 'OK')
  }
  if (props.resultFilter === 'offline') {
    return props.statuses.filter(s => s.status !== 'OK')
  }
  return props.statuses
})

const baseCount = computed(() => props.statuses.length)

const displayedStatuses = computed(() => {
  const list = filtered.value
  if (props.limit > 0) {
    return list.slice(0, props.limit)
  }
  return list
})

function hrefForUrl(url) {
  if (!url || typeof url !== 'string') return '#'
  const t = url.trim()
  if (!t) return '#'
  if (/^https?:\/\//i.test(t)) return t
  return `https://${t}`
}

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

<style scoped>
.status-icon-ok {
  color: var(--success);
  font-size: 1.35rem;
  line-height: 1;
  display: flex;
  align-items: center;
}

.status-item-url {
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
  word-break: break-all;
}

.status-item-url .link-dashboard {
  word-break: break-all;
}
</style>
