<template>
  <MarketingShell>
    <section class="hero-shell">
      <div class="hero-copy">
        <div class="eyebrow">
          <span class="pulse-dot" aria-hidden="true"></span>
          Serverless URL intelligence
        </div>
        <h1>Scale uptime monitoring without scaling operations.</h1>
        <p class="hero-lead">
          Watchtower gives developers and teams a tenant-aware status console for URLs,
          alerts, history, bulk onboarding, and WAF-friendly monitoring.
        </p>

        <div v-if="showUnconfigured" class="alert alert-warning auth-warning" role="status">
          Clerk is not configured. Add <code>VITE_CLERK_PUBLISHABLE_KEY</code> to
          <code>.env</code> to enable sign-up and sign-in.
        </div>

        <div class="hero-actions">
          <Show v-if="isClerkConfigured" when="signed-in">
            <button type="button" class="btn btn-primary btn-lg" @click="goToApp">
              Open my workspace
            </button>
          </Show>
          <Show v-if="isClerkConfigured" when="signed-out">
            <SignUpButton mode="redirect" force-redirect-url="/statuses">
              <button type="button" class="btn btn-primary btn-lg">Create free account</button>
            </SignUpButton>
            <SignInButton mode="redirect" force-redirect-url="/statuses">
              <button type="button" class="btn btn-outline-primary btn-lg">Sign in</button>
            </SignInButton>
          </Show>
          <button
            v-if="!isClerkConfigured"
            type="button"
            class="btn btn-primary btn-lg"
            @click="goToApp"
          >
            Open app
          </button>
        </div>
      </div>

      <aside class="telemetry-panel" aria-label="Current Watchtower public rollup">
        <div class="panel-header">
          <div>
            <p class="panel-kicker">Current tally</p>
            <h2>Platform signal</h2>
          </div>
          <span class="live-badge" :class="{ muted: statsLoading }">
            {{ statsLoading ? 'Loading' : 'Live' }}
          </span>
        </div>

        <div class="metric-ring" :style="{ '--uptime-deg': `${uptimePercentage * 3.6}deg` }">
          <div class="ring-value">{{ uptimePercentage }}%</div>
          <div class="ring-label">latest OK rate</div>
        </div>

        <div class="home-stats">
          <div class="home-stat success">
            <span>Up</span>
            <strong>{{ onlineCount }}</strong>
          </div>
          <div class="home-stat danger">
            <span>Down</span>
            <strong>{{ offlineCount }}</strong>
          </div>
          <div class="home-stat">
            <span>URLs tracked</span>
            <strong>{{ totalCount }}</strong>
          </div>
        </div>

        <p class="panel-footnote">
          Aggregate rollup only. Sign in to view tenant-scoped URL details, history, and alerts.
        </p>
      </aside>
    </section>

    <section class="capability-grid" aria-label="Watchtower capabilities">
      <article
        v-for="capability in capabilities"
        :key="capability.title"
        class="capability-card"
      >
        <i class="bi" :class="capability.icon" aria-hidden="true"></i>
        <h3>{{ capability.title }}</h3>
        <p>{{ capability.copy }}</p>
      </article>
    </section>

    <section class="directory-section" aria-label="Public status directory">
      <div class="directory-header">
        <div>
          <p class="panel-kicker">Public directory</p>
          <h2>Live endpoints by category</h2>
          <p class="directory-lead">
            Publicly shared monitors, grouped for quick scanning. Mark endpoints public from Manage.
          </p>
        </div>
        <div class="directory-controls">
          <input
            v-model="directoryQuery"
            type="search"
            class="form-control directory-search"
            placeholder="Search name, URL, org…"
            aria-label="Search public endpoints"
          >
          <select
            v-model="directoryCategory"
            class="form-control directory-category"
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            <option v-for="cat in categoryOptions" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>
      </div>

      <p v-if="directoryLoading" class="directory-empty">Loading public endpoints…</p>
      <p v-else-if="filteredDirectory.length === 0" class="directory-empty">
        No public endpoints yet. Sign in, add a URL, and set visibility to Public.
      </p>

      <div v-else class="directory-groups">
        <article
          v-for="group in groupedDirectory"
          :key="group.category"
          class="directory-group"
        >
          <header class="directory-group-header">
            <h3>{{ group.category }}</h3>
            <span>{{ group.items.length }}</span>
          </header>
          <div class="directory-table-wrap">
            <table class="directory-table">
              <thead>
                <tr>
                  <th>Endpoint</th>
                  <th>Org</th>
                  <th>Status</th>
                  <th>Last checked</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in group.items" :key="`${item.category}-${item.urlName}-${item.url}`">
                  <td>
                    <strong>{{ item.urlName }}</strong>
                    <a
                      class="directory-url"
                      :href="item.url"
                      target="_blank"
                      rel="noopener noreferrer"
                    >{{ item.url }}</a>
                  </td>
                  <td>{{ item.orgLabel }}</td>
                  <td>
                    <span class="status-pill" :class="statusClass(item.status)">
                      {{ formatStatus(item.status) }}
                    </span>
                  </td>
                  <td>{{ formatChecked(item.date) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>

    <section class="architecture-strip">
      <div>
        <p class="panel-kicker">Architecture</p>
        <h2>Built for cheap scale, tenant safety, and boring reliability.</h2>
      </div>
      <div class="architecture-list">
        <span>.NET 10 isolated Functions</span>
        <span>Flex Consumption</span>
        <span>Durable fan-out polling</span>
        <span>Azure Tables by tenant</span>
        <span>Clerk auth</span>
        <span>ACS alerts</span>
      </div>
    </section>
  </MarketingShell>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Show, SignInButton, SignUpButton } from '@clerk/vue'
import { isClerkConfigured } from '../auth/clerkConfig.js'
import MarketingShell from '../components/MarketingShell.vue'
import { useApi } from '../composables/useApi.js'

const CATEGORY_OPTIONS = [
  'Landing',
  'API',
  'Intake',
  'Documentation',
  'General',
  'Auth',
  'Search'
]

const router = useRouter()
const { fetchStatuses, fetchPublicStatuses } = useApi()
const showUnconfigured = computed(() => !isClerkConfigured)
const statuses = ref([])
const statsLoading = ref(true)
const directory = ref([])
const directoryLoading = ref(true)
const directoryQuery = ref('')
const directoryCategory = ref('')
const categoryOptions = CATEGORY_OPTIONS

const capabilities = [
  {
    icon: 'bi-person-check',
    title: 'Start solo — org optional',
    copy: 'No Clerk organization required. Sign up into a personal workspace; switch to a company org later if you want shared URLs and billing.',
  },
  {
    icon: 'bi-shield-check',
    title: 'WAF-ready monitoring',
    copy: 'Publish monitoring IPs and user-agent guidance so protected sites can safely allow checks.',
  },
  {
    icon: 'bi-bell',
    title: 'Actionable alerts',
    copy: 'Durable polling records current state, history, and alert signals without managing servers.',
  },
]

const onlineCount = computed(() => statuses.value.filter((s) => isUp(s.status)).length)
const totalCount = computed(() => statuses.value.length)
const offlineCount = computed(() => Math.max(totalCount.value - onlineCount.value, 0))
const uptimePercentage = computed(() => {
  if (!totalCount.value) return 0
  return Math.round((onlineCount.value / totalCount.value) * 100)
})

const filteredDirectory = computed(() => {
  const q = directoryQuery.value.trim().toLowerCase()
  const cat = directoryCategory.value
  return directory.value.filter((item) => {
    if (cat && item.category !== cat) return false
    if (!q) return true
    const hay = `${item.urlName} ${item.url} ${item.category} ${item.orgLabel}`.toLowerCase()
    return hay.includes(q)
  })
})

const groupedDirectory = computed(() => {
  const map = new Map()
  for (const item of filteredDirectory.value) {
    const key = item.category || 'General'
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(item)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, items]) => ({ category, items }))
})

