<template>
  <MarketingShell show-back-home>
    <section class="contact-shell" aria-labelledby="contact-title">
      <p class="panel-kicker">Pricing</p>
      <h1 id="contact-title">Ask about a plan.</h1>
      <p class="contact-lead">
        Tell us what you want to monitor. We reply by email. There is no public price list.
      </p>

      <form class="contact-card" @submit.prevent="onSubmit">
        <p v-if="!siteKey" class="form-status is-error" role="status">
          The contact form is not available right now.
        </p>

        <div class="field">
          <label class="form-label" for="contact-name">Name</label>
          <input
            id="contact-name"
            v-model="name"
            class="form-control"
            type="text"
            name="name"
            autocomplete="name"
            maxlength="120"
            required
            :disabled="!siteKey || submitted"
          >
        </div>

        <div class="field">
          <label class="form-label" for="contact-email">Email</label>
          <input
            id="contact-email"
            v-model="email"
            class="form-control"
            type="email"
            name="email"
            autocomplete="email"
            maxlength="254"
            required
            :disabled="!siteKey || submitted"
          >
        </div>

        <div class="field">
          <label class="form-label" for="contact-message">Message</label>
          <textarea
            id="contact-message"
            v-model="message"
            class="form-control contact-message"
            name="message"
            maxlength="4000"
            rows="6"
            required
            :disabled="!siteKey || submitted"
          ></textarea>
        </div>

        <div
          v-if="siteKey"
          ref="turnstileHost"
          class="turnstile-host"
        ></div>
        <p v-if="widgetError" class="form-status is-error" role="alert">
          We could not load verification. Refresh the page and try again.
        </p>

        <p v-if="formError" class="form-status is-error" role="alert">{{ formError }}</p>
        <p v-if="submitted" class="form-status is-ok" role="status">
          Thanks. We received your message and will reply by email.
        </p>

        <button
          type="submit"
          class="btn btn-primary btn-lg"
          :disabled="!siteKey || submitting || submitted || widgetError"
        >
          {{ submitting ? 'Sending…' : 'Send message' }}
        </button>
      </form>
    </section>
  </MarketingShell>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import MarketingShell from '../components/MarketingShell.vue'
import { useApi } from '../composables/useApi.js'

const TURNSTILE_ONLOAD = '__outpost13TurnstileOnload'
const CONTACT_ACTION = 'contact'

const ERROR_COPY = {
  verification_failed: 'We could not verify this submission. Please try again.',
  invalid_request: 'Check the name, email, and message, then try again.',
  unavailable: 'Contact is temporarily unavailable. Please try again later.',
}

const siteKey = String(import.meta.env.VITE_TURNSTILE_SITE_KEY || '').trim()
const { submitContact } = useApi()

const name = ref('')
const email = ref('')
const message = ref('')
const turnstileHost = ref(null)
const turnstileToken = ref('')
const widgetId = ref(null)
const widgetError = ref(false)
const submitting = ref(false)
const submitted = ref(false)
const formError = ref('')

let turnstileScriptPromise = null

function loadTurnstile() {
  if (window.turnstile?.render) return Promise.resolve(window.turnstile)
  if (turnstileScriptPromise) return turnstileScriptPromise

  turnstileScriptPromise = new Promise((resolve, reject) => {
    window[TURNSTILE_ONLOAD] = () => {
      if (window.turnstile?.render) resolve(window.turnstile)
      else reject(new Error('turnstile'))
    }

    const existing = document.querySelector('script[data-turnstile="contact"]')
    if (existing) return

    const script = document.createElement('script')
    script.src = `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=${TURNSTILE_ONLOAD}`
    script.async = true
    script.defer = true
    script.dataset.turnstile = 'contact'
    script.onerror = () => reject(new Error('turnstile'))
    document.head.appendChild(script)
  })

  return turnstileScriptPromise
}

function resetWidget() {
  turnstileToken.value = ''
  if (widgetId.value != null && window.turnstile) {
    window.turnstile.reset(widgetId.value)
  }
}

async function renderWidget() {
  if (!siteKey || !turnstileHost.value) return
  const turnstile = await loadTurnstile()
  if (!turnstile?.render || !turnstileHost.value) {
    widgetError.value = true
    return
  }

  const theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
  widgetId.value = turnstile.render(turnstileHost.value, {
    sitekey: siteKey,
    action: CONTACT_ACTION,
    theme,
    callback(token) {
      turnstileToken.value = token
    },
    'expired-callback'() {
      turnstileToken.value = ''
    },
    'error-callback'() {
      turnstileToken.value = ''
      widgetError.value = true
    },
  })
}

onMounted(() => {
  if (!siteKey) return
  renderWidget().catch(() => {
    widgetError.value = true
  })
})

onBeforeUnmount(() => {
  if (widgetId.value != null && window.turnstile) {
    window.turnstile.remove(widgetId.value)
  }
  delete window[TURNSTILE_ONLOAD]
})

async function onSubmit() {
  formError.value = ''
  if (!siteKey || submitted.value || submitting.value) return
  if (!turnstileToken.value) {
    formError.value = ERROR_COPY.verification_failed
    return
  }

  submitting.value = true
  try {
    const result = await submitContact({
      name: name.value,
      email: email.value,
      message: message.value,
      turnstileToken: turnstileToken.value,
    })

    if (result.ok) {
      submitted.value = true
      name.value = ''
      email.value = ''
      message.value = ''
      turnstileToken.value = ''
      return
    }

    formError.value = ERROR_COPY[result.error] || ERROR_COPY.unavailable
    resetWidget()
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.contact-shell {
  max-width: 720px;
  margin: 0 auto;
}

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

.contact-shell h1 {
  margin: 0;
  font-size: clamp(2.4rem, 6vw, 4.25rem);
  line-height: 0.95;
  letter-spacing: -0.06em;
}

.contact-lead {
  max-width: 38rem;
  color: var(--text-muted);
  font-size: 1.05rem;
  margin: 1rem 0 1.5rem;
}

.contact-card {
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 22px;
  border: 1px solid var(--border-color);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent),
    var(--bg-panel);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.28);
}

.field {
  display: grid;
  gap: 0.35rem;
}

.contact-message {
  min-height: 9rem;
  resize: vertical;
}

.turnstile-host {
  min-height: 65px;
}

.form-status {
  margin: 0;
  font-size: 0.92rem;
}

.form-status.is-error {
  color: var(--color-danger);
}

.form-status.is-ok {
  color: var(--color-success);
}

.contact-card .btn {
  justify-self: start;
}

.contact-card .btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
