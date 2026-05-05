import { PublicClientApplication } from '@azure/msal-browser'
import { reactive } from 'vue'
import { msalConfig, loginRequest } from './authConfig.js'

export const msalInstance = new PublicClientApplication(msalConfig)

/** Reactive active account for UI (top bar, etc.). */
export const authState = reactive({
  account: null,
})

export function getAccount() {
  return (
    msalInstance.getActiveAccount() ||
    msalInstance.getAllAccounts()[0] ||
    null
  )
}

function syncAuthState() {
  authState.account = getAccount()
}

/**
 * Call once at startup before mounting the app / router.
 * Handles the redirect round-trip from Microsoft login.
 */
export async function initAuth() {
  await msalInstance.initialize()
  const result = await msalInstance.handleRedirectPromise()
  if (result?.account) {
    msalInstance.setActiveAccount(result.account)
  } else if (!getAccount()) {
    const accounts = msalInstance.getAllAccounts()
    if (accounts.length === 1) {
      msalInstance.setActiveAccount(accounts[0])
    }
  }
  syncAuthState()
  return result
}

export async function signInRedirect(extra = {}) {
  await msalInstance.loginRedirect({ ...loginRequest, ...extra })
}

export async function signOut() {
  sessionStorage.removeItem('auth_return')
  await msalInstance.logoutRedirect({
    postLogoutRedirectUri: msalConfig.auth.postLogoutRedirectUri,
  })
}

export { loginRequest }
