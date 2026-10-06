import { ref } from 'vue'
import { getClerkToken } from '../auth/clerkConfig'
import { normalizeHistoryPayload } from '../utils/statusHistory'

const DEFAULT_BASE =
  'https://wt-health-dev-ok2.azurewebsites.net/api'

/**
 * HTTP routes match the Function App’s invoke URLs (see Azure Portal or
 * `az functionapp function list -g rg-watchtower-dev -n wt-health-dev-ok2`).
 * Paths are case-insensitive on Azure; defaults match invokeUrlTemplate lowercase.
 */

/** Manual poll — GET, plain-text orchestration message */
function getPollerFunctionName() {
  const raw = import.meta.env.VITE_POLLER_FUNCTION
  if (raw && String(raw).trim()) return String(raw).trim()
  return 'httppollertrigger'
}

/** Authenticated single-URL poll — GET/POST JSON */
function getPollUrlFunctionName() {
  const raw = import.meta.env.VITE_POLL_URL_FUNCTION
  if (raw && String(raw).trim()) return String(raw).trim()
  return 'pollurl'
}

/** Monitored URL rows — GET JSON */
function getUrlListReaderFunctionName() {
  const raw = import.meta.env.VITE_URL_LIST_FUNCTION
  if (raw && String(raw).trim()) return String(raw).trim()
  return 'statusurllistreader'
}

/** Current site status rows — GET JSON (statusTable) */
function getStatusReaderFunctionName() {
  const raw = import.meta.env.VITE_STATUS_FUNCTION
  if (raw && String(raw).trim()) return String(raw).trim()
  return 'statussitestatereader'
}

/** Add / update / delete URLs — POST, PUT, DELETE (+ queue) */
function getUrlPersisterFunctionName() {
  const raw = import.meta.env.VITE_URL_PERSISTER_FUNCTION
  if (raw && String(raw).trim()) return String(raw).trim()
  return 'urlpersister'
}

/** Status history rows — GET JSON (statusHistoryTable) */
function getHistoryReaderFunctionName() {
  const raw = import.meta.env.VITE_HISTORY_FUNCTION
  if (raw && String(raw).trim()) return String(raw).trim()
  return 'statushistoryreader'
}

/** Aggregated uptime/check stats — GET JSON */
function getStatsReaderFunctionName() {
  const raw = import.meta.env.VITE_STATS_FUNCTION
  if (raw && String(raw).trim()) return String(raw).trim()
  return 'statusstatsreader'
}

/** Anonymous public directory — GET JSON (visibility=public only) */
function getPublicStatusesFunctionName() {
  const raw = import.meta.env.VITE_PUBLIC_STATUSES_FUNCTION
  if (raw && String(raw).trim()) return String(raw).trim()
  return 'publicstatusesreader'
}

/** Domain-level header profiles — GET JSON */
function getDomainHeaderReaderFunctionName() {
  const raw = import.meta.env.VITE_DOMAIN_HEADER_READER_FUNCTION
  if (raw && String(raw).trim()) return String(raw).trim()
  return 'domainheaderreader'
}

/** Domain-level header profiles — POST / PUT / DELETE */
function getDomainHeaderPersisterFunctionName() {
  const raw = import.meta.env.VITE_DOMAIN_HEADER_PERSISTER_FUNCTION
  if (raw && String(raw).trim()) return String(raw).trim()
  return 'domainheaderpersister'
}

function getBaseUrl() {
  // Proxy only during `vite` dev — never in production builds (no /__watchtower route there).
  const useProxy =
    import.meta.env.DEV && import.meta.env.VITE_DEV_PROXY === 'true'
  if (useProxy && typeof window !== 'undefined') {
    return `${window.location.origin}/__watchtower/api`.replace(/\/$/, '')
  }

  let base = String(import.meta.env.VITE_API_BASE_URL || '').trim()
  if (!base) base = DEFAULT_BASE
  base = base.replace(/\/$/, '')

  // Must be absolute — relative values were resolved against window.location (Netlify) by URL().
  if (!/^https?:\/\//i.test(base)) {
    console.warn('VITE_API_BASE_URL must be absolute; falling back to default Azure API base.')
    base = DEFAULT_BASE.replace(/\/$/, '')
  }

  if (typeof window !== 'undefined') {
    try {
      if (new URL(base).origin === window.location.origin) {
        console.warn(
          'VITE_API_BASE_URL matches this site origin; falling back to default Azure API base.'
        )
        base = DEFAULT_BASE.replace(/\/$/, '')
      }
    } catch {
      base = DEFAULT_BASE.replace(/\/$/, '')
    }
  }

  return base
}

