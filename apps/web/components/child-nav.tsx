'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cx } from '@mevabe/ui'

const TABS: { href: (id: string) => string; label: string }[] = [
  { href: (id) => `/be/${id}`, label: 'Tổng quan' },
  { href: (id) => `/be/${id}/an`, label: 'Bú' },
  { href: (id) => `/be/${id}/ngu`, label: 'Ngủ' },
  { href: (id) => `/be/${id}/ta`, label: 'Tã' },
  { href: (id) => `/be/${id}/lon-cao`, label: 'Tăng trưởng' },
  { href: (id) => `/be/${id}/cot-moc`, label: 'Cột mốc' },
  { href: (id) => `/be/${id}/tien-chung`, label: 'Tiêm chủng' },
]

/** Điều hướng tab theo từng bé. */
export function ChildNav({ childId, name }: { childId: string; name: string }) {
  const pathname = usePathname()
  const base = `/be/${childId}`
  return (
    <div className="mb-6">
      <h1 className="text-xl font-semibold text-fg md:text-2xl">{name}</h1>
      <nav className="mt-3 flex gap-1 overflow-x-auto rounded-md bg-surface-muted p-1" aria-label={`Điều hướng bé ${name}`}>
        {TABS.map((tab) => {
          const href = tab.href(childId)
          const active = pathname === href || (href !== base && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cx(
                'shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                active ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg',
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
