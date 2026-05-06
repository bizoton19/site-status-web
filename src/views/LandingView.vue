<template>
  <div class="landing">
    <div class="landing-card">
      <h1>Site status</h1>
      <p class="lead">
        The dashboard is open without sign-in. Use <strong>Sign in</strong> in the header if you
        want your Microsoft account and profile on this optional page.
      </p>
      <div v-if="showUnconfigured" class="alert alert-warning" role="status">
        Azure AD is not configured. Add <code>VITE_AAD_CLIENT_ID</code> and related variables to
        <code>.env</code> (see <code>.env.example</code>) to enable Sign in.
      </div>
      <div class="landing-actions">
        <button type="button" class="btn btn-primary btn-lg" @click="goToApp">
          Open dashboard
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { msalConfig } from '../auth/authConfig.js'

const router = useRouter()

const showUnconfigured = computed(() => !msalConfig.auth.clientId)

function goToApp() {
  router.push('/dashboard')
}
</script>

<style scoped>
.landing {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: var(--bg-page);
}

.landing-card {
  max-width: 32rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 4px 24px rgba(28, 36, 48, 0.06);
}

.landing-card h1 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--text);
}

.lead {
  color: var(--text-muted);
  margin-bottom: 1.5rem;
  line-height: 1.5;
}

.landing-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}
</style>
