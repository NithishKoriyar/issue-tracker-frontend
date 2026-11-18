import { Badge } from '@/components/ui/badge'
import { STATUS_LABELS } from '@/lib/issue-status'
import { cn } from '@/lib/utils'
import type { IssueStatus } from '@/types'

const STATUS_STYLES: Record<IssueStatus, string> = {
  open: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  in_progress:
    'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  closed:
    'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
}

export function StatusBadge({
  status,
  className,
}: {
  status: IssueStatus
  className?: string
}) {
  return (
    <Badge variant="outline" className={cn(STATUS_STYLES[status], className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </Badge>
  )
}
