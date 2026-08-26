'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cx } from '@mevabe/ui'

export interface SectionTab {
  href: string
  label: string
  icon?: string
}

/** Nhóm thẻ con cho từng nhóm chức năng (gắn vào đầu trang). */
export const THAI_KY_TABS: SectionTab[] = [
  { href: '/tuan', label: 'Tuần' },
  { href: '/lich-kham', label: 'Lịch khám' },
  { href: '/ho-so-kham', label: 'Hồ sơ khám', icon: '🩺' },
  { href: '/tinh-trang', label: 'Sức khỏe' },
  { href: '/do-luong', label: 'Đo lường' },
]

/** Thẻ phụ cấp 2 — dùng trong Sức khỏe. */
export const SUC_KHOE_TABS: SectionTab[] = [
  { href: '/tinh-trang', label: 'Tình trạng' },
  { href: '/trieu-chung', label: 'Triệu chứng' },
  { href: '/thai-may', label: 'Thai máy' },
  { href: '/nuoc-cafeine', label: 'Nước & caffeine' },
]

export const DINH_DUONG_TABS: SectionTab[] = [
  { href: '/bo-an', label: 'Bữa ăn' },
  { href: '/dinh-duong', label: 'Dinh dưỡng tuần' },
  { href: '/theo-doi-dinh-duong', label: 'Hằng ngày' },
  { href: '/bo-sung', label: 'Bổ sung' },
]

export const BE_TABS: SectionTab[] = [
  { href: '/be', label: 'Các bé' },
  { href: '/hau-san', label: 'Sau sinh' },
]

export const CAM_NANG_TABS: SectionTab[] = [
  { href: '/cam-nang', label: 'Cẩm nang' },
  { href: '/thu-vien', label: 'Thư viện' },
]

export const GIA_DINH_TABS: SectionTab[] = [
  { href: '/cong-viec', label: 'Công việc' },
  { href: '/mua-sam', label: 'Mua sắm' },
]

/** Tab active khi trùng hoặc là đường con (VD /tuan → /tuan/20). */
function isActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== '/' && pathname.startsWith(href))
}

/** Thanh thẻ con nằm ngang, cuộn ngang khi dài (mobile), active theo đường dẫn. */
export function SectionTabs({ tabs }: { tabs: SectionTab[] }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Chuyển trang trong nhóm" className="-mx-4 mb-6 overflow-x-auto px-4 md:mx-0 md:px-0">
      <div className="flex w-max min-w-full gap-1.5 rounded-full bg-surface-muted/70 p-1.5">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={cx(
                'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                active ? 'bg-primary-soft text-primary-strong shadow-sm' : 'text-muted hover:bg-surface hover:text-fg',
              )}
            >
              {tab.icon && (
                <span aria-hidden className="text-[13px]">
                  {tab.icon}
                </span>
              )}
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
