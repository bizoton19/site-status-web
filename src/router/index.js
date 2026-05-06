import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '../views/LandingView.vue'
import DashboardApp from '../views/DashboardApp.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/welcome',
      name: 'welcome',
      component: LandingView,
      meta: { public: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardApp,
      meta: { public: true },
    },
    {
      path: '/manage',
      name: 'manage',
      component: DashboardApp,
      meta: { public: true },
    },
  ],
})

export default router
