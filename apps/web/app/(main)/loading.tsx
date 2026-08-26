import { CardSkeleton, Skeleton } from '@mevabe/ui'

export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Đang tải">
      <Skeleton className="h-8 w-56" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <CardSkeleton className="min-h-40" />
      <CardSkeleton className="min-h-40" />
    </div>
  )
}
