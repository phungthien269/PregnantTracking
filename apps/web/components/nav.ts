export interface NavItem {
  href: string
  label: string
  icon: string
}

/** Sidebar (desktop) — 6 nhóm chức năng. Trang con đi qua thanh thẻ (SectionTabs). */
export const MAIN_NAV: { label: string; items: NavItem[] }[] = [
  {
    label: 'Chính',
    items: [{ href: '/dashboard', label: 'Trang chủ', icon: '🏠' }],
  },
  {
    label: 'Thai kỳ',
    items: [{ href: '/tuan', label: 'Thai kỳ', icon: '🤰' }],
  },
  {
    label: 'Dinh dưỡng',
    items: [{ href: '/dinh-duong', label: 'Dinh dưỡng', icon: '🥗' }],
  },
  {
    label: 'Bé & sau sinh',
    items: [{ href: '/be', label: 'Bé & sau sinh', icon: '🍼' }],
  },
  {
    label: 'Cẩm nang',
    items: [{ href: '/cam-nang', label: 'Cẩm nang', icon: '📖' }],
  },
  {
    label: 'Gia đình',
    items: [{ href: '/cong-viec', label: 'Gia đình', icon: '👨‍👩‍👧' }],
  },
]

/** Bottom nav (mobile) — gọn 6 mục. */
export const BOTTOM_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Trang chủ', icon: '🏠' },
  { href: '/tuan', label: 'Thai kỳ', icon: '🤰' },
  { href: '/dinh-duong', label: 'Dinh dưỡng', icon: '🥗' },
  { href: '/be', label: 'Bé', icon: '🍼' },
  { href: '/cam-nang', label: 'Cẩm nang', icon: '📖' },
  { href: '/cong-viec', label: 'Gia đình', icon: '👨‍👩‍👧' },
]
