'use client'

import { createContext, useContext, useId, useRef, useState } from 'react'
import { cx } from './cx'

interface TabsCtxValue {
  active: string
  setActive: (v: string) => void
  baseId: string
  refs: React.MutableRefObject<Record<string, HTMLButtonElement | null>>
}

const TabsCtx = createContext<TabsCtxValue | undefined>(undefined)

function useTabsCtx() {
  const ctx = useContext(TabsCtx)
  if (!ctx) throw new Error('TabsTrigger/TabsList/TabsContent phải nằm trong <Tabs>')
  return ctx
}

export function Tabs({
  defaultValue,
  children,
  className,
}: {
  defaultValue: string
  children: React.ReactNode
  className?: string
}) {
  const [active, setActive] = useState(defaultValue)
  const baseId = useId()
  const refs = useRef<Record<string, HTMLButtonElement | null>>({})
  return (
    <TabsCtx.Provider value={{ active, setActive, baseId, refs }}>
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  )
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  const ctx = useTabsCtx()
  return (
    <div
      role="tablist"
      onKeyDown={(e) => {
        // Điều hướng bàn phím theo mẫu tabs (Arrow/Home/End) — WCAG 2.1.1.
        const values = Object.keys(ctx.refs.current)
        if (!values.length) return
        const idx = values.indexOf(ctx.active)
        let next = -1
        if (e.key === 'ArrowRight') next = (idx + 1) % values.length
        else if (e.key === 'ArrowLeft') next = (idx - 1 + values.length) % values.length
        else if (e.key === 'Home') next = 0
        else if (e.key === 'End') next = values.length - 1
        if (next < 0) return
        e.preventDefault()
        const v = values[next]!
        ctx.setActive(v)
        ctx.refs.current[v]?.focus()
      }}
      className={cx('flex gap-1 overflow-x-auto rounded-md bg-surface-muted p-1', className)}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = useTabsCtx()
  const active = ctx.active === value
  return (
    <button
      ref={(el) => {
        ctx.refs.current[value] = el
      }}
      type="button"
      role="tab"
      id={`${ctx.baseId}-tab-${value}`}
      aria-selected={active}
      aria-controls={`${ctx.baseId}-panel-${value}`}
      tabIndex={active ? 0 : -1}
      onClick={() => ctx.setActive(value)}
      className={cx(
        'shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        active ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg',
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = useTabsCtx()
  if (ctx.active !== value) return null
  return (
    <div
      id={`${ctx.baseId}-panel-${value}`}
      role="tabpanel"
      aria-labelledby={`${ctx.baseId}-tab-${value}`}
      className="pt-4"
    >
      {children}
    </div>
  )
}
