'use client'

import { buttonClasses } from '@mevabe/ui'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg p-6 text-center">
      <p className="text-3xl" aria-hidden>
        😔
      </p>
      <h1 className="text-lg font-semibold text-fg">Đã có lỗi xảy ra</h1>
      <p className="max-w-md text-sm text-muted">{error.message || 'Vui lòng thử lại.'}</p>
      <button className={buttonClasses()} onClick={reset}>
        Thử lại
      </button>
    </div>
  )
}
