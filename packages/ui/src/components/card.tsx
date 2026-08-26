import type { ReactNode } from 'react'
import { cx } from './cx'

/** Card 1 khối: header (title/description/action) + body. Dùng cho hầu hết trang. */
export function Card({
  children,
  className,
  title,
  description,
  action,
}: {
  children?: ReactNode
  className?: string
  title?: string
  description?: string
  action?: ReactNode
}) {
  return (
    <section className={cx('rounded-lg border border-border bg-surface shadow-card', className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            {title && <h2 className="text-sm font-semibold text-fg">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children && <div className="p-4">{children}</div>}
    </section>
  )
}
