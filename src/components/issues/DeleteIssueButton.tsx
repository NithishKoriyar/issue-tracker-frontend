import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Loader2Icon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { toApiError } from '@/lib/api'
import { QUERY_KEYS } from '@/lib/api.constants'
import { invalidateIssueData } from '@/lib/query'
import { issuesService } from '@/services/issues.service'
import type { Issue, IssueListResponse } from '@/types'

// Admin only: delete with a confirmation step (it also deletes the comments).
export function DeleteIssueButton({ issue }: { issue: Issue }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: () => issuesService.remove(issue.id),
    onSuccess: async () => {
      setOpen(false)
      toast.success(`Issue #${issue.id} deleted`)
      // Take it out of every cached list right away, so the list we navigate
      // to never shows it — then refetch everything from the server.
      queryClient.setQueriesData<IssueListResponse>(
        { queryKey: [QUERY_KEYS.issues] },
        (old) =>
          old && {
            issues: old.issues.filter((i) => i.id !== issue.id),
            pagination: {
              ...old.pagination,
              total: Math.max(0, old.pagination.total - 1),
            },
          },
      )
      invalidateIssueData(queryClient)
      await navigate({ to: '/issues' })
      // Gone for good: drop its cached detail + comments (after leaving its page).
      queryClient.removeQueries({ queryKey: [QUERY_KEYS.issue, issue.id] })
      queryClient.removeQueries({ queryKey: [QUERY_KEYS.comments, issue.id] })
    },
    onError: (err) => toast.error(toApiError(err).message),
  })

  const comments =
    issue.commentCount === 1 ? '1 comment' : `${issue.commentCount} comments`

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
        <Trash2Icon />
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this issue?</AlertDialogTitle>
          <AlertDialogDescription>
            “{issue.title}” and its {comments} will be permanently deleted. This
            can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending && <Loader2Icon className="animate-spin" />}
            Delete issue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
