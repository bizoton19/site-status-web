import { ref } from 'vue'
import { normalizeHistoryPayload } from '../utils/statusHistory'

const DEFAULT_BASE =
  'https://healthchker-akhghwe9adgxcqdt.eastus-01.azurewebsites.net/api'

/**
 * HTTP routes match the Function App’s invoke URLs (see Azure Portal or
 * `az functionapp function list -g functions-cpsc1 -n healthchker`).
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

function getBaseUrl() {
  // Dev + VITE_DEV_PROXY: call /__healthchker/api/... on the Vite host so the browser stays same-origin.
  // Production (or dev with proxy off): use VITE_API_BASE_URL or default Azure URL — requires CORS on the Function App.
  const useProxy = import.meta.env.VITE_DEV_PROXY === 'true'
  if (useProxy && typeof window !== 'undefined') {
    return `${window.location.origin}/__healthchker/api`.replace(/\/$/, '')
  }
  const raw = import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE
  return raw.replace(/\/$/, '')
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

/**
 * Build an Azure Functions URL with `code` query param and extra search params.
 */
function apiUrl(path, searchParams = {}) {
  const base = getBaseUrl()
  const pathname = path.startsWith('http') ? path : `${base}/${path.replace(/^\//, '')}`
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : DEFAULT_BASE
  const url = new URL(pathname, origin)
  url.searchParams.set('code', requireApiCode())
  Object.entries(searchParams).forEach(([k, v]) => {
    if (v != null && v !== '') {
      url.searchParams.set(k, String(v))
    }
  })
  return url.href
}

export function useApi() {
  const loading = ref(false)
  const error = ref(null)

  async function fetchStatuses() {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(apiUrl(getStatusReaderFunctionName()), {
        method: 'GET',
        credentials: 'omit'
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

  async function refreshStatuses() {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(apiUrl(getPollerFunctionName()), {
        method: 'GET',
        credentials: 'omit'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const message = (await response.text()).trim()
      return { success: true, status: response.status, message }
    } catch (err) {
      error.value = err.message
      console.error('Error refreshing statuses:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  async function fetchUrls() {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(apiUrl(getUrlListReaderFunctionName()), {
        method: 'GET',
        credentials: 'omit'
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

  async function addUrl(urlData) {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(apiUrl(getUrlPersisterFunctionName()), {
        method: 'POST',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([
          {
            urlName: urlData.urlName,
            url: urlData.url
          }
        ])
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return { success: true }
    } catch (err) {
      error.value = err.message
      console.error('Error adding URL:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  async function updateUrl(urlData) {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(apiUrl(getUrlPersisterFunctionName()), {
        method: 'PUT',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([
          {
            urlName: urlData.urlName,
            url: urlData.url
          }
        ])
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return { success: true }
    } catch (err) {
      error.value = err.message
      console.error('Error updating URL:', err)
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  /**
   * Historical checks from storage (statusHistoryTable).
   * Does not use the shared `loading` ref to avoid clobbering parallel status/URL loads.
   */
  async function fetchStatusHistory() {
    try {
      const response = await fetch(apiUrl(getHistoryReaderFunctionName()), {
        method: 'GET',
        credentials: 'omit'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return normalizeHistoryPayload(data)
    } catch (err) {
      console.error('Error fetching status history:', err)
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
          credentials: 'omit'
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

  return {
    loading,
    error,
    fetchStatuses,
    fetchStatusHistory,
    refreshStatuses,
    fetchUrls,
    addUrl,
    updateUrl,
    deleteUrl
  }
}
