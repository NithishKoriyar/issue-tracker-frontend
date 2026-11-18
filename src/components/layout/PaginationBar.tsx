import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Pagination } from '@/types'

interface PaginationBarProps {
  pagination: Pagination
  onPageChange: (page: number) => void
  // True while the next page is loading (the previous rows stay visible).
  disabled?: boolean
}

// "Showing 11–20 of 34   ‹ Previous   Page 2 of 4   Next ›"
export function PaginationBar({
  pagination,
  onPageChange,
  disabled,
}: PaginationBarProps) {
  const { page, pageSize, total, totalPages } = pagination
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col items-center gap-3 border-t px-4 py-3 sm:flex-row sm:justify-between"
    >
      <p className="text-sm text-muted-foreground">
        Showing{' '}
        <span className="font-medium text-foreground tabular-nums">
          {from}–{to}
        </span>{' '}
        of{' '}
        <span className="font-medium text-foreground tabular-nums">
          {total}
        </span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
        >
          <ChevronLeftIcon />
          Previous
        </Button>
        <span className="px-1 text-sm tabular-nums" aria-current="page">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= totalPages}
        >
          Next
          <ChevronRightIcon />
        </Button>
      </div>
    </nav>
  )
}
