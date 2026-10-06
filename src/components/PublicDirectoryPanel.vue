<template>
  <section class="directory-section" aria-label="Public status directory">
    <div class="directory-header">
      <div>
        <p class="panel-kicker">Public directory</p>
        <h2>{{ title }}</h2>
        <p class="directory-lead">{{ lead }}</p>
      </div>
      <div v-if="showFilters" class="directory-controls">
        <input
          v-model="directoryQuery"
          type="search"
          class="form-control directory-search"
          placeholder="Search URL, domain…"
          aria-label="Search public endpoints"
          @keyup.enter="onSearch"
        >
        <select
          v-model="directoryCategory"
          class="form-control directory-category"
          aria-label="Filter by category"
          @change="onFilterChange"
        >
          <option value="">All categories</option>
          <option v-for="cat in categoryOptions" :key="cat" :value="cat">{{ cat }}</option>
        </select>
        <button type="button" class="btn btn-secondary" @click="onSearch">Search</button>
      </div>
    </div>

    <p v-if="directoryLoading" class="directory-empty">Loading public endpoints…</p>
    <p v-else-if="directoryGroups.length === 0" class="directory-empty">
      {{ emptyMessage }}
    </p>

    <div v-else class="directory-groups">
      <article
        v-for="group in directoryGroups"
        :key="group.groupKey"
        class="directory-group"
      >
        <header class="directory-group-header" aria-label="Owner group">
          <span>
            {{ group.urlCount }} URL{{ group.urlCount === 1 ? '' : 's' }}
            · {{ group.upCount }} up
            · {{ group.downCount }} down
          </span>
        </header>
        <div class="directory-table-wrap">
          <table class="directory-table">
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>Domain</th>
                <th>Category</th>
                <th>Status</th>
                <th>Last checked</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in group.items"
                :key="`${item.domain}-${item.url}`"
              >
                <td>
                  <a
                    class="directory-url"
                    :href="item.url"
                    target="_blank"
                    rel="noopener noreferrer"
                  >{{ item.url }}</a>
                </td>
                <td>{{ item.domain || '—' }}</td>
                <td>
                  <span class="cat-chip">{{ item.category }}</span>
                </td>
                <td>
                  <div class="status-cell">
                    <span class="status-pill" :class="statusClass(item.status)">
                      {{ formatStatus(item.status) }}
                    </span>
                    <template v-if="needsDetails(item.status)">
                      <Show v-if="isClerkConfigured" when="signed-in">
                        <button type="button" class="details-link" @click="goToApp">
                          See details
                        </button>
                      </Show>
                      <Show v-if="isClerkConfigured" when="signed-out">
                        <SignInButton mode="redirect" force-redirect-url="/statuses">
                          <button type="button" class="details-link">
                            See details
                          </button>
                        </SignInButton>
                      </Show>
                      <button
                        v-if="!isClerkConfigured"
                        type="button"
                        class="details-link"
                        @click="goToApp"
                      >
                        See details
                      </button>
                    </template>
                  </div>
                </td>
                <td>{{ formatChecked(item.date) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p
          v-if="group.urlCount > group.items.length"
          class="directory-truncated"
        >
          Showing {{ group.items.length }} of {{ group.urlCount }} in this group
          (page cap). Refine search to narrow results.
        </p>
      </article>
    </div>

    <nav
      v-if="showPagination && totalPages > 1"
      class="directory-pagination"
      aria-label="Owner group pages"
    >
      <button
        type="button"
        class="btn btn-secondary btn-sm"
        :disabled="directoryPage <= 1 || directoryLoading"
        @click="goPage(directoryPage - 1)"
      >
        Previous
      </button>
      <span class="page-meta">
        Page {{ directoryPage }} of {{ totalPages }}
        · {{ totalOwners }} group{{ totalOwners === 1 ? '' : 's' }}
      </span>
      <button
        type="button"
        class="btn btn-secondary btn-sm"
        :disabled="directoryPage >= totalPages || directoryLoading"
        @click="goPage(directoryPage + 1)"
      >
        Next
      </button>
    </nav>

    <div v-if="showSeeMore" class="directory-see-more">
      <button type="button" class="btn btn-outline-primary" @click="goAllStatuses">
        See more
      </button>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Show, SignInButton } from '@clerk/vue'
import { isClerkConfigured } from '../auth/clerkConfig.js'
import { useApi } from '../composables/useApi.js'
import {
  formatPublicStatusLabel,
  isSuccessStatus,
  publicStatusClass
} from '../utils/probeStatus.js'

const CATEGORY_OPTIONS = [
  'Landing',
  'API',
  'Intake',
  'Documentation',
  'General',
  'Auth',
  'Search'
]

const props = defineProps({
  title: { type: String, default: 'Live endpoints' },
  lead: {
    type: String,
    default: 'Publicly shared monitors, grouped by owner. Mark endpoints public from Manage.'
  },
  emptyMessage: {
    type: String,
    default: 'No public endpoints yet. Sign in, add a URL, and set visibility to Public.'
  },
  showFilters: { type: Boolean, default: false },
  showPagination: { type: Boolean, default: false },
  showSeeMore: { type: Boolean, default: false },
  /** When set, only owner groups with this many URLs or fewer are returned. */
  maxUrls: { type: Number, default: null },
  pageSize: { type: Number, default: 10 },
  /** When true, emit summary for parent hero stats. */
  emitSummary: { type: Boolean, default: false }
})

const emit = defineEmits(['summary'])

const router = useRouter()
const { fetchPublicStatuses } = useApi()

const directoryGroups = ref([])
const directoryLoading = ref(true)
const directoryQuery = ref('')
const directoryCategory = ref('')
const directoryPage = ref(1)
const totalPages = ref(1)
const totalOwners = ref(0)
const categoryOptions = CATEGORY_OPTIONS

async function loadDirectory() {
  directoryLoading.value = true
  try {
    const data = await fetchPublicStatuses({
      q: props.showFilters ? (directoryQuery.value.trim() || undefined) : undefined,
      category: props.showFilters ? (directoryCategory.value || undefined) : undefined,
      page: directoryPage.value,
      pageSize: props.pageSize,
      maxUrls: props.maxUrls ?? undefined
    })
    if (props.emitSummary) {
      emit('summary', data.summary || {})
    }
    // Prefer server maxUrls; also filter client-side so landing stays correct
    // if an older API build is still serving.
    const groups = data.groups || []
    directoryGroups.value = props.maxUrls == null
      ? groups
      : groups.filter((g) => (g.urlCount ?? 0) <= props.maxUrls)
    totalPages.value = data.totalPages || 1
    totalOwners.value = data.totalOwners || 0
    directoryPage.value = data.page || directoryPage.value
  } finally {
    directoryLoading.value = false
  }
}

function onSearch() {
  directoryPage.value = 1
  loadDirectory()
}

function onFilterChange() {
  directoryPage.value = 1
  loadDirectory()
}

function goPage(page) {
  if (page < 1 || page > totalPages.value) return
  directoryPage.value = page
  loadDirectory()
}

function goAllStatuses() {
  router.push('/allstatuses')
}

function goToApp() {
  router.push('/statuses')
}

function isUp(status) {
  return isSuccessStatus(status)
}

function isPending(status) {
  const s = String(status || '').trim().toLowerCase()
  return !s || s === 'pending'
}

function needsDetails(status) {
  if (isUp(status) || isPending(status)) return false
  return true
}

function formatStatus(status) {
  return formatPublicStatusLabel(status)
}

function statusClass(status) {
  return publicStatusClass(status)
}

function formatChecked(date) {
  if (!date) return '—'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString()
}

onMounted(() => {
  loadDirectory()
})

watch(
  () => [props.maxUrls, props.pageSize],
  () => {
    directoryPage.value = 1
    loadDirectory()
  }
)
</script>

<style scoped>
.panel-kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-accent);
  font-family: var(--font-mono);
  font-size: 0.74rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 1rem;
}

