'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { data } from '@/lib/data/client-entry'
import { TASK_STATUS_LABELS } from '@/lib/labels'
import { fmtDate } from '@/lib/format'
import { Badge, Button, Card, EmptyState, Field, Input } from '@mevabe/ui'
import type { Task } from '@mevabe/domain'

const isDone = (t: Task) => t.status === 'done'

export function TaskBoard({ tasks }: { tasks: Task[] }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    await data.addTask({ title: title.trim(), due_date: due || null })
    setTitle('')
    setDue('')
    router.refresh()
  }

  const toggle = async (t: Task) => {
    setBusyId(t.id)
    try {
      await data.toggleTask(t.id, !isDone(t))
      router.refresh()
    } finally {
      setBusyId(null)
    }
  }

  const sorted = [...tasks].sort((a, b) => Number(isDone(a)) - Number(isDone(b)))

  return (
    <div className="space-y-6">
      <Card title="Thêm công việc">
        <form onSubmit={add} className="grid gap-4 sm:grid-cols-3">
          <Field label="Công việc" htmlFor="task-title">
            <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Đặt lịch siêu âm" />
          </Field>
          <Field label="Hạn" htmlFor="task-due">
            <Input id="task-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          </Field>
          <div className="flex items-end">
            <Button type="submit" disabled={!title.trim()} className="w-full sm:w-auto">
              Thêm
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Checklist" description="Việc cần làm của cả nhà — người phụ trách được gán khi cần.">
        {sorted.length ? (
          <ul className="divide-y divide-border">
            {sorted.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isDone(t)}
                    onChange={() => toggle(t)}
                    disabled={busyId === t.id}
                    aria-label={`Đánh dấu ${t.title}`}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <span className={isDone(t) ? 'text-muted line-through' : 'text-fg'}>{t.title}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {t.status !== 'done' && <Badge>{TASK_STATUS_LABELS[t.status]}</Badge>}
                  {t.due_date && <span className="text-xs text-muted">Hạn: {fmtDate(t.due_date)}</span>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Chưa có công việc" description="Thêm việc cần làm để cả nhà cùng theo dõi." />
        )}
      </Card>
    </div>
  )
}
