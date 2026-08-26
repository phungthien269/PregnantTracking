'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { data } from '@/lib/data/client-entry'
import { fmtDate } from '@/lib/format'
import { Button, Card, EmptyState, Field, Input, Modal, Textarea } from '@mevabe/ui'
import type { MedicalVisit, VisitDocument } from '@/lib/data/client-entry'

const MAX_DIM = 1200
const JPEG_QUALITY = 0.8

/** Nén ảnh client-side (canvas → JPEG ~1200px, quality 0.8) để base64 gọn. */
function compressImage(file: File): Promise<{ dataUrl: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      try {
        const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Không tạo được canvas')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve({ dataUrl: canvas.toDataURL('image/jpeg', JPEG_QUALITY), mime: 'image/jpeg' })
      } catch (err) {
        reject(err)
      } finally {
        URL.revokeObjectURL(url)
      }
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Không đọc được ảnh'))
    }
    img.src = url
  })
}

/** Gọi OCR /api/v1/vision/ocr; trả null khi route lỗi/ngoại tuyến/không đọc được. */
async function readOcr(dataUrl: string): Promise<string | null> {
  try {
    const res = await fetch('/api/v1/vision/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageDataUrl: dataUrl }),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok || !json?.ok) return null
    const text = typeof json?.text === 'string' ? json.text.trim() : ''
    return text || null
  } catch {
    return null
  }
}

/** Danh sách lần khám + form thêm + up ảnh (nén + OCR) cho từng lần khám. */
export function MedicalVisitLog({
  visits,
  documentsByVisit,
}: {
  visits: MedicalVisit[]
  documentsByVisit: Record<string, VisitDocument[]>
}) {
  const router = useRouter()

  // ---- form thêm lần khám ----
  const [form, setForm] = useState({ visitDate: '', clinic: '', reason: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  // ---- danh sách ----
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // ---- up ảnh ----
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [uploadMsg, setUploadMsg] = useState<{ id: string; text: string } | null>(null)

  // ---- xem ảnh lớn ----
  const [preview, setPreview] = useState<string | null>(null)

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.visitDate || saving) return
    setSaving(true)
    setSaveMsg(null)
    try {
      await data.addMedicalVisit({
        visit_date: form.visitDate,
        clinic: form.clinic.trim() || null,
        reason: form.reason.trim() || null,
        notes: form.notes.trim() || null,
      })
      setForm({ visitDate: '', clinic: '', reason: '', notes: '' })
      setSaveMsg('Đã thêm lần khám.')
      router.refresh()
    } catch {
      setSaveMsg('Lưu không thành công — thử lại.')
    } finally {
      setSaving(false)
    }
  }

  const uploadPhotos = async (visitId: string, files: File[]) => {
    if (!files.length || uploadingId) return
    setUploadingId(visitId)
    setUploadMsg(null)
    let saved = 0
    let failed = 0
    try {
      for (const file of files) {
        try {
          const { dataUrl, mime } = await compressImage(file)
          const ocrText = await readOcr(dataUrl)
          await data.addVisitDocument(visitId, {
            filename: file.name,
            mime,
            imageDataUrl: dataUrl,
            ocrText,
          })
          saved++
        } catch {
          failed++
        }
      }
      setUploadMsg({
        id: visitId,
        text: `${saved} ảnh đã lưu${failed ? `, ${failed} ảnh lỗi` : ''}.`,
      })
      router.refresh()
    } finally {
      setUploadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Thêm lần khám">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Ngày khám *" htmlFor="mv-date">
            <Input
              id="mv-date"
              type="date"
              value={form.visitDate}
              onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
              required
            />
          </Field>
          <Field label="Nơi khám" htmlFor="mv-clinic">
            <Input
              id="mv-clinic"
              value={form.clinic}
              onChange={(e) => setForm({ ...form, clinic: e.target.value })}
              placeholder="VD: BV Từ Dũ"
            />
          </Field>
          <Field label="Lý do khám" htmlFor="mv-reason">
            <Input
              id="mv-reason"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="VD: Khám định kỳ, xét nghiệm…"
            />
          </Field>
          <Field label="Ghi chú" htmlFor="mv-notes">
            <Textarea
              id="mv-notes"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Kết quả, chỉ định bác sĩ…"
            />
          </Field>
          <div className="sm:col-span-2 sm:justify-self-end">
            <Button type="submit" disabled={!form.visitDate || saving} className="w-full sm:w-auto">
              {saving ? 'Đang lưu…' : 'Thêm lần khám'}
            </Button>
          </div>
        </form>
        {saveMsg && (
          <p className="mt-2 text-sm text-success" role="status">
            {saveMsg}
          </p>
        )}
      </Card>

      {visits.length === 0 ? (
        <EmptyState
          title="Chưa có lần khám nào"
          description="Thêm lần khám đầu tiên để bắt đầu lưu hồ sơ — kèm ảnh giấy khám và nội dung đọc được từ ảnh."
        />
      ) : (
        <div className="space-y-4">
          {visits.map((v) => {
            const docs = documentsByVisit[v.id] ?? []
            const isOpen = expanded.has(v.id)
            const uploading = uploadingId === v.id
            return (
              <Card
                key={v.id}
                title={`Khám ${fmtDate(v.visit_date)}${v.clinic ? ` — ${v.clinic}` : ''}`}
                description={v.reason ? `Lý do: ${v.reason}` : undefined}
                action={
                  <Button variant="ghost" size="sm" onClick={() => toggle(v.id)} aria-expanded={isOpen}>
                    {isOpen ? 'Thu gọn' : `Ảnh & nội dung${docs.length ? ` (${docs.length})` : ''}`}
                  </Button>
                }
              >
                <div className="space-y-3">
                  {v.notes && <p className="whitespace-pre-wrap text-sm text-fg">📝 {v.notes}</p>}

                  {isOpen && (
                    <>
                      {docs.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {docs.map((d) => (
                            <figure key={d.id} className="space-y-1.5">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={d.image_data}
                                alt={d.filename}
                                onClick={() => setPreview(d.image_data)}
                                className="h-28 w-full cursor-zoom-in rounded-md border border-border object-cover"
                              />
                              <figcaption className="line-clamp-2 text-xs text-muted">
                                {d.ocr_text || 'Chưa đọc được nội dung.'}
                              </figcaption>
                            </figure>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          disabled={uploading}
                          className="text-sm text-muted file:mr-2 file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:text-fg"
                          onChange={(e) => {
                            const files = Array.from(e.target.files ?? [])
                            e.target.value = ''
                            if (files.length) void uploadPhotos(v.id, files)
                          }}
                        />
                        {uploading && <span className="text-sm text-muted">Đang nén & đọc chữ…</span>}
                      </div>
                      {uploadMsg?.id === v.id && (
                        <p className="text-xs text-success" role="status">
                          {uploadMsg.text}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        open={preview !== null}
        onClose={() => setPreview(null)}
        title="Xem ảnh giấy khám"
        footer={
          <Button variant="secondary" onClick={() => setPreview(null)}>
            Đóng
          </Button>
        }
      >
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Ảnh giấy khám" className="max-h-[70vh] w-full rounded-md object-contain" />
        )}
      </Modal>
    </div>
  )
}
