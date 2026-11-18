import { Link } from '@tanstack/react-router'
import { BugIcon, LogOutIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth.context'

// Top bar for every (core) page. Logging out clears the user; the (core)
// guard then sends them to /login automatically.
export function Navbar() {
  const { user, isAdmin, logout } = useAuth()

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <BugIcon className="size-5" aria-hidden="true" />
          Issue Tracker
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="text-muted-foreground hover:text-foreground"
            activeProps={{ className: 'font-medium text-foreground' }}
          >
            Dashboard
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm leading-none font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <Badge variant={isAdmin ? 'default' : 'secondary'}>
            {isAdmin ? 'Admin' : 'User'}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => void logout()}>
            <LogOutIcon />
            Log out
          </Button>
        </div>
      </div>
    </header>
  )
}
