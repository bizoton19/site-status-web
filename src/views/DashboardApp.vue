<template>
  <div class="dashboard-wrapper">
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-brand">
        <div class="sidebar-brand-row">
          <Outpost13LogoMark :size="30" />
          <h1>Outpost13</h1>
        </div>
        <div class="sidebar-tagline">Your org monitoring</div>
      </div>

      <nav>
        <div class="nav-section">
          <div class="nav-section-title">Views</div>
          <div
            class="nav-item"
            :class="{ active: activeTab === 'statuses' }"
            @click="openStatusesTab"
          >
            <i class="bi bi-list-check"></i>
            <span>My statuses</span>
          </div>
          <div
            class="nav-item"
            :class="{ active: activeTab === 'dashboard' }"
            @click="goOverview"
          >
            <i class="bi bi-columns-gap"></i>
            <span>Dashboard</span>
          </div>
          <div
            class="nav-item"
            :class="{ active: activeTab === 'urls' }"
            @click="goManage"
          >
            <i class="bi bi-link-45deg"></i>
            <span>URLs</span>
          </div>
          <div class="nav-item" @click="goPublicStatuses">
            <i class="bi bi-globe2"></i>
            <span>Public statuses</span>
          </div>
        </div>

        <div class="nav-section">
          <div class="nav-section-title">Reports</div>
          <div
            class="nav-item"
            :class="{ active: activeTab === 'charts' }"
            @click="goCharts"
          >
            <i class="bi bi-bar-chart-line"></i>
            <span>Charts</span>
          </div>
          <div
            class="nav-item"
            :class="{ active: activeTab === 'history' }"
            @click="goHistory"
          >
            <i class="bi bi-clock-history"></i>
            <span>History</span>
          </div>
        </div>
      </nav>
    </aside>

    <main class="main-content">
      <div
        v-if="showAuthUnconfiguredBanner"
        class="alert alert-warning mb-3"
        role="status"
      >
        Sign-in is not configured. Add <code>VITE_CLERK_PUBLISHABLE_KEY</code> to
        <code>.env</code> (see <code>.env.example</code>).
      </div>

      <header class="dashboard-header">
        <div class="header-left">
          <h2>{{ headerTitle }}</h2>
          <p class="header-status-note">{{ headerSubtitle }}</p>
        </div>
        <div class="header-right">
          <ThemeToggle />
          <UserMenu />
          <button
            class="btn btn-secondary btn-reload"
            :class="{ loading: isReloading }"
            @click="handleReload"
            :disabled="isReloading || isRefreshing"
            type="button"
            title="Reloads the latest statuses and history without triggering a new poll."
            :aria-busy="isReloading"
            aria-live="polite"
          >
            <i class="bi bi-arrow-clockwise" aria-hidden="true"></i>
            {{ isReloading ? 'Reloading…' : 'Reload data' }}
          </button>
          <button
            class="btn-refresh"
            :class="{ loading: isRefreshing }"
            @click="handleRefresh"
            :disabled="isRefreshing"
            type="button"
            title="Triggers the configured Azure poll function. Results arrive shortly; use Reload data to fetch them."
            :aria-busy="isRefreshing"
            aria-live="polite"
          >
            <i class="bi bi-arrow-repeat" aria-hidden="true"></i>
            {{ isRefreshing ? 'Submitting…' : 'Run poll' }}
          </button>
        </div>
      </header>

      <div
        v-if="pollBannerText"
        class="poll-feedback-banner"
        :class="{ 'is-busy': pollBannerBusy, 'is-error': pollBannerError }"
        role="status"
        aria-live="polite"
      >
        <span v-if="pollBannerBusy" class="poll-feedback-spinner" aria-hidden="true"></span>
        <span>{{ pollBannerText }}</span>
      </div>

      <div v-if="activeTab === 'dashboard'" class="fade-in">
        <StatsOverview :statuses="statuses" @navigate-statuses="onStatNavigate" />
        <div class="charts-grid">
          <UptimeChart :statuses="statuses" />
          <ResponseTimeChart :statuses="statuses" />
        </div>
        <div class="overview-actions">
          <button type="button" class="btn btn-primary" @click="openStatusesTab">
            View my statuses
          </button>
        </div>
        <StatusGrid :statuses="statuses" :limit="6" result-filter="all" :show-search="false" />
      </div>

      <div v-else-if="activeTab === 'statuses'" class="fade-in">
        <div v-if="statusesFilter !== 'all'" class="filter-toolbar">
          <span class="text-secondary">Filter: <strong>{{ filterLabel }}</strong></span>
          <button type="button" class="btn btn-secondary btn-sm" @click="statusesFilter = 'all'">
            Show all
          </button>
        </div>
        <StatsOverview :statuses="statuses" @navigate-statuses="onStatNavigate" />
        <StatusGrid :statuses="statuses" :result-filter="statusesFilter" />
      </div>

      <div v-else-if="activeTab === 'urls'" class="fade-in manage-stack">
        <DomainHeadersPanel @updated="onDomainHeadersUpdated" />
        <UrlManager ref="urlManagerRef" @urlUpdated="refreshData" />
      </div>

      <div v-else-if="activeTab === 'charts'" class="fade-in">
        <div class="charts-grid">
          <UptimeChart :statuses="statuses" />
          <ResponseTimeChart :statuses="statuses" />
        </div>
        <HistoryChart :history="statsRaw" />
      </div>

      <div v-else-if="activeTab === 'history'" class="fade-in">
        <HistoryLog :statuses="statuses" />
      </div>
    </main>

    <div class="toast-container" aria-live="polite">
      <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.type">
        <i :class="toastIconClass(toast.type)" aria-hidden="true"></i>
        <span>{{ toast.message }}</span>
      </div>
    </div>

    <div v-if="initialLoading" class="loading-overlay">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '../composables/useApi'
