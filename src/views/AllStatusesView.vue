<template>
  <main class="all-statuses-page">
    <div class="home-grid-bg" aria-hidden="true"></div>

    <header class="home-nav">
      <button type="button" class="brand-button" @click="goHome">
        <Outpost13LogoMark :size="30" />
        <span>Outpost13</span>
      </button>
      <nav class="home-nav-links" aria-label="Primary">
        <router-link class="home-nav-link" to="/allstatuses">Public statuses</router-link>
        <router-link class="home-nav-link" to="/faq">FAQ</router-link>
        <router-link class="home-nav-link" to="/contact">Pricing</router-link>
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

    <PublicDirectoryPanel
      title="All public endpoints"
      lead="Full public directory — search, filter by group, and page through every owner group."
      empty-message="No public endpoints match. Try clearing search or group filters."
      :show-filters="true"
      :show-pagination="true"
      :page-size="10"
    />

    <SiteFooter />
  </main>
</template>

<script setup>
import { Show, SignInButton } from '@clerk/vue'
import { useRouter } from 'vue-router'
import { isClerkConfigured } from '../auth/clerkConfig.js'
import ThemeToggle from '../components/ThemeToggle.vue'
import Outpost13LogoMark from '../components/Outpost13LogoMark.vue'
import PublicDirectoryPanel from '../components/PublicDirectoryPanel.vue'
import SiteFooter from '../components/SiteFooter.vue'

const router = useRouter()

function goHome() {
  router.push('/')
}

function goToApp() {
  router.push('/statuses')
}
</script>

<style scoped>
.all-statuses-page {
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

.home-nav-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .home-nav {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
