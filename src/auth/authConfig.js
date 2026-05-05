/**
 * Azure AD / MSAL SPA configuration.
 * Set VITE_* values in `.env` (see `.env.example`). Redirect URIs must match the app registration exactly.
 */

const tenant =
  typeof import.meta.env.VITE_AAD_TENANT_ID === 'string'
    ? import.meta.env.VITE_AAD_TENANT_ID.trim()
    : ''

const defaultOrigin =
  typeof window !== 'undefined' ? `${window.location.origin}/` : '/'

export const msalConfig = {
  auth: {
    clientId:
      typeof import.meta.env.VITE_AAD_CLIENT_ID === 'string'
        ? import.meta.env.VITE_AAD_CLIENT_ID.trim()
        : '',
    authority: `https://login.microsoftonline.com/${tenant || 'common'}`,
    redirectUri:
      typeof import.meta.env.VITE_REDIRECT_URI === 'string' &&
      import.meta.env.VITE_REDIRECT_URI.trim()
        ? import.meta.env.VITE_REDIRECT_URI.trim()
        : defaultOrigin,
    postLogoutRedirectUri:
      typeof import.meta.env.VITE_POST_LOGOUT_REDIRECT_URI === 'string' &&
      import.meta.env.VITE_POST_LOGOUT_REDIRECT_URI.trim()
        ? import.meta.env.VITE_POST_LOGOUT_REDIRECT_URI.trim()
        : defaultOrigin,
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
}

export const loginRequest = {
  scopes: ['User.Read'],
}
