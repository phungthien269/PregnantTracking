import Link from 'next/link'
import { buttonClasses } from '@mevabe/ui'

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg p-6 text-center">
      <p className="text-3xl" aria-hidden>
        🤷
      </p>
      <h1 className="text-lg font-semibold text-fg">Không tìm thấy trang</h1>
      <p className="text-sm text-muted">Trang mẹ tìm không tồn tại hoặc đã được di chuyển.</p>
      <Link className={buttonClasses()} href="/dashboard">
        Về trang chủ
      </Link>
    </div>
  )
}
