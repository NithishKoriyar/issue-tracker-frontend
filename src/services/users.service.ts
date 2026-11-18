import { api } from '@/lib/api'
import { API_ROUTES } from '@/lib/api.constants'
import type { Role, User, UserListResponse } from '@/types'

export interface UserListParams {
  search?: string // name or email, case-insensitive
  role?: Role // only 'user' or only 'admin' accounts
  page?: number // 1-based (default 1)
  pageSize?: number // 1–50 (default 10)
}

// Admin only: users with their issue counts.
export const usersService = {
  // One page of users + { page, pageSize, total, totalPages }.
  async list(params: UserListParams = {}): Promise<UserListResponse> {
    const { data } = await api.get<UserListResponse>(API_ROUTES.users.list, {
      params,
    })
    return data
  },

  async get(id: number): Promise<User> {
    const { data } = await api.get<{ user: User }>(API_ROUTES.users.byId(id))
    return data.user
  },
}