.directory-section {
  max-width: 1180px;
  margin: 3rem auto 0;
}

.directory-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.25rem;
  margin-bottom: 1.25rem;
}

.directory-header h2 {
  margin: 0;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  letter-spacing: -0.04em;
}

.directory-lead {
  max-width: 540px;
  margin: 0.55rem 0 0;
  color: var(--text-muted);
}

.directory-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.directory-search {
  min-width: min(280px, 70vw);
}

.directory-category {
  min-width: 160px;
}

.directory-empty {
  color: var(--text-muted);
  border: 1px dashed var(--border-color);
  border-radius: 14px;
  padding: 1.25rem;
  margin: 0;
}

.directory-groups {
  display: grid;
  gap: 1rem;
}

.directory-group {
  border: 1px solid var(--border-color);
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent),
    var(--bg-panel);
  overflow: hidden;
}

.directory-group-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--border-color);
  min-height: 2.6rem;
}

.directory-group-header span {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--text-muted);
}

.directory-table-wrap {
  overflow-x: auto;
}

.directory-table {
  width: 100%;
  border-collapse: collapse;
}

.directory-table th,
.directory-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
  vertical-align: top;
}

.directory-table th {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.directory-table tr:last-child td {
  border-bottom: 0;
}

.directory-url {
  display: block;
  color: var(--text-main);
  font-size: 0.88rem;
  word-break: break-all;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.2rem 0.45rem;
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.status-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
}

.status-pill.is-up {
  color: var(--color-success);
  border-color: rgba(74, 222, 128, 0.45);
}

.status-pill.is-down {
  color: var(--color-danger);
  border-color: rgba(239, 68, 68, 0.45);
}

.status-pill.is-degraded {
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.45);
}

.status-pill.is-pending {
  color: var(--text-muted);
}

.details-link {
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--text-accent);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  text-decoration: underline;
  text-underline-offset: 0.15em;
  cursor: pointer;
}

.details-link:hover {
  color: var(--text-main);
}

.cat-chip {
  font-family: var(--font-mono);
  font-size: 0.68rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.directory-truncated {
  margin: 0;
  padding: 0.55rem 1rem 0.85rem;
  color: var(--text-muted);
  font-size: 0.78rem;
}

.directory-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  margin-top: 1.25rem;
}

.page-meta {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.directory-see-more {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}

@media (max-width: 640px) {
  .directory-controls {
    width: 100%;
  }

  .directory-search,
  .directory-category {
    width: 100%;
    min-width: 0;
  }
}
</style>
