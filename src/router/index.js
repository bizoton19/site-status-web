import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '../views/LandingView.vue'
import DashboardApp from '../views/DashboardApp.vue'
import { getAccount, msalInstance, loginRequest } from '../auth/msalClient.js'
import { msalConfig } from '../auth/authConfig.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/statuses',
    },
    {
      path: '/welcome',
      name: 'welcome',
      component: LandingView,
      meta: { public: true },
    },
    {
      path: '/statuses',
      name: 'statuses',
      component: DashboardApp,
      meta: { public: true },
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

router.beforeEach((to, _from, next) => {
  if (to.meta.public) {
    next()
    return
  }
  if (!to.meta.requiresAuth) {
    next()
    return
  }
  if (!msalConfig.auth.clientId) {
    next({ path: '/statuses', query: { auth: 'unconfigured' } })
    return
  }
  const account = getAccount()
  if (account) {
    next()
    return
  }
  sessionStorage.setItem('auth_return', to.fullPath)
  msalInstance.loginRedirect({ ...loginRequest }).catch((err) => {
    console.error(err)
    sessionStorage.removeItem('auth_return')
    next(false)
  })
})

export default router
