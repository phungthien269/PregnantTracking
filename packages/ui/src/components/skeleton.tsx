import { cx } from './cx'

/** Khối loading (pulse). Truyền className để đặt kích thước. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-md bg-surface-muted', className)} />
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cx('rounded-lg border border-border bg-surface p-4 shadow-card', className)}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="mt-3 h-8 w-1/2" />
    </div>
  )
}
