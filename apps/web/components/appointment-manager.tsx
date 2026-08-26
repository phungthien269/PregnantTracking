'use client'

import { useState } from 'react'
import { data } from '@/lib/data/client-entry'
import { APPOINTMENT_LABELS, APPOINTMENT_OPTIONS } from '@/lib/labels'
import { fmtDateTime } from '@/lib/format'
import { apiErrorMessage } from '@/lib/api-error'
import { fromLocalInput, toLocalInput } from '@/lib/appointment-datetime'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
} from '@mevabe/ui'
import type { Appointment, AppointmentType } from '@mevabe/domain'

interface FormState {
  type: AppointmentType
  scheduled_at: string
  location: string
  doctor: string
  summary_before: string
  outcome: string
  prescription: string
  tasks_after: string[]
  followup_at: string
}

type ModalState =
  | { kind: 'add' }
  | { kind: 'edit'; id: string; showPost: boolean }
  | null

const emptyForm = (): FormState => ({
  type: 'prenatal',
  scheduled_at: '',
  location: '',
  doctor: '',
  summary_before: '',
  outcome: '',
  prescription: '',
  tasks_after: [],
  followup_at: '',
})

export function AppointmentManager({ initial }: { initial: Appointment[] }) {
  const [appointments, setAppointments] = useState<Appointment[]>(initial)
  const [modal, setModal] = useState<ModalState>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const now = Date.now()
  const upcoming = appointments
    .filter((a) => new Date(a.scheduled_at).getTime() >= now)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
  const past = appointments
    .filter((a) => new Date(a.scheduled_at).getTime() < now)
    .sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at))

  // Các mốc thời gian được hẹn tái khám → đánh dấu lịch tương ứng là "Tái khám".
  const followupTargets = new Set<number>()
  for (const a of appointments) if (a.followup_at) followupTargets.add(new Date(a.followup_at).getTime())
  const isFollowup = (a: Appointment) => followupTargets.has(new Date(a.scheduled_at).getTime())

  const openAdd = () => {
    setForm(emptyForm())
    setError('')
    setModal({ kind: 'add' })
  }

  const openEdit = (a: Appointment, showPost: boolean) => {
    setForm({
      type: a.type,
      scheduled_at: toLocalInput(a.scheduled_at),
      location: a.location ?? '',
      doctor: a.doctor ?? '',
      summary_before: a.summary_before ?? '',
      outcome: a.outcome ?? '',
      prescription: a.prescription ?? '',
      tasks_after: a.tasks_after ? [...a.tasks_after] : [],
      followup_at: a.followup_at ? toLocalInput(a.followup_at) : '',
    })
    setError('')
    setModal({ kind: 'edit', id: a.id, showPost })
  }

  const setField = (key: keyof FormState, value: string | string[]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const setTask = (i: number, v: string) =>
    setForm((f) => {
      const t = [...f.tasks_after]
      t[i] = v
      return { ...f, tasks_after: t }
    })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.scheduled_at) {
      setError('Vui lòng chọn ngày giờ khám.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const base = {
        type: form.type,
        scheduled_at: fromLocalInput(form.scheduled_at),
        location: form.location.trim() || null,
        doctor: form.doctor.trim() || null,
        summary_before: form.summary_before.trim() || null,
      }
      if (modal?.kind === 'add') {
        const created = await data.addAppointment(base)
        setAppointments((prev) => [...prev, created])
      } else if (modal?.kind === 'edit') {
        const updated = await data.updateAppointment(modal.id, {
          ...base,
          outcome: form.outcome.trim() || null,
          prescription: form.prescription.trim() || null,
          tasks_after: form.tasks_after.map((t) => t.trim()).filter(Boolean),
          followup_at: form.followup_at ? fromLocalInput(form.followup_at) : null,
        })
        setAppointments((prev) => prev.map((a) => (a.id === modal.id ? updated : a)))
      }
      setModal(null)
    } catch (err) {
      setError(apiErrorMessage(err, 'Không lưu được lịch khám. Thử lại.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card
        title="Thêm lịch khám"
        description="Ghi trước buổi khám: loại khám, ngày giờ, nơi khám, bác sĩ và câu hỏi cần hỏi."
        action={
          <Button size="sm" onClick={openAdd}>
            + Thêm lịch
          </Button>
        }
      >
        <p className="text-xs text-muted">
          Lịch khám hôm nay sẽ tự xuất hiện trong mục Thông báo (bản tin sáng).
        </p>
      </Card>

      <Card title="Sắp tới" description="Chuẩn bị: tóm tắt triệu chứng, các chỉ số gần nhất và câu hỏi cần hỏi bác sĩ.">
        {upcoming.length ? (
          <ul className="divide-y divide-border">
            {upcoming.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="primary">{APPOINTMENT_LABELS[a.type]}</Badge>
                    {isFollowup(a) && <Badge tone="accent">Tái khám</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-fg">{fmtDateTime(a.scheduled_at)}</p>
                  {(a.location || a.doctor) && (
                    <p className="text-xs text-muted">
                      {[a.doctor, a.location].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {a.summary_before && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted">📝 {a.summary_before}</p>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => openEdit(a, false)}>
                  Sửa
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Chưa có lịch sắp tới" description="Thêm lịch khám đầu tiên bằng nút phía trên." />
        )}
      </Card>

      <Card title="Đã qua" description="Sau khám: ghi kết luận, đơn thuốc và việc cần làm để tiện theo dõi.">
        {past.length ? (
          <ul className="divide-y divide-border">
            {past.map((a) => (
              <li key={a.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="neutral">{APPOINTMENT_LABELS[a.type]}</Badge>
                      {a.followup_at && <Badge tone="accent">Đã hẹn tái khám</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-fg">{fmtDateTime(a.scheduled_at)}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(a, true)}>
                    {a.outcome || a.prescription || a.tasks_after?.length ? 'Sửa kết quả' : 'Ghi kết quả'}
                  </Button>
                </div>
                {a.outcome && <p className="mt-1 text-sm text-fg">💬 {a.outcome}</p>}
                {a.prescription && <p className="mt-1 text-xs text-muted">💊 {a.prescription}</p>}
                {a.tasks_after && a.tasks_after.length > 0 && (
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-muted">
                    {a.tasks_after.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                )}
                {a.followup_at && (
                  <p className="mt-1 text-xs text-muted">Hẹn tái khám: {fmtDateTime(a.followup_at)}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Chưa có lịch đã qua" description="Kết quả khám sẽ hiển thị tại đây sau buổi khám." />
        )}
      </Card>

      <div className="flex items-center gap-2">
        <Badge tone="primary">Mẹo</Badge>
        <p className="text-sm text-muted">Mang theo sổ khám và giấy tờ siêu âm gần nhất.</p>
      </div>

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal?.kind === 'add' ? 'Thêm lịch khám' : 'Chi tiết buổi khám'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)} disabled={saving}>
              Hủy
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? 'Đang lưu…' : 'Lưu'}
            </Button>
          </>
        }
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Loại khám" htmlFor="appt-type">
              <Select
                id="appt-type"
                value={form.type}
                onChange={(e) => setField('type', e.target.value as AppointmentType)}
              >
                {APPOINTMENT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Ngày giờ khám" htmlFor="appt-scheduled">
              <Input
                id="appt-scheduled"
                type="datetime-local"
                required
                value={form.scheduled_at}
                onChange={(e) => setField('scheduled_at', e.target.value)}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nơi khám" htmlFor="appt-location">
              <Input
                id="appt-location"
                value={form.location}
                onChange={(e) => setField('location', e.target.value)}
                placeholder="VD: Bệnh viện Từ Dũ"
              />
            </Field>
            <Field label="Bác sĩ" htmlFor="appt-doctor">
              <Input
                id="appt-doctor"
                value={form.doctor}
                onChange={(e) => setField('doctor', e.target.value)}
                placeholder="VD: BS. Nguyễn Thị Hoa"
              />
            </Field>
          </div>
          <Field label="Tình trạng / câu hỏi trước khám" htmlFor="appt-summary">
            <Textarea
              id="appt-summary"
              value={form.summary_before}
              onChange={(e) => setField('summary_before', e.target.value)}
              placeholder="Triệu chứng đang gặp, chỉ số gần nhất, câu hỏi cần hỏi bác sĩ…"
            />
          </Field>

          {modal?.kind === 'edit' && modal.showPost && (
            <div className="space-y-4 rounded-md bg-surface-muted p-3">
              <p className="text-xs font-medium text-fg">Sau buổi khám</p>
              <Field label="Kết luận của bác sĩ" htmlFor="appt-outcome">
                <Textarea
                  id="appt-outcome"
                  value={form.outcome}
                  onChange={(e) => setField('outcome', e.target.value)}
                  placeholder="Kết luận, chẩn đoán, lưu ý…"
                />
              </Field>
              <Field label="Đơn thuốc" htmlFor="appt-prescription">
                <Textarea
                  id="appt-prescription"
                  value={form.prescription}
                  onChange={(e) => setField('prescription', e.target.value)}
                  placeholder="VD: Sắt 60mg/ngày, Canxi 500mg/ngày…"
                />
              </Field>
              <Field label="Việc cần làm sau khám">
                <div className="space-y-2">
                  {form.tasks_after.map((t, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        value={t}
                        onChange={(e) => setTask(i, e.target.value)}
                        placeholder={`Việc ${i + 1}`}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={() => setField('tasks_after', form.tasks_after.filter((_, j) => j !== i))}
                        aria-label="Xóa việc này"
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                  <Button variant="soft" size="sm" type="button" onClick={() => setField('tasks_after', [...form.tasks_after, ''])}>
                    + Thêm việc cần làm
                  </Button>
                </div>
              </Field>
              <Field label="Hẹn tái khám" htmlFor="appt-followup" hint="Bỏ trống nếu chưa hẹn.">
                <Input
                  id="appt-followup"
                  type="datetime-local"
                  value={form.followup_at}
                  onChange={(e) => setField('followup_at', e.target.value)}
                />
              </Field>
            </div>
          )}

          {error && (
            <p className="text-xs text-danger" role="alert">
              {error}
            </p>
          )}
        </form>
      </Modal>
    </div>
  )
}
