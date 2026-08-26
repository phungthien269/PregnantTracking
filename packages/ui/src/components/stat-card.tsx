import type { ReactNode } from 'react'
import { cx } from './cx'

export type StatTone = 'primary' | 'accent' | 'success' | 'warning' | 'danger'

const VALUE_TONES: Record<StatTone, string> = {
  primary: 'text-primary-strong',
  accent: 'text-success',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
}

/** Thẻ chỉ số: nhãn + giá trị lớn + ghi chú. */
export function StatCard({
  label,
  value,
  hint,
  tone = 'primary',
  className,
}: {
  label: string
  value: ReactNode
  hint?: string
  tone?: StatTone
  className?: string
}) {
  return (
    <div className={cx('rounded-lg border border-border bg-surface p-4 shadow-card', className)}>
      <p className="text-xs text-muted">{label}</p>
      <p className={cx('mt-1 text-2xl font-semibold', VALUE_TONES[tone])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}
