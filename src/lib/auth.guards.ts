import { redirect } from '@tanstack/react-router'
import type { AuthState } from '@/lib/auth.context'

// Search params shared by the login pages: ?redirect=/issues/3
export interface RedirectSearch {
  redirect?: string
}

export function validateRedirectSearch(
  search: Record<string, unknown>,
): RedirectSearch {
  return {
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }
}

// Only allow same-site paths like "/issues". Blocks open redirects such as
// ?redirect=https://evil.com, //evil.com or /\evil.com.
export function safeRedirect(path: string | undefined): string {
  if (!path || !path.startsWith('/')) return '/'
  if (path.startsWith('//') || path.startsWith('/\\')) return '/'
  return path
}

// (auth) pages: a logged-in user is sent on to the app.
export function redirectIfAuthenticated(auth: AuthState, to?: string) {
  if (auth.isAuthenticated) {
    throw redirect({ href: safeRedirect(to) })
  }
}

// Admin-only pages (e.g. /users): anyone else goes back to the dashboard.
// UX only — the API answers 403 for non-admins anyway.
export function requireAdmin(auth: AuthState) {
  if (!auth.isAdmin) {
    throw redirect({ to: '/' })
  }
}

// (core) pages: not logged in → /login, remembering where they were going.
// UX only — the backend still checks the token on every request.
export function requireAuth(auth: AuthState, currentHref: string) {
  if (!auth.isAuthenticated) {
    throw redirect({
      to: '/login',
      search: { redirect: currentHref === '/' ? undefined : currentHref },
    })
  }
}
