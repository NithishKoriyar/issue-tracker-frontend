import { api, refreshSession, setAccessToken } from '@/lib/api'
import { API_ROUTES } from '@/lib/api.constants'
import type { AuthResponse, LoginInput, RegisterInput, User } from '@/types'

// Auth HTTP calls. The server sets / clears the refresh-token cookie;
// this service only stores the short-lived access token in memory.
export const authService = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>(
      API_ROUTES.auth.register,
      input,
    )
    setAccessToken(data.accessToken)
    return data
  },

  // One endpoint for both roles. With asAdmin: true (admin login) the server
  // returns 403 NOT_ADMIN for non-admin accounts and creates no session.
  async login(input: LoginInput): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>(API_ROUTES.auth.login, input)
    setAccessToken(data.accessToken)
    return data
  },

  // Used on app load to restore the session from the refresh cookie.
  refresh(): Promise<AuthResponse> {
    return refreshSession()
  },

  async me(): Promise<User> {
    const { data } = await api.get<{ user: User }>(API_ROUTES.auth.me)
    return data.user
  },

  async logout(): Promise<void> {
    try {
      await api.post(API_ROUTES.auth.logout)
    } finally {
      setAccessToken(null) // clear locally even if the request fails
    }
  },
}
