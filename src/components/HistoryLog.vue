<template>
  <div class="dashboard-card">
    <div class="dashboard-card-header log-header">
      <div>
        <h3 class="dashboard-card-title">Status log</h3>
        <p class="text-secondary log-source-note">{{ logSourceNote }}</p>
      </div>
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
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          :class="{ 'is-active': filter === 'blocked' }"
          @click="filter = 'blocked'"
        >
          Blocked
        </button>
      </div>
    </div>
    <div class="dashboard-card-body" style="padding: 0;">
      <div v-if="initialLoading" class="empty-state">
        <p>Loading history…</p>
      </div>
      <template v-else>
        <div v-if="filteredStatuses.length === 0" class="empty-state">
          <h4>No records</h4>
          <p>There is no status data to show for this filter.</p>
        </div>
        <template v-else>
          <table class="data-table">
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
              <tr v-for="(status, idx) in filteredStatuses" :key="`${status.rowKey}-${idx}-${status.date}`">
                <td>
                  <span
                    class="status-badge"
                    :class="isSuccessStatus(status) ? 'online' : 'offline'"
                  >
                    {{ formatStatusLabel(status) }}
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
                  <span v-if="isSuccessStatus(status)" class="text-ok">Normal</span>
                  <span v-else class="text-err">{{ status.description || 'Error' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="nextPageToken" class="load-more-row">
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              :disabled="loadingMore"
              @click="loadMore"
            >
              {{ loadingMore ? 'Loading…' : 'Load more' }}
            </button>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useApi } from '../composables/useApi'
import { toDisplayHistoryRows } from '../utils/statusHistory'
import {
  formatStatusLabel,
  isBlockedStatus,
  isDownStatus,
  isSuccessStatus
} from '../utils/probeStatus'

const props = defineProps({
  statuses: {
    type: Array,
    default: () => []
  }
})

const { fetchStatusHistory } = useApi()

const historyItems = ref([])
const nextPageToken = ref(null)
const initialLoading = ref(true)
const loadingMore = ref(false)
const filter = ref('all')

async function loadInitial() {
  initialLoading.value = true
  const result = await fetchStatusHistory()
  historyItems.value = toDisplayHistoryRows(result.items)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
  nextPageToken.value = result.nextPageToken
  initialLoading.value = false
}

async function loadMore() {
  if (!nextPageToken.value || loadingMore.value) return
  loadingMore.value = true
  const result = await fetchStatusHistory(nextPageToken.value)
  const newItems = toDisplayHistoryRows(result.items)
  historyItems.value = [...historyItems.value, ...newItems]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
  nextPageToken.value = result.nextPageToken
  loadingMore.value = false
}

const sourceRows = computed(() =>
  historyItems.value.length > 0 ? historyItems.value : props.statuses
)

const logSourceNote = computed(() => {
  if (initialLoading.value) return 'Loading…'
  if (historyItems.value.length > 0) {
    const more = nextPageToken.value ? ' · More available — use Load more.' : ' · All pages loaded.'
    return `${historyItems.value.length} row(s)${more}`
  }
  return 'Showing current snapshot only. History not yet available.'
})

const filteredStatuses = computed(() => {
  const list = sourceRows.value
  if (filter.value === 'online') {
    return list.filter((s) => isSuccessStatus(s))
  }
  if (filter.value === 'blocked') {
    return list.filter((s) => isBlockedStatus(s))
  }
  if (filter.value === 'offline') {
    return list.filter((s) => isDownStatus(s))
  }
  return list
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

onMounted(loadInitial)
</script>

<style scoped>
.log-header {
  align-items: flex-start;
}

.log-source-note {
  font-size: 0.8rem;
  margin: 0.25rem 0 0;
  max-width: 28rem;
}

.log-filters {
  display: flex;
  gap: 0.35rem;
  flex-shrink: 0;
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

.load-more-row {
  display: flex;
  justify-content: center;
  padding: 1rem;
  border-top: 1px solid var(--border);
}
</style>
