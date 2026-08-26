import { cx } from './cx'

/** Select native (đã style) — options do trang truyền vào. */
export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cx(
        'w-full appearance-none rounded-md border border-border bg-surface px-3 py-2 pr-8 text-sm text-fg',
        'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
