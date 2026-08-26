import Link from 'next/link'

/** Nút nổi Hỏi AI — góc dưới phải, nổi trên mọi trang. */
export function AskAiFab() {
  return (
    <Link
      href="/hoi-ai"
      aria-label="Hỏi AI"
      className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-pop transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:bottom-6 md:right-6"
    >
      <span aria-hidden className="text-xl leading-none">
        💬
      </span>
    </Link>
  )
}
