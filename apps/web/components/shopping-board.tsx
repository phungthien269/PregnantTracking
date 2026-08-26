'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { data } from '@/lib/data/client-entry'
import { SHOPPING_STATUS_LABELS } from '@/lib/labels'
import { todayStr } from '@/lib/format'
import { Badge, Button, Card, EmptyState, Field, Input, Modal, Select, StatCard, Toggle } from '@mevabe/ui'
import type { BudgetEntry, BudgetType, ShoppingItem } from '@mevabe/domain'

const money = (n: number) => `${Math.round(n).toLocaleString('vi-VN')}đ`

// Giá tham khảo UI cho nguyên liệu Việt (ước lượng, chưa có cơ sở thật).
// Item từ addMealToShopping có estimated_price=null → UI gán mức tham khảo này.
const REF_PRICE: [string, number][] = [
  ['cá hồi', 650000],
  ['hạt óc chó', 600000],
  ['hạnh nhân', 550000],
  ['thịt bò', 300000],
  ['thịt băm', 140000],
  ['thịt gà', 120000],
  ['súp lơ', 45000],
  ['bông cải', 45000],
  ['rau ngót', 25000],
  ['gạo lứt', 40000],
  ['gạo', 25000],
  ['đu đủ', 25000],
  ['sữa chua', 8000],
  ['trứng', 5000],
  ['tía tô', 5000],
  ['hành lá', 5000],
  ['chanh', 4000],
]
const refPrice = (name: string): number | undefined => {
  const n = name.toLowerCase()
  return REF_PRICE.find(([k]) => n.includes(k))?.[1]
}

const monthKey = (iso: string) => iso.slice(0, 7)
const monthLabel = (key: string) => {
  const [y, m] = key.split('-')
  return `Tháng ${Number(m)}/${y}`
}

