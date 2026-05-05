import { ref } from 'vue'

const DEFAULT_BASE =
  'https://healthchker-akhghwe9adgxcqdt.eastus-01.azurewebsites.net/api'

/** Poller HTTP trigger (replaces legacy `/poller`). */
const POLLER_FUNCTION = 'httpPollerTrigger'

function getBaseUrl() {
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
  const url = new URL(pathname)
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
      const response = await fetch(apiUrl('statuses'), {
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
      const response = await fetch(apiUrl(POLLER_FUNCTION), {
        method: 'GET',
        credentials: 'omit'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return { success: true, status: response.status }
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
      const response = await fetch(apiUrl('urls'), {
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
      const response = await fetch(apiUrl('url'), {
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
      const response = await fetch(apiUrl('url'), {
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

  async function deleteUrl(urlName) {
    loading.value = true
    error.value = null

    try {
      const response = await fetch(
        apiUrl('status', { urlName }),
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
    refreshStatuses,
    fetchUrls,
    addUrl,
    updateUrl,
    deleteUrl
  }
}
