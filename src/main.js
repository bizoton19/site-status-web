import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initAuth, getAccount } from './auth/msalClient.js'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './assets/dashboard.css'

async function bootstrap() {
  await initAuth()

  const app = createApp(App)
  app.use(router)
  await router.isReady()

  const pending = sessionStorage.getItem('auth_return')
  if (pending && getAccount()) {
    sessionStorage.removeItem('auth_return')
    await router.replace(pending)
  }

  app.mount('#app')
}

bootstrap().catch((err) => {
  console.error(err)
  const el = document.getElementById('app')
  if (el) {
    el.innerHTML = `<p style="padding:2rem;font-family:system-ui">Could not start the app: ${err.message}</p>`
  }
})
