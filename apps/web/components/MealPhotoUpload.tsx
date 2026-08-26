'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { data } from '@/lib/data/client-entry'
import { apiErrorMessage } from '@/lib/api-error'
import { MEAL_OPTIONS } from '@/lib/labels'
import { Badge, Button, Card, Field, Input, Select, Textarea } from '@mevabe/ui'
import type { MealType } from '@mevabe/domain'
import type { MealProposal } from '@/lib/meals-photo/recognize'
import { buildMealEntryInput } from '@/lib/meals-photo/confirm'

/**
 * Ảnh bữa ăn → nhận diện món (AI/heuristic theo tên file) → NGƯỜI DÙNG XÁC NHẬN
 * trước khi lưu. Gọi POST /api/v1/meals/photo (trả đề xuất, KHÔNG tự lưu); khi
 * xác nhận mới lưu qua data.addMeal.
 */
export function MealPhotoUpload({ onSaved }: { onSaved?: () => void }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [proposal, setProposal] = useState<MealProposal | null>(null)
  const [mealType, setMealType] = useState<MealType>('lunch')
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [savedNote, setSavedNote] = useState<string | null>(null)

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    setError(null)
    setSavedNote(null)
    setProposal(null)
    if (!f) {
      setFile(null)
      setPreview(null)
      return
    }
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const recognize = async () => {
    if (!file || loading) return
    setLoading(true)
    setError(null)
    setSavedNote(null)
    try {
      const fd = new FormData()
      fd.append('photo', file)
      fd.append('meal_type', mealType)
      const res = await fetch('/api/v1/meals/photo', { method: 'POST', body: fd })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.data) throw json
      const p = json.data as MealProposal
      setProposal(p)
      setMealType(p.meal_type)
      setName(p.name)
      setNote(p.note ?? '')
    } catch (err) {
      setError(apiErrorMessage(err, 'Lỗi nhận diện'))
    } finally {
      setLoading(false)
    }
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || saving) return
    setSaving(true)
    setError(null)
    try {
      // 1) Lưu bữa ăn (luồng có sẵn) → 2) nếu có ảnh, lưu ảnh + record meal_photos.
      const meal = await data.addMeal(
        buildMealEntryInput({ meal_type: mealType, name, note: note || undefined, calories: proposal?.calories ?? undefined }),
      )
      if (file) {
        try {
          const fd = new FormData()
          fd.append('meal_id', meal.id)
          fd.append('photo', file)
          const res = await fetch('/api/v1/meals/photo/save', { method: 'POST', body: fd })
          const json = await res.json().catch(() => null)
          if (!res.ok || !json?.data) throw new Error(json?.error?.message ?? 'Lưu ảnh không thành công')
          setSavedNote('Đã lưu bữa ăn kèm ảnh.')
        } catch {
          // Ảnh là bản ghi phụ — lỗi không chặn bữa ăn đã lưu; chỉ báo nhẹ.
          setSavedNote('Đã lưu bữa ăn. (Lưu ảnh không thành công — thử lại sau.)')
        }
      } else {
        setSavedNote('Đã lưu bữa ăn.')
      }
      reset()
      onSaved?.()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu bữa ăn thất bại')
    } finally {
      setSaving(false)
    }
  }

  const reset = () => {
    setFile(null)
    setPreview(null)
    setProposal(null)
    setMealType('lunch')
    setName('')
    setNote('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <Card
      title="Ảnh bữa ăn — nhận diện món"
      description="Tải ảnh lên, xem đề xuất món + dinh dưỡng, xác nhận trước khi lưu."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={pickFile}
            className="text-sm text-muted file:mr-3 file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:text-fg"
          />
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Ảnh bữa ăn đã chọn"
              className="h-20 w-20 rounded-md border border-border object-cover"
            />
          )}
        </div>

        <Field label="Bữa" htmlFor="photo-meal-type">
          <Select
            id="photo-meal-type"
            value={mealType}
            onChange={(e) => setMealType(e.target.value as MealType)}
            className="sm:max-w-56"
          >
            {MEAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex flex-wrap gap-2">
          <Button onClick={recognize} disabled={!file || loading}>
            {loading ? 'Đang nhận diện…' : 'Nhận diện món'}
          </Button>
          {proposal && (
            <Button variant="secondary" onClick={reset}>
              Làm lại
            </Button>
          )}
        </div>

        {error && (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        {savedNote && (
          <p className="text-sm text-success" role="status">
            {savedNote}
          </p>
        )}

        {proposal && (
          <form
            onSubmit={save}
            className="space-y-3 rounded-md border border-border bg-surface-muted p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={proposal.source === 'ai' ? 'primary' : 'accent'}>
                {proposal.source === 'ai' ? '✨ Đề xuất AI' : '📷 Theo tên file'}
              </Badge>
              {proposal.model && (
                <span className="text-xs text-muted">
                  {proposal.provider}/{proposal.model}
                </span>
              )}
              <span className="text-xs text-muted">
                — mẹ kiểm tra và sửa trước khi lưu
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Món" htmlFor="photo-name">
                <Input
                  id="photo-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Phở bò"
                />
              </Field>
              <Field label="Năng lượng ước tính" htmlFor="photo-kcal">
                <Input
                  id="photo-kcal"
                  value={proposal.calories != null ? `${proposal.calories} kcal` : 'Không rõ'}
                  disabled
                />
              </Field>
            </div>
            <Field label="Ghi chú" htmlFor="photo-note">
              <Textarea id="photo-note" value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            <div className="flex justify-end">
              <Button type="submit" disabled={!name.trim() || saving}>
                {saving ? 'Đang lưu…' : 'Xác nhận & lưu'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Card>
  )
}
