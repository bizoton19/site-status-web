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
          :class="[
            isSuccessStatus(status) ? 'online' : 'offline',
            { clickable: !isSuccessStatus(status) }
          ]"
          :role="!isSuccessStatus(status) ? 'button' : undefined"
          :tabindex="!isSuccessStatus(status) ? 0 : undefined"
          :title="!isSuccessStatus(status) ? 'View request / response details' : undefined"
          @click="onCardClick(status)"
          @keydown.enter.prevent="onCardClick(status)"
          @keydown.space.prevent="onCardClick(status)"
        >
          <div class="status-item-header">
            <span class="status-item-name">{{ status.urlName }}</span>
            <span
              v-if="isSuccessStatus(status)"
              class="status-icon-ok"
              title="OK"
              aria-label="OK"
            >
              <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
            </span>
            <span
              v-else
              class="status-badge offline"
              title="Failed — click for details"
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
              @click.stop
            >{{ status.url }}</a>
          </div>
          <div class="status-item-footer">
            <span>{{ formatDate(status.date) }}</span>
            <span v-if="isSuccessStatus(status)" class="status-item-detail ok">Normal</span>
            <span v-else class="status-item-detail err">{{ formatErrorDescription(status.description) }}</span>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="detailStatus"
        class="probe-modal-root"
        role="dialog"
        aria-modal="true"
        aria-labelledby="probe-modal-title"
      >
        <div class="probe-modal-backdrop" @click="closeDetail" />
        <div class="probe-modal-dialog" @click.stop>
          <div class="probe-modal-header">
            <h5 id="probe-modal-title" class="modal-title">
              Probe details — {{ detailStatus.urlName }}
            </h5>
            <button type="button" class="btn-icon" title="Close" @click="closeDetail">
              <i class="bi bi-x-lg" aria-hidden="true"></i>
            </button>
          </div>
          <div class="probe-modal-body">
            <p class="probe-meta">
              <span class="probe-pill fail">{{ detailStatusLabel }}</span>
              <span v-if="detailStatus.durationMs != null" class="text-secondary">
                {{ detailStatus.durationMs }} ms
              </span>
              <span class="text-secondary">{{ formatDate(detailStatus.date) }}</span>
            </p>

            <section class="probe-section">
              <h6>Request</h6>
              <dl class="probe-dl">
                <dt>Method</dt>
                <dd>{{ detailRequest.method || 'GET' }}</dd>
                <dt>URL</dt>
                <dd class="mono wrap">{{ detailRequest.url || detailStatus.url }}</dd>
              </dl>
              <div class="probe-block-label">Headers</div>
              <pre class="probe-pre">{{ formatHeaders(detailRequest.headers) }}</pre>
            </section>

            <section class="probe-section">
              <h6>Response</h6>
              <dl class="probe-dl">
                <dt>Status</dt>
                <dd>{{ detailResponse.statusCode ?? detailStatus.statusCode ?? detailStatus.status }}</dd>
                <dt v-if="detailResponse.reasonPhrase">Reason</dt>
                <dd v-if="detailResponse.reasonPhrase">{{ detailResponse.reasonPhrase }}</dd>
                <dt v-if="detailResponse.error">Error</dt>
                <dd v-if="detailResponse.error" class="err">{{ detailResponse.error }}</dd>
              </dl>
              <div class="probe-block-label">Headers</div>
              <pre class="probe-pre">{{ formatHeaders(detailResponse.headers) }}</pre>
              <div class="probe-block-label">Body snippet</div>
              <pre class="probe-pre body">{{ detailResponse.bodySnippet || detailStatus.description || '—' }}</pre>
            </section>
          </div>
          <div class="probe-modal-footer">
            <button type="button" class="btn btn-secondary btn-sm" @click="closeDetail">Close</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'

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
const detailStatus = ref(null)

const searchTrim = computed(() => searchQuery.value.trim())

/** Success = OK / Created / HTTP 200 / 201 */
function isSuccessStatus(status) {
  if (!status) return false
  const code = Number(status.statusCode)
  if (code === 200 || code === 201) return true
  const s = String(status.status ?? '').trim().toUpperCase()
  return s === 'OK' || s === 'CREATED' || s === '200' || s === '201'
}

