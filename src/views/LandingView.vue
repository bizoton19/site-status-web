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
          Outpost13 gives developers and teams a tenant-aware status console for URLs,
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

      <aside class="telemetry-panel" aria-label="Current Outpost13 public rollup">
        <div class="panel-header">
          <div>
            <p class="panel-kicker">Current tally</p>
            <h2>Platform signal</h2>
          </div>
          <span class="live-badge" :class="{ muted: statsLoading }">
            {{ statsLoading ? 'Loading' : 'Live' }}
          </span>
        </div>

        <div
          class="metric-ring"
          :class="{
            'is-all-up': uptimePercentage === 100 && totalCount > 0,
            'is-all-down': uptimePercentage === 0 && totalCount > 0,
            'is-empty': totalCount === 0
          }"
          :style="{ '--uptime-deg': `${uptimePercentage * 3.6}deg` }"
        >
          <div class="ring-value">{{ uptimePercentage }}%</div>
          <div class="ring-label">latest OK rate</div>
        </div>

        <div class="home-stats">
          <div class="home-stat">
            <span>Domains</span>
            <strong>{{ domainCount }}</strong>
          </div>
          <div class="home-stat">
            <span>URLs</span>
            <strong>{{ totalCount }}</strong>
          </div>
          <div class="home-stat danger">
            <span>Down</span>
            <strong>{{ offlineCount }}</strong>
          </div>
          <div class="home-stat danger">
            <span>Blocked</span>
            <strong>{{ blockedCount }}</strong>
          </div>
          <div class="home-stat success">
            <span>Up</span>
            <strong>{{ onlineCount }}</strong>
          </div>
        </div>

        <p class="panel-footnote">
          Aggregate rollup only. Sign in to view tenant-scoped URL details, history, and alerts.
        </p>
      </aside>
    </section>

    <section class="capability-grid" aria-label="Outpost13 capabilities">
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

    <PublicDirectoryPanel
      title="Live endpoints"
      lead="Public owner groups on the directory (up to 5 groups here, previewing up to 5 URLs each). Open the full directory for every group."
      empty-message="No public endpoints yet. Sign in, add a URL, and set visibility to Public — or open Public statuses for the full directory."
      :max-urls="5"
      :page-size="5"
      :show-see-more="true"
      :emit-summary="true"
      @summary="applySummary"
    />

    <section class="architecture-strip">
      <div>
        <p class="panel-kicker">Architecture</p>
        <h2>Built for cheap scale, tenant safety, and boring reliability.</h2>
      </div>
      <div class="architecture-skyline" aria-hidden="true">
        <svg
          class="skyline-svg"
          viewBox="0 0 640 200"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMax meet"
        >
          <g
            fill="none"
            stroke="var(--text-accent)"
            stroke-width="1.75"
            stroke-linejoin="round"
            stroke-linecap="round"
          >
            <path d="M28 200 V118 H48 V200" />
            <path d="M48 200 V92 H78 V200" />
            <path d="M54 92 V72 H72 V92" />
            <path d="M58 72 L63 52 L68 72" />
            <path d="M90 200 V128 H130 V200" />
            <path d="M100 128 V108 H120 V128" />
            <path d="M138 200 V84 H178 V200" />
            <path d="M148 84 V64 H168 V84" />
            <path d="M154 64 L158 42 L162 64" />
            <path d="M198 200 V58 H248 V200" />
            <path d="M210 58 V36 H236 V58" />
            <path d="M218 36 L223 8 L228 36" />
            <path d="M208 100 H238" />
            <path d="M208 130 H238" />
            <path d="M208 160 H238" />
            <path d="M258 200 V70 H292 V200" />
            <path d="M268 70 V48" />
            <path d="M275 70 V38" />
            <path d="M282 70 V52" />
            <path d="M262 100 H288" />
            <path d="M262 140 H288" />
            <path d="M310 200 V46 H380 V200" />
            <path d="M322 46 V22 H368 V46" />
            <path d="M338 22 L345 4 L352 22" />
            <path d="M320 80 H370" />
            <path d="M320 110 H370" />
            <path d="M320 140 H370" />
            <path d="M320 170 H370" />
            <path d="M398 200 V96 H430 V200" />
            <path d="M408 96 V76 H420 V96" />
            <path d="M440 200 V110 H488 V200" />
            <path d="M452 110 V78 H476 V110" />
            <path d="M460 78 L464 58 L468 78" />
            <path d="M500 200 V120 H540 V200" />
            <path d="M512 120 V98 H528 V120" />
            <path d="M548 200 V88 H590 V200" />
            <path d="M560 88 V62 H578 V88" />
            <path d="M566 62 L569 40 L572 62" />
            <path d="M598 200 V140 H620 V200" />
          </g>
          <path
            d="M12 200 H628"
            fill="none"
            stroke="var(--border-active)"
            stroke-width="1"
            opacity="0.55"
          />
        </svg>
      </div>
    </section>
  </MarketingShell>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Show, SignInButton, SignUpButton } from '@clerk/vue'
