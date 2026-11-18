import { useState } from 'react'
import type { KeyboardEvent, SubmitEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2Icon, MessageSquareIcon, SendIcon } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState, ErrorState } from '@/components/layout/QueryState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { toApiError } from '@/lib/api'
import { QUERY_KEYS } from '@/lib/api.constants'
import { useAuth } from '@/lib/auth.context'
import { formatDateTime, initials, timeAgo } from '@/lib/format'
import { invalidateIssueData } from '@/lib/query'
import { commentsService } from '@/services/comments.service'

// Anyone who can open the issue (admin or its assignee) can read and add
// comments — the server enforces the same rule.
export function CommentSection({ issueId }: { issueId: number }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [body, setBody] = useState('')

  const commentsQuery = useQuery({
    queryKey: [QUERY_KEYS.comments, issueId],
    queryFn: () => commentsService.list(issueId),
  })

  const mutation = useMutation({
    mutationFn: (text: string) => commentsService.create(issueId, text),
    onSuccess: () => {
      setBody('')
      void queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.comments, issueId],
      })
      // The issue's comment count changed too.
      invalidateIssueData(queryClient, issueId)
    },
    onError: (err) => toast.error(toApiError(err).message),
  })

  function submit() {
    const text = body.trim()
    if (text && !mutation.isPending) mutation.mutate(text)
  }

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    submit()
  }

  // Ctrl/⌘ + Enter posts the comment.
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      submit()
    }
  }

  const comments = commentsQuery.data ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comments</CardTitle>
        <CardDescription>
          {commentsQuery.isSuccess &&
            (comments.length === 1
              ? '1 comment'
              : `${comments.length} comments`)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {commentsQuery.isPending ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : commentsQuery.isError ? (
          <ErrorState
            error={commentsQuery.error}
            onRetry={() => void commentsQuery.refetch()}
          />
        ) : comments.length === 0 ? (
          <EmptyState
            icon={MessageSquareIcon}
            title="No comments yet"
            description="Share progress or ask a question below."
          />
        ) : (
          <ol className="space-y-5">
            {comments.map((comment) => (
              <li key={comment.id} className="flex gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {initials(comment.author.name)}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <span className="font-medium">{comment.author.name}</span>
                    {comment.author.role === 'admin' && <Badge>Admin</Badge>}
                    {comment.author.id === user?.id && (
                      <Badge variant="secondary">You</Badge>
                    )}
                    <time
                      dateTime={comment.createdAt}
                      title={formatDateTime(comment.createdAt)}
                      className="text-xs text-muted-foreground"
                    >
                      {timeAgo(comment.createdAt)}
                    </time>
                  </div>
                  <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                    {comment.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}

        <form onSubmit={handleSubmit} className="space-y-2">
          <Textarea
            aria-label="Write a comment"
            placeholder="Write a comment…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            maxLength={2000}
          />
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Ctrl + Enter to send
            </p>
            <Button
              type="submit"
              size="sm"
              disabled={!body.trim() || mutation.isPending}
            >
              {mutation.isPending ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <SendIcon />
              )}
              Comment
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