const filtered = computed(() => {
  if (props.resultFilter === 'online') {
    return props.statuses.filter((s) => isSuccessStatus(s))
  }
  if (props.resultFilter === 'offline') {
    return props.statuses.filter((s) => !isSuccessStatus(s))
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

function parseJsonSafe(raw) {
  if (!raw) return {}
  if (typeof raw === 'object') return raw
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

const detailRequest = computed(() => parseJsonSafe(detailStatus.value?.lastRequestJson))
const detailResponse = computed(() => parseJsonSafe(detailStatus.value?.lastResponseJson))

const detailStatusLabel = computed(() => {
  const s = detailStatus.value
  if (!s) return ''
  if (s.statusCode != null && s.statusCode !== '') return String(s.statusCode)
  return String(s.status || 'Failed')
})

function onCardClick(status) {
  if (isSuccessStatus(status)) return
  detailStatus.value = status
  document.body.style.overflow = 'hidden'
}

function closeDetail() {
  detailStatus.value = null
  document.body.style.overflow = ''
}

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

function formatErrorDescription(desc) {
  if (!desc) return 'Error'
  const clean = String(desc).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  if (
    clean.includes('Site Status Dashboard') &&
    clean.includes('site-status-theme')
  ) {
    return 'Received dashboard HTML (check monitored URL or API base).'
  }
  return clean.length > 120 ? `${clean.slice(0, 120)}…` : clean
}

function formatHeaders(headers) {
  if (!headers || typeof headers !== 'object') return '(none)'
  const entries = Object.entries(headers)
  if (!entries.length) return '(none)'
  return entries.map(([k, v]) => `${k}: ${v}`).join('\n')
}

onUnmounted(() => {
  document.body.style.overflow = ''
})
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

.status-item.clickable {
  cursor: pointer;
}

.status-item.clickable:hover {
  outline: 1px solid color-mix(in srgb, var(--danger, #ef4444) 45%, transparent);
}

.probe-modal-root {
  position: fixed;
  inset: 0;
  z-index: 12000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.probe-modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
}

.probe-modal-dialog {
  position: relative;
  z-index: 1;
  width: min(640px, 100%);
  max-height: min(88vh, 900px);
  overflow: auto;
  background: var(--surface, #12141a);
  color: var(--text, #e8eaed);
  border: 1px solid var(--border, #2a2f3a);
  border-radius: 10px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
}

.probe-modal-header,
.probe-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--border, #2a2f3a);
}

.probe-modal-footer {
  border-bottom: none;
  border-top: 1px solid var(--border, #2a2f3a);
  justify-content: flex-end;
}

.probe-modal-body {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.probe-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  align-items: center;
  margin: 0;
  font-size: 0.85rem;
}

.probe-pill {
  display: inline-flex;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.8rem;
}

.probe-pill.fail {
  background: color-mix(in srgb, var(--danger, #ef4444) 18%, transparent);
  color: var(--danger, #ef4444);
}

.probe-section h6 {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
  font-weight: 600;
}

.probe-dl {
  display: grid;
  grid-template-columns: 6rem 1fr;
  gap: 0.25rem 0.75rem;
  margin: 0 0 0.65rem;
  font-size: 0.85rem;
}

.probe-dl dt {
  color: var(--text-muted, #9aa0a6);
  margin: 0;
}

.probe-dl dd {
  margin: 0;
}

.probe-dl dd.err {
  color: var(--danger, #ef4444);
}

.probe-dl .mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8rem;
}

.probe-dl .wrap {
  word-break: break-all;
}

.probe-block-label {
  font-size: 0.75rem;
  color: var(--text-muted, #9aa0a6);
  margin-bottom: 0.25rem;
}

.probe-pre {
  margin: 0 0 0.75rem;
  padding: 0.65rem 0.75rem;
  background: var(--surface-muted, #0c0e12);
  border: 1px solid var(--border, #2a2f3a);
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 10rem;
  overflow: auto;
}

.probe-pre.body {
  max-height: 14rem;
}

.btn-icon {
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.35rem;
  line-height: 1;
  border-radius: 4px;
}

.btn-icon:hover {
  color: var(--text);
  background: var(--surface-muted, #0c0e12);
}
</style>
