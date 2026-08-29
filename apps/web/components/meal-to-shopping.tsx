'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { data } from '@/lib/data/client-entry'
import { isOfflineError, OFFLINE_MESSAGE } from '@/lib/api-error'
import { Button, Card, EmptyState } from '@mevabe/ui'
import type { SavedMeal } from '@mevabe/domain'

/** Món đã lưu → thêm nguyên liệu vào danh sách mua sắm (Phase 6D). */
export function MealToShopping({ meals }: { meals: SavedMeal[] }) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const add = async (m: SavedMeal) => {
    setBusyId(m.id)
    setDone(null)
    setError(null)
    try {
      const items = await data.addMealToShopping(m)
      setDone(`Đã thêm ${items.length} nguyên liệu của “${m.name}” vào mua sắm`)
      router.refresh()
    } catch (err) {
      setError(isOfflineError(err) ? OFFLINE_MESSAGE : err instanceof Error && err.message ? err.message : 'Chưa thêm được nguyên liệu — mẹ thử lại.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Card title="Món đã lưu → Mua sắm" description="Chọn món để đưa nguyên liệu cần mua vào danh sách mua sắm.">
      {done && (
        <p className="mb-3 rounded-md bg-success/15 px-3 py-2 text-xs text-success" role="status">
          {done}
        </p>
      )}
      {error && (
        <p role="alert" className="mb-3 rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}
      {meals.length ? (
        <ul className="divide-y divide-border">
          {meals.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="font-medium text-fg">{m.name}</p>
                <p className="text-xs text-muted">
                  {m.servings ?? ''}
                  {m.ingredients.length ? ` · ${m.ingredients.length} nguyên liệu` : ''}
                </p>
              </div>
              <Button size="sm" variant="secondary" disabled={busyId === m.id} onClick={() => add(m)}>
                {busyId === m.id ? 'Đang thêm…' : 'Thêm vào mua sắm'}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="Chưa có món đã lưu" description="Các món gợi ý theo tuần sẽ hiển thị ở đây để thêm vào mua sắm." />
      )}
    </Card>
  )
}
