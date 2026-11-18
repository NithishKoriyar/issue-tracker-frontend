import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { StatusSelect } from '@/components/issues/StatusSelect'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toApiError } from '@/lib/api'
import { QUERY_KEYS } from '@/lib/api.constants'
import { invalidateIssueData } from '@/lib/query'
import { issuesService } from '@/services/issues.service'
import { usersService } from '@/services/users.service'
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
  const [assignee, setAssignee] = useState(
    issue?.assignee ? String(issue.assignee.id) : UNASSIGNED,
  )
  const [error, setError] = useState<string | null>(null)

  // Who can be assigned: regular users (same cached list as the Users page).
  const usersQuery = useQuery({
    queryKey: [QUERY_KEYS.users],
    queryFn: () => usersService.list(),
  })
  const assignable = (usersQuery.data ?? []).filter((u) => u.role === 'user')

  const assigneeItems: Record<string, string> = {
    [UNASSIGNED]: 'Unassigned',
    ...Object.fromEntries(assignable.map((u) => [String(u.id), u.name])),
  }
  // Keep the current assignee visible even if they're not in the list.
  if (issue?.assignee && !(String(issue.assignee.id) in assigneeItems)) {
    assigneeItems[String(issue.assignee.id)] = issue.assignee.name
  }

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
      assignedTo: assignee === UNASSIGNED ? null : Number(assignee),
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
          <Select
            items={assigneeItems}
            value={assignee}
            onValueChange={(next) => {
              if (typeof next === 'string') setAssignee(next)
            }}
          >
            <SelectTrigger id="issue-assignee" className="w-full">
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