/** True when the body looks like our SPA or any HTML page, not a poller plain-text response. */
function isSpaOrHtmlBody(text) {
  if (!text || typeof text !== 'string') return false
  const head = text.slice(0, 800).trim()
  if (/^<!DOCTYPE\s+html/i.test(head) || /<html[\s>]/i.test(head)) return true
  if (/Site Status Dashboard/i.test(head) && /site-status-theme/i.test(head)) return true
  return false
}

/** For logs only — never show ?code= in UI copy. */
function redactUrlForLog(href) {
  try {
    const u = new URL(href)
    u.searchParams.delete('code')
    return u.toString()
  } catch {
    return '(invalid url)'
  }
}

function pollerResponseError() {
  return (
    'Poll hit this website instead of Azure Functions. Set VITE_API_BASE_URL to your ' +
    'Function App (…azurewebsites.net/api) in Netlify, then trigger a new deploy.'
  )
}

function getApiCode() {
  const raw = import.meta.env.VITE_API_CODE
  return typeof raw === 'string' ? raw.trim() : ''
}

/**
 * Every Azure HTTP function requires `?code=` (function or host key).
 * Local `npm run dev` must load it from `.env` via VITE_API_CODE.
 */
function requireApiCode() {
  const code = getApiCode()
  if (!code) {
    throw new Error(
      'Missing VITE_API_CODE. Copy .env.example to .env and set your Azure Functions key (required for all API calls).'
    )
  }
  return code
}

function isAbsoluteHttpUrl(path) {
  return /^https?:\/\//i.test(String(path))
}

/**
 * Build an Azure Functions URL with `code` query param and extra search params.
 */
