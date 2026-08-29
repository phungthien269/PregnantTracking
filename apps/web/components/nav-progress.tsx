'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * NavProgress — thanh tiến trình 2px trên đỉnh màn hình khi điều hướng (R7).
 * Cơ chế: bắt click anchor cùng nguồn ở pha capture (không phải sửa từng <Link>),
 * tắt khi pathname đổi + timer an toàn 5s tránh kẹt (route không đổi/hủy navigate).
 * Reduced-motion: CSS hiển thị thanh tĩnh mờ thay cho animation trượt.
 */
export function NavProgress() {
  const pathname = usePathname()
  const [pending, setPending] = useState(false)

  // Điều hướng xong (đường dẫn đổi) → tắt thanh.
  useEffect(() => {
    setPending(false)
  }, [pathname])

  // Timer an toàn: route không đổi (click chính nó / hủy navigate) → không kẹt.
  useEffect(() => {
    if (!pending) return
    const t = setTimeout(() => setPending(false), 5000)
    return () => clearTimeout(t)
  }, [pending])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as HTMLElement | null)?.closest?.('a')
      if (!a) return
      const href = a.getAttribute('href')
      if (!href || !href.startsWith('/') || href.startsWith('//') || a.target === '_blank') return
      if (href === pathname) return
      setPending(true)
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [pathname])

  if (!pending) return null
  return <div aria-hidden className="nav-progress-bar fixed inset-x-0 top-0 z-[60] h-0.5" />
}
