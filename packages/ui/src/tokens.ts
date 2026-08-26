// Design tokens — các hằng số dùng trong code (xem tokens.css cho giá trị màu).

export const ACCENTS = ['rose', 'green', 'blue', 'purple', 'amber'] as const
export type Accent = (typeof ACCENTS)[number]

export const THEME_MODES = ['light', 'dark', 'system'] as const
export type ThemeMode = (typeof THEME_MODES)[number]

export const FONT_SANS = 'var(--mv-font-sans)'

/** Key lưu trên localStorage */
export const THEME_STORAGE_KEY = 'mv-theme'
export const ACCENT_STORAGE_KEY = 'mv-accent'