function apiUrl(path, searchParams = {}) {
  const segment = String(path).replace(/^\//, '')
  const base = getBaseUrl()
  const url = isAbsoluteHttpUrl(path)
    ? new URL(path)
    : new URL(`${base}/${segment}`)
  url.searchParams.set('code', requireApiCode())
  Object.entries(searchParams).forEach(([k, v]) => {
    if (v != null && v !== '') {
      url.searchParams.set(k, String(v))
    }
  })
  return url.href
}

async function authHeaders(extraHeaders = {}) {
  const token = await getClerkToken().catch(() => null)
  return token
    ? { ...extraHeaders, Authorization: `Bearer ${token}` }
    : extraHeaders
}

/**
 * Default poller User-Agent. Keep in sync with Functions CustomHeaders.DefaultUserAgent
 * (WAF allowlist docs use this exact string).
 */
export const DEFAULT_MONITOR_USER_AGENT = 'Outpost13Monitor/1.0'

function hasUserAgentHeader(headers) {
  return Object.keys(headers || {}).some((k) => k.toLowerCase() === 'user-agent')
}

/** Ensure every URL payload includes a User-Agent unless the caller set one. */
function ensureDefaultUserAgent(headers) {
  const out = headers && typeof headers === 'object' ? { ...headers } : {}
  if (!hasUserAgentHeader(out)) {
    out['User-Agent'] = DEFAULT_MONITOR_USER_AGENT
  }
  return out
}

/** Normalize header rows → { Key: value } for urlPersister. */
function buildUrlPayload(urlData) {
  const headers = {}
  const rows = Array.isArray(urlData.headers) ? urlData.headers : []
  for (const row of rows) {
    const key = String(row?.key || row?.name || '').trim()
    const value = row?.value == null ? '' : String(row.value)
    if (!key) continue
    headers[key] = value
  }

  return {
    urlName: urlData.urlName,
    url: urlData.url,
    category: urlData.category || 'General',
    visibility: urlData.visibility === 'public' ? 'public' : 'private',
    headers: ensureDefaultUserAgent(headers)
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function useApi() {
  const loading = ref(false)
  const error = ref(null)

  async function fetchStatuses(options = {}) {
    loading.value = true
    error.value = null

    try {
      const headers = options.publicAggregate ? {} : await authHeaders()
      const response = await fetch(apiUrl(getStatusReaderFunctionName()), {
        method: 'GET',
        credentials: 'omit',
        headers
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (err) {
      error.value = err.message
      console.error('Error fetching statuses:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Public landing directory — anonymous, public endpoints only.
   * Returns { summary, page, pageSize, totalOwners, totalPages, groups }.
   * Groups are owner-partition buckets with opaque groupKey (never render as a label).
   * @param {{ q?: string, category?: string, page?: number, pageSize?: number, maxUrls?: number }} [filters]
   */
  async function fetchPublicStatuses(filters = {}) {
    loading.value = true
    error.value = null

const empty = {
      summary: { domains: 0, urls: 0, up: 0, down: 0, blocked: 0, uptimePct: 0 },
      page: 1,
      pageSize: 10,
      totalOwners: 0,
      totalPages: 1,
      groups: []
    }

    try {
      const params = {}
      if (filters.q) params.q = filters.q
      if (filters.category) params.category = filters.category
      if (filters.page) params.page = filters.page
      if (filters.pageSize) params.pageSize = filters.pageSize
      if (filters.maxUrls != null && filters.maxUrls !== '') params.maxUrls = filters.maxUrls

      const response = await fetch(apiUrl(getPublicStatusesFunctionName(), params), {
        method: 'GET',
        credentials: 'omit'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      // Legacy: plain array
      if (Array.isArray(data)) {
        return {
          ...empty,
          summary: {
            domains: new Set(data.map((r) => r.Domain || r.domain).filter(Boolean)).size,
            urls: data.length,
            up: data.filter((r) => String(r.Status || r.status || '').toUpperCase() === 'OK').length,
            down: 0,
            blocked: 0,
            uptimePct: 0
          },
          groups: [],
          _legacyItems: data
        }
      }

      const summary = data.summary || data.Summary || empty.summary
      return {
        summary: {
          domains: summary.domains ?? summary.Domains ?? 0,
          urls: summary.urls ?? summary.Urls ?? 0,
          up: summary.up ?? summary.Up ?? 0,
          down: summary.down ?? summary.Down ?? 0,
          blocked: summary.blocked ?? summary.Blocked ?? 0,
          uptimePct: summary.uptimePct ?? summary.UptimePct ?? 0
        },
        page: data.page ?? data.Page ?? 1,
        pageSize: data.pageSize ?? data.PageSize ?? 10,
        totalOwners: data.totalOwners ?? data.TotalOwners
          ?? data.totalDomains ?? data.TotalDomains ?? 0,
        totalPages: data.totalPages ?? data.TotalPages ?? 1,
        groups: (data.groups || data.Groups || []).map((g, index) => ({
          // Opaque key for Vue :key only — never display as owner/org label
          groupKey: g.groupKey || g.GroupKey || `group-${index}`,
          urlCount: g.urlCount ?? g.UrlCount ?? 0,
          upCount: g.upCount ?? g.UpCount ?? 0,
          downCount: g.downCount ?? g.DownCount ?? 0,
          items: (g.items || g.Items || []).map((row) => {
            const domainRaw = String(row.Domain ?? row.domain ?? '').trim()
            const domain = /^unknown$/i.test(domainRaw) ? '' : domainRaw
            return {
              url: row.Url ?? row.url ?? '',
              domain,
              category: row.Category ?? row.category ?? 'General',
              status: row.Status ?? row.status ?? '',
              date: row.Date ?? row.date ?? null
            }
          })
        }))
      }
    } catch (err) {
      error.value = err.message
      console.error('Error fetching public statuses:', err)
      return empty
    } finally {
      loading.value = false
    }
  }

  /**
   * Fire-and-forget poll submission. Returns immediately after starting fetch;
   * does not wait for the poller HTTP response (orchestration may run for minutes).
   */
  function submitPollRequest() {
    let pollUrl
    try {
      pollUrl = apiUrl(getPollerFunctionName())
    } catch (err) {
      return {
        ok: false,
        error: err.message || 'Could not build poll request URL.',
      }
    }

    void authHeaders()
      .then((headers) => fetch(pollUrl, { method: 'GET', credentials: 'omit', headers }))
      .then((response) => {
        if (!response.ok) {
          console.warn(
            'Poll request HTTP error:',
            response.status,
            redactUrlForLog(pollUrl)
          )
          return null
        }
        return response.text()
      })
      .then((body) => {
        if (body && isSpaOrHtmlBody(body)) {
          console.error('Poll returned HTML; request (redacted):', redactUrlForLog(pollUrl))
        }
      })
      .catch((err) => {
        console.warn('Poll background request failed:', err.message || err)
      })

    return { ok: true }
  }

  /**
   * Poll a single monitored URL for the signed-in tenant.
   * Updates statusTable + history for that urlName only (no full fan-out).
   * @param {string} urlName
   */
  async function pollUrl(urlName) {
    const name = String(urlName || '').trim()
    if (!name) {
      return { success: false, error: 'urlName is required.' }
    }

    try {
      const response = await fetch(
        apiUrl(getPollUrlFunctionName(), { urlName: name }),
        {
          method: 'POST',
          credentials: 'omit',
          headers: await authHeaders()
        }
      )

      if (!response.ok) {
        let detail = `HTTP error! status: ${response.status}`
        try {
          const body = await response.json()
          if (body?.error) detail = body.error
        } catch {
          /* ignore non-JSON error bodies */
        }
        throw new Error(detail)
      }

      const data = await response.json()
      return { success: true, data }
    } catch (err) {
      console.error('Error polling URL:', err)
      return { success: false, error: err.message || 'Poll failed.' }
    }
  }

  /** @deprecated Prefer submitPollRequest for UI; kept for callers that need to await. */
  async function refreshStatuses() {
    const sent = submitPollRequest()
    if (!sent.ok) {
      error.value = sent.error
      return { success: false, error: sent.error }
    }
    return { success: true, submitted: true, status: 0, message: '' }
  }

  async function fetchUrls() {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(apiUrl(getUrlListReaderFunctionName()), {
        method: 'GET',
        credentials: 'omit',
        headers: await authHeaders()
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (err) {
      error.value = err.message
      console.error('Error fetching URLs:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Re-fetch URL list with short backoff when the first read looks empty/stale
   * relative to names we just saved.
   */
  async function fetchUrlsWithRetry({ expectedNames = [], attempts = 3 } = {}) {
    const expected = new Set(
      (expectedNames || []).map((n) => String(n || '').trim()).filter(Boolean)
    )
    const delays = [200, 350, 500]
    let last = []

    for (let i = 0; i < attempts; i++) {
      last = await fetchUrls()
      if (expected.size === 0) {
        if (last.length > 0 || i === attempts - 1) return last
      } else {
        const names = new Set(
          last.map((u) => u?.UrlName || u?.urlName || '').filter(Boolean)
        )
        const hasAll = [...expected].every((n) => names.has(n))
        if (hasAll) return last
      }
      if (i < attempts - 1) {
        await sleep(delays[Math.min(i, delays.length - 1)])
      }
    }

    return last
  }

  async function persistUrls(method, urlDataList) {
    loading.value = true
    error.value = null

    try {
      const payload = (Array.isArray(urlDataList) ? urlDataList : [urlDataList]).map(buildUrlPayload)
      const response = await fetch(apiUrl(getUrlPersisterFunctionName()), {
        method,
        credentials: 'omit',
        headers: await authHeaders({
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify(payload)
      })

      // Sync write must return 200 + entities — 202 means queue-only / incomplete.
      if (response.status === 202) {
        throw new Error(
          'URL save was accepted but not confirmed by the server. Refresh and try again.'
        )
      }

      if (!response.ok) {
        let detail = `HTTP error! status: ${response.status}`
        try {
          const body = await response.json()
          if (body?.error) detail = body.error
        } catch {
          // ignore
        }
        throw new Error(detail)
      }

      const saved = await response.json().catch(() => null)
      if (!Array.isArray(saved) || saved.length === 0) {
        throw new Error('Server did not return saved URLs. Nothing was confirmed.')
      }
      return { success: true, saved }
    } catch (err) {
      error.value = err.message
      console.error(`Error ${method} URLs:`, err)
      return { success: false, error: err.message, saved: [] }
    } finally {
      loading.value = false
    }
  }

  async function addUrl(urlData) {
    return persistUrls('POST', urlData)
  }

  async function addUrls(urlDataList) {
    return persistUrls('POST', urlDataList)
  }

  async function updateUrl(urlData) {
    return persistUrls('PUT', urlData)
  }

  /**
   * Historical checks from storage (statusHistoryTable).
   * Returns { items, nextPageToken } — pass nextPageToken to load next page.
   */
  async function fetchStatusHistory(nextPageToken = null) {
    try {
      const params = {}
      if (nextPageToken) params.nextPageToken = nextPageToken
      const response = await fetch(apiUrl(getHistoryReaderFunctionName(), params), {
        method: 'GET',
        credentials: 'omit',
        headers: await authHeaders()
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const items = normalizeHistoryPayload(data)
      const token = (data && !Array.isArray(data) && data.nextPageToken) ? data.nextPageToken : null
      return { items, nextPageToken: token }
    } catch (err) {
      console.error('Error fetching status history:', err)
      return { items: [], nextPageToken: null }
    }
  }

  /**
   * Aggregated stats rows from statusstatsreader (for uptime/chart widgets).
   */
  async function fetchStatusStats() {
    try {
      const response = await fetch(apiUrl(getStatsReaderFunctionName()), {
        method: 'GET',
        credentials: 'omit',
        headers: await authHeaders()
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return normalizeHistoryPayload(data)
    } catch (err) {
      console.error('Error fetching status stats:', err)
      return []
    }
  }

  async function deleteUrl(urlName) {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(
        apiUrl(getUrlPersisterFunctionName(), { urlName }),
        {
          method: 'DELETE',
          credentials: 'omit',
          headers: await authHeaders()
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return { success: true }
    } catch (err) {
      error.value = err.message
      console.error('Error deleting URL:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete many URLs sequentially (reuses deleteUrl).
   * @param {string[]} urlNames
   * @returns {{ success: boolean, deleted: string[], failed: { urlName: string, error?: string }[] }}
   */
  async function deleteUrls(urlNames) {
    const deleted = []
    const failed = []
    for (const urlName of urlNames || []) {
      if (!urlName) continue
      const result = await deleteUrl(urlName)
      if (result.success) deleted.push(urlName)
      else failed.push({ urlName, error: result.error })
    }
    return {
      success: failed.length === 0 && deleted.length > 0,
      deleted,
      failed
    }
  }

  async function fetchDomainHeaders() {
    try {
      const response = await fetch(apiUrl(getDomainHeaderReaderFunctionName()), {
        method: 'GET',
        credentials: 'omit',
        headers: await authHeaders()
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (err) {
      console.error('Error fetching domain headers:', err)
      return []
    }
  }

  async function saveDomainHeader(payload, { isEdit = false } = {}) {
    try {
      const headersObj = {}
      for (const row of payload.headers || []) {
        const key = String(row?.key || '').trim()
        if (!key) continue
        headersObj[key] = row?.value == null ? '' : String(row.value)
      }

      const response = await fetch(apiUrl(getDomainHeaderPersisterFunctionName()), {
        method: isEdit ? 'PUT' : 'POST',
        credentials: 'omit',
        headers: await authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          domain: payload.domain,
          label: payload.label || '',
          headers: headersObj
        })
      })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      return { success: true, data: await response.json() }
    } catch (err) {
      console.error('Error saving domain headers:', err)
      return { success: false, error: err.message }
    }
  }

  async function deleteDomainHeader(domain) {
    try {
      const response = await fetch(
        apiUrl(getDomainHeaderPersisterFunctionName(), { domain }),
        {
          method: 'DELETE',
          credentials: 'omit',
          headers: await authHeaders()
        }
      )
      if (!response.ok && response.status !== 204) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return { success: true }
    } catch (err) {
      console.error('Error deleting domain headers:', err)
      return { success: false, error: err.message }
    }
  }

  return {
    loading,
    error,
    fetchStatuses,
    fetchPublicStatuses,
    fetchStatusHistory,
    fetchStatusStats,
    refreshStatuses,
    submitPollRequest,
    pollUrl,
    fetchUrls,
    fetchUrlsWithRetry,
    addUrl,
    addUrls,
    updateUrl,
    deleteUrl,
    deleteUrls,
    fetchDomainHeaders,
    saveDomainHeader,
    deleteDomainHeader
  }
}