async function loadDirectory() {
  directoryLoading.value = true
  try {
    const rows = await fetchPublicStatuses({
      q: directoryQuery.value.trim() || undefined,
      category: directoryCategory.value || undefined
    })
    directory.value = rows.map((row) => ({
      urlName: row.UrlName ?? row.urlName ?? '',
      url: row.Url ?? row.url ?? '',
      category: row.Category ?? row.category ?? 'General',
      status: row.Status ?? row.status ?? '',
      date: row.Date ?? row.date ?? null,
      orgLabel: row.OrgLabel ?? row.orgLabel ?? 'Watchtower'
    }))
    // Prefer public directory for the hero tally when available.
    if (directory.value.length) {
      statuses.value = directory.value.map((item) => ({ status: item.status }))
      statsLoading.value = false
    }
  } finally {
    directoryLoading.value = false
  }
}

onMounted(async () => {
  try {
    const data = await fetchStatuses({ publicAggregate: true })
    statuses.value = data.map((item) => ({
      status: item.Status ?? item.status,
    }))
  } finally {
    statsLoading.value = false
  }
  await loadDirectory()
})

function isUp(status) {
  const s = String(status || '').toUpperCase()
  return s === 'OK' || s === '200' || s === 'UP'
}

function formatStatus(status) {
  if (isUp(status)) return 'Up'
  const s = String(status || '').trim()
  if (!s || s.toLowerCase() === 'pending') return 'Pending'
  return 'Down'
}

function statusClass(status) {
  if (isUp(status)) return 'is-up'
  const s = String(status || '').toLowerCase()
  if (!s || s === 'pending') return 'is-pending'
  return 'is-down'
}

