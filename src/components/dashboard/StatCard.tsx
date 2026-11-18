import type { LucideIcon } from 'lucide-react'
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface StatCardProps {
  label: string
  value: number | undefined
  icon: LucideIcon
  hint?: string
  iconClassName?: string
  className?: string
}

// One number on the dashboard. `value` undefined → still loading.
export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  iconClassName,
  className,
}: StatCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl font-semibold tabular-nums">
          {value === undefined ? <Skeleton className="h-9 w-12" /> : value}
        </CardTitle>
        <CardAction>
          <Icon
            className={iconClassName ?? 'size-5 text-muted-foreground'}
            aria-hidden="true"
          />
        </CardAction>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardHeader>
    </Card>
  )
}
