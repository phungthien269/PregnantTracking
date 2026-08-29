import { CardSkeleton, Skeleton } from '@mevabe/ui'

// ===========================================================================
// page-skeletons — skeleton khớp BỐ CỤC từng nhóm trang (R1 — chống nhảy layout).
// loading.tsx từng route import composition phù hợp; (main)/loading.tsx giữ làm
// fallback cho route không có file riêng. Chỉ server JSX — không 'use client'.
// ===========================================================================

function HeaderSkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-72 max-w-full" />
    </div>
  )
}

function RowSkeleton({ tone = false }: { tone?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3 shadow-card">
      <div className="min-w-0 space-y-2">
        <Skeleton className="h-4 w-40 max-w-full" />
        <Skeleton className="h-3 w-24" />
      </div>
      {tone && <Skeleton className="h-6 w-14 shrink-0 rounded-full" />}
    </div>
  )
}

/** Trang dạng tổng quan: banner + lưới số liệu + 2 thẻ (dashboard, bản tin, nước). */
export function StatsPageLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Đang tải">
      <HeaderSkeleton />
      <div className="rounded-lg border border-border bg-surface p-5 shadow-card">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-3 h-8 w-40" />
        <Skeleton className="mt-3 h-3 w-full max-w-md" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <CardSkeleton className="min-h-36" />
        <CardSkeleton className="min-h-36" />
      </div>
    </div>
  )
}

/** Trang dạng danh sách: tiêu đề + tab + các hàng có badge (công việc, mua sắm…). */
export function ListLoading({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Đang tải">
      <HeaderSkeleton />
      <div className="flex gap-2" aria-hidden>
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-28 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-full" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <RowSkeleton key={i} tone={i % 2 === 0} />
        ))}
      </div>
    </div>
  )
}

/** Trang dạng lưới thẻ (cẩm nang, thư viện): 2 cột thẻ. */
export function GridLoading({ cards = 4 }: { cards?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Đang tải">
      <HeaderSkeleton />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: cards }, (_, i) => (
          <CardSkeleton key={i} className="min-h-28" />
        ))}
      </div>
    </div>
  )
}

/** Trang dạng bài đọc: tiêu đề + các khối đoạn văn (tuần thai, bài cẩm nang). */
export function ContentLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Đang tải">
      <HeaderSkeleton />
      <div className="rounded-lg border border-border bg-surface p-5 shadow-card">
        <div className="space-y-3" aria-hidden>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-11/12" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="mt-6 h-4 w-1/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <CardSkeleton className="min-h-24" />
        <CardSkeleton className="min-h-24" />
      </div>
    </div>
  )
}

/** Trang dạng hội thoại AI: bong bóng问答 xen kẽ. */
export function ChatLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Đang tải">
      <HeaderSkeleton />
      <div className="space-y-3" aria-hidden>
        <div className="ml-auto w-2/3">
          <Skeleton className="h-10 rounded-2xl" />
        </div>
        <div className="w-3/4">
          <Skeleton className="h-16 rounded-2xl" />
        </div>
        <div className="ml-auto w-1/2">
          <Skeleton className="h-10 rounded-2xl" />
        </div>
        <div className="w-2/3">
          <Skeleton className="h-14 rounded-2xl" />
        </div>
      </div>
      <Skeleton className="h-12 w-full rounded-full" />
    </div>
  )
}

/** Trang dạng biểu mẫu + danh sách đo (cài đặt, đo lường). */
export function FormLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Đang tải">
      <HeaderSkeleton />
      <div className="rounded-lg border border-border bg-surface p-5 shadow-card">
        <div className="grid gap-4 sm:grid-cols-2" aria-hidden>
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md sm:col-span-2" />
        </div>
        <Skeleton className="mt-4 h-10 w-32 rounded-md" />
      </div>
      <div className="space-y-3">
        <RowSkeleton tone />
        <RowSkeleton />
      </div>
    </div>
  )
}

/** Trang nước & caffeine: vòng tiến độ + các hàng nhật ký (khớp bố cục thật). */
export function WaterLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Đang tải">
      <HeaderSkeleton />
      <div className="flex flex-wrap items-center justify-center gap-6 rounded-lg border border-border bg-surface p-5 shadow-card sm:justify-between">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="space-y-2" aria-hidden>
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <div className="space-y-3">
        <RowSkeleton tone />
        <RowSkeleton />
        <RowSkeleton tone />
      </div>
    </div>
  )
}
