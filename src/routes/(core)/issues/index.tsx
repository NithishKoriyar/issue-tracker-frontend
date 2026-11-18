import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { MessageSquareIcon, PlusIcon, XIcon } from 'lucide-react'
import { IssueFormDialog } from '@/components/issues/IssueFormDialog'
import { StatusBadge } from '@/components/issues/StatusBadge'
import { EmptyState, ErrorState } from '@/components/layout/QueryState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import {
  ISSUE_STATUSES,
  STATUS_LABELS,
  isIssueStatus,
} from '@/lib/issue-status'
import { issuesService } from '@/services/issues.service'
import { usersService } from '@/services/users.service'
import type { IssueFilters } from '@/types'

const ALL = 'all'
const UNASSIGNED = 'unassigned'

// Filters live in the URL (?status=open&assignee=3), so they survive a
// reload and can be shared or linked to (the dashboard links here).
function parseAssignee(value: unknown): IssueFilters['assignee'] {
  if (value === UNASSIGNED) return UNASSIGNED
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : undefined
}

export const Route = createFileRoute('/(core)/issues/')({
  validateSearch: (search: Record<string, unknown>): IssueFilters => ({
    status: isIssueStatus(search.status) ? search.status : undefined,
    assignee: parseAssignee(search.assignee),
  }),
  staticData: { title: 'Issues' },
  component: IssuesPage,
})

function IssuesPage() {
  const { isAdmin } = useAuth()
  const filters = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const [createOpen, setCreateOpen] = useState(false)

  // The server already scopes this: admin → all issues, user → only theirs.
  const issuesQuery = useQuery({
    queryKey: [QUERY_KEYS.issues, filters],
    queryFn: () => issuesService.list(filters),
  })

  // Admin only: names for the assignee filter.
  const usersQuery = useQuery({
    queryKey: [QUERY_KEYS.users],
    queryFn: () => usersService.list(),
    enabled: isAdmin,
  })

  const setFilter = (changes: Partial<IssueFilters>) =>
    void navigate({ search: (prev) => ({ ...prev, ...changes }) })

  const hasFilters =
    filters.status !== undefined || (isAdmin && filters.assignee !== undefined)

  const statusItems: Record<string, string> = {
    [ALL]: 'All statuses',
    ...STATUS_LABELS,
  }
  const assigneeItems: Record<string, string> = {
    [ALL]: 'Everyone',
    [UNASSIGNED]: 'Unassigned',
    ...Object.fromEntries(
      (usersQuery.data ?? [])
        .filter((u) => u.role === 'user')
        .map((u) => [String(u.id), u.name]),
    ),
  }

  const issues = issuesQuery.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Issues</h2>
          <p className="text-muted-foreground">
            {isAdmin
              ? 'Every issue across the team.'
              : 'Issues assigned to you.'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            New issue
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select
          items={statusItems}
          value={filters.status ?? ALL}
          onValueChange={(value) =>
            setFilter({ status: isIssueStatus(value) ? value : undefined })
          }
        >
          <SelectTrigger className="w-40" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {ISSUE_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {isAdmin && (
          <Select
            items={assigneeItems}
            value={
              filters.assignee === undefined ? ALL : String(filters.assignee)
            }
            onValueChange={(value) =>
              setFilter({ assignee: parseAssignee(value) })
            }
          >
            <SelectTrigger className="w-44" aria-label="Filter by assignee">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(assigneeItems).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              void navigate({
                search: { status: undefined, assignee: undefined },
              })
            }
          >
            <XIcon />
            Clear filters
          </Button>
        )}

        {issuesQuery.isSuccess && (
          <span className="ml-auto text-sm text-muted-foreground">
            {issues.length === 1 ? '1 issue' : `${issues.length} issues`}
          </span>
        )}
      </div>

      <Card className="py-0">
        <CardContent className="px-0">
          {issuesQuery.isPending ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : issuesQuery.isError ? (
            <div className="p-4">
              <ErrorState
                error={issuesQuery.error}
                onRetry={() => void issuesQuery.refetch()}
              />
            </div>
          ) : issues.length === 0 ? (
            <EmptyState
              title={
                hasFilters
                  ? 'No issues match these filters'
                  : isAdmin
                    ? 'No issues yet'
                    : 'No issues assigned to you yet'
              }
              description={
                hasFilters
                  ? 'Try another status or assignee.'
                  : isAdmin
                    ? 'Create the first issue and assign it to someone.'
                    : 'When an admin assigns you an issue, it will show up here.'
              }
              action={
                isAdmin && !hasFilters ? (
                  <Button size="sm" onClick={() => setCreateOpen(true)}>
                    <PlusIcon />
                    New issue
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden w-16 pl-4 sm:table-cell">
                    #
                  </TableHead>
                  <TableHead className="pl-4 sm:pl-2">Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Assignee
                  </TableHead>
                  <TableHead className="hidden text-right lg:table-cell">
                    Comments
                  </TableHead>
                  <TableHead className="hidden pr-4 text-right md:table-cell">
                    Updated
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {issues.map((issue) => (
                  <TableRow
                    key={issue.id}
                    className="cursor-pointer"
                    onClick={() =>
                      void navigate({
                        to: '/issues/$issueId',
                        params: { issueId: issue.id },
                      })
                    }
                  >
                    <TableCell className="hidden pl-4 text-muted-foreground tabular-nums sm:table-cell">
                      {issue.id}
                    </TableCell>
                    <TableCell className="max-w-64 pl-4 sm:max-w-md sm:pl-2">
                      {/* A real link too, for keyboard users and "open in new tab". */}
                      <Link
                        to="/issues/$issueId"
                        params={{ issueId: issue.id }}
                        className="block truncate font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {issue.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={issue.status} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {issue.assignee?.name ?? (
                        <span className="text-muted-foreground">
                          Unassigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden text-right text-muted-foreground tabular-nums lg:table-cell">
                      <span className="inline-flex items-center gap-1">
                        <MessageSquareIcon className="size-3.5" />
                        {issue.commentCount}
                      </span>
                    </TableCell>
                    <TableCell className="hidden pr-4 text-right text-muted-foreground md:table-cell">
                      {timeAgo(issue.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <IssueFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      )}
    </div>
  )
}