import { isClerkConfigured } from '../auth/clerkConfig.js'
import MarketingShell from '../components/MarketingShell.vue'
import PublicDirectoryPanel from '../components/PublicDirectoryPanel.vue'

const router = useRouter()
const showUnconfigured = computed(() => !isClerkConfigured)
const statsLoading = ref(true)

const domainCount = ref(0)
const totalCount = ref(0)
const onlineCount = ref(0)
const offlineCount = ref(0)
const blockedCount = ref(0)

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

const uptimePercentage = computed(() => {
  if (!totalCount.value) return 0
  return Math.round((onlineCount.value / totalCount.value) * 100)
})

function applySummary(summary) {
  domainCount.value = summary.domains || 0
  totalCount.value = summary.urls || 0
  onlineCount.value = summary.up || 0
  offlineCount.value = summary.down || 0
  blockedCount.value = summary.blocked || 0
  statsLoading.value = false
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
    conic-gradient(
      var(--color-success) 0deg var(--uptime-deg),
      var(--color-danger) var(--uptime-deg) 360deg
    );
  box-shadow: inset 0 0 50px rgba(74, 222, 128, 0.08);
}

.metric-ring.is-all-up {
  box-shadow: inset 0 0 56px rgba(74, 222, 128, 0.22);
  border-color: rgba(74, 222, 128, 0.45);
}

.metric-ring.is-all-down {
  box-shadow: inset 0 0 56px rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.45);
}

.metric-ring.is-empty {
  background:
    radial-gradient(circle, var(--bg-panel) 54%, transparent 55%),
    conic-gradient(var(--bg-surface) 0deg 360deg);
  box-shadow: none;
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.55rem;
}

.home-stat {
  padding: 0.7rem 0.55rem;
  border: 1px solid var(--border-color);
  border-radius: 14px;
  background: var(--bg-surface);
  text-align: center;
}

.home-stat span {
  display: block;
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.home-stat strong {
  display: block;
  margin-top: 0.3rem;
  font-size: 1.45rem;
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
  margin: 3rem auto 0;
  border-radius: 22px;
  padding: 1.25rem;
  display: grid;
  grid-template-columns: minmax(0, 0.75fr) minmax(0, 1.25fr);
  gap: 1rem;
  align-items: center;
}

.architecture-skyline {
  width: 100%;
  min-height: 140px;
  display: flex;
  align-items: flex-end;
}

.skyline-svg {
  width: 100%;
  height: clamp(120px, 22vw, 200px);
  display: block;
  opacity: 0.92;
}

@media (max-width: 980px) {
  .hero-shell,
  .architecture-strip {
    grid-template-columns: 1fr;
  }

  .capability-grid {
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
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .capability-grid {
    grid-template-columns: 1fr;
  }

  .telemetry-panel {
    padding: 1rem;
  }
}
</style>
