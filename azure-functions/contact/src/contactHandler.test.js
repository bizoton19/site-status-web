import assert from 'node:assert/strict'
import test from 'node:test'
import { handleContactRequest } from './contactHandler.js'

const SECRET = 'test-secret-not-real'
const TOKEN = 'token.with_parts-OK'

function env(overrides = {}) {
  return {
    TURNSTILE_SECRET_KEY: SECRET,
    TURNSTILE_HOSTNAMES: 'outpost13.app',
    ...overrides,
  }
}

function siteverify(result, { onCall } = {}) {
  return async (url, options) => {
    if (onCall) onCall(url, options)
    return {
      ok: true,
      async json() {
        return result
      },
    }
  }
}

function passingVerify() {
  return siteverify({
    success: true,
    action: 'contact',
    hostname: 'outpost13.app',
  })
}

const inquiry = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'We need monitoring for a few public status pages.',
  turnstileToken: TOKEN,
}

test('rejects a missing Turnstile token before siteverify or storage', async () => {
  let fetched = false
  let stored = false
  const result = await handleContactRequest({
    body: { ...inquiry, turnstileToken: '' },
    env: env(),
    fetchImpl: () => {
      fetched = true
    },
    store: () => {
      stored = true
    },
  })

  assert.equal(result.status, 403)
  assert.deepEqual(result.body, { ok: false, error: 'verification_failed' })
  assert.equal(fetched, false)
  assert.equal(stored, false)
})

test('rejects an invalid token without storing the message', async () => {
  let stored = false
  const result = await handleContactRequest({
    body: inquiry,
    env: env(),
    fetchImpl: siteverify({
      success: false,
      'error-codes': ['invalid-input-response'],
      action: 'contact',
      hostname: 'outpost13.app',
    }),
    store: () => {
      stored = true
    },
  })

  assert.equal(result.status, 403)
  assert.equal(result.body.error, 'verification_failed')
  assert.equal(stored, false)
  assert.equal(JSON.stringify(result.body).includes(inquiry.message), false)
  assert.equal(JSON.stringify(result.body).includes(SECRET), false)
})

test('fails closed when the secret or hostname allowlist is missing', async () => {
  for (const broken of [
    env({ TURNSTILE_SECRET_KEY: '' }),
    env({ TURNSTILE_HOSTNAMES: '' }),
  ]) {
    let fetched = false
    const result = await handleContactRequest({
      body: inquiry,
      env: broken,
      fetchImpl: () => {
        fetched = true
      },
      store: () => {},
    })
    assert.equal(result.status, 403)
    assert.equal(fetched, false)
  }
})

test('rejects a token minted for another action or hostname', async () => {
  const cases = [
    { success: true, action: 'signup', hostname: 'outpost13.app' },
    { success: true, action: 'contact', hostname: 'evil.example' },
    { success: true, action: 'contact', hostname: 'localhost' },
  ]

  for (const payload of cases) {
    let stored = false
    const result = await handleContactRequest({
      body: inquiry,
      env: env(),
      fetchImpl: siteverify(payload),
      store: () => {
        stored = true
      },
    })
    assert.equal(result.status, 403)
    assert.equal(stored, false)
  }
})

test('drops localhost from the production hostname allowlist', async () => {
  let stored = false
  const result = await handleContactRequest({
    body: inquiry,
    env: env({
      AZURE_FUNCTIONS_ENVIRONMENT: 'Production',
      TURNSTILE_HOSTNAMES: 'localhost,127.0.0.1',
    }),
    fetchImpl: siteverify({
      success: true,
      action: 'contact',
      hostname: 'localhost',
    }),
    store: () => {
      stored = true
    },
  })

  assert.equal(result.status, 403)
  assert.equal(stored, false)
})

test('stores a verified inquiry and returns a privacy-safe success body', async () => {
  const seen = []
  let siteverifyBody = ''
  const result = await handleContactRequest({
    body: {
      ...inquiry,
      email: ' Ada@Example.com ',
      'cf-turnstile-response': TOKEN,
    },
    ip: '203.0.113.8, 10.0.0.1',
    env: env(),
    fetchImpl: siteverify(
      { success: true, action: 'contact', hostname: 'outpost13.app' },
      {
        onCall(_url, options) {
          siteverifyBody = String(options.body)
        },
      }
    ),
    store: async (record) => {
      seen.push(record)
    },
  })

  assert.equal(result.status, 200)
  assert.deepEqual(result.body, { ok: true })
  assert.equal(seen.length, 1)
  assert.equal(seen[0].name, 'Ada Lovelace')
  assert.equal(seen[0].email, 'ada@example.com')
  assert.equal(seen[0].hostname, 'outpost13.app')
  assert.equal(siteverifyBody.includes('remoteip=203.0.113.8'), true)
  assert.equal(siteverifyBody.includes(SECRET), true)
  assert.equal(JSON.stringify(result.body).includes('ada@example.com'), false)
})

test('returns a generic error when storage fails', async () => {
  const result = await handleContactRequest({
    body: inquiry,
    env: env(),
    fetchImpl: passingVerify(),
    store: async () => {
      throw new Error('AccountKey=super-secret connection failure')
    },
  })

  assert.equal(result.status, 503)
  assert.deepEqual(result.body, { ok: false, error: 'unavailable' })
  assert.equal(JSON.stringify(result.body).includes('super-secret'), false)
})

test('rejects an oversized body and an invalid email without calling siteverify', async () => {
  let calls = 0
  const fetchImpl = () => {
    calls += 1
  }

  const oversized = await handleContactRequest({
    body: inquiry,
    contentLength: 20_000,
    env: env(),
    fetchImpl,
    store: async () => {},
  })
  assert.equal(oversized.status, 400)

  const badEmail = await handleContactRequest({
    body: { ...inquiry, email: 'not-an-email' },
    env: env(),
    fetchImpl,
    store: async () => {},
  })
  assert.equal(badEmail.status, 400)
  assert.equal(badEmail.body.error, 'invalid_request')
  assert.equal(calls, 0)
})

test('fails closed when siteverify is unreachable', async () => {
  const result = await handleContactRequest({
    body: inquiry,
    env: env(),
    fetchImpl: async () => {
      throw new Error('network down')
    },
    store: async () => {
      throw new Error('should not store')
    },
  })

  assert.equal(result.status, 403)
  assert.equal(result.body.error, 'verification_failed')
})
