'use client'

import { useState } from 'react'
import { Badge, Button, Card, EmptyState, Field, Input } from '@mevabe/ui'
import type { KnowledgeChunk } from '@mevabe/domain'
import { apiErrorMessage } from '@/lib/api-error'
import { data } from '@/lib/data/client-entry'

/**
 * Tìm kiếm trong thư viện — gọi searchKnowledgeChunks (LIKE đơn giản trên
 * content/citation, giới hạn 50, order theo position). Mỗi kết quả hiển thị
 * kèm trích dẫn nguồn (citation) + vị trí; bấm "Xem thêm" để mở toàn bộ nội
 * dung chunk (chính là đoạn trích từ nguồn tương ứng).
 */
export function LibrarySearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<KnowledgeChunk[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const runSearch = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const q = query.trim()
    if (!q || loading) return
    setLoading(true)
    setError(null)
    setSearched(true)
    try {
      setResults(await data.searchKnowledgeChunks(q))
    } catch (err) {
      setResults([])
      setError(apiErrorMessage(err, 'Tìm kiếm chưa thành công — mẹ thử lại.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card
      title="Tìm trong thư viện"
      description="Tìm kiếm nội dung đã import theo từ khoá (VD: canxi, sắt, thai máy…)."
    >
      <form onSubmit={runSearch} className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <Field label="Từ khoá" htmlFor="lib-search">
            <Input
              id="lib-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="VD: canxi, sắt, thai máy…"
              maxLength={200}
            />
          </Field>
        </div>
        <Button type="submit" disabled={!query.trim() || loading}>
          {loading ? 'Đang tìm…' : 'Tìm'}
        </Button>
      </form>

      {error && (
        <p className="mt-3 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      {searched && !loading && !error && (
        results.length ? (
          <ul className="mt-4 space-y-2">
            {results.map((c) => {
              const isOpen = expanded[c.id]
              const clamp = !isOpen && c.content.length > 220
              return (
                <li key={c.id} className="rounded-md border border-border bg-surface p-3 text-sm">
                  <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge tone="accent">{c.citation}</Badge>
                    <Badge tone="neutral">Đoạn {c.position + 1}</Badge>
                  </div>
                  <p className={clamp ? 'line-clamp-3 whitespace-pre-line text-fg' : 'whitespace-pre-line text-fg'}>
                    {c.content}
                  </p>
                  {c.content.length > 220 && (
                    <button
                      type="button"
                      onClick={() => setExpanded((prev) => ({ ...prev, [c.id]: !isOpen }))}
                      className="mt-1 text-xs text-primary hover:underline"
                    >
                      {isOpen ? 'Thu gọn' : 'Xem thêm'}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="mt-4">
            <EmptyState
              title="Không tìm thấy"
              description="Thử từ khoá khác hoặc import thêm tài liệu để mở rộng thư viện."
            />
          </div>
        )
      )}
    </Card>
  )
}
