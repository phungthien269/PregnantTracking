'use client'

import { useState } from 'react'
import { Button, Field, Modal, Select, Textarea } from '@mevabe/ui'
import { apiErrorMessage } from '@/lib/api-error'

const REASONS = [
  'Sai đáp án',
  'Nội dung không chính xác',
  'Lỗi chính tả hoặc ngữ pháp',
  'Thông tin gây hiểu nhầm',
  'Khác',
]

/**
 * Nút "Báo lỗi câu hỏi" trên quiz — gửi report qua POST /api/v1/quizzes/report.
 * Mở modal nhỏ: lý do (chọn sẵn) + chi tiết tuỳ chọn.
 */
export function QuizReportButton({ questionId }: { questionId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const close = (): void => {
    setOpen(false)
    setError(null)
    setSent(false)
    setReason('')
    setDetails('')
  }

  const submit = async (): Promise<void> => {
    if (!reason) {
      setError('Mẹ hãy chọn lý do báo lỗi.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/v1/quizzes/report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ quiz_question_id: questionId, reason, details: details.trim() || undefined }),
      })
      const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null
      if (!res.ok) {
        setError(apiErrorMessage(body, 'Không gửi được báo lỗi. Mẹ thử lại nhé.'))
        return
      }
      setSent(true)
    } catch {
      setError('Không gửi được báo lỗi. Mẹ thử lại nhé.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-muted underline-offset-2 hover:text-fg hover:underline focus-visible:outline-2 focus-visible:outline-primary"
      >
        Báo lỗi câu hỏi
      </button>

      <Modal
        open={open}
        onClose={close}
        title="Báo lỗi câu hỏi"
        footer={
          sent ? (
            <Button variant="secondary" onClick={close}>
              Đóng
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={close}>
                Huỷ
              </Button>
              <Button onClick={submit} disabled={submitting}>
                {submitting ? 'Đang gửi…' : 'Gửi báo lỗi'}
              </Button>
            </>
          )
        }
      >
        {sent ? (
          <p className="text-sm text-success">Cảm ơn mẹ đã góp ý! Đội ngũ sẽ xem xét câu hỏi này.</p>
        ) : (
          <div className="space-y-3">
            <Field label="Lý do">
              <Select value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Lý do báo lỗi">
                <option value="">Chọn lý do…</option>
                {REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Chi tiết (không bắt buộc)"
              hint="Mô tả rõ hơn giúp đội ngũ sửa nhanh hơn."
            >
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={700}
                placeholder="Ví dụ: đáp án đúng phải là 1000 mg…"
                aria-label="Chi tiết báo lỗi"
              />
            </Field>
            {error && (
              <p className="text-xs text-danger" role="alert">
                {error}
              </p>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
