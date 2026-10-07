import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '../views/LandingView.vue'
import ContactView from '../views/ContactView.vue'
import DashboardApp from '../views/DashboardApp.vue'
import SignInView from '../views/SignInView.vue'
import SignUpView from '../views/SignUpView.vue'
import { isClerkConfigured } from '../auth/clerkConfig.js'

/**
 * Product routes (org-scoped SaaS):
 *   /welcome          — public marketing
 *   /contact          — public contact / pricing (Turnstile)
 *   /sign-in|/sign-up — public Clerk auth
 *   /statuses         — AUTH: org status list (primary home after login)
 *   /dashboard        — AUTH: org overview (counts + charts + preview)
 *   /manage|/charts|/history — AUTH: org tools
 *
 * Tenant boundary = Clerk organization (org_id), not user_id.
 * See azure-functions/TENANT-MODEL.md
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: LandingView,
      meta: { public: true },
    },
    {
      path: '/welcome',
      name: 'welcome',
      component: LandingView,
      meta: { public: true },
    },
    {
      path: '/contact',
      name: 'contact',
      component: ContactView,
      meta: { public: true },
    },
    // Catch-all so Clerk path routing can render SSO/factor/continue subpaths
    // e.g. /sign-up/sso-callback, /sign-in/factor-one, /sign-up/continue
    {
      path: '/sign-in/:pathMatch(.*)*',
      name: 'sign-in',
      component: SignInView,
      meta: { public: true },
    },
    {
      path: '/sign-up/:pathMatch(.*)*',
      name: 'sign-up',
      component: SignUpView,
      meta: { public: true },
    },
    {
      path: '/statuses',
      name: 'statuses',
      component: DashboardApp,
      meta: { requiresAuth: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardApp,
      meta: { requiresAuth: true },
    },
    {
      path: '/manage',
      name: 'manage',
      component: DashboardApp,
      meta: { requiresAuth: true },
    },
    {
      path: '/charts',
      name: 'charts',
      component: DashboardApp,
      meta: { requiresAuth: true },
    },
    {
      path: '/history',
      name: 'history',
      component: DashboardApp,
      meta: { requiresAuth: true },
    },
  ],
})

function waitForClerkLoaded(timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    if (window.Clerk?.loaded) {
      resolve(window.Clerk)
      return
    }

    const started = Date.now()
    const timer = window.setInterval(() => {
      if (window.Clerk?.loaded) {
        window.clearInterval(timer)
        resolve(window.Clerk)
        return
      }

      if (Date.now() - started > timeoutMs) {
        window.clearInterval(timer)
        reject(new Error('Timed out waiting for Clerk to load.'))
      }
    }, 50)
  })
}

router.beforeEach(async (to) => {
  if (to.meta.public) {
    return true
  }

  if (!to.meta.requiresAuth) {
    return true
  }

  // Auth required but Clerk not configured — send to marketing, not a data page
  if (!isClerkConfigured) {
    return { path: '/welcome', query: { auth: 'unconfigured' } }
  }

  try {
    const clerk = await waitForClerkLoaded()
    if (clerk.user) {
      return true
    }
  } catch {
    return { path: '/sign-in', query: { redirect_url: to.fullPath } }
  }

  return { path: '/sign-in', query: { redirect_url: to.fullPath } }
})

export default router
