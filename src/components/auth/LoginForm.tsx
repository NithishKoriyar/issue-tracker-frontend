import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toApiError } from '@/lib/api'
import { useAuth } from '@/lib/auth.context'

export type LoginMode = 'user' | 'admin'

interface LoginFormProps {
  // Both modes call POST /auth/login. "admin" adds asAdmin: true, so the
  // server refuses non-admin accounts (403 NOT_ADMIN, no session created).
  mode: LoginMode
}

// After a successful login the (auth) guard performs the redirect (see main.tsx).
export function LoginForm({ mode }: LoginFormProps) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isAdminMode = mode === 'admin'

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const user = await login({
        email: email.trim(),
        password,
        asAdmin: isAdminMode,
      })
      toast.success(`Welcome back, ${user.name}`)
    } catch (err) {
      setError(toApiError(err).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={isAdminMode ? 'admin@example.com' : 'you@example.com'}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting && <Loader2Icon className="animate-spin" />}
        {isAdminMode ? 'Log in as admin' : 'Log in'}
      </Button>
    </form>
  )
}
