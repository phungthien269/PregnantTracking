'use client'

import {
  CartesianGrid,
  Line,
  LineChart as RechartsLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface LineChartPoint {
  label: string
  value: number
}

/** Biểu đồ đường đơn giản (Recharts). Nằm ở web vì ui package không khai recharts. */
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
  if (!data.length) return null
  return (
    <div style={{ height }} role="img" aria-label="Biểu đồ đường">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLine data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="var(--mv-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--mv-text-muted)' }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--mv-text-muted)' }} tickLine={false} axisLine={false} width={52} />
          <Tooltip
            contentStyle={{
              background: 'var(--mv-surface)',
              border: '1px solid var(--mv-border)',
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: 'var(--mv-text)' }}
            formatter={(v) => [`${v}${yUnit}`, 'Giá trị']}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </RechartsLine>
      </ResponsiveContainer>
    </div>
  )
}
