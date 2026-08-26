'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { data } from '@/lib/data/client-entry'
import { fmtDate } from '@/lib/format'
import { BIRTH_LABELS } from '@/lib/labels'
import { Badge, Button, Field, Input, Select, Textarea } from '@mevabe/ui'
import { BIRTH_TYPES } from '@mevabe/domain'
import type { BirthRecord, BirthType } from '@mevabe/domain'

const BIRTH_OPTIONS = BIRTH_TYPES.map((t) => ({ value: t, label: BIRTH_LABELS[t] }))

const splitList = (s: string) =>
  s
    .split(/[,\n]/)
    .map((x) => x.trim())
    .filter(Boolean)

/** Nhập ca sinh (khi chưa có) + sửa hồ sơ sinh (khi đã có) + hiển thị dữ liệu hiện tại. */
export function BirthRecordForm({ birth }: { birth: BirthRecord | null }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [birthDate, setBirthDate] = useState('')
  const [birthType, setBirthType] = useState<BirthType>('vaginal')
  const [hospital, setHospital] = useState('')
  const [duration, setDuration] = useState('')
  const [complications, setComplications] = useState('')
  const [notes, setNotes] = useState('')

  const startEdit = () => {
    if (!birth) return
    setBirthDate(birth.birth_date)
    setBirthType(birth.birth_type)
    setHospital(birth.hospital ?? '')
    setDuration(birth.duration_hours != null ? String(birth.duration_hours) : '')
    setComplications(birth.complications.join(', '))
    setNotes(birth.notes ?? '')
    setEditing(true)
  }

  const closeForm = () => {
    setOpen(false)
    setEditing(false)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const input = {
        birth_date: birthDate,
        birth_type: birthType,
        hospital: hospital || undefined,
        duration_hours: duration ? Number(duration) : undefined,
        complications: splitList(complications),
        notes: notes || undefined,
      }
      if (birth) {
        await data.updateBirthRecord(birth.id, input)
      } else {
        await data.addBirthRecord(input)
      }
      setSaved(true)
      closeForm()
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  if (birth && !editing) {
    return (
      <div className="space-y-2 text-sm text-fg">
        {saved && (
          <p role="status" className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
            Đã lưu hồ sơ sinh.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <p>
            Ngày sinh: <strong>{fmtDate(birth.birth_date)}</strong>
          </p>
          <Badge tone="primary">{BIRTH_LABELS[birth.birth_type]}</Badge>
        </div>
        {birth.hospital && <p>Bệnh viện: {birth.hospital}</p>}
        {birth.duration_hours != null && <p>Thời gian chuyển dạ: {birth.duration_hours} giờ</p>}
        {birth.complications.length > 0 && (
          <p>
            Biến chứng: <span className="text-muted">{birth.complications.join(', ')}</span>
          </p>
        )}
        {birth.notes && <p className="text-sm text-muted">{birth.notes}</p>}
        <div>
          <Button type="button" variant="secondary" size="sm" onClick={startEdit}>
            Sửa
          </Button>
        </div>
      </div>
    )
  }

  const showForm = open || editing
  if (!showForm) {
    return <Button onClick={() => setOpen(true)}>Nhập ca sinh</Button>
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <Field label="Ngày sinh" htmlFor="br-birth-date">
        <Input id="br-birth-date" type="date" required value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
      </Field>
      <Field label="Loại sinh" htmlFor="br-type">
        <Select id="br-type" value={birthType} onChange={(e) => setBirthType(e.target.value as BirthType)}>
          {BIRTH_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Bệnh viện" htmlFor="br-hospital">
        <Input id="br-hospital" value={hospital} onChange={(e) => setHospital(e.target.value)} placeholder="VD: Bệnh viện Từ Dũ" />
      </Field>
      <Field label="Thời gian chuyển dạ (giờ)" htmlFor="br-duration">
        <Input id="br-duration" type="number" inputMode="decimal" min={0} step="0.5" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="VD: 8.5" />
      </Field>
      <Field label="Biến chứng" htmlFor="br-complications" hint="Ngăn cách bằng dấu phẩy hoặc xuống dòng.">
        <Textarea id="br-complications" value={complications} onChange={(e) => setComplications(e.target.value)} placeholder="VD: chảy máu, rối loạn hô hấp" />
      </Field>
      <Field label="Ghi chú" htmlFor="br-notes">
        <Textarea id="br-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <div className="flex gap-2 sm:col-span-2 sm:justify-end">
        <Button type="button" variant="secondary" onClick={closeForm}>
          Hủy
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Đang lưu…' : birth ? 'Lưu thay đổi' : 'Lưu ca sinh'}
        </Button>
      </div>
    </form>
  )
}
