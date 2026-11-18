import { useId, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  CheckIcon,
  ChevronsUpDownIcon,
  Loader2Icon,
  SearchIcon,
  UsersIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { QUERY_KEYS } from '@/lib/api.constants'
import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'
import { usersService } from '@/services/users.service'
import type { UserRef } from '@/types'

const DEFAULT_LIMIT = 5 // shown before typing
const SEARCH_LIMIT = 10 // shown while searching
const SEARCH_DELAY_MS = 300

// A fixed choice listed above the users, e.g. "Everyone" or "Unassigned".
export interface UserPickerOption {
  value: string
  label: string
}

// A user id (number), or the `value` of one of the fixed options (string).
export type UserPickerValue = number | string

interface UserPickerProps {
  value: UserPickerValue
  onChange: (value: UserPickerValue) => void
  options?: Array<UserPickerOption>
  // Name for `value` when the parent already knows it (e.g. the issue's
  // current assignee), so the button never has to look it up.
  selectedUser?: UserRef | null
  id?: string
  'aria-label'?: string
  className?: string
  disabled?: boolean
}

interface Row {
  key: string
  value: UserPickerValue
  label: string
  email?: string
}

// Searchable user dropdown: a button that opens a panel with a search box,
// the fixed options, and users from the server — 5 before typing, then a
// debounced server search. Only assignable accounts (role "user") are listed.
export function UserPicker({
  value,
  onChange,
  options = [],
  selectedUser,
  id,
  'aria-label': ariaLabel,
  className,
  disabled,
}: UserPickerProps) {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const [highlight, setHighlight] = useState(0)
  // Name of whoever was picked last, so the button can show it straight away.
  const [picked, setPicked] = useState<UserRef | null>(null)
  const listId = useId()

  const search = useDebouncedValue(term.trim(), SEARCH_DELAY_MS)
  const limit = search ? SEARCH_LIMIT : DEFAULT_LIMIT

  // Runs when the component mounts (so the first 5 are ready before the
  // panel opens) and again for each debounced search term. Each term is its
  // own cache entry; keepPreviousData avoids an empty flash between them.
  // Page 1 only: the picker never pages, it narrows by search instead.
  const usersQuery = useQuery({
    queryKey: [QUERY_KEYS.users, { picker: true, search, limit }],
    queryFn: () =>
      usersService.list({
        search: search || undefined,
        role: 'user',
        pageSize: limit,
      }),
    placeholderData: keepPreviousData,
  })
  const users = usersQuery.data?.users ?? []
  const totalMatches = usersQuery.data?.pagination.total ?? 0

  // --- What the button says ---------------------------------------------
  const selectedOption =
    typeof value === 'string'
      ? options.find((option) => option.value === value)
      : undefined
  const knownUser =
    typeof value === 'number'
      ? [selectedUser, picked, ...users].find((u) => u?.id === value)
      : undefined
  // Not known yet (e.g. /issues?assignee=7 opened from a link): fetch that
  // one user by id.
  const lookup = useQuery({
    queryKey: [QUERY_KEYS.users, { id: value }],
    queryFn: () => usersService.get(value as number),
    enabled: typeof value === 'number' && !knownUser,
  })
  const buttonLabel =
    selectedOption?.label ??
    knownUser?.name ??
    lookup.data?.name ??
    (lookup.isError
      ? 'Unknown user'
      : typeof value === 'number'
        ? 'Loading…'
        : 'Select…')

  // --- The list -----------------------------------------------------------
  const needle = search.toLowerCase()
  const optionRows: Array<Row> = options
    .filter((option) => option.label.toLowerCase().includes(needle))
    .map((option) => ({
      key: `option:${option.value}`,
      value: option.value,
      label: option.label,
    }))
  const userRows: Array<Row> = users.map((u) => ({
    key: `user:${u.id}`,
    value: u.id,
    label: u.name,
    email: u.email,
  }))
  const rows = [...optionRows, ...userRows]

  const typing = term.trim() !== search
  const busy = typing || usersQuery.isFetching
  const activeIndex = Math.min(highlight, Math.max(rows.length - 1, 0))

  function choose(row: Row) {
    if (typeof row.value === 'number') {
      setPicked({ id: row.value, name: row.label })
    }
    onChange(row.value)
    setOpen(false)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setTerm('')
      setHighlight(0)
    }
  }

  // ↑ / ↓ move the highlight, Enter picks it (Escape is handled by Popover).
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight(Math.min(activeIndex + 1, rows.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight(Math.max(activeIndex - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const row = rows[activeIndex] as Row | undefined
      if (row) choose(row)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            id={id}
            aria-label={ariaLabel}
            disabled={disabled}
            className={cn('justify-between font-normal', className)}
          />
        }
      >
        <span className="truncate">{buttonLabel}</span>
        <ChevronsUpDownIcon className="text-muted-foreground" />
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-(--anchor-width) min-w-64 gap-0 p-0"
      >
        {/* Search box */}
        <div className="relative border-b">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            autoFocus
            role="combobox"
            aria-label="Search users"
            aria-expanded={open}
            aria-controls={listId}
            aria-activedescendant={
              rows.length ? `${listId}-${activeIndex}` : undefined
            }
            placeholder="Search users…"
            value={term}
            onChange={(e) => {
              setTerm(e.target.value)
              setHighlight(0)
            }}
            onKeyDown={handleKeyDown}
            maxLength={100}
            className="h-9 w-full bg-transparent pr-8 pl-8 text-sm outline-none placeholder:text-muted-foreground"
          />
          {busy && (
            <Loader2Icon
              className="absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
              aria-label="Searching"
            />
          )}
        </div>

        {/* Options + users */}
        <div
          id={listId}
          role="listbox"
          aria-label="Users"
          className="max-h-64 overflow-y-auto p-1"
        >
          {rows.map((row, index) => {
            const selected = row.value === value
            return (
              <div
                key={row.key}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setHighlight(index)}
                // Keep focus in the search box while clicking.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(row)}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5',
                  index === activeIndex && 'bg-accent text-accent-foreground',
                  // A thin line between the fixed options and the users.
                  index === optionRows.length &&
                    optionRows.length > 0 &&
                    'mt-1 border-t pt-2',
                )}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold">
                  {typeof row.value === 'number' ? (
                    initials(row.label)
                  ) : (
                    <UsersIcon className="size-3.5" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{row.label}</span>
                  {row.email && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {row.email}
                    </span>
                  )}
                </span>
                {selected && <CheckIcon className="size-4 shrink-0" />}
              </div>
            )
          })}

          {rows.length === 0 && !busy && (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              {search ? `No users match “${search}”` : 'No users yet'}
            </p>
          )}
        </div>

        {/* More exist than shown → nudge towards search. */}
        {totalMatches > users.length && (
          <p className="border-t px-3 py-2 text-xs text-muted-foreground">
            {search
              ? `Showing ${users.length} of ${totalMatches} matches — keep typing to narrow down.`
              : `Showing ${users.length} of ${totalMatches} users — type to search.`}
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}
