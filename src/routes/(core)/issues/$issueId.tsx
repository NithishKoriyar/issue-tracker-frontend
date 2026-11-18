import { useState } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute } from '@tanstack/react-router'
import { ArrowLeftIcon, FileQuestionIcon, PencilIcon } from 'lucide-react'
import { toast } from 'sonner'
import { CommentSection } from '@/components/comments/CommentSection'
import { DeleteIssueButton } from '@/components/issues/DeleteIssueButton'
import { IssueFormDialog } from '@/components/issues/IssueFormDialog'
import { StatusBadge } from '@/components/issues/StatusBadge'
import { StatusSelect } from '@/components/issues/StatusSelect'
import { EmptyState, ErrorState } from '@/components/layout/QueryState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ApiError, toApiError } from '@/lib/api'
import { QUERY_KEYS } from '@/lib/api.constants'
import { useAuth } from '@/lib/auth.context'
import { formatDateTime, timeAgo } from '@/lib/format'
import { STATUS_LABELS } from '@/lib/issue-status'
import { invalidateIssueData } from '@/lib/query'
import { issuesService } from '@/services/issues.service'
import type { IssueStatus } from '@/types'

export const Route = createFileRoute('/(core)/issues/$issueId')({
  // URL "/issues/7" ⇄ { issueId: 7 } (a number in code).
  params: {
    parse: ({ issueId }) => ({ issueId: Number(issueId) }),
    stringify: ({ issueId }) => ({ issueId: String(issueId) }),
  },
  staticData: { title: 'Issue' },
  component: IssueDetailPage,
})

function IssueDetailPage() {
  const { issueId } = Route.useParams()
  const { user, isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)

  const validId = Number.isInteger(issueId) && issueId > 0
  const issueQuery = useQuery({
    queryKey: [QUERY_KEYS.issue, issueId],
    queryFn: () => issuesService.get(issueId),
    enabled: validId,
  })

  // Admin, or the assignee. The server returns 404 to anyone else.
  const statusMutation = useMutation({
    mutationFn: (status: IssueStatus) =>
      issuesService.updateStatus(issueId, status),
    onSuccess: (updated) => {
      queryClient.setQueryData([QUERY_KEYS.issue, issueId], updated)
      invalidateIssueData(queryClient, issueId)
      toast.success(`Status changed to ${STATUS_LABELS[updated.status]}`)
    },
    onError: (err) => toast.error(toApiError(err).message),
  })

  const notFound =
    !validId ||
    (issueQuery.error instanceof ApiError && issueQuery.error.status === 404)

  if (notFound) {
    return (
      <Card>
        <EmptyState
          icon={FileQuestionIcon}
          title="Issue not found"
          description="It may have been deleted, or it isn't assigned to you."
          action={
            <Button variant="outline" size="sm" render={<Link to="/issues" />}>
              Back to issues
            </Button>
          }
        />
      </Card>
    )
  }

  if (issueQuery.isError) {
    return (
      <ErrorState
        error={issueQuery.error}
        onRetry={() => void issueQuery.refetch()}
      />
    )
  }

  if (issueQuery.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-2/3" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  const issue = issueQuery.data
  const isAssignee = issue.assignee?.id === user?.id
  const canChangeStatus = isAdmin || isAssignee

  return (
    <div className="space-y-6">
      <Link
        to="/issues"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        All issues
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="tabular-nums">#{issue.id}</span>
            <StatusBadge status={issue.status} />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight break-words">
            {issue.title}
          </h2>
        </div>
        {isAdmin && (
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              <PencilIcon />
              Edit
            </Button>
            <DeleteIssueButton issue={issue} />
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              {issue.description ? (
                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                  {issue.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No description.</p>
              )}
            </CardContent>
          </Card>

          <CommentSection issueId={issue.id} />
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4 text-sm">
              <Detail label="Status">
                {canChangeStatus ? (
                  <StatusSelect
                    value={issue.status}
                    disabled={statusMutation.isPending}
                    onChange={(status) => {
                      if (status !== issue.status) statusMutation.mutate(status)
                    }}
                    className="w-full"
                  />
                ) : (
                  <StatusBadge status={issue.status} />
                )}
              </Detail>
              <Detail label="Assignee">
                {issue.assignee ? (
                  <span className="inline-flex items-center gap-2">
                    {issue.assignee.name}
                    {isAssignee && <Badge variant="secondary">You</Badge>}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </Detail>
              <Detail label="Created by">{issue.createdBy.name}</Detail>
              <Detail label="Created">{formatDateTime(issue.createdAt)}</Detail>
              <Detail label="Last updated">
                <time
                  dateTime={issue.updatedAt}
                  title={formatDateTime(issue.updatedAt)}
                >
                  {timeAgo(issue.updatedAt)}
                </time>
              </Detail>
            </dl>
          </CardContent>
        </Card>
      </div>

      {isAdmin && (
        <IssueFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          issue={issue}
        />
      )}
    </div>
  )
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  )
}
