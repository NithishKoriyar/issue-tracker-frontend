import { useEffect, useRef, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { Loader2Icon, SearchIcon, UsersIcon, XIcon } from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/layout/QueryState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { QUERY_KEYS } from '@/lib/api.constants'
import { useAuth } from '@/lib/auth.context'
import { requireAdmin } from '@/lib/auth.guards'
import { formatDate } from '@/lib/format'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { usersService } from '@/services/users.service'

const SEARCH_DELAY_MS = 300

interface UsersSearch {
  q?: string
}

// Admin only. Read-only on purpose: people sign up themselves, the admin
// just needs to see them and how much each one is working on.
// The search term lives in the URL (/users?q=asha), like the Issues filters.
export const Route = createFileRoute('/(core)/users')({
  validateSearch: (search: Record<string, unknown>): UsersSearch => ({
    q:
      typeof search.q === 'string' && search.q.trim()
        ? search.q.trim()
        : undefined,
  }),
  beforeLoad: ({ context }) => requireAdmin(context.auth),
  staticData: { title: 'Users' },
  component: UsersPage,
})

function UsersPage() {
  const { user: me } = useAuth()
  const { q } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })

  // What's in the box (updates on every keystroke) vs. what we search for
  // (only after typing pauses for SEARCH_DELAY_MS).
  const [term, setTerm] = useState(q ?? '')
  const debouncedTerm = useDebouncedValue(term.trim(), SEARCH_DELAY_MS)

  // Keep the URL in sync with the debounced term, without a loop: remember
  // the last value we pushed, so our own URL change isn't mistaken for an
  // outside one (back / forward button), which should refill the box.
  const lastPushed = useRef(q ?? '')
  useEffect(() => {
    if (debouncedTerm !== lastPushed.current) {
      lastPushed.current = debouncedTerm
      void navigate({
        search: { q: debouncedTerm || undefined },
        replace: true, // typing shouldn't fill the browser history
      })
    }
  }, [debouncedTerm, navigate])
  useEffect(() => {
    if ((q ?? '') !== lastPushed.current) {
      lastPushed.current = q ?? ''
      setTerm(q ?? '')
    }
  }, [q])

  // Each search term is its own cache entry; keepPreviousData keeps the last
  // results on screen while the next search loads.
  const usersQuery = useQuery({
    queryKey: [QUERY_KEYS.users, { search: q ?? '' }],
    queryFn: () => usersService.list({ search: q }),
    placeholderData: keepPreviousData,
  })

  const users = usersQuery.data ?? []
  // Typing, or waiting for the server → spinner in the search box.
  const searching =
    term.trim() !== debouncedTerm ||
    (usersQuery.isFetching && usersQuery.isPlaceholderData)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Users</h2>
        <p className="text-muted-foreground">
          Everyone with an account and the issues assigned to them.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-80">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            aria-label="Search users"
            placeholder="Search by name or email…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setTerm('')
            }}
            maxLength={100}
            className="pr-8 pl-8 [&::-webkit-search-cancel-button]:hidden"
          />
          <div className="absolute top-1/2 right-1.5 -translate-y-1/2">
            {searching ? (
              <Loader2Icon
                className="mr-1 size-4 animate-spin text-muted-foreground"
                aria-label="Searching"
              />
            ) : term ? (
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Clear search"
                onClick={() => setTerm('')}
              >
                <XIcon />
              </Button>
            ) : null}
          </div>
        </div>
        {usersQuery.isSuccess && (
          <span className="ml-auto text-sm text-muted-foreground">
            {users.length === 1 ? '1 user' : `${users.length} users`}
          </span>
        )}
      </div>

      <Card className="py-0">
        <CardContent className="px-0">
          {usersQuery.isPending ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : usersQuery.isError ? (
            <div className="p-4">
              <ErrorState
                error={usersQuery.error}
                onRetry={() => void usersQuery.refetch()}
              />
            </div>
          ) : users.length === 0 ? (
            q ? (
              <EmptyState
                icon={SearchIcon}
                title={`No users match “${q}”`}
                description="Try part of a name or an email address."
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTerm('')}
                  >
                    Clear search
                  </Button>
                }
              />
            ) : (
              <EmptyState icon={UsersIcon} title="No users yet" />
            )
          ) : (
            <Table
              className={
                usersQuery.isPlaceholderData
                  ? 'opacity-60 transition-opacity'
                  : ''
              }
            >
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4">User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Joined</TableHead>
                  <TableHead className="text-right">Open</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">
                    In progress
                  </TableHead>
                  <TableHead className="hidden text-right sm:table-cell">
                    Closed
                  </TableHead>
                  <TableHead className="pr-4 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="max-w-56 pl-4">
                      <div className="flex items-center gap-2">
                        {u.role === 'user' ? (
                          // Jump to this person's issues.
                          <Link
                            to="/issues"
                            search={{ assignee: u.id }}
                            className="truncate font-medium hover:underline"
                          >
                            {u.name}
                          </Link>
                        ) : (
                          <span className="truncate font-medium">{u.name}</span>
                        )}
                        {u.id === me?.id && (
                          <Badge variant="secondary">You</Badge>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {u.email}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={u.role === 'admin' ? 'default' : 'outline'}
                      >
                        {u.role === 'admin' ? 'Admin' : 'User'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {formatDate(u.createdAt)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {u.issueCounts.open}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">
                      {u.issueCounts.inProgress}
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums sm:table-cell">
                      {u.issueCounts.closed}
                    </TableCell>
                    <TableCell className="pr-4 text-right font-medium tabular-nums">
                      {u.issueCounts.total}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
