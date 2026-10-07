<template>
  <div class="dashboard-wrapper">
    <!-- Mobile (<= 992px): tap-outside backdrop for the off-canvas sidebar drawer -->
    <div
      v-if="isMobileNav && sidebarOpen"
      class="sidebar-backdrop"
      aria-hidden="true"
      @click="closeSidebar()"
    ></div>

    <aside
      id="app-sidebar"
      ref="sidebarRef"
      class="sidebar"
      :class="{ open: sidebarOpen }"
      :role="isMobileNav && sidebarOpen ? 'dialog' : undefined"
      :aria-modal="isMobileNav && sidebarOpen ? 'true' : undefined"
      :aria-label="isMobileNav ? 'App navigation' : undefined"
      @keydown="onSidebarKeydown"
    >
      <div class="sidebar-brand">
        <div class="sidebar-brand-row">
          <Outpost13LogoMark :size="30" />
          <h1>Outpost13</h1>
          <button
            ref="sidebarCloseRef"
            type="button"
            class="sidebar-close-btn"
            aria-label="Close navigation menu"
            @click="closeSidebar()"
          >
            <i class="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </div>
        <div class="sidebar-tagline">Your org monitoring</div>
      </div>

      <nav aria-label="App">
        <div class="nav-section">
          <div class="nav-section-title">Views</div>
          <button
            type="button"
            class="nav-item"
            :class="{ active: activeTab === 'statuses' }"
            @click="openStatusesTab"
          >
            <i class="bi bi-list-check"></i>
            <span>My statuses</span>
          </button>
          <button
            type="button"
            class="nav-item"
            :class="{ active: activeTab === 'dashboard' }"
            @click="goOverview"
          >
            <i class="bi bi-columns-gap"></i>
            <span>Dashboard</span>
          </button>
          <button
            type="button"
            class="nav-item"
            :class="{ active: activeTab === 'urls' }"
            @click="goManage"
          >
            <i class="bi bi-link-45deg"></i>
            <span>URLs</span>
          </button>
          <button type="button" class="nav-item" @click="goPublicStatuses">
            <i class="bi bi-globe2"></i>
            <span>Public statuses</span>
          </button>
        </div>

        <div class="nav-section">
          <div class="nav-section-title">Reports</div>
          <button
            type="button"
            class="nav-item"
            :class="{ active: activeTab === 'charts' }"
            @click="goCharts"
          >
            <i class="bi bi-bar-chart-line"></i>
            <span>Charts</span>
          </button>
          <button
            type="button"
            class="nav-item"
            :class="{ active: activeTab === 'history' }"
            @click="goHistory"
          >
            <i class="bi bi-clock-history"></i>
            <span>History</span>
          </button>
        </div>

        <!-- Mobile drawer only: account actions (desktop keeps them in the header) -->
        <div v-if="isClerkConfigured" class="nav-section nav-section-mobile">
          <div class="nav-section-title">Account</div>
          <button type="button" class="nav-item" @click="handleSignOut">
            <i class="bi bi-box-arrow-right"></i>
            <span>Sign out</span>
          </button>
        </div>
      </nav>
    </aside>

    <main class="main-content">
      <div class="mobile-topbar">
        <button
          ref="menuButtonRef"
          type="button"
          class="mobile-menu-btn"
          aria-controls="app-sidebar"
          :aria-expanded="sidebarOpen ? 'true' : 'false'"
          aria-label="Open navigation menu"
          @click="openSidebar"
        >
          <i class="bi bi-list" aria-hidden="true"></i>
        </button>
        <router-link to="/statuses" class="mobile-topbar-brand" aria-label="Outpost13 — My statuses">
          <Outpost13LogoMark :size="24" />
          <span>Outpost13</span>
        </router-link>
      </div>

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
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
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
import { isClerkConfigured } from '../auth/clerkConfig.js'

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

/* ---------- Mobile navigation drawer (sidebar is off-canvas at <= 992px) ---------- */
const MOBILE_NAV_QUERY = '(max-width: 992px)'
const isMobileNav = ref(false)
const sidebarRef = ref(null)
const sidebarCloseRef = ref(null)
const menuButtonRef = ref(null)
let mobileNavMql = null

function setBodyScrollLock(locked) {
  if (typeof document === 'undefined') return
  document.body.style.overflow = locked ? 'hidden' : ''
}

function openSidebar() {
  if (!isMobileNav.value) return
  sidebarOpen.value = true
}

function closeSidebar({ restoreFocus = true } = {}) {
  if (!sidebarOpen.value) return
  sidebarOpen.value = false
  if (restoreFocus) nextTick(() => menuButtonRef.value?.focus())
}

function sidebarFocusables() {
  const root = sidebarRef.value
  if (!root) return []
  return Array.from(
    root.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')
  ).filter((el) => el.offsetParent !== null)
}

function onSidebarKeydown(event) {
  if (!isMobileNav.value || !sidebarOpen.value || event.key !== 'Tab') return
  // Keep keyboard focus inside the open drawer.
  const items = sidebarFocusables()
  if (items.length === 0) return
  const first = items[0]
  const last = items[items.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function onDocumentKeydown(event) {
  if (event.key === 'Escape' && sidebarOpen.value) {
    event.preventDefault()
    closeSidebar()
  }
}

function onMobileNavChange(e) {
  isMobileNav.value = e.matches
  // Leaving the mobile breakpoint: drop drawer state so desktop is unaffected.
  if (!e.matches && sidebarOpen.value) closeSidebar({ restoreFocus: false })
}

watch(sidebarOpen, (open) => {
  setBodyScrollLock(open && isMobileNav.value)
  if (open) {
    document.addEventListener('keydown', onDocumentKeydown)
    nextTick(() => sidebarCloseRef.value?.focus())
  } else {
    document.removeEventListener('keydown', onDocumentKeydown)
  }
})

async function handleSignOut() {
  closeSidebar({ restoreFocus: false })
  try {
    if (window.Clerk?.signOut) {
      await window.Clerk.signOut({ redirectUrl: '/welcome' })
      return
    }
  } catch {
    /* fall through to marketing page */
  }
  router.push('/welcome')
}

onMounted(() => {
  if (typeof window === 'undefined' || !window.matchMedia) return
  mobileNavMql = window.matchMedia(MOBILE_NAV_QUERY)
  isMobileNav.value = mobileNavMql.matches
  mobileNavMql.addEventListener('change', onMobileNavChange)
})

onBeforeUnmount(() => {
  mobileNavMql?.removeEventListener('change', onMobileNavChange)
  document.removeEventListener('keydown', onDocumentKeydown)
  setBodyScrollLock(false)
})

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
    // Navigating from the mobile drawer closes it.
    closeSidebar({ restoreFocus: false })
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
