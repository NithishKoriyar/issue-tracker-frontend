import { api } from '@/lib/api'
import { API_ROUTES } from '@/lib/api.constants'
import type { UserWithCounts } from '@/types'

// Admin only: every user with their issue counts.
export const usersService = {
  async list(): Promise<Array<UserWithCounts>> {
    const { data } = await api.get<{ users: Array<UserWithCounts> }>(
      API_ROUTES.users.list,
    )
    return data.users
  },
}
