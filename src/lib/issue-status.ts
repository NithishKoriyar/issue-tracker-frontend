import type { IssueStatus } from '@/types'

export const ISSUE_STATUSES: Array<IssueStatus> = [
  'open',
  'in_progress',
  'closed',
]

export const STATUS_LABELS: Record<IssueStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  closed: 'Closed',
}

export function isIssueStatus(value: unknown): value is IssueStatus {
  return (
    typeof value === 'string' &&
    (ISSUE_STATUSES as Array<string>).includes(value)
  )
}
