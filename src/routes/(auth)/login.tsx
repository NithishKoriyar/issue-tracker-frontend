import { Link, createFileRoute } from '@tanstack/react-router'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { LoginForm } from '@/components/auth/LoginForm'
import type { LoginMode } from '@/components/auth/LoginForm'

interface LoginPageSearch {
  mode?: 'admin'
}

// One page, two modes: /login (users) and /login?mode=admin (admin login).
// Guard + ?redirect= handling live in (auth)/route.tsx.
export const Route = createFileRoute('/(auth)/login')({
  validateSearch: (search: Record<string, unknown>): LoginPageSearch => ({
    mode: search.mode === 'admin' ? 'admin' : undefined,
  }),
  component: LoginPage,
})

const linkClass = 'font-medium text-foreground underline'

function LoginPage() {
  const { mode: searchMode } = Route.useSearch()
  const mode: LoginMode = searchMode === 'admin' ? 'admin' : 'user'
  const isAdminMode = mode === 'admin'

  return (
    <AuthLayout
      title={isAdminMode ? 'Admin login' : 'Log in'}
      description={
        isAdminMode
          ? 'Restricted to administrators.'
          : 'Enter your email and password to continue.'
      }
      footer={
        isAdminMode ? (
          // Switching modes keeps ?redirect= and only toggles ?mode=.
          <p>
            Not an admin?{' '}
            <Link
              to="/login"
              search={(prev) => ({ ...prev, mode: undefined })}
              className={linkClass}
            >
              User login
            </Link>
          </p>
        ) : (
          <div className="space-y-1 text-center">
            <p>
              Don&apos;t have an account?{' '}
              <Link to="/register" className={linkClass}>
                Sign up
              </Link>
            </p>
            <p>
              Administrator?{' '}
              <Link
                to="/login"
                search={(prev) => ({ ...prev, mode: 'admin' as const })}
                className={linkClass}
              >
                Admin login
              </Link>
            </p>
          </div>
        )
      }
    >
      {/* key: switching modes gives a fresh form (clears errors). */}
      <LoginForm key={mode} mode={mode} />
    </AuthLayout>
  )
}
