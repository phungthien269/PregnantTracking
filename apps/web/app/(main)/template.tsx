/**
 * template.tsx — bọc MỖI trang khi điều hướng (remount theo navigation).
 * Class `page-enter` (globals.css) cho hiệu ứng vào trang: fade + slide-up nhẹ
 * 180ms, chỉ transform/opacity (60fps). Người dùng bật "giảm chuyển động" trong
 * hệ điều hành → globals.css tắt animation (prefers-reduced-motion).
 * Next 15: template remount đúng theo navigation — không mất state của layout.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>
}
