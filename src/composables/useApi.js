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
    headers
  }
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
   * @param {{ q?: string, category?: string }} [filters]
   */
  async function fetchPublicStatuses(filters = {}) {
    loading.value = true
    error.value = null

    try {
      const params = {}
      if (filters.q) params.q = filters.q
      if (filters.category) params.category = filters.category

      const response = await fetch(apiUrl(getPublicStatusesFunctionName(), params), {
        method: 'GET',
        credentials: 'omit'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (err) {
      error.value = err.message
      console.error('Error fetching public statuses:', err)
      return []
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
      return data
    } catch (err) {
      error.value = err.message
      console.error('Error fetching URLs:', err)
      return []
    } finally {
      loading.value = false
    }
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

      const saved = await response.json().catch(() => [])
      return { success: true, saved: Array.isArray(saved) ? saved : [] }
    } catch (err) {
      error.value = err.message
      console.error(`Error ${method} URLs:`, err)
      return { success: false, error: err.message }
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
    fetchUrls,
    addUrl,
    addUrls,
    updateUrl,
    deleteUrl,
    fetchDomainHeaders,
    saveDomainHeader,
    deleteDomainHeader
  }
}
