const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
export const EXPECTED_ACTION = 'contact'
const MAX_TOKEN_LENGTH = 2048
const MAX_BODY_BYTES = 16_384
const MAX_NAME = 120
const MAX_EMAIL = 254
const MAX_MESSAGE = 4000
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

export function publicError(status, error) {
  return { status, body: { ok: false, error } }
}

function sanitizeText(value, max) {
  if (typeof value !== 'string') return ''
  const cleaned = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim()
  if (!cleaned || cleaned.length > max) return ''
  return cleaned
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function readToken(body) {
  if (!body || typeof body !== 'object') return ''
  const raw = body.turnstileToken ?? body['cf-turnstile-response']
  if (typeof raw !== 'string') return ''
  const token = raw.trim()
  if (!token || token.length > MAX_TOKEN_LENGTH) return ''
  if (/[\s\u0000-\u001F\u007F]/.test(token)) return ''
  return token
}

export function hostnameAllowlist(env) {
  const hosts = new Set(
    String(env.TURNSTILE_HOSTNAMES ?? '')
      .split(',')
      .map((hostname) => hostname.trim().toLowerCase())
      .filter(Boolean)
  )

  const production = /^production$/i.test(String(env.AZURE_FUNCTIONS_ENVIRONMENT || ''))
  if (production) {
    for (const host of LOCAL_HOSTS) hosts.delete(host)
  }

  return hosts
}

export function normalizeIp(ip) {
  if (typeof ip !== 'string') return ''
  const value = ip.split(',')[0].trim()
  if (!value || value.length > 64) return ''
  if (!/^[0-9a-fA-F:.]+$/.test(value)) return ''
  return value
}

export async function verifyTurnstile({ token, ip, env, fetchImpl }) {
  const secret = String(env.TURNSTILE_SECRET_KEY || '').trim()
  const expectedHostnames = hostnameAllowlist(env)
  if (!secret || expectedHostnames.size === 0 || !token) {
    return { ok: false }
  }

  const params = new URLSearchParams({
    secret,
    response: token,
  })
  const remoteIp = normalizeIp(ip)
  if (remoteIp) params.set('remoteip', remoteIp)

  let result
  try {
    const response = await fetchImpl(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) return { ok: false }
    result = await response.json()
  } catch {
    return { ok: false }
  }

  const hostname = String(result?.hostname || '').trim().toLowerCase()
  if (
    result?.success !== true ||
    result?.action !== EXPECTED_ACTION ||
    !expectedHostnames.has(hostname)
  ) {
    return { ok: false }
  }

  return { ok: true, hostname }
}

function readInquiry(body) {
  const name = sanitizeText(body?.name, MAX_NAME)
  const email = sanitizeText(body?.email, MAX_EMAIL).toLowerCase()
  const message = sanitizeText(body?.message, MAX_MESSAGE)
  if (!name || !isEmail(email) || !message) return null
  return { name, email, message }
}

/**
 * Public contact submission.
 * Missing or invalid Turnstile tokens fail closed before anything is stored.
 */
export async function handleContactRequest({
  body,
  ip,
  env,
  fetchImpl,
  store,
  contentLength,
}) {
  if (typeof contentLength === 'number' && Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return publicError(400, 'invalid_request')
  }

  const token = readToken(body)
  if (!token) return publicError(403, 'verification_failed')

  const inquiry = readInquiry(body)
  if (!inquiry) return publicError(400, 'invalid_request')

  const verified = await verifyTurnstile({
    token,
    ip,
    env,
    fetchImpl: fetchImpl || globalThis.fetch,
  })
  if (!verified.ok) return publicError(403, 'verification_failed')

  try {
    await store({
      name: inquiry.name,
      email: inquiry.email,
      message: inquiry.message,
      hostname: verified.hostname,
      createdAt: new Date().toISOString(),
    })
  } catch {
    return publicError(503, 'unavailable')
  }

  return { status: 200, body: { ok: true } }
}
