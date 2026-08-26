'use client'

/** Chọn tuần thai. Không dùng router (ui package không khai next) — onChange do trang xử lý. */
export function WeekPicker({
  week,
  maxWeek = 42,
  onChange,
}: {
  week: number
  maxWeek?: number
  onChange: (week: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(week - 1)}
        disabled={week <= 1}
        aria-label="Tuần trước"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-fg hover:bg-surface-muted disabled:opacity-40"
      >
        ←
      </button>
      <span className="min-w-24 text-center text-sm font-semibold text-fg">Tuần {week}</span>
      <button
        type="button"
        onClick={() => onChange(week + 1)}
        disabled={week >= maxWeek}
        aria-label="Tuần sau"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-fg hover:bg-surface-muted disabled:opacity-40"
      >
        →
      </button>
    </div>
  )
}
