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
  issues: {
    list: '/issues',
    byId: (id: number) => `/issues/${id}`,
    status: (id: number) => `/issues/${id}/status`,
    comments: (id: number) => `/issues/${id}/comments`,
  },
  users: {
    list: '/users',
  },
  dashboard: {
    stats: '/dashboard/stats',
  },
} as const

// Every TanStack Query cache key starts with one of these. Pages build keys
// like [QUERY_KEYS.issues, filters] or [QUERY_KEYS.issue, id], and mutations
// invalidate by prefix — so a typo can never silently skip a refresh.
export const QUERY_KEYS = {
  issues: 'issues', //       [issues, filters]  → issue lists
  issue: 'issue', //         [issue, id]        → one issue
  comments: 'comments', //   [comments, issueId]
  users: 'users', //         [users]            → admin users list / assign dropdown
  dashboard: 'dashboard', // [dashboard]        → stats
} as const

// Backend error codes the frontend reacts to.
export const API_ERROR_CODES = {
  tokenExpired: 'TOKEN_EXPIRED',
} as const
