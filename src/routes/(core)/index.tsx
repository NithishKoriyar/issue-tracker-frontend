import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowRightIcon,
  CircleCheckIcon,
  CircleDotIcon,
  ListTodoIcon,
  TimerIcon,
  UserXIcon,
} from 'lucide-react'
import { StatCard } from '@/components/dashboard/StatCard'
import { StatusBadge } from '@/components/issues/StatusBadge'
import { EmptyState, ErrorState } from '@/components/layout/QueryState'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { timeAgo } from '@/lib/format'
import { dashboardService } from '@/services/dashboard.service'
import type { Issue, UserWithCounts } from '@/types'

export const Route = createFileRoute('/(core)/')({
  staticData: { title: 'Dashboard' },
  component: DashboardPage,
})

// ONE dashboard for both roles. The server scopes the numbers (admin: every
// issue, user: only theirs); the page only decides which sections to show.
function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const statsQuery = useQuery({
    queryKey: [QUERY_KEYS.dashboard],
    queryFn: () => dashboardService.stats(),
  })

  const totals = statsQuery.data?.totals
  const firstName = user?.name.split(' ')[0] ?? ''

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Welcome back, {firstName}
        </h2>
        <p className="text-muted-foreground">
          {isAdmin
            ? 'An overview of every issue across the team.'
            : 'Here is everything assigned to you.'}
        </p>
      </div>

      {statsQuery.isError ? (
        <ErrorState
          error={statsQuery.error}
          onRetry={() => void statsQuery.refetch()}
        />
      ) : (
        <>
          <div
            className={
              isAdmin
                ? 'grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-5'
                : 'grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4'
            }
          >
            <StatCard
              label={isAdmin ? 'Total issues' : 'Assigned to me'}
              value={totals?.total}
              icon={ListTodoIcon}
            />
            <StatCard
              label="Open"
              value={totals?.open}
              icon={CircleDotIcon}
              iconClassName="size-5 text-sky-500"
            />
            <StatCard
              label="In progress"
              value={totals?.inProgress}
              icon={TimerIcon}
              iconClassName="size-5 text-amber-500"
            />
            <StatCard
              label="Closed"
              value={totals?.closed}
              icon={CircleCheckIcon}
              iconClassName="size-5 text-emerald-500"
            />
            {isAdmin && (
              <StatCard
                label="Unassigned"
                className="col-span-2 md:col-span-1"
                value={totals?.unassigned}
                icon={UserXIcon}
                hint="Waiting for an owner"
              />
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <RecentIssues
              issues={statsQuery.data?.recentIssues}
              isAdmin={isAdmin}
              className={isAdmin ? 'lg:col-span-3' : 'lg:col-span-5'}
            />
            {isAdmin && (
              <IssuesByUser
                users={statsQuery.data?.byUser}
                className="lg:col-span-2"
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}

function RecentIssues({
  issues,
  isAdmin,
  className,
}: {
  issues: Array<Issue> | undefined
  isAdmin: boolean
  className?: string
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recently updated</CardTitle>
        <CardDescription>
          The latest activity on {isAdmin ? 'all' : 'your'} issues
        </CardDescription>
        <CardAction>
          <Link
            to="/issues"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            View all <ArrowRightIcon className="size-4" />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {issues === undefined ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : issues.length === 0 ? (
          <EmptyState
            title={isAdmin ? 'No issues yet' : 'No issues assigned yet'}
            description={
              isAdmin
                ? 'Create the first issue from the Issues page.'
                : 'When an admin assigns you an issue, it will show up here.'
            }
          />
        ) : (
          <ul className="divide-y">
            {issues.map((issue) => (
              <li key={issue.id}>
                <Link
                  to="/issues/$issueId"
                  params={{ issueId: issue.id }}
                  className="flex items-center gap-3 rounded-md px-2 py-3 hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {issue.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      #{issue.id} · {issue.assignee?.name ?? 'Unassigned'} ·
                      updated {timeAgo(issue.updatedAt)}
                    </p>
                  </div>
                  <StatusBadge status={issue.status} className="shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function IssuesByUser({
  users,
  className,
}: {
  users: Array<UserWithCounts> | undefined
  className?: string
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Issues by user</CardTitle>
        <CardDescription>Who is working on what</CardDescription>
      </CardHeader>
      <CardContent>
        {users === undefined ? (
          <Skeleton className="h-40 w-full" />
        ) : users.length === 0 ? (
          <EmptyState
            title="No users yet"
            description="People who sign up appear here."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Open</TableHead>
                <TableHead className="text-right">Active</TableHead>
                <TableHead className="text-right">Closed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="max-w-40">
                    <Link
                      to="/issues"
                      search={{ assignee: u.id }}
                      className="block truncate font-medium hover:underline"
                    >
                      {u.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {u.issueCounts.open}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {u.issueCounts.inProgress}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {u.issueCounts.closed}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
