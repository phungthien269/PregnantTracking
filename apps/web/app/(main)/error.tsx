'use client'

import { buttonClasses } from '@mevabe/ui'

export default function MainError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-surface p-10 text-center shadow-card">
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
