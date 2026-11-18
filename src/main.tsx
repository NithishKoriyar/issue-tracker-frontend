import { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getRouter } from './router'
import { ApiError } from '@/lib/api'
import { AuthProvider, useAuth } from '@/lib/auth.context'

// Server-state cache for every page.
//
// staleTime 30 s: revisiting a page within 30 s shows cached data without a
// request. Kept short (not minutes) because two roles work on the same data —
// when the admin assigns an issue, the user should see it on their next visit,
// not several minutes later. Our own changes show instantly anyway: every
// mutation invalidates the query keys it affects.
//
// retry: a 4xx means the request itself is wrong or not allowed (403, 404,
// validation) — retrying can't fix that. Network / 5xx errors get one retry.
// 401s never reach here: the refresh interceptor in lib/api.ts handles them.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (
          error instanceof ApiError &&
          error.status >= 400 &&
          error.status < 500
        ) {
          return false
        }
        return failureCount < 1
      },
    },
  },
})

const router = getRouter()

function InnerApp() {
  const auth = useAuth()

  // Whenever the user logs in or out, re-run every route's beforeLoad guard:
  // (auth) pages redirect into the app after login, (core) pages redirect to
  // /login after logout or session expiry.
  useEffect(() => {
    void router.invalidate()
  }, [auth.user])

  return <RouterProvider router={router} context={{ auth }} />
}

const rootElement = document.getElementById('app')!

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    // QueryClientProvider wraps AuthProvider so logout can clear the cache.
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <InnerApp />
      </AuthProvider>
    </QueryClientProvider>,
  )
}
