'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { fmtDateTime } from '@/lib/format'
import { apiErrorMessage } from '@/lib/api-error'
import { Badge, Button, Card, Toggle, cx } from '@mevabe/ui'
import type { ChatRole } from '@mevabe/domain'

interface SourceRef {
  id: string
  title: string
  source: string
}

interface SessionRow {
  id: string
  title: string | null
  updated_at: string
}

interface ChatRow {
  id: string
  role: ChatRole
  content: string
  created_at: string
  sources?: { id?: string; title: string; source: string }[]
  model?: string | null
  provider?: string | null
}

interface ChatUiProps {
  initialSessions: SessionRow[]
  initialSessionId: string | null
  initialMessages: ChatRow[]
}

/** Chat với AI (OpenRouter qua /api/v1/ai/chat) — lưu lịch sử theo user, AI nhớ nhiều lượt. */
export function ChatUI({ initialSessions, initialSessionId, initialMessages }: ChatUiProps) {
  const [sessions, setSessions] = useState<SessionRow[]>(initialSessions)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(initialSessionId)
  const [messages, setMessages] = useState<ChatRow[]>(initialMessages)
  const [input, setInput] = useState('')
  const [aiOn, setAiOn] = useState(true)
  const [pending, setPending] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [meta, setMeta] = useState({ configured: false, model: 'demo-mock', provider: 'mock' })
  const scrollRef = useRef<HTMLDivElement>(null)
  const seq = useRef(0)

  // Lấy cấu hình AI (model/provider) để hiện trong UI.
  useEffect(() => {
    fetch('/api/v1/ai/chat')
      .then((r) => r.json())
      .then((j) => {
        if (j?.data) setMeta(j.data)
      })
      .catch(() => {})
  }, [])

  // Tự cuộn xuống tin mới nhất.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, pending])

  /** Làm mới danh sách phiên (sau khi gửi tin để phiên mới/đã sửa lên đầu). */
  const refreshSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/ai/chat/history')
      const json = await res.json()
      if (json?.data?.sessions) setSessions(json.data.sessions)
    } catch {
      /* giữ danh sách hiện tại */
    }
  }, [])

  /** Mở một cuộc trò chuyện cũ → tải tin nhắn của phiên đó. */
  const selectSession = useCallback(
    async (id: string) => {
      if (id === activeSessionId) return
      setActiveSessionId(id)
      setLoadingHistory(true)
      try {
        const res = await fetch(`/api/v1/ai/chat/history?sessionId=${encodeURIComponent(id)}`)
        const json = await res.json()
        setMessages(json?.data?.messages ?? [])
      } catch {
        setMessages([])
      } finally {
        setLoadingHistory(false)
      }
    },
    [activeSessionId],
  )

  /** Bắt đầu cuộc trò chuyện mới (chưa có session — lần gửi sau route tự tạo). */
  const newConversation = () => {
    setActiveSessionId(null)
    setMessages([])
  }

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || pending) return
    const stamp = `${Date.now()}-${seq.current++}`
    const userMsg: ChatRow = {
      id: `local-u-${stamp}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')

    if (!aiOn) {
      setMessages((prev) => [
        ...prev,
        {
          id: `local-a-${stamp}`,
          role: 'assistant',
          content: 'AI đã tắt. Mẹ có thể tìm câu trả lời trong thư viện bài viết của mình.',
          created_at: new Date().toISOString(),
        },
      ])
      return
    }

    setPending(true)
    try {
      const res = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: activeSessionId }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.data) throw json
      const d = json.data
      setMessages((prev) => [
        ...prev,
        {
          id: `local-a-${stamp}`,
          role: 'assistant',
          content: d.reply,
          created_at: new Date().toISOString(),
          sources: d.sources ?? [],
          model: d.model ?? null,
          provider: d.provider ?? null,
        },
      ])
      // Route tạo mới hoặc xác nhận phiên → ghi nhận để lần gửi sau nối tiếp đúng cuộc.
      if (d.sessionId) setActiveSessionId(d.sessionId)
      if (d.model) setMeta((m) => ({ ...m, configured: true, model: d.model, provider: d.provider }))
      refreshSessions()
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `local-a-${stamp}`,
          role: 'assistant',
          content: apiErrorMessage(
            err,
            'Xin lỗi, AI chưa trả lời được. Mẹ hãy thử lại hoặc tìm câu trả lời trong thư viện bài viết.',
          ),
          created_at: new Date().toISOString(),
        },
      ])
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Hỏi AI" description="Trả lời dựa trên nội dung thư viện của bạn — không khuyến cáo y khoa cứng.">
        {/* Thanh trạng thái + bật/tắt */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <p className="flex items-center gap-2 text-xs text-muted">
            <Badge tone={aiOn ? (meta.configured ? 'success' : 'neutral') : 'neutral'}>
              {aiOn ? (meta.configured ? 'AI bật' : 'Nguồn') : 'AI tắt'}
            </Badge>
            Model: <code className="text-fg">{meta.model}</code> · Provider: <code className="text-fg">{meta.provider}</code>
          </p>
          <div className="flex items-center gap-3">
            <Button variant="soft" size="sm" onClick={newConversation} type="button">
              + Cuộc trò chuyện mới
            </Button>
            <Toggle checked={aiOn} onChange={setAiOn} label="Hỏi AI" />
          </div>
        </div>

        {/* Danh sách cuộc trò chuyện cũ */}
        {sessions.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto border-b border-border py-3" role="list" aria-label="Cuộc trò chuyện cũ">
            {sessions.map((s) => {
              const active = s.id === activeSessionId
              return (
                <button
                  key={s.id}
                  type="button"
                  role="listitem"
                  onClick={() => selectSession(s.id)}
                  aria-pressed={active}
                  className={cx(
                    'flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                    active
                      ? 'border-primary bg-primary-soft text-primary-strong'
                      : 'border-border bg-surface text-fg hover:bg-surface-muted',
                  )}
                >
                  <span className="max-w-40 truncate">{s.title || 'Cuộc trò chuyện'}</span>
                  <span className="text-[10px] text-muted">{fmtDateTime(s.updated_at)}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Vùng tin nhắn */}
        <div
          ref={scrollRef}
          className="flex max-h-[50vh] min-h-64 flex-col gap-3 overflow-y-auto py-4"
          role="log"
          aria-label="Lịch sử chat"
        >
          {loadingHistory ? (
            <p className="text-sm text-muted">Đang tải lịch sử…</p>
          ) : messages.length ? (
            messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    m.role === 'user' ? 'bg-primary-soft text-primary-strong' : 'bg-surface-muted text-fg'
                  }`}
                >
                  <p className="whitespace-pre-line">{m.content}</p>
                  {m.sources && m.sources.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5 text-[10px] text-muted">
                      {m.sources.map((s, i) => (
                        <li key={i}>
                          📚 {s.title} — <span className="text-fg">{s.source}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-1 text-[10px] text-muted">
                    {fmtDateTime(m.created_at)}
                    {m.model ? ` · ${m.provider}/${m.model}` : ''}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">Bắt đầu cuộc trò chuyện với mẹ nhé!</p>
          )}
          {pending && <p className="text-xs text-muted">AI đang suy nghĩ…</p>}
        </div>

        <form onSubmit={send} className="flex gap-2 border-t border-border pt-3">
          <label className="sr-only" htmlFor="chat-input">
            Nhập tin nhắn
          </label>
          <input
            id="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="VD: Tuần 18 nên ăn gì?"
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Button type="submit" disabled={!input.trim() || pending}>
            {pending ? '…' : 'Gửi'}
          </Button>
        </form>
      </Card>

      <p className="text-sm text-muted">
        📚 AI trích trả lời từ nội dung trong thư viện của mẹ. Nếu không có nguồn, AI sẽ nói rõ thay vì bịa.
      </p>
    </div>
  )
}