import StatsOverview from '../components/StatsOverview.vue'
import StatusGrid from '../components/StatusGrid.vue'
import UrlManager from '../components/UrlManager.vue'
import DomainHeadersPanel from '../components/DomainHeadersPanel.vue'
import UptimeChart from '../components/UptimeChart.vue'
import ResponseTimeChart from '../components/ResponseTimeChart.vue'
import HistoryChart from '../components/HistoryChart.vue'
import HistoryLog from '../components/HistoryLog.vue'
import UserMenu from '../components/UserMenu.vue'
import ThemeToggle from '../components/ThemeToggle.vue'
import Outpost13LogoMark from '../components/Outpost13LogoMark.vue'
import { isSuccessStatus as isSuccessRow } from '../utils/probeStatus'

const route = useRoute()
const router = useRouter()
const { fetchStatuses, fetchStatusStats, submitPollRequest } = useApi()

const activeTab = ref('statuses')
const statusesFilter = ref('all')
const sidebarOpen = ref(false)
const statuses = ref([])
const statsRaw = ref([])
const isRefreshing = ref(false)
const isReloading = ref(false)
const initialLoading = ref(true)
const toasts = ref([])
const urlManagerRef = ref(null)

function onDomainHeadersUpdated(detail) {
  urlManagerRef.value?.loadDomainProfiles?.()
  if (detail?.monitoredUrl) {
    urlManagerRef.value?.loadUrls?.()
    showToast(detail.toast || `Domain saved · also monitoring ${detail.monitoredUrl}`, 'success', 6000)
  }
}

const pollBannerText = ref('')
const pollBannerBusy = ref(false)
const pollBannerError = ref(false)

const showAuthUnconfiguredBanner = computed(() => route.query.auth === 'unconfigured')

const filterLabel = computed(() => {
  if (statusesFilter.value === 'online') return 'Online only'
  if (statusesFilter.value === 'offline') return 'Failed only'
  if (statusesFilter.value === 'blocked') return 'Blocked only'
  return 'All'
})

function goOverview() {
  if (route.path !== '/dashboard') router.push('/dashboard')
}

function goManage() {
  if (route.path !== '/manage') router.push('/manage')
}

function goCharts() {
  if (route.path !== '/charts') router.push('/charts')
}

function goHistory() {
  if (route.path !== '/history') router.push('/history')
}

function goPublicStatuses() {
  router.push('/allstatuses')
}

function syncTabFromRoute() {
  const p = route.path
  if (p === '/statuses') {
    activeTab.value = 'statuses'
    return
  }
  if (p === '/dashboard' || p === '/overview') {
    activeTab.value = 'dashboard'
    return
  }
  if (p === '/manage') {
    activeTab.value = 'urls'
    return
  }
  if (p === '/charts') {
    activeTab.value = 'charts'
    return
  }
  if (p === '/history') {
    activeTab.value = 'history'
    return
  }
}

watch(
  () => route.path,
  () => {
    syncTabFromRoute()
  },
  { immediate: true }
)

function openStatusesTab() {
  statusesFilter.value = 'all'
  if (route.path !== '/statuses') router.push('/statuses')
}

