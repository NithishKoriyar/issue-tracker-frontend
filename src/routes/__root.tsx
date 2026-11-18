import {
  Link,
  Outlet,
  createRootRouteWithContext,
} from '@tanstack/react-router'

import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'

import { Toaster } from '@/components/ui/sonner'
import type { AuthState } from '@/lib/auth.context'

import '../styles.css'

// Everything a route's beforeLoad can read via `context`.
export interface RouterContext {
  auth: AuthState
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  notFoundComponent: NotFound,
})

function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link to="/" className="font-medium underline">
        Go to dashboard
      </Link>
    </main>
  )
}

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster richColors position="top-right" />
      {import.meta.env.DEV && (
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'TanStack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            {
              name: 'TanStack Query',
              render: <ReactQueryDevtoolsPanel />,
            },
          ]}
        />
      )}
    </>
  )
}
