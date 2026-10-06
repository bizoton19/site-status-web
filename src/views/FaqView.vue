<template>
  <main class="faq-page">
    <div class="home-grid-bg" aria-hidden="true"></div>

    <header class="home-nav">
      <button type="button" class="brand-button" @click="goHome">
        <Outpost13LogoMark :size="30" />
        <span>Outpost13</span>
      </button>
      <nav class="home-nav-links" aria-label="Primary">
        <router-link class="home-nav-link" to="/allstatuses">Public statuses</router-link>
        <router-link class="home-nav-link" to="/faq">FAQ</router-link>
      </nav>
      <div class="home-nav-actions">
        <ThemeToggle />
        <button type="button" class="btn btn-secondary btn-sm" @click="goHome">
          Back to home
        </button>
        <Show v-if="isClerkConfigured" when="signed-in">
          <button type="button" class="btn btn-secondary btn-sm" @click="goToApp">
            View my statuses
          </button>
        </Show>
        <Show v-if="isClerkConfigured" when="signed-out">
          <SignInButton mode="redirect" force-redirect-url="/statuses">
            <button type="button" class="btn btn-secondary btn-sm">Sign in</button>
          </SignInButton>
        </Show>
      </div>
    </header>

    <section class="faq-hero">
      <p class="panel-kicker">Capabilities</p>
      <h1>FAQ</h1>
      <p class="faq-lead">
        How Outpost13 monitors endpoints, shares a public directory, and keeps WAF-friendly checks boring and reliable.
      </p>
    </section>

    <section class="faq-list" aria-label="Frequently asked questions">
      <article v-for="item in faqs" :key="item.q" class="faq-item">
        <h2>{{ item.q }}</h2>
        <p v-for="(para, idx) in item.a" :key="idx">{{ para }}</p>
      </article>
    </section>

    <SiteFooter />
  </main>
</template>

<script setup>
import { Show, SignInButton } from '@clerk/vue'
import { useRouter } from 'vue-router'
import { isClerkConfigured } from '../auth/clerkConfig.js'
import ThemeToggle from '../components/ThemeToggle.vue'
import Outpost13LogoMark from '../components/Outpost13LogoMark.vue'
import SiteFooter from '../components/SiteFooter.vue'

const router = useRouter()

const faqs = [
  {
    q: 'What does Outpost13 monitor?',
    a: [
      'You register HTTPS endpoints (health checks, landing pages, APIs). Outpost13 polls them on a schedule, stores the latest status, and keeps history so you can see when something changed.',
      'Personal workspaces work without an organization. Switch to a shared org later if your team needs common URLs and billing.'
    ]
  },
  {
    q: 'What is the public directory?',
    a: [
      'Endpoints you mark Public appear on the landing page and the Public statuses directory. Groups are anonymous owner buckets — visitor pages never show tenant or account names.',
      'Private endpoints stay inside your signed-in workspace only.'
    ]
  },
  {
    q: 'What is the difference between BLOCKED and DOWN?',
    a: [
      'DOWN means the check could not get a healthy response — timeouts, connection failures, or server errors that look like the site is unavailable.',
      'BLOCKED means the site answered, but access was denied (typically HTTP 401 or 403). That usually means a WAF, bot filter, or auth gate stopped the monitor — not that the whole site is offline. Allowlist the monitor identity, then re-check.'
    ]
  },
  {
    q: 'What are domain headers?',
    a: [
      'Domain headers are request headers you attach once for a hostname (for example a shared User-Agent or API key header). Matching URLs under that domain inherit them; you can still override per URL.',
      'Header values stay in your tenant workspace and are never exposed on public directory APIs.'
    ]
  },
  {
    q: 'What is included on the free tier?',
    a: [
      'Free accounts can monitor up to 50 URLs and use up to 1 million polls with no credit card. After that, usage is priced per million polls — not a stack of enterprise SKUs.'
    ]
  },
  {
    q: 'How do I allowlist Outpost13 on my WAF?',
    a: [
      'Treat the monitor like any other known health checker: allow the published monitoring User-Agent and egress IPs your workspace shows for allowlisting.',
      'You do not need to open your origin broadly — only permit the monitor identity so checks return real application status instead of BLOCKED.'
    ]
  },
  {
    q: 'Can I poll a single URL on demand?',
    a: [
      'Yes. In Manage URLs, use Poll on a row (or poll selected) to refresh that endpoint only. Full workspace “Run poll” still fans out across your monitored set when you want a complete sweep.'
    ]
  }
]

function goHome() {
  router.push('/')
}

function goToApp() {
  router.push('/statuses')
}
</script>

<style scoped>
.faq-page {
  min-height: 100vh;
  padding: 1.25rem clamp(1rem, 3vw, 2.5rem) 3rem;
  position: relative;
  overflow: hidden;
}

.home-grid-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  background:
    radial-gradient(circle at 18% 14%, rgba(255, 51, 102, 0.18), transparent 28rem),
    radial-gradient(circle at 78% 8%, rgba(74, 222, 128, 0.12), transparent 24rem),
    linear-gradient(var(--border-color) 1px, transparent 1px),
    linear-gradient(90deg, var(--border-color) 1px, transparent 1px);
  background-size: auto, auto, 72px 72px, 72px 72px;
  mask-image: linear-gradient(to bottom, #000 0%, transparent 88%);
  opacity: 0.58;
}

.home-nav {
  max-width: 1180px;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 0;
  flex-wrap: wrap;
}

.brand-button {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  border: 0;
  background: transparent;
  color: var(--text-main);
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.home-nav-links {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: auto;
  margin-right: 0.5rem;
}

.home-nav-link {
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
}

.home-nav-link:hover,
.home-nav-link.router-link-active {
  color: var(--text-accent);
}

.home-nav-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.faq-hero {
  max-width: 780px;
  margin: 0 auto 2rem;
}

.panel-kicker {
  display: inline-flex;
  color: var(--text-accent);
  font-family: var(--font-mono);
  font-size: 0.74rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 1rem;
}

.faq-hero h1 {
  margin: 0;
  font-size: clamp(2.4rem, 6vw, 4rem);
  letter-spacing: -0.06em;
  line-height: 0.95;
}

.faq-lead {
  margin: 1rem 0 0;
  color: var(--text-muted);
  font-size: 1.05rem;
  max-width: 620px;
}

.faq-list {
  max-width: 780px;
  margin: 0 auto;
  display: grid;
  gap: 0.9rem;
}

.faq-item {
  border: 1px solid var(--border-color);
  border-radius: 18px;
  padding: 1.15rem 1.25rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent),
    var(--bg-panel);
}

.faq-item h2 {
  margin: 0 0 0.65rem;
  font-size: 1.05rem;
  letter-spacing: -0.02em;
}

.faq-item p {
  margin: 0 0 0.65rem;
  color: var(--text-muted);
  line-height: 1.55;
}

.faq-item p:last-child {
  margin-bottom: 0;
}

@media (max-width: 640px) {
  .home-nav-links {
    width: 100%;
    margin: 0;
    order: 3;
  }
}
</style>
