import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ISSUE_STATUSES,
  STATUS_LABELS,
  isIssueStatus,
} from '@/lib/issue-status'
import type { IssueStatus } from '@/types'

interface StatusSelectProps {
  value: IssueStatus
  onChange: (status: IssueStatus) => void
  disabled?: boolean
  id?: string
  className?: string
}

// Open / In progress / Closed picker. `items` lets Base UI show the label
// (not the raw value) in the trigger.
export function StatusSelect({
  value,
  onChange,
  disabled,
  id,
  className,
}: StatusSelectProps) {
  return (
    <Select
      items={STATUS_LABELS}
      value={value}
      disabled={disabled}
      onValueChange={(next) => {
        if (isIssueStatus(next)) onChange(next)
      }}
    >
      <SelectTrigger id={id} className={className ?? 'w-40'}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ISSUE_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            {STATUS_LABELS[status]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
