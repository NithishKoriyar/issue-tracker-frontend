import { api } from '@/lib/api'
import { API_ROUTES } from '@/lib/api.constants'
import type { Role, User, UserWithCounts } from '@/types'

export interface UserListParams {
  search?: string // name or email, case-insensitive
  role?: Role // only 'user' or only 'admin' accounts
  limit?: number // at most N rows (1–50)
}

// Admin only: users with their issue counts.
export const usersService = {
  async list(params: UserListParams = {}): Promise<Array<UserWithCounts>> {
    const { data } = await api.get<{ users: Array<UserWithCounts> }>(
      API_ROUTES.users.list,
      { params },
    )
    return data.users
  },

  async get(id: number): Promise<User> {
    const { data } = await api.get<{ user: User }>(API_ROUTES.users.byId(id))
    return data.user
  },
}
