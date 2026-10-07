<template>
  <header class="home-nav">
    <button type="button" class="brand-button" @click="goHome">
      <span class="logo-mark" aria-hidden="true"></span>
      <span>Watchtower</span>
    </button>
    <nav class="home-nav-links" aria-label="Primary">
      <RouterLink to="/contact" class="home-nav-link">Pricing</RouterLink>
    </nav>
    <div class="home-nav-actions">
      <ThemeToggle />
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
</template>

<script setup>
import { useRouter } from 'vue-router'
import { Show, SignInButton } from '@clerk/vue'
import { isClerkConfigured } from '../auth/clerkConfig.js'
import ThemeToggle from './ThemeToggle.vue'

const router = useRouter()

function goHome() {
  router.push('/')
}

function goToApp() {
  router.push('/statuses')
}
</script>

<style scoped>
.home-nav {
  max-width: 1180px;
  margin: 0 auto 3rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
  padding: 0.85rem 0;
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
  flex: 1 1 auto;
  gap: 0.35rem 1.1rem;
  min-width: 0;
}

.home-nav-link {
  color: var(--text-muted);
  text-decoration: none;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.home-nav-link:hover,
.home-nav-link.router-link-active {
  color: var(--text-main);
}

.home-nav-link:focus-visible {
  outline: 2px solid var(--text-accent);
  outline-offset: 3px;
}

.home-nav-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-left: auto;
}

@media (max-width: 640px) {
  .home-nav {
    align-items: flex-start;
  }

  .home-nav-links {
    order: 3;
    flex-basis: 100%;
  }

  .home-nav-actions {
    margin-left: auto;
    justify-content: flex-end;
  }
}
</style>
