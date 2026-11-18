import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { StatusSelect } from '@/components/issues/StatusSelect'
import { UserPicker } from '@/components/users/UserPicker'
import type { UserPickerValue } from '@/components/users/UserPicker'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toApiError } from '@/lib/api'
import { invalidateIssueData } from '@/lib/query'
import { issuesService } from '@/services/issues.service'
import type { Issue, IssueInput, IssueStatus } from '@/types'

const UNASSIGNED = 'unassigned'

interface IssueFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // Present → edit that issue. Absent → create a new one.
  issue?: Issue
}

// Admin only: create or edit an issue (title, description, status, assignee).
export function IssueFormDialog({
  open,
  onOpenChange,
  issue,
}: IssueFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{issue ? 'Edit issue' : 'New issue'}</DialogTitle>
          <DialogDescription>
            {issue
              ? `Update the details of issue #${issue.id}.`
              : 'Describe the problem and choose who should work on it.'}
          </DialogDescription>
        </DialogHeader>
        {/* Mounting the form only while open resets its fields every time. */}
        {open && <IssueForm issue={issue} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function IssueForm({ issue, onDone }: { issue?: Issue; onDone: () => void }) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(issue?.title ?? '')
  const [description, setDescription] = useState(issue?.description ?? '')
  const [status, setStatus] = useState<IssueStatus>(issue?.status ?? 'open')
  // A user id, or UNASSIGNED.
  const [assignee, setAssignee] = useState<UserPickerValue>(
    issue?.assignee?.id ?? UNASSIGNED,
  )
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (input: IssueInput) =>
      issue
        ? issuesService.update(issue.id, input)
        : issuesService.create(input),
    onSuccess: (saved) => {
      invalidateIssueData(queryClient, saved.id)
      toast.success(issue ? 'Issue updated' : `Issue #${saved.id} created`)
      onDone()
    },
    onError: (err) => setError(toApiError(err).message),
  })

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    mutation.mutate({
      title: title.trim(),
      description: description.trim(),
      status,
      assignedTo: typeof assignee === 'number' ? assignee : null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="issue-title">Title</Label>
        <Input
          id="issue-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Login button does nothing on Safari"
          maxLength={200}
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="issue-description">Description</Label>
        <Textarea
          id="issue-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Steps to reproduce, expected vs actual behaviour…"
          rows={5}
          maxLength={5000}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="issue-status">Status</Label>
          <StatusSelect
            id="issue-status"
            value={status}
            onChange={setStatus}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="issue-assignee">Assignee</Label>
          {/* Searchable: 5 users up front, type to search everyone. */}
          <UserPicker
            id="issue-assignee"
            value={assignee}
            onChange={setAssignee}
            options={[{ value: UNASSIGNED, label: 'Unassigned' }]}
            selectedUser={issue?.assignee}
            className="w-full"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2Icon className="animate-spin" />}
          {issue ? 'Save changes' : 'Create issue'}
        </Button>
      </DialogFooter>
    </form>
  )
}
