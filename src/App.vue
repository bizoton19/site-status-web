<template>
  <div class="dashboard-wrapper">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ open: sidebarOpen }">
      <div class="sidebar-brand">
        <i class="bi bi-activity"></i>
        <h1>StatusHub</h1>
      </div>
      
      <nav>
        <div class="nav-section">
          <div class="nav-section-title">Main</div>
          <div 
            class="nav-item" 
            :class="{ active: activeTab === 'dashboard' }"
            @click="activeTab = 'dashboard'"
          >
            <i class="bi bi-grid-1x2-fill"></i>
            <span>Dashboard</span>
          </div>
          <div 
            class="nav-item" 
            :class="{ active: activeTab === 'statuses' }"
            @click="activeTab = 'statuses'"
          >
            <i class="bi bi-heart-pulse-fill"></i>
            <span>Site Statuses</span>
          </div>
          <div 
            class="nav-item" 
            :class="{ active: activeTab === 'urls' }"
            @click="activeTab = 'urls'"
          >
            <i class="bi bi-link-45deg"></i>
            <span>URL Management</span>
          </div>
        </div>
        
        <div class="nav-section">
          <div class="nav-section-title">Analytics</div>
          <div 
            class="nav-item" 
            :class="{ active: activeTab === 'charts' }"
            @click="activeTab = 'charts'"
          >
            <i class="bi bi-graph-up-arrow"></i>
            <span>Uptime Charts</span>
          </div>
          <div 
            class="nav-item" 
            :class="{ active: activeTab === 'history' }"
            @click="activeTab = 'history'"
          >
            <i class="bi bi-clock-history"></i>
            <span>History Log</span>
          </div>
        </div>
        
        <div class="nav-section">
          <div class="nav-section-title">Settings</div>
          <div class="nav-item">
            <i class="bi bi-gear-fill"></i>
            <span>Preferences</span>
          </div>
          <div class="nav-item">
            <i class="bi bi-bell-fill"></i>
            <span>Notifications</span>
          </div>
        </div>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Header -->
      <header class="dashboard-header">
        <div class="header-left">
          <h2>{{ headerTitle }}</h2>
          <p><span class="pulse"></span>{{ headerSubtitle }}</p>
        </div>
        <div class="header-right">
          <button 
            class="btn-refresh" 
            :class="{ loading: isRefreshing }"
            @click="handleRefresh"
            :disabled="isRefreshing"
          >
            <i class="bi bi-arrow-clockwise"></i>
            {{ isRefreshing ? 'Refreshing...' : 'Refresh All' }}
          </button>
        </div>
      </header>

      <!-- Dashboard View -->
      <div v-if="activeTab === 'dashboard'" class="fade-in">
        <StatsOverview :statuses="statuses" />
        <div class="charts-grid">
          <UptimeChart :statuses="statuses" />
          <ResponseTimeChart :statuses="statuses" />
        </div>
        <StatusGrid :statuses="statuses" :limit="6" />
      </div>

      <!-- Statuses View -->
      <div v-else-if="activeTab === 'statuses'" class="fade-in">
        <StatsOverview :statuses="statuses" />
        <StatusGrid :statuses="statuses" />
      </div>

      <!-- URL Management View -->
      <div v-else-if="activeTab === 'urls'" class="fade-in">
        <UrlManager @urlUpdated="loadStatuses" />
      </div>

      <!-- Charts View -->
      <div v-else-if="activeTab === 'charts'" class="fade-in">
        <div class="charts-grid">
          <UptimeChart :statuses="statuses" />
          <ResponseTimeChart :statuses="statuses" />
        </div>
        <HistoryChart :statuses="statuses" />
      </div>

      <!-- History View -->
      <div v-else-if="activeTab === 'history'" class="fade-in">
        <HistoryLog :statuses="statuses" />
      </div>
    </main>

    <!-- Toast Container -->
    <div class="toast-container">
      <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.type">
        <i :class="toast.type === 'success' ? 'bi bi-check-circle-fill' : 'bi bi-exclamation-circle-fill'"></i>
        <span>{{ toast.message }}</span>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div v-if="initialLoading" class="loading-overlay">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useApi } from './composables/useApi'
import StatsOverview from './components/StatsOverview.vue'
import StatusGrid from './components/StatusGrid.vue'
import UrlManager from './components/UrlManager.vue'
import UptimeChart from './components/UptimeChart.vue'
import ResponseTimeChart from './components/ResponseTimeChart.vue'
import HistoryChart from './components/HistoryChart.vue'
import HistoryLog from './components/HistoryLog.vue'

const { fetchStatuses, refreshStatuses } = useApi()

const activeTab = ref('dashboard')
const sidebarOpen = ref(false)
const statuses = ref([])
const isRefreshing = ref(false)
const initialLoading = ref(true)
const toasts = ref([])

const headerTitle = computed(() => {
  const titles = {
    dashboard: 'Dashboard Overview',
    statuses: 'Site Statuses',
    urls: 'URL Management',
    charts: 'Uptime Analytics',
    history: 'History Log'
  }
  return titles[activeTab.value] || 'Dashboard'
})

const headerSubtitle = computed(() => {
  const online = statuses.value.filter(s => s.status === 'OK').length
  const total = statuses.value.length
  return `${online}/${total} sites online - Last checked: ${new Date().toLocaleTimeString()}`
})

function showToast(message, type = 'success') {
  const id = Date.now()
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, 3000)
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

async function handleRefresh() {
  isRefreshing.value = true
  const result = await refreshStatuses()
  
  if (result.success) {
    showToast('Status refresh initiated successfully!')
    setTimeout(async () => {
      await loadStatuses()
      isRefreshing.value = false
    }, 3000)
  } else {
    showToast('Failed to refresh statuses', 'error')
    isRefreshing.value = false
  }
}

onMounted(async () => {
  await loadStatuses()
  initialLoading.value = false
})
</script>
