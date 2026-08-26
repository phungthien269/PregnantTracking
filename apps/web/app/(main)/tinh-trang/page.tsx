'use client'

// ===========================================================================
// /tinh-trang — mô-đun "Tình trạng đặc biệt" thai kỳ (Phase 4A, mock mode).
// Khai báo tình trạng (typed) → lịch đo theo chỉ định bác sĩ (reminder) →
// nhật ký chỉ số + biểu đồ xu hướng → chỉ số ngoài mốc hiển thị ngữ cảnh +
// gợi ý trao đổi bác sĩ (KHÔNG kết luận đạt/không đạt, không cảnh báo khẩn).
// Mọi dữ liệu qua API route (server-side mock) → chạy đúng cả curl lẫn browser.
// ===========================================================================

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, Field, Input, Modal, Select, Textarea } from '@mevabe/ui'
import type {
  ConditionType,
  MaternalMeasurement,
  MeasurementType,
  Reminder,
} from '@mevabe/domain'
import { PageHeader } from '@/components/page-header'
import { SectionTabs, THAI_KY_TABS, SUC_KHOE_TABS } from '@/components/section-tabs'
import { LineChart } from '@/components/line-chart'
import {
  CONDITION_LABELS,
  CONDITION_METRICS,
  MEASUREMENT_LABELS,
  MEASUREMENT_UNITS,
} from '@/lib/labels'
import { fmtDayMonth, fmtDateTime, todayStr } from '@/lib/format'
import { checkMeasurement } from '@/lib/health/condition-thresholds'

const TIME_SLOTS = [
  { key: 'morning', label: 'Sáng', hour: 7 },
  { key: 'noon', label: 'Trưa', hour: 12 },
  { key: 'afternoon', label: 'Chiều', hour: 18 },
  { key: 'evening', label: 'Tối', hour: 21 },
] as const

const MEAL_TIMINGS = [
  { key: 'before', label: 'Trước ăn' },
  { key: 'after', label: 'Sau ăn' },
  { key: 'any', label: 'Không rõ' },
] as const

const FREQUENCIES = [
  { value: 'daily', label: 'Hằng ngày' },
  { value: 'weekly', label: 'Hằng tuần' },
] as const

interface SchedPayload {
  v?: number
  conditionType?: string
  measurementType?: string
  mealTiming?: string
}

function payloadOf(r: Reminder): SchedPayload | null {
  if (!r.payload) return null
  try {
    const p = JSON.parse(r.payload) as SchedPayload
    return p?.v === 1 ? p : null
  } catch {
    return null
  }
}

function schedulePayload(cond: string, mt: string, mealTiming: string): string {
  return JSON.stringify({ v: 1, conditionType: cond, measurementType: mt, mealTiming })
}

/** scheduled_at = hôm nay (HCM) tại giờ cố định, offset +07:00 — daily/weekly luôn "đến hạn" đúng dịp. */
function buildScheduledAt(hour: number): string {
  return `${todayStr()}T${String(hour).padStart(2, '0')}:00:00+07:00`
}

function journalType(cond: ConditionType): MeasurementType {
  return CONDITION_METRICS[cond][0]!.measurementType
}

interface SchedDraft {
  measurementType: MeasurementType
  frequency: 'daily' | 'weekly'
  timeSlot: string
  mealTiming: string
}

function schedDefault(cond: ConditionType): SchedDraft {
  const metric = CONDITION_METRICS[cond][0]!
  return {
    measurementType: metric.measurementType,
    frequency: metric.frequency,
    timeSlot: 'morning',
    mealTiming: 'before',
  }
}

