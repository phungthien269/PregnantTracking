'use client'

// ===========================================================================
// Theo dõi dinh dưỡng hằng ngày (Agent 6J) — UI client.
// Nhập bữa ăn (chọn từ MEALS/FOODS hoặc mô tả tự do) + thực phẩm chức năng;
// tổng vi chất hôm nay so nhu cầu tuần thai; lịch sử gần đây.
// Gọi qua `data` (client-entry → proxy fetch /api/v1) — route server tính vi chất
// (số liệu thật MEALS/FOODS, món không rõ → AI ước tính, gắn nhãn "ước tính").
// ===========================================================================

import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, Field, Input, Select, Textarea } from '@mevabe/ui'
import { MEALS, FOODS } from '@/lib/nutrition'
import { todayStr } from '@/lib/format'
import { data } from '@/lib/data/client-entry'
import { apiErrorMessage } from '@/lib/api-error'
import { IntakeDiagnosis } from '@/components/intake-diagnosis'
import type { DailyIntakeLog, IntakeItemKind, IntakeItemInput, NutrientSummary } from '@/lib/data/client-entry'

interface DraftItem {
  kind: IntakeItemKind
  name: string
  ref_id: string | null
  amount_g: string
  qty: string
  dose_mg: string
  pills: string
}

const emptyDraft = (kind: IntakeItemKind = 'meal'): DraftItem => ({
  kind,
  name: '',
  ref_id: null,
  amount_g: '',
  qty: '1',
  dose_mg: '',
  pills: '1',
})

const KIND_LABELS: Record<IntakeItemKind, string> = {
  meal: 'Món ăn',
  food: 'Thực phẩm',
  custom: 'Món tự do',
  supplement: 'TPCN / vitamin',
}

const pctColor = (pct: number | null): string => {
  if (pct === null) return '#94a3b8'
  if (pct >= 90) return '#16a34a'
  if (pct >= 60) return '#d97706'
  return '#dc2626'
}

