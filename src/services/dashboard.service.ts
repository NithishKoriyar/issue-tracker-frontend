import { api } from '@/lib/api'
import { API_ROUTES } from '@/lib/api.constants'
import type { DashboardStats } from '@/types'

// Scoped by the server: admin gets everything, a user only their own counts.
export const dashboardService = {
  async stats(): Promise<DashboardStats> {
    const { data } = await api.get<DashboardStats>(API_ROUTES.dashboard.stats)
    return data
  },
}
