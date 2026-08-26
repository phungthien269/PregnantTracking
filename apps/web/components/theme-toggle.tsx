'use client'

import { useTheme } from './theme-provider'

/** Nút chuyển sáng/tối (override cả chế độ system). */
export function ThemeToggle() {
  const { mode, setMode } = useTheme()
  const isDark = mode === 'dark'
  return (
    <button
      type="button"
      onClick={() => setMode(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-sm text-fg hover:bg-surface-muted"
    >
      <span aria-hidden>{isDark ? '🌙' : '☀️'}</span>
      <span className="hidden sm:inline">{isDark ? 'Tối' : 'Sáng'}</span>
    </button>
  )
}
