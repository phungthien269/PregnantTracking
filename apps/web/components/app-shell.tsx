'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Badge, Button, cx } from '@mevabe/ui'
import { dataMode } from '@/lib/data/client-entry'
import { useSession } from '@/lib/auth/session-context'
import { useLang, NAV_I18N } from '@/lib/i18n'
import { BOTTOM_NAV, MAIN_NAV } from './nav'
import { ThemeToggle } from './theme-toggle'
import { AskAiFab } from './ask-ai-fab'
import { NavProgress } from './nav-progress'
import { LangToggle } from './lang-toggle'

function isActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== '/' && pathname.startsWith(href))
}

/** Khung app: sidebar (desktop) + topbar + bottom nav (mobile). */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { session, logout } = useSession()
  const { t } = useLang()
  const userLabel = session ? session.name ?? session.email : null

  const handleLogout = async () => {
    await logout()
    router.replace('/dang-nhap')
  }

  // R2 (perf): đã đăng nhập → prefetch 4 route hay dùng nhất lúc máy rảnh
  // (chuyển trang sau đó gần như tức thì; Link vẫn prefetch khi hiện trong màn hình).
  useEffect(() => {
    if (!session) return
    const t = setTimeout(() => {
      for (const href of ['/nhap-lieu', '/ban-tin-sang', '/be', '/cai-dat']) {
        router.prefetch(href)
      }
    }, 1500)
    return () => clearTimeout(t)
  }, [router, session])

  return (
    <div className="min-h-dvh bg-bg">
      {/* Skip link (WCAG 2.4.1) — hiện khi focus bàn phím */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-fg focus:shadow-pop"
      >
        Bỏ qua điều hướng
      </a>
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-surface md:flex">
        <Link href="/dashboard" className="flex items-center gap-2 px-5 py-5 text-lg font-semibold text-fg">
          <span aria-hidden>🌸</span> Mẹ &amp; Bé
        </Link>
        <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label={t('shell.navMain')}>
          {MAIN_NAV.map((group) => (
            <div key={group.label} className="mt-4">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-muted">{t(NAV_I18N[group.items[0]?.href ?? '']?.group ?? group.label as never)}</p>
              <ul className="mt-1 space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cx(
                        'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                        isActive(pathname, item.href)
                          ? 'bg-primary-soft text-primary-strong'
                          : 'text-muted hover:bg-surface-muted hover:text-fg',
                      )}
                    >
                      <span aria-hidden>{item.icon}</span>
                      {t(NAV_I18N[item.href]?.label ?? item.label as never)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-border px-5 py-3">
          {session ? (
            <div className="flex items-center justify-between gap-2">
              <Badge tone="primary" className="min-w-0 truncate" title={session.email}>
                {userLabel}
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Đăng xuất
              </Button>
            </div>
          ) : (
            <Badge>{dataMode === 'local' ? t('shell.demoMode') : t('shell.connected')}</Badge>
          )}
        </div>
      </aside>

      {/* Main + topbar */}
      <div className="md:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-bg/80 px-4 backdrop-blur md:px-8">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-fg md:hidden">
            <span aria-hidden>🌸</span> Mẹ &amp; Bé
          </Link>
          <p className="hidden text-sm text-muted md:block">{t('shell.tagline')}</p>
          <div className="flex items-center gap-1.5">
            <Link
              href="/thong-bao"
              aria-label={t('shell.notifications')}
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <span aria-hidden className="text-base">
                🔔
              </span>
            </Link>
            <Link
              href="/cai-dat"
              aria-label={t('shell.settings')}
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <span aria-hidden className="text-base">
                ⚙️
              </span>
            </Link>
            {session && (
              <Button variant="ghost" size="sm" className="ml-1 md:hidden" onClick={handleLogout}>
                {t('shell.logout')}
              </Button>
            )}
            <LangToggle />
            <ThemeToggle />
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-5xl px-4 py-6 pb-24 md:px-8 md:pb-10">{children}</main>
      </div>

      {/* Bottom nav mobile */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface md:hidden"
        aria-label={t('shell.navQuick')}
      >
        <ul className="grid grid-cols-6">
          {BOTTOM_NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cx(
                  'flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium',
                  isActive(pathname, item.href) ? 'text-primary-strong' : 'text-muted',
                )}
              >
                <span aria-hidden className="text-lg">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <AskAiFab />
      <NavProgress />
    </div>
  )
}
