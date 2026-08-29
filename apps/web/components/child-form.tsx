'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { data } from '@/lib/data/client-entry'
import { isOfflineError, OFFLINE_MESSAGE } from '@/lib/api-error'
import { Button, Field, Input, Select } from '@mevabe/ui'
import type { Gender } from '@mevabe/domain'

const GENDER_LABELS: Record<Gender, string> = {
  male: 'Bé trai',
  female: 'Bé gái',
  unknown: 'Chưa rõ',
}
const GENDER_OPTIONS = (Object.keys(GENDER_LABELS) as Gender[]).map((g) => ({ value: g, label: GENDER_LABELS[g] }))

const splitList = (s: string) =>
  s
    .split(/[,\n]/)
    .map((x) => x.trim())
    .filter(Boolean)

/** Form thêm hồ sơ bé. `birthId` (nếu có) liên kết bé với ca sinh vừa ghi. */
export function ChildForm({ birthId }: { birthId?: string | null }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [sex, setSex] = useState<Gender>('female')
  const [birthDate, setBirthDate] = useState('')
  const [weight, setWeight] = useState('')
  const [length, setLength] = useState('')
  const [head, setHead] = useState('')
  const [bloodType, setBloodType] = useState('')
  const [allergies, setAllergies] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    setError('')
    try {
      await data.addChild({
        birth_record_id: birthId ?? undefined,
        name,
        sex,
        birth_date: birthDate,
        birth_weight_kg: weight ? Number(weight) : undefined,
        birth_length_cm: length ? Number(length) : undefined,
        head_circumference_cm: head ? Number(head) : undefined,
        blood_type: bloodType || undefined,
        allergies: splitList(allergies),
      })
      setName('')
      setSex('female')
      setBirthDate('')
      setWeight('')
      setLength('')
      setHead('')
      setBloodType('')
      setAllergies('')
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(isOfflineError(err) ? OFFLINE_MESSAGE : err instanceof Error && err.message ? err.message : 'Chưa thêm được hồ sơ bé — mẹ thử lại.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mb-4">
      {open ? (
        <form onSubmit={submit} className="grid gap-4 rounded-md border border-border bg-surface-muted p-4 sm:grid-cols-2">
          <Field label="Tên bé" htmlFor="ch-name">
            <Input id="ch-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Bé Minh" />
          </Field>
          <Field label="Giới tính" htmlFor="ch-sex">
            <Select id="ch-sex" value={sex} onChange={(e) => setSex(e.target.value as Gender)}>
              {GENDER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Ngày sinh" htmlFor="ch-birth-date">
            <Input id="ch-birth-date" type="date" required value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </Field>
          <Field label="Cân nặng lúc sinh (kg)" htmlFor="ch-weight">
            <Input id="ch-weight" type="number" inputMode="decimal" min={0} step="0.01" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="VD: 3.2" />
          </Field>
          <Field label="Chiều dài lúc sinh (cm)" htmlFor="ch-length">
            <Input id="ch-length" type="number" inputMode="decimal" min={0} step="0.1" value={length} onChange={(e) => setLength(e.target.value)} placeholder="VD: 50" />
          </Field>
          <Field label="Vòng đầu lúc sinh (cm)" htmlFor="ch-head">
            <Input id="ch-head" type="number" inputMode="decimal" min={0} step="0.1" value={head} onChange={(e) => setHead(e.target.value)} placeholder="VD: 34" />
          </Field>
          <Field label="Nhóm máu" htmlFor="ch-blood">
            <Input id="ch-blood" value={bloodType} onChange={(e) => setBloodType(e.target.value)} placeholder="VD: A+" />
          </Field>
          <Field label="Dị ứng" htmlFor="ch-allergies" hint="Ngăn cách bằng dấu phẩy hoặc xuống dòng.">
            <Input id="ch-allergies" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="VD: đạm sữa bò, lạc" />
          </Field>
          <div className="flex gap-2 sm:col-span-2 sm:justify-end">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Đang lưu…' : 'Thêm bé'}
            </Button>
          </div>
          {error && (
            <p role="alert" className="sm:col-span-2 rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
        </form>
      ) : (
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          + Thêm bé
        </Button>
      )}
    </div>
  )
}
