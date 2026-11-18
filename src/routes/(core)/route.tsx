import { Outlet, createFileRoute } from '@tanstack/react-router'
import { Navbar } from '@/components/layout/Navbar'
import { requireAuth } from '@/lib/auth.guards'

// Layout + guard for every logged-in page in the (core) group.
// Not logged in → /login?redirect=<where they were going>.
export const Route = createFileRoute('/(core)')({
  beforeLoad: ({ context, location }) =>
    requireAuth(context.auth, location.href),
  component: CoreLayout,
})

function CoreLayout() {
  return (
    <div className="min-h-svh bg-muted/40">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
