// Relative base URL: Vite (dev) and nginx (prod) proxy /api to the backend,
// so the browser only ever talks to one origin — no CORS, first-party cookies.
export const API_BASE_URL = '/api'

// Every backend path lives here. Pages and services never hard-code URLs.
export const API_ROUTES = {
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
  },
} as const

// Backend error codes the frontend reacts to.
export const API_ERROR_CODES = {
  tokenExpired: 'TOKEN_EXPIRED',
} as const