function onStatNavigate(filter) {
  statusesFilter.value = filter
  if (route.path !== '/statuses') router.push('/statuses')
}

const headerTitle = computed(() => {
  const titles = {
    dashboard: 'Dashboard',
    statuses: 'My statuses',
    urls: 'URL configuration',
    charts: 'Charts',
    history: 'History',
  }
  return titles[activeTab.value] || 'My statuses'
})

const headerSubtitle = computed(() => {
  const online = statuses.value.filter((s) => isSuccessRow(s)).length
  const total = statuses.value.length
  let filterNote = ''
  if (activeTab.value === 'statuses' && statusesFilter.value === 'online') {
    filterNote = ' · Showing online only'
  } else if (activeTab.value === 'statuses' && statusesFilter.value === 'offline') {
    filterNote = ' · Showing failed only'
  } else if (activeTab.value === 'statuses' && statusesFilter.value === 'blocked') {
    filterNote = ' · Showing blocked only'
  }
  return `${online} of ${total} org endpoints OK (latest poll)${filterNote} · UI refresh ${new Date().toLocaleString()}`
})

function showToast(message, type = 'success', durationMs = 5000) {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, durationMs)
}

function toastIconClass(type) {
  if (type === 'error') return 'bi bi-exclamation-circle'
  if (type === 'info') return 'bi bi-hourglass-split'
  return 'bi bi-check-circle'
}

async function loadStatuses() {
  const data = await fetchStatuses()
  statuses.value = data
    .map((item) => ({
      rowKey: item.RowKey ?? item.rowKey,
      urlName: item.UrlName ?? item.urlName,
      url: item.Url ?? item.url,
      description: item.Description ?? item.description,
      status: item.Status ?? item.status,
      statusCode: item.StatusCode ?? item.statusCode ?? 0,
      durationMs: item.DurationMs ?? item.durationMs ?? null,
      lastRequestJson: item.LastRequestJson ?? item.lastRequestJson ?? '',
      lastResponseJson: item.LastResponseJson ?? item.lastResponseJson ?? '',
      date: item.Date ?? item.date
    }))
    .sort((a, b) => {
      const aOk = isSuccessRow(a)
      const bOk = isSuccessRow(b)
      if (aOk && !bOk) return 1
      if (!aOk && bOk) return -1
      return 0
    })
}

async function loadHistory() {
  statsRaw.value = await fetchStatusStats()
}

async function refreshData() {
  await Promise.all([loadStatuses(), loadHistory()])
}

function handleRefresh() {
  if (isRefreshing.value) return

  isRefreshing.value = true
  pollBannerError.value = false
  pollBannerBusy.value = false

  const sent = submitPollRequest()

  if (!sent.ok) {
    pollBannerError.value = true
    pollBannerText.value = sent.error
    showToast(sent.error, 'error', 10000)
    isRefreshing.value = false
    return
  }

  pollBannerText.value =
    'Poll request submitted. New results take a moment — click Reload data in a bit to see updated statuses.'
  showToast('Poll request submitted. Click Reload data in a bit.', 'success', 8000)

  setTimeout(() => {
    isRefreshing.value = false
  }, 800)

  setTimeout(() => {
    if (!pollBannerError.value) pollBannerText.value = ''
  }, 12000)
}

async function handleReload() {
  if (isReloading.value) return
  isReloading.value = true
  pollBannerError.value = false
  pollBannerBusy.value = true
  pollBannerText.value = 'Reloading latest statuses and history…'

  try {
    await refreshData()
    const t = new Date().toLocaleTimeString()
    pollBannerText.value = `Dashboard updated at ${t}.`
    showToast(`Data reloaded at ${t}.`, 'success', 4000)
    setTimeout(() => {
      pollBannerText.value = ''
    }, 6000)
  } catch (err) {
    pollBannerError.value = true
    pollBannerText.value = 'Failed to reload data. Try again in a moment.'
    showToast('Failed to reload data.', 'error', 6000)
  } finally {
    pollBannerBusy.value = false
    isReloading.value = false
  }
}

onMounted(async () => {
  await refreshData()
  initialLoading.value = false
})
</script>

<style scoped>
.filter-toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding: 0.5rem 0;
  flex-wrap: wrap;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.btn-reload {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
}

.btn-reload:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-reload.loading i {
  animation: spin 0.9s linear infinite;
}
.overview-actions {
  display: flex;
  justify-content: flex-start;
  margin: 0.75rem 0 1.25rem;
}
</style>
