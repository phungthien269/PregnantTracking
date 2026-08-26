'use client'

// Phần client của trang /nhap-lieu (Hồ sơ sức khỏe + Import triệu chứng).
// Page là server component (app/(main)/nhap-lieu/page.tsx), phần tương tác nằm đây.
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge, Button, Card, Field, Input, Select, Textarea } from '@mevabe/ui'
import type { BloodType, HealthProfile, SymptomSeverity } from '@mevabe/domain'
import { SEVERITY_LABELS } from '@/lib/labels'
import { apiErrorMessage } from '@/lib/api-error'
import { fmtDate } from '@/lib/format'
import { parseSymptoms, type ParseResult } from '@/lib/import/parse'

// ---- hồ sơ: nhãn nhóm máu (A/B/AB/O + Rh) ----
const BLOOD_OPTIONS: { value: BloodType; label: string }[] = [
  { value: 'A+', label: 'Nhóm A Rh+' },
  { value: 'A-', label: 'Nhóm A Rh−' },
  { value: 'B+', label: 'Nhóm B Rh+' },
  { value: 'B-', label: 'Nhóm B Rh−' },
  { value: 'AB+', label: 'Nhóm AB Rh+' },
  { value: 'AB-', label: 'Nhóm AB Rh−' },
  { value: 'O+', label: 'Nhóm O Rh+' },
  { value: 'O-', label: 'Nhóm O Rh−' },
  { value: 'unknown', label: 'Chưa rõ' },
]

function bloodLabel(v: string): string {
  return BLOOD_OPTIONS.find((o) => o.value === v)?.label ?? v
}

const severityTone = (s: SymptomSeverity) =>
  s === 'severe' ? ('danger' as const) : s === 'moderate' ? ('warning' as const) : ('neutral' as const)

