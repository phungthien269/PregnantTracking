import type { Citation } from '@/lib/nutrition'

/**
 * Danh sách trích dẫn nguồn — hiển thị "Tham khảo từ: tổ chức — tiêu đề (nguồn ↗)".
 * Dùng cho mọi khuyến nghị dinh dưỡng để số liệu luôn có nguồn (org + URL).
 */
export function SourceList({
  citations,
  label = 'Tham khảo từ',
}: {
  citations: Citation[]
  label?: string
}) {
  if (!citations || citations.length === 0) return null
  return (
    <div className="mt-3 border-t border-border pt-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <ul className="mt-1 space-y-1">
        {citations.map((c, i) => (
          <li key={i} className="text-[11px] leading-snug text-muted">
            <span className="font-medium text-muted">{c.org}</span>
            <span className="text-muted/70"> — {c.title}</span>
            {c.url && (
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-primary underline underline-offset-2 hover:text-primary-strong"
              >
                nguồn ↗
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
