<template>
  <div class="dashboard-wrapper">
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-brand">
        <h1>Site status</h1>
        <div class="sidebar-tagline">Monitoring dashboard</div>
      </div>

      <nav>
        <div class="nav-section">
          <div class="nav-section-title">Views</div>
          <div
            class="nav-item"
            :class="{ active: activeTab === 'dashboard' }"
            @click="activeTab = 'dashboard'"
          >
            <i class="bi bi-columns-gap"></i>
            <span>Overview</span>
          </div>
          <div
            class="nav-item"
            :class="{ active: activeTab === 'statuses' }"
            @click="activeTab = 'statuses'"
          >
            <i class="bi bi-list-check"></i>
            <span>Statuses</span>
          </div>
          <div
            class="nav-item"
            :class="{ active: activeTab === 'urls' }"
            @click="activeTab = 'urls'"
          >
            <i class="bi bi-link-45deg"></i>
            <span>URLs</span>
          </div>
        </div>

        <div class="nav-section">
          <div class="nav-section-title">Reports</div>
          <div
            class="nav-item"
            :class="{ active: activeTab === 'charts' }"
            @click="activeTab = 'charts'"
          >
            <i class="bi bi-bar-chart-line"></i>
            <span>Charts</span>
          </div>
          <div
            class="nav-item"
            :class="{ active: activeTab === 'history' }"
            @click="activeTab = 'history'"
          >
            <i class="bi bi-clock-history"></i>
            <span>History</span>
          </div>
        </div>
      </nav>
    </aside>

    <main class="main-content">
      <header class="dashboard-header">
        <div class="header-left">
          <h2>{{ headerTitle }}</h2>
          <p class="header-status-note">{{ headerSubtitle }}</p>
        </div>
        <div class="header-right">
          <button
            class="btn-refresh"
            :class="{ loading: isRefreshing }"
            @click="handleRefresh"
            :disabled="isRefreshing"
            type="button"
            title="Triggers the configured Azure poll function, then reloads status data."
          >
            <i class="bi bi-arrow-repeat"></i>
            {{ isRefreshing ? 'Starting…' : 'Run poll' }}
          </button>
        </div>
      </header>

      <div v-if="activeTab === 'dashboard'" class="fade-in">
        <StatsOverview :statuses="statuses" />
        <div class="charts-grid">
          <UptimeChart :statuses="statuses" />
          <ResponseTimeChart :statuses="statuses" />
        </div>
        <StatusGrid :statuses="statuses" :limit="6" />
      </div>

      <div v-else-if="activeTab === 'statuses'" class="fade-in">
        <StatsOverview :statuses="statuses" />
        <StatusGrid :statuses="statuses" />
      </div>

      <div v-else-if="activeTab === 'urls'" class="fade-in">
        <UrlManager @urlUpdated="refreshData" />
      </div>

      <div v-else-if="activeTab === 'charts'" class="fade-in">
        <div class="charts-grid">
          <UptimeChart :statuses="statuses" />
          <ResponseTimeChart :statuses="statuses" />
        </div>
        <HistoryChart :history="historyRaw" />
      </div>

      <div v-else-if="activeTab === 'history'" class="fade-in">
        <HistoryLog :statuses="statuses" :history-rows="historyDisplayRows" />
      </div>
    </main>

    <div class="toast-container">
      <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.type">
        <i :class="toast.type === 'success' ? 'bi bi-check-circle' : 'bi bi-exclamation-circle'"></i>
        <span>{{ toast.message }}</span>
      </div>
    </div>

    <div v-if="initialLoading" class="loading-overlay">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useApi } from './composables/useApi'
import { toDisplayHistoryRows } from './utils/statusHistory'
import StatsOverview from './components/StatsOverview.vue'
import StatusGrid from './components/StatusGrid.vue'
import UrlManager from './components/UrlManager.vue'
import UptimeChart from './components/UptimeChart.vue'
import ResponseTimeChart from './components/ResponseTimeChart.vue'
import HistoryChart from './components/HistoryChart.vue'
import HistoryLog from './components/HistoryLog.vue'

const { fetchStatuses, fetchStatusHistory, refreshStatuses } = useApi()

const activeTab = ref('dashboard')
const sidebarOpen = ref(false)
const statuses = ref([])
const historyRaw = ref([])
const isRefreshing = ref(false)
const initialLoading = ref(true)
const toasts = ref([])

const historyDisplayRows = computed(() => {
  const rows = toDisplayHistoryRows(historyRaw.value)
  return [...rows].sort((a, b) => new Date(b.date) - new Date(a.date))
})

const headerTitle = computed(() => {
  const titles = {
    dashboard: 'Overview',
    statuses: 'Statuses',
    urls: 'URL configuration',
    charts: 'Charts',
    history: 'History'
  }
  return titles[activeTab.value] || 'Overview'
})

const headerSubtitle = computed(() => {
  const online = statuses.value.filter(s => s.status === 'OK').length
  const total = statuses.value.length
  const histCount = historyDisplayRows.value.length
  const histNote = histCount ? ` · ${histCount} history row(s)` : ''
  return `${online} of ${total} endpoints OK (latest poll) · UI refresh ${new Date().toLocaleString()}${histNote}`
})

function showToast(message, type = 'success', durationMs = 5000) {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, durationMs)
}

function formatPollerToast(body) {
  if (!body) return 'Poll started. Loading latest data.'
  const m = body.match(/OrchestrationInstanceId:\s*([a-fA-F0-9]+)/)
  if (m) {
    return `Poll started (run ${m[1]}). Loading latest data.`
  }
  return body.length > 160 ? `${body.slice(0, 160)}…` : body
}

async function loadStatuses() {
  const data = await fetchStatuses()
  statuses.value = data.map(item => ({
    rowKey: item.RowKey,
    urlName: item.UrlName,
    url: item.Url,
    description: item.Description,
    status: item.Status,
    date: item.Date
  })).sort((a, b) => {
    if (a.status === 'OK' && b.status !== 'OK') return 1
    if (a.status !== 'OK' && b.status === 'OK') return -1
    return 0
  })
}

async function loadHistory() {
  historyRaw.value = await fetchStatusHistory()
}

async function refreshData() {
  await Promise.all([loadStatuses(), loadHistory()])
}

async function handleRefresh() {
  isRefreshing.value = true
  const result = await refreshStatuses()

  if (result.success) {
    showToast(formatPollerToast(result.message), 'success', 6000)
    setTimeout(async () => {
      await refreshData()
      isRefreshing.value = false
    }, 3000)
  } else {
    showToast(result.error || 'Poll request failed', 'error')
    isRefreshing.value = false
  }
}

onMounted(async () => {
  await refreshData()
  initialLoading.value = false
})
</script>
