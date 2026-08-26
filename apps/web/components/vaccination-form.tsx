'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { data } from '@/lib/data/client-entry'
import { todayStr } from '@/lib/format'
import { Button, Field, Input, Modal, Textarea } from '@mevabe/ui'

/** Form thêm mũi tiêm — modal. Gọi addVaccination → router.refresh() để trang cập nhật ngay. */
export function VaccinationForm({ childId }: { childId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [vaccineName, setVaccineName] = useState('')
  const [doseNumber, setDoseNumber] = useState('1')
  const [scheduledDate, setScheduledDate] = useState(todayStr())
  const [administeredDate, setAdministeredDate] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setVaccineName('')
    setDoseNumber('1')
    setScheduledDate(todayStr())
    setAdministeredDate('')
    setLocation('')
    setNotes('')
    setError(null)
  }

  const close = () => {
    setOpen(false)
    setError(null)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vaccineName.trim()) return
    setSaving(true)
    setError(null)
    try {
      await data.addVaccination(childId, {
        vaccine_name: vaccineName.trim(),
        dose_number: doseNumber ? Number(doseNumber) : undefined,
        scheduled_date: scheduledDate || undefined,
        administered_date: administeredDate || undefined,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      })
      reset()
      setOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không lưu được mũi tiêm.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>+ Thêm mũi tiêm</Button>
      <Modal
        open={open}
        onClose={close}
        title="Thêm mũi tiêm"
        footer={
          <>
            <Button variant="ghost" onClick={close} disabled={saving}>
              Hủy
            </Button>
            <Button onClick={submit} disabled={!vaccineName.trim() || saving}>
              {saving ? 'Đang lưu…' : 'Lưu'}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4">
          <Field label="Tên vắc-xin *" htmlFor="vx-name">
            <Input
              id="vx-name"
              value={vaccineName}
              onChange={(e) => setVaccineName(e.target.value)}
              placeholder="VD: 6 trong 1, Phế cầu, Sởi…"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Liều (mũi thứ)" htmlFor="vx-dose">
              <Input
                id="vx-dose"
                type="number"
                min={1}
                value={doseNumber}
                onChange={(e) => setDoseNumber(e.target.value)}
              />
            </Field>
            <Field label="Ngày hẹn" htmlFor="vx-sched">
              <Input id="vx-sched" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ngày đã tiêm" htmlFor="vx-admin" hint="Để trống nếu chưa tiêm.">
              <Input
                id="vx-admin"
                type="date"
                value={administeredDate}
                onChange={(e) => setAdministeredDate(e.target.value)}
              />
            </Field>
            <Field label="Nơi tiêm" htmlFor="vx-loc">
              <Input id="vx-loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Trạm y tế…" />
            </Field>
          </div>
          <Field label="Ghi chú" htmlFor="vx-notes">
            <Textarea id="vx-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="VD: phản ứng sau tiêm…" />
          </Field>
          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}
        </form>
      </Modal>
    </>
  )
}
