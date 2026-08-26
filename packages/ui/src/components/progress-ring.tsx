/** Vòng tròn tiến độ (SVG thuần). value 0–100. */
export function ProgressRing({
  value,
  size = 88,
  strokeWidth = 8,
  label,
}: {
  value: number
  size?: number
  strokeWidth?: number
  label?: string
}) {
  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  const offset = c - (pct / 100) * c
  return (
    <div
      className="relative inline-flex items-center justify-center"
      role="img"
      aria-label={label ?? `Tiến độ ${Math.round(pct)}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={strokeWidth} className="stroke-border" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="stroke-primary"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-fg">
        {Math.round(pct)}%
      </div>
    </div>
  )
}
