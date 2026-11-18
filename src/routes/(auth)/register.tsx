import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toApiError } from '@/lib/api'
import { useAuth } from '@/lib/auth.context'

// Must match the backend's register validation.
const PASSWORD_MIN_LENGTH = 8

// Guard lives in (auth)/route.tsx.
export const Route = createFileRoute('/(auth)/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      // The server always creates a regular "user" — the role is never sent.
      const user = await register({
        name: name.trim(),
        email: email.trim(),
        password,
      })
      toast.success(`Welcome, ${user.name}! Your account is ready.`)
    } catch (err) {
      setError(toApiError(err).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create an account"
      description="Sign up to see and work on the issues assigned to you."
      footer={
        <span>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-foreground underline">
            Log in
          </Link>
        </span>
      }
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={100}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={PASSWORD_MIN_LENGTH}
          />
          <p className="text-xs text-muted-foreground">
            At least {PASSWORD_MIN_LENGTH} characters.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
          Create account
        </Button>
      </form>
    </AuthLayout>
  )
}
