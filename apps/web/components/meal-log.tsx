'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { data, type NutritionFocus } from '@/lib/data/client-entry'
import { isOfflineError, OFFLINE_MESSAGE } from '@/lib/api-error'
import { MEAL_LABELS, MEAL_OPTIONS } from '@/lib/labels'
import { fmtDateTime } from '@/lib/format'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Select,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@mevabe/ui'
import type { MealType } from '@mevabe/domain'

export interface MealRow {
  id: string
  meal_type: MealType
  name: string
  logged_at: string
  note?: string | null
}

export interface SavedMealRow {
  id: string
  name: string
}

/** Món phổ biến Việt — ghi nhanh bằng 1 chạm. */
const QUICK_MEALS = ['Cháo thịt băm', 'Phở gà', 'Cơm trắng + cá kho', 'Canh rau ngót', 'Trứng luộc', 'Sữa tươi', 'Chuối', 'Nước cam']

export function MealLog({ meals, saved, focus }: { meals: MealRow[]; saved: SavedMealRow[]; focus: NutritionFocus }) {
  const router = useRouter()
  const [mealType, setMealType] = useState<MealType>('breakfast')
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || saving) return
    setSaving(true)
    setError('')
    try {
      await data.addMeal({
        meal_type: mealType,
        name: name.trim(),
        logged_at: new Date().toISOString(),
        note: note.trim() || undefined,
      })
      setName('')
      setNote('')
      router.refresh()
    } catch (err) {
      setError(isOfflineError(err) ? OFFLINE_MESSAGE : err instanceof Error && err.message ? err.message : 'Chưa ghi được bữa ăn — mẹ thử lại.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card title="Ghi bữa ăn" description="Chọn bữa, gõ món hoặc chạm món nhanh.">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bữa" htmlFor="meal-type">
              <Select id="meal-type" value={mealType} onChange={(e) => setMealType(e.target.value as MealType)}>
                {MEAL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Món" htmlFor="meal-name">
              <Input id="meal-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Phở bò" />
            </Field>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_MEALS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setName(q)}
                className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted hover:bg-surface-muted hover:text-fg"
              >
                {q}
              </button>
            ))}
          </div>
          <Field label="Ghi chú" htmlFor="meal-note">
            <Textarea id="meal-note" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" disabled={!name.trim() || saving}>
              {saving ? 'Đang lưu…' : 'Thêm'}
            </Button>
          </div>
          {error && (
            <p role="alert" className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}
        </form>
      </Card>

      <Tabs defaultValue="log">
        <TabsList>
          <TabsTrigger value="log">Bữa hôm nay</TabsTrigger>
          <TabsTrigger value="suggest">Gợi ý theo tuần</TabsTrigger>
        </TabsList>
        <TabsContent value="log">
          <Card>
            {meals.length ? (
              <ul className="stagger-list divide-y divide-border">
                {meals.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <div>
                      <Badge tone="accent">{MEAL_LABELS[m.meal_type]}</Badge>
                      <span className="ml-2 text-fg">{m.name}</span>
                      {m.note && <span className="ml-2 text-xs text-muted">— {m.note}</span>}
                    </div>
                    <span className="shrink-0 text-xs text-muted">{fmtDateTime(m.logged_at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Chưa có bữa ăn hôm nay" description="Ghi bữa đầu tiên bằng form phía trên." />
            )}
          </Card>
        </TabsContent>
        <TabsContent value="suggest">
          <Card title={`Dinh dưỡng tuần ${focus.week}`}>
            <div className="space-y-4">
              {focus.nutrients.map((n) => (
                <div key={n.name}>
                  <p className="text-sm font-semibold text-fg">{n.name}</p>
                  <p className="text-xs text-muted">{n.role}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {n.foods.map((f) => (
                      <span key={f} className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs text-success">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
          {saved.length > 0 && (
            <Card title="Món đã lưu" className="mt-6">
              <ul className="flex flex-wrap gap-2">
                {saved.map((s) => (
                  <li key={s.id}>
                    <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs text-fg">{s.name}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
