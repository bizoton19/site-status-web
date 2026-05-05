import { ref } from 'vue'

const BASE_URL = 'https://functions-cpsc1.azurewebsites.net/api'

export function useApi() {
  const loading = ref(false)
  const error = ref(null)

  async function fetchStatuses() {
    loading.value = true
    error.value = null
    
    try {
      const response = await fetch(`${BASE_URL}/statuses`, {
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
      const response = await fetch(`${BASE_URL}/poller`, {
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
      const response = await fetch(`${BASE_URL}/urls`, {
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
      const response = await fetch(`${BASE_URL}/url`, {
        method: 'POST',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
          urlName: urlData.urlName,
          url: urlData.url
        }])
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
      const response = await fetch(`${BASE_URL}/url`, {
        method: 'PUT',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{
          urlName: urlData.urlName,
          url: urlData.url
        }])
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
      const response = await fetch(`${BASE_URL}/status?urlName=${encodeURIComponent(urlName)}`, {
        method: 'DELETE',
        credentials: 'omit'
      })
      
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
