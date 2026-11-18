import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/lib/auth.context'

export const Route = createFileRoute('/(core)/')({
  component: DashboardPage,
})

// One dashboard for both roles. The backend scopes the data by role
// (admin: everything, user: only their issues), so the UI only decides
// which sections to show.
function DashboardPage() {
  const { user, isAdmin } = useAuth()

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-muted-foreground">
        {isAdmin
          ? 'Overview of all issues across the team.'
          : `Issues assigned to you, ${user?.name ?? ''}.`}
      </p>
    </div>
  )
}
