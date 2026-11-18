import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { UsersIcon } from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/layout/QueryState'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
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
import { usersService } from '@/services/users.service'

// Admin only. Read-only on purpose: people sign up themselves, the admin
// just needs to see them and how much each one is working on.
export const Route = createFileRoute('/(core)/users')({
  beforeLoad: ({ context }) => requireAdmin(context.auth),
  staticData: { title: 'Users' },
  component: UsersPage,
})

function UsersPage() {
  const { user: me } = useAuth()
  const usersQuery = useQuery({
    queryKey: [QUERY_KEYS.users],
    queryFn: () => usersService.list(),
  })

  const users = usersQuery.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Users</h2>
        <p className="text-muted-foreground">
          Everyone with an account and the issues assigned to them.
        </p>
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
            <EmptyState icon={UsersIcon} title="No users yet" />
          ) : (
            <Table>
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
