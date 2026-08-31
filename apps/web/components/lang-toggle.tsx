'use client'

import { useLang, type Lang } from '@/lib/i18n'

/** Nút đổi ngôn ngữ VI ⇄ EN (app-shell). Lưu localStorage, áp dụng tức thì. */
export function LangToggle() {
  const { lang, setLang } = useLang()
  const next: Lang = lang === 'vi' ? 'en' : 'vi'
  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      aria-label={lang === 'vi' ? 'Switch to English' : 'Chuyển sang tiếng Việt'}
      title={lang === 'vi' ? 'Switch to English' : 'Chuyển sang tiếng Việt'}
      className="flex h-9 items-center gap-1 rounded-md px-2 text-xs font-semibold text-muted transition-colors hover:bg-surface-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span aria-hidden>🌐</span>
      <span className={lang === 'vi' ? 'text-fg' : ''}>VI</span>
      <span aria-hidden className="text-[10px] opacity-60">
        /
      </span>
      <span className={lang === 'en' ? 'text-fg' : ''}>EN</span>
    </button>
  )
}
