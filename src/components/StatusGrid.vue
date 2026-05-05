<template>
  <div class="dashboard-card">
    <div class="dashboard-card-header status-grid-header">
      <h3 class="dashboard-card-title">Endpoints</h3>
      <div class="status-grid-meta">
        <span class="text-secondary meta-line">
          Showing {{ displayedStatuses.length }} of {{ scopedCount }}
          <template v-if="resultFilter !== 'all'"> (status filter)</template>
          <template v-if="searchTrim"> (search)</template>
        </span>
        <div v-if="showSearch" class="status-search-wrap">
          <label class="visually-hidden" for="status-url-search">Filter by name or URL</label>
          <span class="search-icon" aria-hidden="true"><i class="bi bi-search"></i></span>
          <input
            id="status-url-search"
            v-model="searchQuery"
            type="search"
            class="form-control status-search-input"
            placeholder="Search name, URL, or error…"
            autocomplete="off"
            spellcheck="false"
          >
          <button
            v-if="searchTrim"
            type="button"
            class="search-clear"
            title="Clear search"
            aria-label="Clear search"
            @click="searchQuery = ''"
          >
            <i class="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </div>
    <div class="dashboard-card-body">
      <div v-if="displayedStatuses.length === 0" class="empty-state">
        <h4>No data</h4>
        <p v-if="searchTrim && scopedCount > 0">No endpoints match “{{ searchTrim }}”. Try another term or clear the search.</p>
        <p v-else-if="resultFilter === 'offline'">No failed endpoints in the latest poll.</p>
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
import { ref, computed } from 'vue'

const props = defineProps({
  statuses: {
    type: Array,
    default: () => []
  },
  limit: {
    type: Number,
    default: 0
  },
  resultFilter: {
    type: String,
    default: 'all',
    validator: (v) => ['all', 'online', 'offline'].includes(v)
  },
  /** Show search box (off for small overview preview). */
  showSearch: {
    type: Boolean,
    default: true
  }
})

const searchQuery = ref('')

const searchTrim = computed(() => searchQuery.value.trim())

const filtered = computed(() => {
  if (props.resultFilter === 'online') {
    return props.statuses.filter(s => s.status === 'OK')
  }
  if (props.resultFilter === 'offline') {
    return props.statuses.filter(s => s.status !== 'OK')
  }
  return props.statuses
})

const scopedCount = computed(() => filtered.value.length)

const searchFiltered = computed(() => {
  const q = searchTrim.value.toLowerCase()
  if (!q) return filtered.value
  return filtered.value.filter((s) => {
    const name = String(s.urlName ?? '').toLowerCase()
    const url = String(s.url ?? '').toLowerCase()
    const desc = String(s.description ?? '').toLowerCase()
    return name.includes(q) || url.includes(q) || desc.includes(q)
  })
})

const displayedStatuses = computed(() => {
  const list = searchFiltered.value
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
.status-grid-header {
  flex-direction: column;
  align-items: stretch;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .status-grid-header {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
  }
}

.status-grid-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  max-width: 28rem;
}

.meta-line {
  font-size: 0.8rem;
}

.status-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.65rem;
  color: var(--text-muted);
  pointer-events: none;
  font-size: 0.9rem;
}

.status-search-input {
  padding-left: 2.25rem;
  padding-right: 2rem;
}

.search-clear {
  position: absolute;
  right: 0.35rem;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
  border-radius: 4px;
}

.search-clear:hover {
  color: var(--text);
  background: var(--surface-muted);
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

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