export function ShoppingBoard({ items, budget }: { items: ShoppingItem[]; budget: BudgetEntry[] }) {
  const router = useRouter()

  // ---- Mua sắm: thêm đồ dùng ----
  const [name, setName] = useState('')
  const [est, setEst] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  // ---- Mua sắm: sửa / xoá ----
  const [editItem, setEditItem] = useState<ShoppingItem | null>(null)
  const [seName, setSeName] = useState('')
  const [seEst, setSeEst] = useState('')
  const [seNote, setSeNote] = useState('')
  const [seDone, setSeDone] = useState(false)
  const [savingItem, setSavingItem] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<ShoppingItem | null>(null)

  // ---- Ngân sách: thêm ----
  const [bTitle, setBTitle] = useState('')
  const [bType, setBType] = useState<BudgetType>('expense')
  const [bAmount, setBAmount] = useState('')
  const [bCategory, setBCategory] = useState('')
  const [bDate, setBDate] = useState(todayStr())
  const [bNote, setBNote] = useState('')

  // ---- Ngân sách: sửa ----
  const [edit, setEdit] = useState<BudgetEntry | null>(null)
  const [eTitle, setETitle] = useState('')
  const [eType, setEType] = useState<BudgetType>('expense')
  const [eAmount, setEAmount] = useState('')
  const [eCategory, setECategory] = useState('')
  const [eDate, setEDate] = useState('')
  const [eNote, setENote] = useState('')
  const [savingBudget, setSavingBudget] = useState(false)

  const totalIncome = budget.filter((b) => b.type === 'income').reduce((s, b) => s + b.amount, 0)
  const totalExpense = budget.filter((b) => b.type === 'expense').reduce((s, b) => s + b.amount, 0)
  const balance = totalIncome - totalExpense
  const spent = items
    .filter((i) => i.status === 'bought')
    .reduce((s, i) => s + (i.actual_price ?? i.estimated_price ?? 0), 0)

  const byMonth = budget.reduce<Record<string, BudgetEntry[]>>((acc, b) => {
    const k = monthKey(b.occurred_at)
    ;(acc[k] ??= []).push(b)
    return acc
  }, {})
  const months = Object.keys(byMonth).sort().reverse()

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    await data.addShoppingItem({ name: name.trim(), estimated_price: est ? Number(est) : null })
    setName('')
    setEst('')
    router.refresh()
  }

  const toggle = async (i: ShoppingItem) => {
    setBusyId(i.id)
    try {
      await data.toggleShopping(i.id, i.status !== 'bought')
      router.refresh()
    } finally {
      setBusyId(null)
    }
  }

  const startItemEdit = (i: ShoppingItem) => {
    setEditItem(i)
    setSeName(i.name)
    setSeEst(i.estimated_price != null ? String(i.estimated_price) : '')
    setSeNote(i.note ?? '')
    setSeDone(i.status === 'bought')
  }

  const saveItemEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editItem || !seName.trim()) return
    setSavingItem(true)
    try {
      await data.updateShoppingItem(editItem.id, {
        name: seName.trim(),
        estimated_price: seEst ? Number(seEst) : null,
        note: seNote.trim() || null,
        done: seDone,
      })
      setEditItem(null)
      router.refresh()
    } finally {
      setSavingItem(false)
    }
  }

  const removeItem = async (i: ShoppingItem) => {
    setConfirmDelete(null)
    setBusyId(i.id)
    try {
      await data.deleteShoppingItem(i.id)
      router.refresh()
    } finally {
      setBusyId(null)
    }
  }

  const addBudgetEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bTitle.trim() || !bAmount) return
    await data.addBudget({
      title: bTitle.trim(),
      amount: Number(bAmount),
      type: bType,
      category: bCategory.trim() || null,
      occurred_at: bDate,
      note: bNote.trim() || null,
    })
    setBTitle('')
    setBAmount('')
    setBCategory('')
    setBNote('')
    router.refresh()
  }

  const startEdit = (b: BudgetEntry) => {
    setEdit(b)
    setETitle(b.title)
    setEType(b.type)
    setEAmount(String(b.amount))
    setECategory(b.category ?? '')
    setEDate(b.occurred_at)
    setENote(b.note ?? '')
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!edit || !eTitle.trim() || !eAmount) return
    setSavingBudget(true)
    try {
      await data.updateBudget(edit.id, {
        title: eTitle.trim(),
        amount: Number(eAmount),
        type: eType,
        category: eCategory.trim() || null,
        occurred_at: eDate,
        note: eNote.trim() || null,
      })
      setEdit(null)
      router.refresh()
    } finally {
      setSavingBudget(false)
    }
  }

  const addTaskFromItem = async (i: ShoppingItem) => {
    setBusyId(i.id)
    try {
      await data.addTask({ title: `Mua: ${i.name}` })
      router.refresh()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Tổng thu" value={money(totalIncome)} tone="success" />
        <StatCard label="Tổng chi (ngân sách)" value={money(totalExpense)} tone="warning" />
        <StatCard label="Cân đối" value={money(balance)} tone={balance >= 0 ? 'primary' : 'danger'} />
      </div>

      <Card title="Thêm khoản thu/chi">
        <form onSubmit={addBudgetEntry} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Tiêu đề" htmlFor="b-title">
            <Input id="b-title" value={bTitle} onChange={(e) => setBTitle(e.target.value)} placeholder="VD: Mua sữa công thức" />
          </Field>
          <Field label="Loại" htmlFor="b-type">
            <Select id="b-type" value={bType} onChange={(e) => setBType(e.target.value as BudgetType)}>
              <option value="expense">Chi</option>
              <option value="income">Thu</option>
            </Select>
          </Field>
          <Field label="Số tiền (₫)" htmlFor="b-amount">
            <Input id="b-amount" type="number" inputMode="numeric" value={bAmount} onChange={(e) => setBAmount(e.target.value)} placeholder="VD: 500000" />
          </Field>
          <Field label="Danh mục" htmlFor="b-category">
            <Input id="b-category" value={bCategory} onChange={(e) => setBCategory(e.target.value)} placeholder="VD: Sữa và đồ bé" />
          </Field>
          <Field label="Ngày" htmlFor="b-date">
            <Input id="b-date" type="date" value={bDate} onChange={(e) => setBDate(e.target.value)} />
          </Field>
          <Field label="Ghi chú" htmlFor="b-note">
            <Input id="b-note" value={bNote} onChange={(e) => setBNote(e.target.value)} placeholder="Không bắt buộc" />
          </Field>
          <div className="flex items-end sm:col-span-2 lg:col-span-3">
            <Button type="submit" disabled={!bTitle.trim() || !bAmount}>
              Thêm
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Thu chi theo tháng">
        {budget.length ? (
          <div className="space-y-4">
            {months.map((m) => {
              const rows = byMonth[m]!
              const inc = rows.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0)
              const exp = rows.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
              return (
                <div key={m}>
                  <p className="mb-1 text-xs font-semibold text-muted">
                    {monthLabel(m)} · thu {money(inc)} · chi {money(exp)}
                  </p>
                  <ul className="divide-y divide-border">
                    {rows.map((b) => (
                      <li key={b.id}>
                        {edit?.id === b.id ? (
                          <form onSubmit={saveEdit} className="grid gap-3 py-2 sm:grid-cols-2 lg:grid-cols-3">
                            <Input value={eTitle} onChange={(e) => setETitle(e.target.value)} aria-label="Tiêu đề" />
                            <Select value={eType} onChange={(e) => setEType(e.target.value as BudgetType)} aria-label="Loại">
                              <option value="expense">Chi</option>
                              <option value="income">Thu</option>
                            </Select>
                            <Input type="number" inputMode="numeric" value={eAmount} onChange={(e) => setEAmount(e.target.value)} aria-label="Số tiền" />
                            <Input value={eCategory} onChange={(e) => setECategory(e.target.value)} aria-label="Danh mục" />
                            <Input type="date" value={eDate} onChange={(e) => setEDate(e.target.value)} aria-label="Ngày" />
                            <div className="flex items-center gap-2">
                              <Button size="sm" type="submit" disabled={!eTitle.trim() || !eAmount || savingBudget}>
                                Lưu
                              </Button>
                              <Button size="sm" variant="secondary" type="button" onClick={() => setEdit(null)}>
                                Hủy
                              </Button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex items-center justify-between gap-3 py-2 text-sm">
                            <div className="min-w-0">
                              <span className="text-fg">{b.title}</span>
                              {b.category && (
                                <Badge tone="accent" className="ml-2">
                                  {b.category}
                                </Badge>
                              )}
                              {b.note && <span className="ml-2 text-xs text-muted">— {b.note}</span>}
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className={b.type === 'income' ? 'font-medium text-success' : 'font-medium text-danger'}>
                                {b.type === 'income' ? '+' : '−'}
                                {money(b.amount)}
                              </span>
                              <Button size="sm" variant="secondary" onClick={() => startEdit(b)}>
                                Sửa
                              </Button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyState title="Chưa có khoản thu/chi" description="Thêm khoản đầu tiên để theo dõi ngân sách đón bé." />
        )}
      </Card>

      <Card title="Thêm đồ dùng">
        <form onSubmit={add} className="grid gap-4 sm:grid-cols-3">
          <Field label="Đồ dùng" htmlFor="shop-name">
            <Input id="shop-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Bỉm sơ sinh" />
          </Field>
          <Field label="Giá dự kiến (₫)" htmlFor="shop-est">
            <Input id="shop-est" type="number" inputMode="numeric" value={est} onChange={(e) => setEst(e.target.value)} placeholder="VD: 200000" />
          </Field>
          <div className="flex items-end">
            <Button type="submit" disabled={!name.trim()} className="w-full sm:w-auto">
              Thêm
            </Button>
          </div>
        </form>
      </Card>

      <Card title={`Danh sách đồ dùng${spent ? ` · đã chi ${money(spent)}` : ''}`}>
        {items.length ? (
          <ul className="divide-y divide-border">
            {items.map((i) => {
              const bought = i.status === 'bought'
              const ref = i.estimated_price ?? refPrice(i.name)
              if (editItem?.id === i.id) {
                return (
                  <li key={i.id}>
                    <form onSubmit={saveItemEdit} className="grid gap-3 py-2 sm:grid-cols-2 lg:grid-cols-5">
                      <Input value={seName} onChange={(e) => setSeName(e.target.value)} aria-label="Tên" />
                      <Input type="number" inputMode="numeric" value={seEst} onChange={(e) => setSeEst(e.target.value)} aria-label="Giá dự kiến" />
                      <Input value={seNote} onChange={(e) => setSeNote(e.target.value)} aria-label="Ghi chú" />
                      <Toggle checked={seDone} onChange={setSeDone} label="Đã mua" />
                      <div className="flex items-center gap-2">
                        <Button size="sm" type="submit" disabled={!seName.trim() || savingItem}>
                          Lưu
                        </Button>
                        <Button size="sm" variant="secondary" type="button" onClick={() => setEditItem(null)}>
                          Hủy
                        </Button>
                      </div>
                    </form>
                  </li>
                )
              }
              return (
                <li key={i.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="min-w-0">
                    <span className={bought ? 'text-muted line-through' : 'text-fg'}>{i.name}</span>
                    {i.note && <span className="ml-2 text-xs text-muted">{i.note}</span>}
                    {ref != null && <span className="ml-2 text-xs text-muted">{i.estimated_price != null ? '~' : '≈'} {money(ref)}</span>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {bought ? (
                      <Badge tone="success">{SHOPPING_STATUS_LABELS.bought}</Badge>
                    ) : (
                      <>
                        <Badge tone="warning">{SHOPPING_STATUS_LABELS.pending}</Badge>
                        <Button size="sm" variant="secondary" onClick={() => toggle(i)} disabled={busyId === i.id}>
                          Đã mua
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => addTaskFromItem(i)} disabled={busyId === i.id}>
                          Thêm việc
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="secondary" onClick={() => startItemEdit(i)} disabled={busyId === i.id}>
                      Sửa
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setConfirmDelete(i)} disabled={busyId === i.id}>
                      Xoá
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <EmptyState title="Chưa có đồ dùng" description="Thêm danh sách đồ cần chuẩn bị đón bé." />
        )}
      </Card>

      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Xoá món mua sắm"
        footer={
          <>
            <Button size="sm" variant="secondary" onClick={() => setConfirmDelete(null)}>
              Hủy
            </Button>
            <Button size="sm" variant="danger" onClick={() => confirmDelete && removeItem(confirmDelete)} disabled={busyId === confirmDelete?.id}>
              Xoá
            </Button>
          </>
        }
      >
        Xoá “{confirmDelete?.name}” khỏi danh sách mua sắm?
      </Modal>
    </div>
  )
}
