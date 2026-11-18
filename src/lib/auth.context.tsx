import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { setOnSessionExpired } from '@/lib/api'
import { authService } from '@/services/auth.service'
import type { LoginInput, RegisterInput, User } from '@/types'

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (input: LoginInput) => Promise<User>
  register: (input: RegisterInput) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

// Must sit inside <QueryClientProvider> (see main.tsx): logout clears the cache.
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  const [isRestoring, setIsRestoring] = useState(true)

  // On app load: the refresh cookie (if any) gives us a new access token + user.
  // No cookie / expired cookie → simply not logged in.
  useEffect(() => {
    authService
      .refresh()
      .then((res) => setUser(res.user))
      .catch(() => setUser(null))
      .finally(() => setIsRestoring(false))
  }, [])

  // api.ts calls this when a mid-session refresh fails.
  useEffect(() => {
    setOnSessionExpired(() => {
      setUser(null)
      queryClient.clear()
      toast.error('Your session has expired. Please log in again.')
    })
    return () => setOnSessionExpired(null)
  }, [queryClient])

  const login = useCallback(async (input: LoginInput) => {
    const res = await authService.login(input)
    setUser(res.user)
    return res.user
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    const res = await authService.register(input)
    setUser(res.user)
    return res.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      setUser(null)
      // Drop every cached query, so the next user on this browser never
      // sees the previous user's issues.
      queryClient.clear()
    }
  }, [queryClient])

  const value = useMemo<AuthState>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
    }),
    [user, login, register, logout],
  )

  // Don't render the router until we know whether the user is logged in,
  // otherwise route guards would redirect to /login on every page reload.
  if (isRestoring) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2Icon
          className="size-6 animate-spin text-muted-foreground"
          aria-label="Loading"
        />
      </div>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