/** Nhập tag nhiều giá trị: input + Thêm (Enter) + chip xoá được. */
function TagInput({
  id,
  values,
  onChange,
  placeholder,
}: {
  id: string
  values: string[]
  onChange: (v: string[]) => void
  placeholder?: string
}) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const t = draft.trim()
    if (t && !values.includes(t)) onChange([...values, t])
    setDraft('')
  }
  return (
    <div>
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder={placeholder}
          aria-describedby={values.length ? `${id}-list` : undefined}
        />
        <Button type="button" variant="secondary" size="sm" onClick={add} disabled={!draft.trim()}>
          Thêm
        </Button>
      </div>
      {values.length > 0 && (
        <ul id={`${id}-list`} className="mt-2 flex flex-wrap gap-1.5">
          {values.map((v) => (
            <li key={v}>
              <Badge tone="accent" className="pr-1">
                {v}
                <button
                  type="button"
                  onClick={() => onChange(values.filter((x) => x !== v))}
                  aria-label={`Xóa ${v}`}
                  className="ml-1 rounded-full px-1 hover:bg-danger/20 focus-visible:outline-2 focus-visible:outline-primary"
                >
                  ✕
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function NhapLieuClient() {
  const router = useRouter()

  // ---- hồ sơ sức khỏe ----
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [bloodType, setBloodType] = useState<BloodType | ''>('')
  const [allergies, setAllergies] = useState<string[]>([])
  const [conditions, setConditions] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileNote, setProfileNote] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [savedProfile, setSavedProfile] = useState<HealthProfile | null>(null)

  // ---- triệu chứng ----
  const [symText, setSymText] = useState('')
  const [parsed, setParsed] = useState<ParseResult>({ ok: false, items: [], errors: [] })
  const [savingSyms, setSavingSyms] = useState(false)
  const [symNote, setSymNote] = useState<string | null>(null)
  const [symError, setSymError] = useState<string | null>(null)

  const onSymTextChange = (v: string) => {
    setSymText(v)
    setParsed(parseSymptoms(v))
    setSymNote(null)
    setSymError(null)
  }

  const profilePayload = (): Record<string, unknown> => {
    const p: Record<string, unknown> = {}
    const h = Number(height)
    if (height.trim() !== '' && !isNaN(h) && h > 0) p.height_cm = h
    const w = Number(weight)
    if (weight.trim() !== '' && !isNaN(w) && w > 0) p.pre_pregnancy_weight_kg = w
    if (bloodType) p.blood_type = bloodType
    if (allergies.length) p.allergies = allergies
    if (conditions.length) p.preexisting_conditions = conditions
    if (notes.trim() !== '') p.notes = notes.trim()
    return p
  }

  const saveProfile = async () => {
    if (savingProfile) return
    const payload = profilePayload()
    if (Object.keys(payload).length === 0) return
    setSavingProfile(true)
    setProfileError(null)
    setProfileNote(null)
    try {
      const res = await fetch('/api/v1/import/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.data) throw json
      setSavedProfile(json.data as HealthProfile)
      setProfileNote('Đã lưu hồ sơ sức khỏe.')
      router.refresh()
    } catch (err) {
      setProfileError(apiErrorMessage(err, 'Lưu hồ sơ chưa thành công. Vui lòng thử lại.'))
    } finally {
      setSavingProfile(false)
    }
  }

  const saveSymptoms = async () => {
    if (savingSyms || parsed.items.length === 0) return
    setSavingSyms(true)
    setSymError(null)
    setSymNote(null)
    try {
      const res = await fetch('/api/v1/import/symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: parsed.items }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.data) throw json
      const created = (json.data as { created: number }).created
      setSymNote(`Đã lưu ${created} triệu chứng vào nhật ký. AI và trang Triệu chứng sẽ đọc được.`)
      setSymText('')
      setParsed({ ok: false, items: [], errors: [] })
      router.refresh()
    } catch (err) {
      setSymError(apiErrorMessage(err, 'Lưu triệu chứng chưa thành công. Vui lòng thử lại.'))
    } finally {
      setSavingSyms(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ===================== Hồ sơ sức khỏe ===================== */}
      <Card
        title="Thông tin cá nhân"
        description="Chiều cao, cân nặng trước mang thai, nhóm máu, dị ứng và bệnh lý nền — lưu vào hồ sơ sức khỏe để AI hiểu rõ hơn."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Chiều cao (cm)" htmlFor="imp-height" hint="VD: 158">
            <Input
              id="imp-height"
              type="number"
              min={80}
              max={230}
              inputMode="decimal"
              value={height}
              onChange={(e) => {
                setHeight(e.target.value)
                setProfileNote(null)
              }}
              placeholder="158"
            />
          </Field>
          <Field label="Cân nặng trước mang thai (kg)" htmlFor="imp-weight" hint="VD: 52">
            <Input
              id="imp-weight"
              type="number"
              min={30}
              max={200}
              inputMode="decimal"
              value={weight}
              onChange={(e) => {
                setWeight(e.target.value)
                setProfileNote(null)
              }}
              placeholder="52"
            />
          </Field>
          <Field label="Nhóm máu" htmlFor="imp-blood">
            <Select
              id="imp-blood"
              value={bloodType}
              onChange={(e) => {
                setBloodType(e.target.value as BloodType | '')
                setProfileNote(null)
              }}
            >
              <option value="">Chọn nhóm máu…</option>
              {BLOOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <div />
          <Field label="Dị ứng" htmlFor="imp-allergies" hint="Nhập từng mục rồi bấm Thêm — VD: Hải sản, đậu phộng.">
            <TagInput
              id="imp-allergies"
              values={allergies}
              onChange={(v) => {
                setAllergies(v)
                setProfileNote(null)
              }}
              placeholder="VD: Hải sản"
            />
          </Field>
          <Field label="Bệnh lý nền" htmlFor="imp-conditions" hint="Nhập từng mục rồi bấm Thêm — VD: Thiếu máu nhẹ, tiểu đường thai kỳ.">
            <TagInput
              id="imp-conditions"
              values={conditions}
              onChange={(v) => {
                setConditions(v)
                setProfileNote(null)
              }}
              placeholder="VD: Thiếu máu nhẹ"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Ghi chú sức khỏe" htmlFor="imp-notes" hint="VD: Tăng cân ít, hay hoa mắt buổi sáng.">
              <Textarea
                id="imp-notes"
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value)
                  setProfileNote(null)
                }}
                rows={3}
                placeholder="Ghi chú thêm cho bác sĩ / AI…"
              />
            </Field>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={saveProfile} disabled={savingProfile || Object.keys(profilePayload()).length === 0}>
            {savingProfile ? 'Đang lưu…' : 'Lưu hồ sơ'}
          </Button>
          {profileNote && (
            <p className="text-sm text-success" role="status">
              {profileNote}
            </p>
          )}
          {profileError && (
            <p className="text-sm text-danger" role="alert">
              {profileError}
            </p>
          )}
        </div>

        {savedProfile && (
          <div className="mt-5 rounded-md border border-border bg-surface-muted p-3 text-sm">
            <p className="mb-2 font-medium text-fg">Hồ sơ đã lưu</p>
            <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Chiều cao</dt>
                <dd className="text-fg">{savedProfile.height_cm ? `${savedProfile.height_cm} cm` : '—'}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Cân nặng trước thai</dt>
                <dd className="text-fg">
                  {savedProfile.pre_pregnancy_weight_kg ? `${savedProfile.pre_pregnancy_weight_kg} kg` : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Nhóm máu</dt>
                <dd className="text-fg">{bloodLabel(savedProfile.blood_type)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted">Dị ứng</dt>
                <dd className="text-fg">{savedProfile.allergies.length ? savedProfile.allergies.join(', ') : 'Không có'}</dd>
              </div>
              <div className="flex justify-between gap-2 sm:col-span-2">
                <dt className="text-muted">Bệnh lý nền</dt>
                <dd className="text-fg">
                  {savedProfile.preexisting_conditions.length ? savedProfile.preexisting_conditions.join(', ') : 'Không có'}
                </dd>
              </div>
              {savedProfile.notes && (
                <div className="flex justify-between gap-2 sm:col-span-2">
                  <dt className="text-muted">Ghi chú</dt>
                  <dd className="text-fg">{savedProfile.notes}</dd>
                </div>
              )}
            </dl>
            <p className="mt-2 text-xs text-muted">Dữ liệu đã lưu vào hồ sơ sức khỏe phía máy chủ.</p>
          </div>
        )}
      </Card>

      {/* ===================== Import triệu chứng ===================== */}
      <Card
        title="Import triệu chứng hàng loạt"
        description="Dán danh sách để đồng bộ vào nhật ký — AI phân tích và Hỏi AI sẽ tự đọc được."
      >
        <Field
          label="Danh sách triệu chứng"
          htmlFor="imp-symptoms"
          hint="Mỗi dòng: Tên triệu chứng hoặc Tên triệu chứng | mức | ngày (mức: nhẹ/vừa/nặng · ngày: YYYY-MM-DD hoặc dd/mm). Hoặc dán mảng JSON, vd [ symptom: Đau đầu, severity: nhẹ, started_at: 2026-08-01 ]."
        >
          <Textarea
            id="imp-symptoms"
            value={symText}
            onChange={(e) => onSymTextChange(e.target.value)}
            rows={6}
            placeholder={
              'VD:\nỐm nghén | nhẹ | 2026-08-01\nĐau lưng | vừa\nChuột rút chân | nặng | 04/08\n\nHoặc dán mảng JSON:\n[{"symptom":"Buồn nôn","severity":"moderate","started_at":"2026-07-30"}]'
            }
          />
        </Field>

        {symText.trim() !== '' && parsed.items.length === 0 && parsed.errors.length === 0 && (
          <p className="mt-2 text-sm text-muted">Chưa nhận diện được triệu chứng nào.</p>
        )}

        {parsed.items.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-fg">Xem trước ({parsed.items.length})</p>
            <div className="mt-2 overflow-x-auto rounded-md border border-border">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Danh sách triệu chứng sẽ lưu</caption>
                <thead className="bg-surface-muted text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-medium">
                      Triệu chứng
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium">
                      Mức
                    </th>
                    <th scope="col" className="px-3 py-2 font-medium">
                      Bắt đầu
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parsed.items.map((it, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-fg">
                        {it.symptom}
                        {it.note && <span className="block text-xs text-muted">{it.note}</span>}
                      </td>
                      <td className="px-3 py-2">
                        <Badge tone={severityTone(it.severity)}>{SEVERITY_LABELS[it.severity]}</Badge>
                      </td>
                      <td className="px-3 py-2 text-muted">{fmtDate(it.started_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {parsed.errors.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs text-danger" role="alert">
            {parsed.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={saveSymptoms} disabled={savingSyms || parsed.items.length === 0}>
            {savingSyms ? 'Đang lưu…' : 'Lưu triệu chứng'}
          </Button>
          {symNote && (
            <p className="text-sm text-success" role="status">
              {symNote}
            </p>
          )}
          {symError && (
            <p className="text-sm text-danger" role="alert">
              {symError}
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