function formatChecked(date) {
  if (!date) return '—'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString()
}

function goToApp() {
  router.push('/statuses')
}
</script>

<style scoped>
.hero-shell {
  max-width: 1180px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
  gap: clamp(1.5rem, 4vw, 3.5rem);
  align-items: center;
}

.hero-copy {
  padding: clamp(1rem, 2vw, 1.5rem) 0;
}

.eyebrow,
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

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--color-success);
  box-shadow: 0 0 18px rgba(74, 222, 128, 0.65);
}

.hero-copy h1 {
  max-width: 780px;
  margin: 0;
  font-size: clamp(3.25rem, 8vw, 7rem);
  line-height: 0.9;
  letter-spacing: -0.08em;
}

.hero-lead {
  max-width: 650px;
  color: var(--text-muted);
  font-size: clamp(1.05rem, 1.6vw, 1.35rem);
  margin: 1.35rem 0 1.75rem;
}

.auth-warning {
  max-width: 620px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.telemetry-panel,
.capability-card,
.architecture-strip {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent),
    var(--bg-panel);
  border: 1px solid var(--border-color);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.28);
}

.telemetry-panel {
  border-radius: 24px;
  padding: 1.25rem;
  position: relative;
}

.telemetry-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border-top: 3px solid var(--text-accent);
  pointer-events: none;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.panel-header h2,
.architecture-strip h2,
.capability-card h3 {
  margin: 0;
}

.live-badge {
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(74, 222, 128, 0.4);
  color: var(--color-success);
  background: var(--color-success-bg);
  border-radius: 999px;
  padding: 0.25rem 0.6rem;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.live-badge.muted {
  color: var(--text-muted);
  border-color: var(--border-color);
  background: var(--bg-surface);
}

.metric-ring {
  width: min(260px, 70vw);
  aspect-ratio: 1;
  margin: 1.25rem auto;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-active);
  background:
    radial-gradient(circle, var(--bg-panel) 54%, transparent 55%),
    conic-gradient(var(--text-accent) var(--uptime-deg), var(--bg-surface) 0);
  box-shadow: inset 0 0 50px rgba(255, 51, 102, 0.1);
}

.ring-value {
  font-family: var(--font-mono);
  font-size: clamp(2.75rem, 7vw, 4.5rem);
  font-weight: 800;
  letter-spacing: -0.08em;
}

.ring-label {
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.home-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.home-stat {
  padding: 0.9rem;
  border: 1px solid var(--border-color);
  border-radius: 14px;
  background: var(--bg-surface);
}

.home-stat span {
  display: block;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.home-stat strong {
  display: block;
  margin-top: 0.35rem;
  font-size: 2rem;
  line-height: 1;
}

.home-stat.success strong {
  color: var(--color-success);
}

.home-stat.danger strong {
  color: var(--color-danger);
}

.panel-footnote {
  color: var(--text-muted);
  margin: 1rem 0 0;
  font-size: 0.84rem;
}

.capability-grid {
  max-width: 1180px;
  margin: 3rem auto 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;
}

.capability-card {
  border-radius: 18px;
  padding: 1.1rem;
  min-height: 190px;
}

.capability-card i {
  color: var(--text-accent);
  font-size: 1.35rem;
}

.capability-card h3 {
  margin-top: 1rem;
  font-size: 1rem;
}

.capability-card p {
  color: var(--text-muted);
  margin: 0.7rem 0 0;
}

.architecture-strip {
  max-width: 1180px;
  margin: 1rem auto 0;
  border-radius: 22px;
  padding: 1.25rem;
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: 1rem;
  align-items: center;
}

.architecture-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.architecture-list span {
  border: 1px solid var(--border-color);
  background: var(--bg-surface);
  border-radius: 999px;
  padding: 0.45rem 0.7rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
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
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--border-color);
}

.directory-group-header h3 {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
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

.directory-table strong {
  display: block;
  margin-bottom: 0.2rem;
}

.directory-url {
  display: block;
  color: var(--text-muted);
  font-size: 0.8rem;
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

.status-pill.is-up {
  color: var(--color-success);
  border-color: rgba(74, 222, 128, 0.45);
}

.status-pill.is-down {
  color: var(--color-danger);
  border-color: rgba(239, 68, 68, 0.45);
}

.status-pill.is-pending {
  color: var(--text-muted);
}

@media (max-width: 900px) {
  .capability-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 980px) {
  .hero-shell,
  .architecture-strip {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .hero-actions {
    justify-content: flex-start;
  }

  .hero-copy h1 {
    font-size: clamp(2.75rem, 15vw, 4.4rem);
  }

  .home-stats {
    grid-template-columns: 1fr;
  }

  .telemetry-panel {
    padding: 1rem;
  }

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