export function TheoDoiDinhDuongClient() {
  const [date, setDate] = useState(todayStr())
  const [note, setNote] = useState('')
  const [items, setItems] = useState<DraftItem[]>([emptyDraft('meal')])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)
  const [summary, setSummary] = useState<NutrientSummary | null>(null)
  const [history, setHistory] = useState<DailyIntakeLog[]>([])

  const meals = useMemo(() => MEALS.map((m) => ({ id: m.id, name: m.name })), [])
  const foods = useMemo(() => FOODS.map((f) => ({ id: f.id, name: f.name })), [])

  const load = async (d: string) => {
    try {
      const [s, h] = await Promise.all([
        data.getNutrientSummary({ from: d, to: d }),
        data.listIntakeHistory(20),
      ])
      setSummary(s)
      setHistory(h)
    } catch (e) {
      setError(apiErrorMessage(e, 'Không tải được dữ liệu dinh dưỡng.'))
    }
  }

  useEffect(() => {
    void load(date)
  }, [date])

  const updateItem = (i: number, patch: Partial<DraftItem>) => {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  }

  const pickRef = (i: number, kind: IntakeItemKind, refId: string) => {
    if (kind === 'meal') {
      const m = MEALS.find((x) => x.id === refId)
      updateItem(i, { kind, ref_id: refId, name: m?.name ?? refId })
    } else {
      const f = FOODS.find((x) => x.id === refId)
      updateItem(i, { kind, ref_id: refId, name: f?.name ?? refId })
    }
  }

  const submit = async () => {
    setError(null)
    setSavedMsg(null)
    const payload: IntakeItemInput[] = []
    for (const it of items) {
      if (!it.name.trim()) continue
      if (it.kind === 'meal') payload.push({ kind: 'meal', name: it.name.trim(), ref_id: it.ref_id, qty: Number(it.qty) || 1 })
      else if (it.kind === 'food') {
        const amount = Number(it.amount_g)
        if (!(amount > 0)) continue // thiếu khối lượng → bỏ qua (không lưu 0 g)
        payload.push({ kind: 'food', name: it.name.trim(), ref_id: it.ref_id, amount_g: amount })
      } else if (it.kind === 'custom') payload.push({ kind: 'custom', name: it.name.trim() })
      else {
        const dose = Number(it.dose_mg)
        payload.push({
          kind: 'supplement',
          name: it.name.trim(),
          dose_mg: dose > 0 ? dose : undefined,
          pills: Number(it.pills) || 1,
        })
      }
    }
    if (payload.length === 0) {
      setError('Chưa có món/thực phẩm nào để lưu.')
      return
    }
    setSaving(true)
    try {
      await data.addDailyIntake({ date, note: note.trim() || undefined, items: payload })
      setSavedMsg('Đã lưu nhật ký hôm nay.')
      setItems([emptyDraft('meal')])
      setNote('')
      await load(date)
    } catch (e) {
      setError(apiErrorMessage(e, 'Lưu chưa thành công. Thử lại.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-4 w-52">
          <Field label="Ngày" htmlFor="intake-date">
            <Input id="intake-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>

        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 p-3">
              <div className="w-36">
                <Field label="Loại" htmlFor={`it-kind-${i}`}>
                  <Select
                    id={`it-kind-${i}`}
                    value={it.kind}
                    onChange={(e) => {
                      const k = e.target.value as IntakeItemKind
                      setItems((prev) => prev.map((x, idx) => (idx === i ? { ...emptyDraft(k), kind: k } : x)))
                    }}
                  >
                    {(Object.keys(KIND_LABELS) as IntakeItemKind[]).map((k) => (
                      <option key={k} value={k}>
                        {KIND_LABELS[k]}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              {it.kind === 'meal' && (
                <>
                  <div className="min-w-52 flex-1">
                    <Field label="Chọn món" htmlFor={`it-ref-${i}`}>
                      <Select
                        id={`it-ref-${i}`}
                        value={it.ref_id ?? ''}
                        onChange={(e) => e.target.value && pickRef(i, 'meal', e.target.value)}
                      >
                        <option value="">Chọn món…</option>
                        {meals.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                  <div className="w-24">
                    <Field label="Số phần" htmlFor={`it-qty-${i}`}>
                      <Input id={`it-qty-${i}`} type="number" min={1} value={it.qty} onChange={(e) => updateItem(i, { qty: e.target.value })} />
                    </Field>
                  </div>
                </>
              )}

              {it.kind === 'food' && (
                <>
                  <div className="min-w-52 flex-1">
                    <Field label="Chọn thực phẩm" htmlFor={`it-ref-${i}`}>
                      <Select
                        id={`it-ref-${i}`}
                        value={it.ref_id ?? ''}
                        onChange={(e) => e.target.value && pickRef(i, 'food', e.target.value)}
                      >
                        <option value="">Chọn thực phẩm…</option>
                        {foods.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                  <div className="w-28">
                    <Field label="Khối lượng (g)" htmlFor={`it-amount-${i}`}>
                      <Input id={`it-amount-${i}`} type="number" min={1} value={it.amount_g} onChange={(e) => updateItem(i, { amount_g: e.target.value })} placeholder="100" />
                    </Field>
                  </div>
                </>
              )}

              {(it.kind === 'custom' || it.kind === 'supplement') && (
                <div className="min-w-52 flex-1">
                  <Field label="Tên" htmlFor={`it-name-${i}`}>
                    <Input
                      id={`it-name-${i}`}
                      value={it.name}
                      onChange={(e) => updateItem(i, { name: e.target.value })}
                      placeholder={it.kind === 'supplement' ? 'VD: Viên sắt 27mg' : 'VD: Bún ốc, canh chua…'}
                    />
                  </Field>
                </div>
              )}

              {it.kind === 'supplement' && (
                <>
                  <div className="w-32">
                    <Field label="Hàm lượng/viên" htmlFor={`it-dose-${i}`} hint="mg/mcg/IU theo vi chất">
                      <Input id={`it-dose-${i}`} type="number" min={0} value={it.dose_mg} onChange={(e) => updateItem(i, { dose_mg: e.target.value })} placeholder="27" />
                    </Field>
                  </div>
                  <div className="w-24">
                    <Field label="Số viên" htmlFor={`it-pills-${i}`}>
                      <Input id={`it-pills-${i}`} type="number" min={1} value={it.pills} onChange={(e) => updateItem(i, { pills: e.target.value })} />
                    </Field>
                  </div>
                </>
              )}

              <Button type="button" variant="secondary" size="sm" onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}>
                Bỏ
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-start gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => setItems((prev) => [...prev, emptyDraft('meal')])}>
            + Thêm món/TPCN
          </Button>
          <Textarea className="min-w-52 flex-1" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú ngày (tùy chọn)…" rows={2} />
          <Button onClick={submit} disabled={saving}>
            {saving ? 'Đang lưu…' : 'Lưu nhật ký'}
          </Button>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {savedMsg && <p className="mt-3 text-sm text-green-700">{savedMsg}</p>}
      </Card>

      <Card>
        <h3 className="mb-3 text-lg font-semibold">
          Tổng vi chất ngày {date}
          {summary?.week ? ` — tuần thai ${summary.week}` : ''}
        </h3>
        {summary && summary.days.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có nhật ký cho ngày này. Nhập món/TPCN ở trên rồi bấm Lưu.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {summary?.totals.map((t) => {
              const bar = t.need ? Math.min(100, Math.round(((t.pct ?? 0) / 100) * 100)) : 0
              return (
                <div key={t.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium">{t.name}</span>
                    <span className="text-sm tabular-nums">
                      {t.amount} {t.unit}
                      {t.need !== null && <span className="text-slate-500"> / {t.need} {t.unit}</span>}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${bar}%`, backgroundColor: pctColor(t.pct) }} />
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {t.pct === null ? 'Chưa có nhu cầu (tuần thai)' : t.pct >= 100 ? 'Đủ nhu cầu' : `Đạt ${t.pct}%`}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <IntakeDiagnosis />

      <Card>
        <h3 className="mb-3 text-lg font-semibold">Lịch sử gần đây</h3>
        {history.length === 0 ? (
          <p className="text-sm text-slate-500">Chưa có nhật ký nào.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {history.map((log) => (
              <li key={log.id} className="flex flex-wrap items-center gap-2 py-2">
                <span className="w-24 font-medium tabular-nums">{log.date}</span>
                <span className="flex-1">
                  {log.items.map((it) => (
                    <span key={it.id} className="mr-2 inline-flex items-center gap-1">
                      {it.name}
                      {it.estimated && (
                        <Badge tone="warning" className="text-[10px]">
                          ước tính
                        </Badge>
                      )}
                    </span>
                  ))}
                </span>
                {log.note && <span className="text-xs text-slate-500">{log.note}</span>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