export default function TinhTrangPage() {
  // ---- dữ liệu ----
  const [conditions, setConditions] = useState<ConditionType[]>([])
  const [doctorNotes, setDoctorNotes] = useState('')
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [measurements, setMeasurements] = useState<MaternalMeasurement[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [c, r, m] = await Promise.all([
      fetch('/api/v1/conditions').then((r2) => r2.json()),
      fetch('/api/v1/reminders').then((r2) => r2.json()),
      fetch('/api/v1/measurements').then((r2) => r2.json()),
    ])
    setConditions((c?.data?.conditions as ConditionType[]) ?? [])
    setDoctorNotes((c?.data?.doctor_instructions as string) ?? '')
    setReminders((r?.data as Reminder[]) ?? [])
    setMeasurements((m?.data as MaternalMeasurement[]) ?? [])
  }, [])

  useEffect(() => {
    load()
      .catch((e: unknown) => setLoadError(e instanceof Error ? e.message : 'Không tải được dữ liệu'))
      .finally(() => setLoading(false))
  }, [load])

  // ---- khai báo tình trạng ----
  const [showDeclare, setShowDeclare] = useState(false)
  const [draftDeclare, setDraftDeclare] = useState<ConditionType[]>([])
  const [draftNotes, setDraftNotes] = useState('')
  const [savingDeclare, setSavingDeclare] = useState(false)
  const [declareMsg, setDeclareMsg] = useState<string | null>(null)

  const openDeclare = () => {
    setDraftDeclare(conditions)
    setDraftNotes(doctorNotes)
    setDeclareMsg(null)
    setShowDeclare(true)
  }

  const toggleDraft = (c: ConditionType) => {
    setDraftDeclare((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  }

  const saveDeclare = async () => {
    setSavingDeclare(true)
    setDeclareMsg(null)
    try {
      const res = await fetch('/api/v1/conditions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conditions: draftDeclare, doctor_instructions: draftNotes.trim() || null }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.data) throw new Error(json?.error?.message ?? 'Lưu không thành công')
      setConditions(json.data.conditions)
      setDoctorNotes(json.data.doctor_instructions ?? '')
      setShowDeclare(false)
    } catch (e) {
      setDeclareMsg(e instanceof Error ? e.message : 'Lưu không thành công')
    } finally {
      setSavingDeclare(false)
    }
  }

  // ---- lịch đo (schedule) ----
  const [schedDraft, setSchedDraft] = useState<Record<string, SchedDraft>>({})
  const [savingSched, setSavingSched] = useState<string | null>(null)
  /** Thông báo theo từng tình trạng (tránh hiện sang card khác). */
  const [schedMsgs, setSchedMsgs] = useState<Record<string, { ok: boolean; text: string }>>({})

  const schedulesFor = useCallback(
    (cond: ConditionType) =>
      reminders
        .filter((r) => payloadOf(r)?.conditionType === cond)
        .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)),
    [reminders],
  )

  const createSchedule = async (cond: ConditionType) => {
    const draft = schedDraft[cond] ?? schedDefault(cond)
    const slot = TIME_SLOTS.find((t) => t.key === draft.timeSlot)
    const metric = CONDITION_METRICS[cond].find((m) => m.measurementType === draft.measurementType)
    const timing = MEAL_TIMINGS.find((t) => t.key === draft.mealTiming)
    setSavingSched(cond)
    setSchedMsgs((prev) => ({ ...prev, [cond]: { ok: true, text: '' } }))
    try {
      const title = metric
        ? `Đo ${metric.label.toLowerCase()} — ${CONDITION_LABELS[cond]}`
        : `Đo theo dõi — ${CONDITION_LABELS[cond]}`
      const res = await fetch('/api/v1/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          scheduled_at: buildScheduledAt(slot?.hour ?? 7),
          frequency: draft.frequency,
          payload: schedulePayload(cond, draft.measurementType, draft.mealTiming),
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.data) throw new Error(json?.error?.message ?? 'Tạo nhắc không thành công')
      setReminders((prev) => [json.data, ...prev])
      setSchedMsgs((prev) => ({
        ...prev,
        [cond]: {
          ok: true,
          text: `Đã tạo nhắc: "${title}" — ${draft.frequency === 'daily' ? 'mỗi ngày' : 'mỗi tuần'}${timing ? `, ${timing.label.toLowerCase()}` : ''}.`,
        },
      }))
    } catch (e) {
      setSchedMsgs((prev) => ({
        ...prev,
        [cond]: { ok: false, text: e instanceof Error ? e.message : 'Tạo nhắc không thành công' },
      }))
    } finally {
      setSavingSched(null)
    }
  }

  const toggleSchedule = async (id: string, active: boolean) => {
    const res = await fetch(`/api/v1/reminders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok || !json?.data) return
    setReminders((prev) => prev.map((r) => (r.id === id ? json.data : r)))
  }

  // ---- nhật ký chỉ số ----
  const [logDraft, setLogDraft] = useState<Record<string, { value: string; diastolic: string; takenAt: string; note: string }>>({})
  const [savingLog, setSavingLog] = useState<string | null>(null)
  /** Thông báo lỗi ghi chỉ số theo từng tình trạng. */
  const [logMsgs, setLogMsgs] = useState<Record<string, string>>({})

  const logEntry = (cond: ConditionType) =>
    logDraft[cond] ?? { value: '', diastolic: '', takenAt: '', note: '' }

  const setLog = (cond: ConditionType, patch: Partial<{ value: string; diastolic: string; takenAt: string; note: string }>) => {
    setLogDraft((prev) => ({ ...prev, [cond]: { ...logEntry(cond), ...patch } }))
  }

  const submitLog = async (cond: ConditionType) => {
    const mt = journalType(cond)
    const entry = logEntry(cond)
    const value = Number(entry.value)
    if (!Number.isFinite(value)) return
    setSavingLog(cond)
    setLogMsgs((prev) => ({ ...prev, [cond]: '' }))
    try {
      const body: Record<string, unknown> = {
        type: mt,
        value,
        unit: MEASUREMENT_UNITS[mt],
        taken_at: entry.takenAt ? new Date(entry.takenAt).toISOString() : new Date().toISOString(),
        note: entry.note.trim() || undefined,
      }
      if (mt === 'blood_pressure') {
        const dia = Number(entry.diastolic)
        if (Number.isFinite(dia)) body.diastolic = dia
      }
      const res = await fetch('/api/v1/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.data) throw new Error(json?.error?.message ?? 'Lưu chỉ số không thành công')
      setMeasurements((prev) => [...prev, json.data])
      setLogDraft((prev) => ({ ...prev, [cond]: { value: '', diastolic: '', takenAt: '', note: '' } }))
    } catch (e) {
      setLogMsgs((prev) => ({ ...prev, [cond]: e instanceof Error ? e.message : 'Lưu chỉ số không thành công' }))
    } finally {
      setSavingLog(null)
    }
  }

  // ---- bỏ khai báo tình trạng ----
  const [confirmRemove, setConfirmRemove] = useState<ConditionType | null>(null)
  const [removing, setRemoving] = useState(false)

  const removeCondition = async () => {
    if (!confirmRemove) return
    setRemoving(true)
    try {
      const next = conditions.filter((c) => c !== confirmRemove)
      const res = await fetch('/api/v1/conditions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conditions: next, doctor_instructions: doctorNotes.trim() || null }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.data) throw new Error(json?.error?.message ?? 'Không lưu được')
      // Tắt các lịch đo liên quan (giữ lịch sử, active=false).
      const related = schedulesFor(confirmRemove)
      await Promise.all(related.map((r) => fetch(`/api/v1/reminders/${r.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false }),
      })))
      setReminders((prev) => prev.map((r) => (related.some((x) => x.id === r.id) ? { ...r, active: false } : r)))
      setConditions(json.data.conditions)
      setDoctorNotes(json.data.doctor_instructions ?? '')
      setConfirmRemove(null)
    } catch (e) {
      setDeclareMsg(e instanceof Error ? e.message : 'Không lưu được')
    } finally {
      setRemoving(false)
    }
  }

  const outOfRangeRows = useMemo(() => {
    const counts: Record<ConditionType, MaternalMeasurement[]> = {} as Record<ConditionType, MaternalMeasurement[]>
    for (const cond of conditions) {
      const mt = journalType(cond)
      counts[cond] = measurements
        .filter((m) => m.type === mt && checkMeasurement(mt, m.value, m.diastolic ?? undefined))
        .sort((a, b) => b.taken_at.localeCompare(a.taken_at))
    }
    return counts
  }, [conditions, measurements])

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tình trạng" description="Đang tải…" />
        <SectionTabs tabs={THAI_KY_TABS} />
        <SectionTabs tabs={SUC_KHOE_TABS} />
        <Card>
          <p className="text-sm text-muted">Đang tải dữ liệu…</p>
        </Card>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tình trạng" description="Không tải được dữ liệu." />
        <SectionTabs tabs={THAI_KY_TABS} />
        <SectionTabs tabs={SUC_KHOE_TABS} />
        <Card>
          <p className="text-sm text-danger" role="alert">
            {loadError}
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tình trạng đặc biệt"
        description="Khai báo tình trạng để bật mô-đun theo dõi, lịch đo theo chỉ định bác sĩ và nhật ký chỉ số."
        action={
          <Button size="sm" onClick={openDeclare}>
            {conditions.length ? 'Thêm / sửa tình trạng' : 'Khai báo tình trạng'}
          </Button>
        }
      />
      <SectionTabs tabs={THAI_KY_TABS} />
      <SectionTabs tabs={SUC_KHOE_TABS} />

      {declareMsg && (
        <p className="rounded-md border border-border bg-surface p-3 text-sm text-danger" role="alert">
          {declareMsg}
        </p>
      )}

      {conditions.length === 0 ? (
        <Card title="Chưa khai báo tình trạng nào" description="Bắt đầu bằng việc khai báo tình trạng mẹ được bác sĩ chẩn đoán / cần theo dõi.">
          <div className="rounded-lg border border-dashed border-border bg-surface-muted p-6 text-center text-sm text-muted">
            <p>
              Khi khai báo, mô-đun tương ứng sẽ tự bật: gợi ý chỉ số cần đo, tạo nhắc đo theo lịch bác sĩ,
              và nhật ký xu hướng kèm mốc tham khảo.
            </p>
            <div className="mt-4">
              <Button size="sm" onClick={openDeclare}>
                Khai báo tình trạng
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {doctorNotes && (
            <Card title="Chỉ định của bác sĩ">
              <p className="whitespace-pre-wrap text-sm text-fg">{doctorNotes}</p>
            </Card>
          )}

          {conditions.map((cond) => {
            const mt = journalType(cond)
            const rows = measurements
              .filter((m) => m.type === mt)
              .sort((a, b) => a.taken_at.localeCompare(b.taken_at))
            const points = rows.map((m) => ({ label: fmtDayMonth(m.taken_at), value: m.value }))
            const outOfRange = outOfRangeRows[cond] ?? []
            const schedules = schedulesFor(cond)
            const draft = schedDraft[cond] ?? schedDefault(cond)
            return (
              <Card
                key={cond}
                title={CONDITION_LABELS[cond]}
                description={`Theo dõi chỉ số: ${MEASUREMENT_LABELS[mt]}`}
                action={
                  <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(cond)}>
                    Ngừng theo dõi
                  </Button>
                }
              >
                <div className="space-y-5">
                  {/* ---- lịch đo theo chỉ định bác sĩ ---- */}
                  <div className="rounded-md border border-border bg-surface-muted p-3">
                    <p className="mb-2 text-sm font-medium text-fg">Lịch đo theo chỉ định bác sĩ</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      <Field label="Chỉ số" htmlFor={`sched-mt-${cond}`}>
                        <Select
                          id={`sched-mt-${cond}`}
                          value={draft.measurementType}
                          onChange={(e) =>
                            setSchedDraft((prev) => ({
                              ...prev,
                              [cond]: { ...draft, measurementType: e.target.value as MeasurementType },
                            }))
                          }
                        >
                          {CONDITION_METRICS[cond].map((m) => (
                            <option key={m.measurementType} value={m.measurementType}>
                              {m.label} ({m.unit})
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Tần suất" htmlFor={`sched-freq-${cond}`}>
                        <Select
                          id={`sched-freq-${cond}`}
                          value={draft.frequency}
                          onChange={(e) =>
                            setSchedDraft((prev) => ({
                              ...prev,
                              [cond]: { ...draft, frequency: e.target.value as 'daily' | 'weekly' },
                            }))
                          }
                        >
                          {FREQUENCIES.map((f) => (
                            <option key={f.value} value={f.value}>
                              {f.label}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Thời điểm" htmlFor={`sched-time-${cond}`}>
                        <Select
                          id={`sched-time-${cond}`}
                          value={draft.timeSlot}
                          onChange={(e) =>
                            setSchedDraft((prev) => ({ ...prev, [cond]: { ...draft, timeSlot: e.target.value } }))
                          }
                        >
                          {TIME_SLOTS.map((t) => (
                            <option key={t.key} value={t.key}>
                              {t.label} ({String(t.hour).padStart(2, '0')}:00)
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Liên quan bữa ăn" htmlFor={`sched-meal-${cond}`}>
                        <Select
                          id={`sched-meal-${cond}`}
                          value={draft.mealTiming}
                          onChange={(e) =>
                            setSchedDraft((prev) => ({ ...prev, [cond]: { ...draft, mealTiming: e.target.value } }))
                          }
                        >
                          {MEAL_TIMINGS.map((t) => (
                            <option key={t.key} value={t.key}>
                              {t.label}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <div className="flex items-end">
                        <Button
                          size="sm"
                          className="w-full"
                          disabled={savingSched === cond}
                          onClick={() => createSchedule(cond)}
                        >
                          {savingSched === cond ? 'Đang tạo…' : 'Tạo nhắc đo'}
                        </Button>
                      </div>
                    </div>
                    {schedules.length > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {schedules.map((r) => {
                          const p = payloadOf(r)
                          const timing = MEAL_TIMINGS.find((t) => t.key === p?.mealTiming)
                          return (
                            <li key={r.id} className="flex items-center justify-between gap-3 text-sm">
                              <span className={r.active ? 'text-fg' : 'text-muted line-through'}>
                                {r.title}
                                <span className="ml-2 text-xs text-muted">
                                  {r.frequency === 'daily' ? 'mỗi ngày' : 'mỗi tuần'}
                                  {timing && timing.key !== 'any' ? ` · ${timing.label.toLowerCase()}` : ''}
                                </span>
                              </span>
                              <span className="flex items-center gap-2">
                                <Badge tone={r.active ? 'success' : 'neutral'}>
                                  {r.active ? 'Đang bật' : 'Đã tắt'}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleSchedule(r.id, !r.active)}
                                >
                                  {r.active ? 'Tắt' : 'Bật'}
                                </Button>
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                    {schedMsgs[cond]?.text && (
                      <p
                        className={`mt-2 text-xs ${schedMsgs[cond].ok ? 'text-success' : 'text-danger'}`}
                        role={schedMsgs[cond].ok ? 'status' : 'alert'}
                      >
                        {schedMsgs[cond].text}
                      </p>
                    )}
                  </div>

                  {/* ---- nhật ký + biểu đồ ---- */}
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-fg">Nhật ký {MEASUREMENT_LABELS[mt].toLowerCase()}</p>
                      {outOfRange.length > 0 && (
                        <Badge tone="warning">Có chỉ số ngoài mốc tham khảo</Badge>
                      )}
                    </div>

                    {points.length >= 2 && <LineChart data={points} yUnit={` ${MEASUREMENT_UNITS[mt]}`.trim()} />}

                    {/* form ghi nhanh */}
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Field label={`Giá trị (${MEASUREMENT_UNITS[mt] || '—'})`} htmlFor={`log-v-${cond}`}>
                        <Input
                          id={`log-v-${cond}`}
                          type="number"
                          step="any"
                          inputMode="decimal"
                          value={logEntry(cond).value}
                          onChange={(e) => setLog(cond, { value: e.target.value })}
                          placeholder={mt === 'blood_pressure' ? 'Tâm thu (VD 120)' : 'VD 5.2'}
                        />
                      </Field>
                      {mt === 'blood_pressure' && (
                        <Field label="Tâm trương (mmHg)" htmlFor={`log-d-${cond}`}>
                          <Input
                            id={`log-d-${cond}`}
                            type="number"
                            step="any"
                            inputMode="decimal"
                            value={logEntry(cond).diastolic}
                            onChange={(e) => setLog(cond, { diastolic: e.target.value })}
                            placeholder="VD 80"
                          />
                        </Field>
                      )}
                      <Field label="Thời điểm đo" htmlFor={`log-t-${cond}`}>
                        <Input
                          id={`log-t-${cond}`}
                          type="datetime-local"
                          value={logEntry(cond).takenAt}
                          onChange={(e) => setLog(cond, { takenAt: e.target.value })}
                        />
                      </Field>
                      <div className="flex items-end gap-2">
                        <Button
                          size="sm"
                          className="w-full"
                          disabled={!logEntry(cond).value || savingLog === cond}
                          onClick={() => submitLog(cond)}
                        >
                          {savingLog === cond ? 'Đang lưu…' : 'Ghi chỉ số'}
                        </Button>
                      </div>
                    </div>
                    {logMsgs[cond] && (
                      <p className="mt-2 text-xs text-danger" role="alert">
                        {logMsgs[cond]}
                      </p>
                    )}

                    {/* danh sách chỉ số + ngữ cảnh ngoài mốc */}
                    {rows.length > 0 ? (
                      <ul className="mt-3 divide-y divide-border">
                        {rows
                          .slice(-8)
                          .reverse()
                          .map((m) => {
                            const rule = checkMeasurement(mt, m.value, m.diastolic ?? undefined)
                            return (
                              <li key={m.id} className="py-2">
                                <div className="flex items-center justify-between gap-3 text-sm">
                                  <span className="text-fg">
                                    {mt === 'blood_pressure' && m.diastolic != null
                                      ? `${m.value}/${m.diastolic} ${m.unit}`
                                      : `${m.value} ${m.unit}`}
                                    {m.note && <span className="ml-2 text-xs text-muted">— {m.note}</span>}
                                    {rule && (
                                      <Badge tone="warning" className="ml-2">
                                        Ngoài mốc tham khảo
                                      </Badge>
                                    )}
                                  </span>
                                  <span className="shrink-0 text-xs text-muted">{fmtDateTime(m.taken_at)}</span>
                                </div>
                                {rule && (
                                  <p className="mt-1 rounded-md bg-warning/10 px-2 py-1 text-xs text-fg">
                                    {rule.context}. Nên trao đổi với bác sĩ.
                                    <span className="block text-muted">{rule.reference}</span>
                                  </p>
                                )}
                              </li>
                            )
                          })}
                      </ul>
                    ) : (
                      <p className="mt-3 rounded-md border border-dashed border-border p-3 text-center text-xs text-muted">
                        Chưa có chỉ số {MEASUREMENT_LABELS[mt].toLowerCase()} nào — dùng form trên để ghi lần đầu.
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </>
      )}

      {/* ---- modal khai báo ---- */}
      <Modal
        open={showDeclare}
        onClose={() => setShowDeclare(false)}
        title="Khai báo tình trạng"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeclare(false)}>
              Hủy
            </Button>
            <Button onClick={saveDeclare} disabled={savingDeclare}>
              {savingDeclare ? 'Đang lưu…' : 'Lưu'}
            </Button>
          </>
        }
      >
        <p className="mb-3 text-xs text-muted">
          Chọn các tình trạng mẹ được theo dõi. Mô-đun tương ứng tự bật — gợi ý chỉ số đo và lịch nhắc.
        </p>
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium text-fg">Tình trạng</legend>
          {CONDITION_METRICS_LABELS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-fg has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
              <input
                type="checkbox"
                checked={draftDeclare.includes(value)}
                onChange={() => toggleDraft(value)}
                className="h-4 w-4 accent-[var(--mv-primary)]"
              />
              {label}
            </label>
          ))}
        </fieldset>
        <div className="mt-4">
          <Field
            label="Chỉ định của bác sĩ (ghi chú)"
            htmlFor="declare-notes"
            hint="VD: Đo đường huyết đói mỗi sáng; nhập viện nếu huyết áp ≥ 160/110…"
          >
            <Textarea
              id="declare-notes"
              rows={3}
              value={draftNotes}
              onChange={(e) => setDraftNotes(e.target.value)}
              placeholder="Ghi chú theo lời bác sĩ…"
            />
          </Field>
        </div>
        {declareMsg && (
          <p className="mt-3 text-sm text-danger" role="alert">
            {declareMsg}
          </p>
        )}
      </Modal>

      {/* ---- modal ngừng theo dõi ---- */}
      <Modal
        open={confirmRemove !== null}
        onClose={() => setConfirmRemove(null)}
        title="Ngừng theo dõi tình trạng?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmRemove(null)}>
              Hủy
            </Button>
            <Button variant="danger" onClick={removeCondition} disabled={removing}>
              {removing ? 'Đang xử lý…' : 'Ngừng theo dõi'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-fg">
          Bỏ khai báo <strong>{confirmRemove ? CONDITION_LABELS[confirmRemove] : ''}</strong>.
        </p>
        <p className="mt-2 text-sm text-muted">
          Các lịch đo liên quan sẽ được tắt (có thể bật lại sau). Dữ liệu nhật ký đã ghi vẫn được giữ.
        </p>
      </Modal>
    </div>
  )
}

/** Danh sách 7 tình trạng để hiển thị trong modal khai báo. */
const CONDITION_METRICS_LABELS = Object.entries(CONDITION_LABELS).map(([value, label]) => ({
  value: value as ConditionType,
  label,
}))
