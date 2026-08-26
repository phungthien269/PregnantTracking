'use client'

import { useState } from 'react'
import { Button, Field, Input, Modal, Badge } from '@mevabe/ui'
import { DANGER_SIGNS, type Urgency } from '@/lib/ai/symptom-triage'
import { apiErrorMessage } from '@/lib/api-error'

const DANGER_LABELS = DANGER_SIGNS.map((d) => d.label)

interface SourceRef {
  title: string
  source: string
}

interface AnalysisResult {
  urgent: boolean
  urgency: Urgency
  matched: string[]
  reason: string
  actions: string[]
  sources: SourceRef[]
  possible_causes?: string[]
  ai: boolean
  model?: string | null
  provider?: string | null
}

/**
 * Phân tích triệu chứng — gọi /api/v1/ai/symptom.
 * Server triage cứng TRƯỚC (khẩn → không gọi AI); không khẩn → AI/fallback nguồn.
 */
export function SymptomAnalyzer() {
  const [open, setOpen] = useState(false)
  const [symptom, setSymptom] = useState('')
  const [checked, setChecked] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)

  const toggle = (s: string) =>
    setChecked((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))

  const openAnalyzer = () => {
    setSymptom('')
    setChecked([])
    setResult(null)
    setLoading(false)
    setOpen(true)
  }

  const analyze = async () => {
    if (!symptom.trim() || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/v1/ai/symptom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symptom, danger_signs: checked }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.data) throw json
      setResult(json.data)
    } catch (err) {
      setResult({
        urgent: false,
        urgency: 'info',
        matched: [],
        reason: '',
        actions: [apiErrorMessage(err, 'Xin lỗi, phân tích chưa thành công — mẹ hãy thử lại sau.')],
        sources: [{ title: 'Hướng dẫn quốc gia về chăm sóc tiền sản', source: 'Bộ Y tế Việt Nam' }],
        ai: false,
      })
    } finally {
      setLoading(false)
    }
  }

  const urgencyMeta: Record<Urgency, { tone: 'danger' | 'warning' | 'success'; label: string }> = {
    danger: { tone: 'danger', label: 'Cần xử lý ngay' },
    warning: { tone: 'warning', label: 'Cần lưu ý' },
    info: { tone: 'success', label: 'Không khẩn cấp' },
  }

  return (
    <>
      <Button onClick={openAnalyzer}>🤖 Phân tích triệu chứng</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Phân tích triệu chứng">
        {result === null ? (
          <div className="space-y-4">
            <p className="text-muted">
              Nhập triệu chứng và đánh dấu dấu hiệu nguy hiểm bạn đang gặp (nếu có). Hệ thống kiểm tra mức khẩn trước khi đưa gợi ý.
            </p>
            <Field label="Triệu chứng" htmlFor="sym-name">
              <Input id="sym-name" value={symptom} onChange={(e) => setSymptom(e.target.value)} placeholder="VD: đau bụng âm ỉ, mệt mỏi…" />
            </Field>
            <fieldset>
              <legend className="text-sm font-medium text-fg">Dấu hiệu nguy hiểm</legend>
              <div className="mt-2 space-y-1.5">
                {DANGER_LABELS.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm text-fg">
                    <input
                      type="checkbox"
                      checked={checked.includes(s)}
                      onChange={() => toggle(s)}
                      className="h-4 w-4 rounded accent-primary"
                    />
                    {s}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button onClick={analyze} disabled={!symptom.trim() || loading}>
                {loading ? '…' : 'Phân tích'}
              </Button>
            </div>
          </div>
        ) : result.urgent ? (
          <div className="space-y-3">
            <div className="rounded-md bg-danger/10 p-3">
              <p className="font-medium text-danger">Có dấu hiệu nguy hiểm — cần xử lý ngay.</p>
              <p className="mt-1 text-sm text-muted">
                Đừng chờ phân tích AI. Hãy gọi cấp cứu 115 hoặc đến bệnh viện phụ sản gần nhất ngay lập tức.
              </p>
            </div>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted">
              {result.actions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
            <div className="rounded-md bg-surface-muted p-3 text-sm text-muted">
              <p className="font-semibold text-fg">Nguồn:</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                {result.sources.map((s, i) => (
                  <li key={i}>{s.title} — {s.source}</li>
                ))}
              </ul>
            </div>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Đã hiểu
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge tone={urgencyMeta[result.urgency].tone}>{urgencyMeta[result.urgency].label}</Badge>
            </div>
            {result.reason && <p className="text-sm text-muted">{result.reason}</p>}

            {result.possible_causes && result.possible_causes.length > 0 && (
              <div>
                <p className="text-sm font-medium text-fg">Khả năng liên quan</p>
                <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-muted">
                  {result.possible_causes.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-fg">Nên làm gì</p>
              <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-muted">
                {result.actions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-md bg-surface-muted p-3 text-sm text-muted">
              <p className="font-semibold text-fg">Nguồn:</p>
              <ul className="mt-1 list-inside list-disc space-y-0.5">
                {result.sources.map((s, i) => (
                  <li key={i}>{s.title} — {s.source}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs">
                {result.ai
                  ? `✨ Phân tích bởi AI — ${result.provider}/${result.model}.`
                  : '📚 Phân tích từ nội dung nguồn có trong thư viện.'}{' '}
                Đây là thông tin tham khảo, không thay thế lời khuyên bác sĩ.
              </p>
            </div>

            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
