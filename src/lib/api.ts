import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL, API_ERROR_CODES, API_ROUTES } from '@/lib/api.constants'
import type { ApiErrorBody, AuthResponse } from '@/types'

// Error bodies aren't guaranteed (e.g. a proxy error page), so treat the
// shape as optional when reading it.
type MaybeErrorBody = Partial<ApiErrorBody> | undefined

/* ------------------------------------------------------------------ */
/* Access token — kept in memory only (never localStorage).           */
/* A page reload clears it; the session comes back via refresh.       */
/* ------------------------------------------------------------------ */

let accessToken: string | null = null

export const getAccessToken = () => accessToken

export const setAccessToken = (token: string | null) => {
  accessToken = token
}

// The auth context registers what to do when the session can't be
// refreshed any more (clear user state, go to /login).
let onSessionExpired: (() => void) | null = null

export const setOnSessionExpired = (handler: (() => void) | null) => {
  onSessionExpired = handler
}

/* ------------------------------------------------------------------ */
/* Error shape used across the app                                    */
/* ------------------------------------------------------------------ */

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status: number, code: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (axios.isAxiosError<MaybeErrorBody>(error)) {
    const status = error.response?.status ?? 0
    const body = error.response?.data?.error
    const fallback = status
      ? 'Something went wrong. Please try again.'
      : 'Network error. Check your connection.'
    return new ApiError(
      body?.message ?? fallback,
      status,
      body?.code ?? 'UNKNOWN',
    )
  }

  return new ApiError('Something went wrong. Please try again.', 0, 'UNKNOWN')
}

/* ------------------------------------------------------------------ */
/* Axios instances                                                    */
/* ------------------------------------------------------------------ */

// Main client — every service uses this one.
export const api = axios.create({ baseURL: API_BASE_URL })

// Bare client for /auth/refresh only. It has no interceptors, so a failing
// refresh can never trigger another refresh (no infinite loop).
const refreshClient = axios.create({ baseURL: API_BASE_URL })

/* ------------------------------------------------------------------ */
/* Refresh — single flight                                            */
/* If 5 requests expire at once, they all wait on ONE refresh call.   */
/* The refresh token itself is an httpOnly cookie the browser sends.  */
/* ------------------------------------------------------------------ */

let refreshPromise: Promise<AuthResponse> | null = null

export function refreshSession(): Promise<AuthResponse> {
  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<AuthResponse>(API_ROUTES.auth.refresh)
      .then((res) => {
        setAccessToken(res.data.accessToken)
        return res.data
      })
      .catch((error: unknown) => {
        setAccessToken(null)
        throw toApiError(error)
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

/* ------------------------------------------------------------------ */
/* Interceptors                                                       */
/* ------------------------------------------------------------------ */

// 1. Attach the access token to every request.
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 2. Access token expired → refresh once → retry the original request.
type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<MaybeErrorBody>) => {
    const original = error.config as RetryableConfig | undefined
    const isExpired =
      error.response?.status === 401 &&
      error.response.data?.error?.code === API_ERROR_CODES.tokenExpired

    if (isExpired && original && !original._retry) {
      original._retry = true // retry at most once per request
      try {
        await refreshSession()
        return await api(original) // request interceptor adds the new token
      } catch (retryError) {
        // Refresh failed: the session is over.
        if (!getAccessToken()) onSessionExpired?.()
        throw toApiError(retryError)
      }
    }

    throw toApiError(error)
  },
)
