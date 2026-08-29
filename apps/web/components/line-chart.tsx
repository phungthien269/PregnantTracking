'use client'

import { useEffect, useRef, useState } from 'react'

export interface LineChartPoint {
  label: string
  value: number
}

const PAD_L = 46
const PAD_R = 12
const PAD_T = 12
const PAD_B = 26

/** Đo bề rộng container (ResizeObserver — thay ResponsiveContainer của recharts). */
export function useMeasuredWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect
      if (cr && cr.width > 0) setWidth(Math.round(cr.width))
    })
    ro.observe(el)
    setWidth(Math.round(el.getBoundingClientRect().width))
    return () => ro.disconnect()
  }, [])
  return { ref, width }
}

/** Làm tròn biên trục Y thành số đẹp (bội 1/2/5×10^k). */
function niceBounds(min: number, max: number): { lo: number; hi: number } {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { lo: 0, hi: 1 }
  if (min === max) {
    const d = Math.abs(min) || 1
    return { lo: min - d * 0.5, hi: max + d * 0.5 }
  }
  const span = max - min
  const step = Math.pow(10, Math.floor(Math.log10(span / 4)))
  const err = span / 4 / step
  const nice = (err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1) * step
  return { lo: Math.floor(min / nice) * nice, hi: Math.ceil(max / nice) * nice }
}

type Pt = { x: number; y: number }

/** Đường mượt Catmull-Rom → cubic bezier (giống 'monotone' của recharts, không nhọn gắt). */
function smoothPath(pts: Pt[]): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0]!.x} ${pts[0]!.y}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]!
    const p1 = pts[i]!
    const p2 = pts[i + 1]!
    const p3 = pts[Math.min(pts.length - 1, i + 2)]!
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`
  }
  return d
}

export function LineChart({
  data,
  height = 220,
  color = 'var(--mv-primary)',
  yUnit = '',
}: {
  data: LineChartPoint[]
  height?: number
  color?: string
  yUnit?: string
}) {
  const { ref, width } = useMeasuredWidth()
  const [hover, setHover] = useState<number | null>(null)
  if (!data.length) return null

  const values = data.map((d) => d.value).filter((v) => Number.isFinite(v))
  const { lo, hi } = niceBounds(Math.min(...values), Math.max(...values))
  const innerW = Math.max(0, width - PAD_L - PAD_R)
  const innerH = height - PAD_T - PAD_B
  const xAt = (i: number) => PAD_L + (data.length > 1 ? (innerW * i) / (data.length - 1) : innerW / 2)
  const yAt = (v: number) => PAD_T + innerH - ((v - lo) / (hi - lo || 1)) * innerH
  const pts = data.map((d, i) => ({ x: xAt(i), y: yAt(d.value) }))
  const yTicks: number[] = []
  for (let t = 0; t <= 4; t++) yTicks.push(lo + ((hi - lo) * t) / 4)
  const xLabelEvery = Math.max(1, Math.ceil(data.length / 6))
  const showDots = data.length <= 24

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    let best = 0
    let bestD = Infinity
    for (let i = 0; i < pts.length; i++) {
      const d = Math.abs(pts[i]!.x - x)
      if (d < bestD) {
        bestD = d
        best = i
      }
    }
    setHover(best)
  }

  const hp = hover != null ? pts[hover] : null
  const fmt = (v: number): string => `${Number.isFinite(v) ? Math.round(v * 10) / 10 : v}${yUnit}`

  return (
    <div ref={ref} style={{ height }} role="img" aria-label="Biểu đồ đường" className="relative w-full">
      {width > 0 && (
        <svg width={width} height={height} className="block select-none">
          {/* Lưới ngang + nhãn trục Y */}
          {yTicks.map((t) => (
            <g key={t}>
              <line
                x1={PAD_L}
                x2={width - PAD_R}
                y1={yAt(t)}
                y2={yAt(t)}
                stroke="var(--mv-border)"
                strokeDasharray="3 3"
              />
              <text x={PAD_L - 6} y={yAt(t) + 3.5} textAnchor="end" fontSize={10} fill="var(--mv-text-muted)">
                {Math.round(t * 10) / 10}
              </text>
            </g>
          ))}
          {/* Nhãn trục X */}
          {data.map((d, i) =>
            i % xLabelEvery === 0 || i === data.length - 1 ? (
              <text
                key={`x${i}`}
                x={xAt(i)}
                y={height - 8}
                textAnchor="middle"
                fontSize={10}
                fill="var(--mv-text-muted)"
              >
                {d.label}
              </text>
            ) : null,
          )}
          {/* Đường dữ liệu */}
          <path d={smoothPath(pts)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
          {showDots &&
            pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />)}
          {/* Hover: đường dọc + điểm nhấn */}
          {hp && (
            <g>
              <line x1={hp.x} x2={hp.x} y1={PAD_T} y2={height - PAD_B} stroke="var(--mv-border)" />
              <circle cx={hp.x} cy={hp.y} r={5} fill={color} stroke="var(--mv-surface)" strokeWidth={2} />
            </g>
          )}
          {/* Bắt sự kiện chuột (trong suốt) */}
          <rect
            x={PAD_L}
            y={PAD_T}
            width={innerW}
            height={innerH}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
      )}
      {/* Tooltip */}
      {hover != null && hp && (
        <div
          className="pointer-events-none absolute z-10 rounded-md border border-border bg-surface px-2 py-1 text-xs shadow-pop"
          style={{
            left: Math.min(Math.max(hp.x, 60), Math.max(60, width - 60)),
            top: 0,
            transform: 'translateX(-50%)',
          }}
        >
          <span className="text-muted">{data[hover]!.label}: </span>
          <span className="font-medium text-fg">{fmt(data[hover]!.value)}</span>
        </div>
      )}
    </div>
  )
}
