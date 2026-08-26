'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge, Button, Card, Field, Input, Select, Textarea, Toggle } from '@mevabe/ui'
import { KNOWLEDGE_STAGES, type KnowledgeStage } from '@mevabe/domain'
import { apiErrorMessage } from '@/lib/api-error'
import {
  ALLOWED_IMPORT_EXTS,
  IMPORT_STAGE_LABELS,
  MAX_IMPORT_MB,
  buildImportPayload,
  validateImport,
  type ImportMode,
} from '@/lib/library/import-ui'

interface ImportResult {
  sourceId: string
  title: string
  status: 'ready' | 'failed'
  chunkCount: number
  suggestedStage: KnowledgeStage | null
  citations: string[]
}

interface ChunkRow {
  content: string
  citation: string
  position: number
}

interface SourceDetail {
  source: {
    id: string
    title: string
    status: 'processing' | 'ready' | 'failed'
    chunk_count: number | null
    stage: KnowledgeStage | null
  }
  chunks: ChunkRow[]
  stageTags: { stage: KnowledgeStage; confirmed_at: string | null }[]
}

const MODES: { value: ImportMode; label: string }[] = [
  { value: 'text', label: 'Dán text' },
  { value: 'url', label: 'Nhập URL' },
  { value: 'file', label: 'Tải file' },
]

const stageTone = (s: SourceDetail['source']['status']): 'neutral' | 'success' | 'danger' | 'warning' =>
  s === 'ready' ? 'success' : s === 'failed' ? 'danger' : s === 'processing' ? 'warning' : 'neutral'

/**
 * Import thư viện (text/URL/file PDF-EPUB-txt) + chi tiết sau khi import:
 * metadata, chunks + citations, xác nhận giai đoạn (stage tag), sinh quiz.
 * Gọi trực tiếp /api/v1/knowledge-sources — không qua DataApi.
 */
