import { forwardRef } from 'react'
import { cx } from './cx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const VARIANTS: Record<ButtonVariant, string> = {
  // Dark mode dùng nền đậm (primary-soft) + chữ sáng (primary-strong) để đạt AA,
  // vì --mv-primary dark sáng quá, chữ trắng không đủ tương phản.
  primary:
    'bg-primary text-white hover:bg-primary-strong dark:bg-primary-soft dark:text-primary-strong dark:hover:bg-primary-soft/80',
  secondary: 'border border-border bg-surface text-fg hover:bg-surface-muted',
  ghost: 'text-fg hover:bg-surface-muted',
  danger:
    'bg-danger text-white hover:opacity-90 dark:bg-danger/15 dark:text-danger dark:hover:bg-danger/25',
  soft: 'bg-primary-soft text-primary-strong hover:bg-accent-soft',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-3 text-sm',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-6 text-base',
  icon: 'h-10 w-10',
}

/** Class cho nút — dùng được cho <Link> khi cần nút dạng liên kết. */
export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cx(
    'inline-flex items-center justify-center rounded-md font-medium transition duration-150 active:scale-[0.98]',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    'disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    className,
  )
}

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }
>(function Button({ variant = 'primary', size = 'md', className, type = 'button', ...props }, ref) {
  return <button ref={ref} type={type} className={buttonClasses(variant, size, className)} {...props} />
})
