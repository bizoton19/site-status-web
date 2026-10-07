<template>
  <section class="directory-section" aria-label="Public status directory">
    <div class="directory-header">
      <div>
        <p class="panel-kicker">Public directory</p>
        <h2>{{ title }}</h2>
        <p class="directory-lead">{{ lead }}</p>
      </div>
      <p v-if="!directoryLoading && directoryItems.length" class="directory-summary">
        {{ pageTotals.urls }} URL{{ pageTotals.urls === 1 ? '' : 's' }}
        · {{ pageTotals.up }} up
        · {{ pageTotals.down }} down
      </p>
    </div>

    <StatusBoard
      v-model:group="directoryGroup"
      v-model:search="directoryQuery"
      :items="directoryItems"
      :storage-key="showFilters ? 'outpost13.statusView.public' : null"
      default-desktop-view="table"
      :locked-view="showFilters ? null : 'table'"
      default-sort-key="group"
      :show-toolbar="showFilters"
      :client-search="false"
      search-placeholder="Search URL, domain…"
      :group-options="groupOptions"
      :show-domain="true"
      :loading="directoryLoading"
      loading-message="Loading public endpoints…"
      :empty-message="emptyMessage"
      id-prefix="public-status"
      @search-submit="onSearch"
    >
      <template #item-actions="{ item }">
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
      </template>
    </StatusBoard>

    <p v-if="!directoryLoading && pageTotals.urls > directoryItems.length" class="directory-truncated">
      Showing {{ directoryItems.length }} of {{ pageTotals.urls }} URLs on this page
      (per-owner cap). Refine search to narrow results.
    </p>

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
import { computed, onMounted, ref, watch } from 'vue'
import StatusBoard from './StatusBoard.vue'
import { useRouter } from 'vue-router'
import { Show, SignInButton } from '@clerk/vue'
import { isClerkConfigured } from '../auth/clerkConfig.js'
import { useApi } from '../composables/useApi.js'
import { isSuccessStatus } from '../utils/probeStatus.js'

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
  /**
   * Landing preview: ask the API to return at most this many URLs per owner group.
   * Does not hide large groups (server lists every matching owner; pageSize caps groups).
   */
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
const directoryGroup = ref('')
/** Group labels seen so far (groups are free text, so options come from loaded data). */
const seenGroups = ref(new Set())
const directoryPage = ref(1)
const totalPages = ref(1)
const totalOwners = ref(0)
const groupOptions = computed(() => {
  const names = new Set(seenGroups.value)
  if (directoryGroup.value) names.add(directoryGroup.value)
  return [...names].sort((a, b) => a.localeCompare(b))
})

function rememberGroups(groups) {
  const next = new Set(seenGroups.value)
  for (const g of groups || []) {
    for (const item of g.items || []) {
      if (item.group) next.add(item.group)
    }
  }
  seenGroups.value = next
}

async function loadDirectory() {
  directoryLoading.value = true
  try {
    const data = await fetchPublicStatuses({
      q: props.showFilters ? (directoryQuery.value.trim() || undefined) : undefined,
      group: props.showFilters ? (directoryGroup.value || undefined) : undefined,
      page: directoryPage.value,
      pageSize: props.pageSize,
      maxUrls: props.maxUrls ?? undefined
    })
    if (props.emitSummary) {
      emit('summary', data.summary || {})
    }
    // Server already applies maxUrls as a per-group item cap (not a group filter).
    directoryGroups.value = Array.isArray(data.groups) ? data.groups : []
    rememberGroups(directoryGroups.value)
    totalPages.value = data.totalPages || 1
    totalOwners.value = data.totalOwners || 0
    directoryPage.value = data.page || directoryPage.value
  } catch (err) {
    console.error('Public directory load failed:', err)
    directoryGroups.value = []
    if (props.emitSummary) {
      emit('summary', {})
    }
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

function needsDetails(status) {
  if (isSuccessStatus(status)) return false
  const s = String(status || '').trim().toLowerCase()
  return !!s && s !== 'pending'
}

/** Flatten the owner-group page into normalized items for the shared StatusBoard. */
const directoryItems = computed(() =>
  directoryGroups.value.flatMap((g, gi) =>
    (g.items || []).map((item, i) => ({
      key: `${g.groupKey ?? gi}-${item.domain}-${item.url}-${i}`,
      urlName: item.urlName,
      url: item.url,
      domain: item.domain,
      group: item.group,
      status: item.status,
      description: item.description,
      date: item.date,
      durationMs: null,
    }))
  )
)

const pageTotals = computed(() =>
  directoryGroups.value.reduce(
    (acc, g) => ({
      urls: acc.urls + (g.urlCount ?? (g.items || []).length),
      up: acc.up + (g.upCount ?? 0),
      down: acc.down + (g.downCount ?? 0),
    }),
    { urls: 0, up: 0, down: 0 }
  )
)

onMounted(() => {
  loadDirectory()
})

watch(directoryGroup, () => onFilterChange())

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

.directory-summary {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--text-muted);
}

.directory-truncated {
  margin: 0.75rem 0 0;
  padding: 0;
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
</style>