export function LibraryImport() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<ImportMode>('text')
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [privateOnly, setPrivateOnly] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [detail, setDetail] = useState<SourceDetail | null>(null)
  const [stage, setStage] = useState<KnowledgeStage>('pregnancy')
  const [confirming, setConfirming] = useState(false)
  const [stageNote, setStageNote] = useState<string | null>(null)

  const [quizTitle, setQuizTitle] = useState('')
  const [quizNote, setQuizNote] = useState<string | null>(null)
  const [loadingQuiz, setLoadingQuiz] = useState(false)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  const valid = validateImport(mode, { text, url, file }).ok

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null)
    setError(null)
    setDetail(null)
  }

  const loadDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/knowledge-sources/${id}`, { method: 'GET' })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.data) throw json
      const d = json.data as SourceDetail
      setDetail(d)
      setStage(d.source.stage ?? d.stageTags[0]?.stage ?? 'pregnancy')
      setQuizTitle(`${d.source.title} — Quiz`)
    } catch (err) {
      setError(apiErrorMessage(err, 'Đã import xong nhưng chưa tải được chi tiết nguồn.'))
    }
  }

  const doImport = async () => {
    const check = validateImport(mode, { text, url, file })
    if (!check.ok) {
      setError(check.error)
      return
    }
    setImporting(true)
    setError(null)
    setDetail(null)
    setQuizNote(null)
    setStageNote(null)
    try {
      const payload = buildImportPayload(mode, { text, url, file })
      const res = await fetch('/api/v1/knowledge-sources', {
        method: 'POST',
        headers: 'json' in payload ? { 'Content-Type': 'application/json' } : undefined,
        body:
          'json' in payload
            ? JSON.stringify({ ...(payload.json as object), private: privateOnly })
            : (() => {
                payload.form.append('private', String(privateOnly))
                return payload.form
              })(),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.data) throw json
      const result = json.data as ImportResult
      setText('')
      setUrl('')
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
      await loadDetail(result.sourceId)
    } catch (err) {
      setError(apiErrorMessage(err, 'Import chưa thành công — mẹ hãy thử lại.'))
    } finally {
      setImporting(false)
    }
  }

  const confirmStage = async () => {
    if (!detail || confirming) return
    setConfirming(true)
    setStageNote(null)
    try {
      const res = await fetch(`/api/v1/knowledge-sources/${detail.source.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.data) throw json
      setDetail({
        ...detail,
        source: { ...detail.source, stage },
        stageTags: detail.stageTags.map((t) =>
          t.stage === stage ? { ...t, confirmed_at: new Date().toISOString() } : t,
        ),
      })
      setStageNote('Đã xác nhận giai đoạn.')
    } catch (err) {
      setStageNote(apiErrorMessage(err, 'Xác nhận giai đoạn chưa thành công.'))
    } finally {
      setConfirming(false)
    }
  }

  const generateQuiz = async () => {
    if (!detail || loadingQuiz) return
    setLoadingQuiz(true)
    setQuizNote(null)
    try {
      const res = await fetch(`/api/v1/knowledge-sources/${detail.source.id}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quizTitle.trim() || undefined,
          stage: detail.source.stage ?? undefined,
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.data) throw json
      const { title, questionCount } = json.data as { title: string; questionCount: number }
      setQuizNote(`Đã tạo bộ quiz “${title}” với ${questionCount} câu hỏi — xem mục Quiz ôn kiến thức.`)
      router.refresh()
    } catch (err) {
      setQuizNote(apiErrorMessage(err, 'Sinh quiz chưa thành công — mẹ thử lại sau.'))
    } finally {
      setLoadingQuiz(false)
    }
  }

  const citations = detail ? [...new Set(detail.chunks.map((c) => c.citation))] : []
  const confirmedStages = detail?.stageTags.filter((t) => t.confirmed_at) ?? []

  return (
    <Card
      title="Import tài liệu mới"
      description={`Dán text, nhập URL hoặc tải file (PDF/EPUB/txt ≤${MAX_IMPORT_MB}MB) để thêm vào thư viện.`}
    >
      {/* Segmented control giữ `mode` đồng bộ với khối nhập liệu. */}
      <div role="tablist" className="inline-flex gap-1 rounded-md bg-surface-muted p-1">
        {MODES.map((m) => {
          const active = mode === m.value
          return (
            <button
              key={m.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setMode(m.value)
                setError(null)
              }}
              className={
                'shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ' +
                (active ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg')
              }
            >
              {m.label}
            </button>
          )
        })}
      </div>

      <div className="mt-4">
        {mode === 'text' && (
          <Field label="Nội dung" htmlFor="li-text" hint="Dán bài viết hoặc đoạn tài liệu muốn đưa vào thư viện.">
            <Textarea
              id="li-text"
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setError(null)
              }}
              placeholder="VD: Mẹ bầu cần bổ sung khoảng 1000–1200 mg canxi mỗi ngày…"
              rows={5}
              maxLength={200_000}
            />
          </Field>
        )}
        {mode === 'url' && (
          <Field label="Địa chỉ URL" htmlFor="li-url" hint="Chỉ hỗ trợ link http/https. Server tải nội dung và lập chỉ mục.">
            <Input
              id="li-url"
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                setError(null)
              }}
              placeholder="https://example.com/bai-viet"
              maxLength={2000}
            />
          </Field>
        )}
        {mode === 'file' && (
          <Field label="File" htmlFor="li-file" hint="PDF, EPUB, TXT, MD, HTML — tối đa 20 MB.">
            <input
              ref={inputRef}
              id="li-file"
              type="file"
              accept={ALLOWED_IMPORT_EXTS.map((e) => `.${e}`).join(',')}
              onChange={pickFile}
              className="text-sm text-muted file:mr-3 file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:text-fg"
            />
          </Field>
        )}
        {mode === 'file' && file && (
          <p className="mt-1 text-xs text-muted">
            {file.name} · {(file.size / 1024).toFixed(0)} KB
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button onClick={doImport} disabled={!valid || importing}>
          {importing ? 'Đang import…' : 'Import'}
        </Button>
        <Toggle checked={privateOnly} onChange={setPrivateOnly} label="Chỉ mình tôi xem" />
        {error && (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}
      </div>

      {detail && (
        <div className="mt-6 space-y-5 border-t border-border pt-5">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-fg">{detail.source.title}</h3>
              <Badge tone={stageTone(detail.source.status)}>{detail.source.status}</Badge>
              <Badge tone="neutral">{detail.chunks.length} chunks</Badge>
            </div>
            <p className="text-xs text-muted">ID: {detail.source.id}</p>
          </div>

          {citations.length > 0 && (
            <div>
              <p className="mb-1.5 text-sm font-medium text-fg">Nguồn trích dẫn</p>
              <ul className="flex flex-wrap gap-1.5">
                {citations.map((c) => (
                  <li key={c}>
                    <Badge tone="accent">{c}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-md border border-border bg-surface-muted p-3">
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Giai đoạn" htmlFor="li-stage">
                <Select
                  id="li-stage"
                  value={stage}
                  onChange={(e) => {
                    setStage(e.target.value as KnowledgeStage)
                    setStageNote(null)
                  }}
                  className="sm:max-w-52"
                >
                  {KNOWLEDGE_STAGES.map((s) => (
                    <option key={s} value={s}>
                      {IMPORT_STAGE_LABELS[s]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Button variant="secondary" onClick={confirmStage} disabled={confirming || detail.source.stage === stage}>
                {confirming ? 'Đang lưu…' : 'Xác nhận giai đoạn'}
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
              {detail.source.stage && (
                <Badge tone="success">Đã chọn: {IMPORT_STAGE_LABELS[detail.source.stage]}</Badge>
              )}
              {confirmedStages.length > 0 && <span>✓ {confirmedStages.length} tag đã xác nhận</span>}
              {stageNote && <span className="text-success">{stageNote}</span>}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-fg">Nội dung đã chia đoạn (chunks + citations)</p>
            {detail.chunks.length ? (
              <ul className="space-y-2">
                {detail.chunks.map((c) => {
                  const isOpen = expanded[c.position]
                  const clamp = !isOpen && c.content.length > 220
                  return (
                    <li key={c.position} className="rounded-md border border-border bg-surface p-3 text-sm">
                      <p className="mb-1 text-xs font-medium text-muted">
                        #{c.position + 1} · {c.citation}
                      </p>
                      <p className={clamp ? 'line-clamp-3 whitespace-pre-line text-fg' : 'whitespace-pre-line text-fg'}>
                        {c.content}
                      </p>
                      {c.content.length > 220 && (
                        <button
                          type="button"
                          onClick={() => setExpanded((prev) => ({ ...prev, [c.position]: !isOpen }))}
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
              <p className="text-sm text-muted">Chưa có chunk nào.</p>
            )}
          </div>

          <div className="rounded-md border border-border bg-surface-muted p-3">
            <p className="mb-2 text-sm font-medium text-fg">Sinh quiz từ nguồn này</p>
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Tên bộ quiz" htmlFor="li-quiz-title">
                <Input
                  id="li-quiz-title"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="Tên bộ quiz"
                  maxLength={200}
                  className="sm:max-w-72"
                />
              </Field>
              <Button onClick={generateQuiz} disabled={loadingQuiz || detail.chunks.length === 0}>
                {loadingQuiz ? 'Đang sinh…' : 'Sinh quiz'}
              </Button>
            </div>
            {quizNote && (
              <p className="mt-2 text-sm text-success" role="status">
                {quizNote}
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
