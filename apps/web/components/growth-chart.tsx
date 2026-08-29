'use client'

import { useState } from 'react'
import { useMeasuredWidth } from './line-chart'

export interface GrowthChartPoint {
  label: string
  value: number
  /** Đường chuẩn WHO tại tháng đo (null khi chưa xác định giới tính). */
  p3: number | null
  p97: number | null
}

const PAD_L = 46
const PAD_R = 12
const PAD_T = 12
const PAD_B = 26

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

/** Đường mượt Catmull-Rom → cubic bezier. */
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

/** Vẽ path bỏ qua đoạn giá trị null (P3/P97 chưa xác định). */
function segmentPaths(points: Pt[], values: (number | null)[]): string[] {
  const out: string[] = []
  let run: Pt[] = []
  const flush = (): void => {
    if (run.length > 1) out.push(smoothPath(run))
    run = []
  }
  for (let i = 0; i < values.length; i++) {
    if (values[i] == null || !Number.isFinite(values[i]!)) {
      flush()
    } else {
      run.push(points[i]!)
    }
  }
  flush()
  return out
}

/** Biểu đồ tăng trưởng: đường số đo của bé + nền P3/P97 theo chuẩn WHO (SVG thuần). */
export function GrowthChart({
  data,
  height = 260,
  color = 'var(--mv-primary)',
  yUnit = '',
}: {
  data: GrowthChartPoint[]
  height?: number
  color?: string
  yUnit?: string
}) {
  const { ref, width } = useMeasuredWidth()
  const [hover, setHover] = useState<number | null>(null)
  if (!data.length) return null

  const all = data
    .flatMap((d) => [d.value, d.p3, d.p97])
    .filter((v): v is number => v != null && Number.isFinite(v))
  const { lo, hi } = niceBounds(Math.min(...all), Math.max(...all))
  const innerW = Math.max(0, width - PAD_L - PAD_R)
  const innerH = height - PAD_T - PAD_B
  const xAt = (i: number) => PAD_L + (data.length > 1 ? (innerW * i) / (data.length - 1) : innerW / 2)
  const yAt = (v: number) => PAD_T + innerH - ((v - lo) / (hi - lo || 1)) * innerH
  const baby = data.map((d, i) => ({ x: xAt(i), y: yAt(d.value) }))
  const p3 = data.map((d, i) => ({ x: xAt(i), y: yAt(d.p3 ?? 0) }))
  const p97 = data.map((d, i) => ({ x: xAt(i), y: yAt(d.p97 ?? 0) }))
  const yTicks: number[] = []
  for (let t = 0; t <= 4; t++) yTicks.push(lo + ((hi - lo) * t) / 4)
  const xLabelEvery = Math.max(1, Math.ceil(data.length / 6))
  const showDots = data.length <= 24

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    let best = 0
    let bestD = Infinity
    for (let i = 0; i < baby.length; i++) {
      const d = Math.abs(baby[i]!.x - x)
      if (d < bestD) {
        bestD = d
        best = i
      }
    }
    setHover(best)
  }

  const hp = hover != null ? baby[hover] : null
  const fmt = (v: number | null): string => (v == null ? '—' : `${Math.round(v * 10) / 10}${yUnit}`)

  return (
    <div ref={ref} style={{ height }} role="img" aria-label="Biểu đồ tăng trưởng kèm đường chuẩn WHO" className="relative w-full">
      {/* Chú giải */}
      <div className="mb-1 flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-0.5 w-4 rounded" style={{ background: color }} /> Bé
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-0 w-4 border-t-2 border-dashed border-[var(--mv-text-muted)]" /> P3
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-0 w-4 border-t-2 border-dashed border-[var(--mv-text-muted)]" /> P97
        </span>
      </div>
      {width > 0 && (
        <svg width={width} height={height} className="block select-none">
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
          {/* P3/P97 nét đứt mờ */}
          {segmentPaths(p3, data.map((d) => d.p3)).map((d, i) => (
            <path key={`p3-${i}`} d={d} fill="none" stroke="var(--mv-text-muted)" strokeWidth={1.5} strokeDasharray="4 4" />
          ))}
          {segmentPaths(p97, data.map((d) => d.p97)).map((d, i) => (
            <path key={`p97-${i}`} d={d} fill="none" stroke="var(--mv-text-muted)" strokeWidth={1.5} strokeDasharray="4 4" />
          ))}
          {/* Đường của bé */}
          <path d={smoothPath(baby)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
          {showDots &&
            baby.map((p, i) =>
              data[i]!.p3 != null && data[i]!.p97 != null ? <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} /> : null,
            )}
          {hp && (
            <g>
              <line x1={hp.x} x2={hp.x} y1={PAD_T} y2={height - PAD_B} stroke="var(--mv-border)" />
              <circle cx={hp.x} cy={hp.y} r={5} fill={color} stroke="var(--mv-surface)" strokeWidth={2} />
            </g>
          )}
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
      {hover != null && hp && (
        <div
          className="pointer-events-none absolute z-10 rounded-md border border-border bg-surface px-2 py-1 text-xs shadow-pop"
          style={{
            left: Math.min(Math.max(hp.x, 80), Math.max(80, width - 80)),
            top: 18,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="font-medium text-fg">{data[hover]!.label}</div>
          <div className="text-muted">
            Bé: <span className="font-medium text-fg">{fmt(data[hover]!.value)}</span> · P3: {fmt(data[hover]!.p3)} · P97:{' '}
            {fmt(data[hover]!.p97)}
          </div>
        </div>
      )}
    </div>
  )
}
