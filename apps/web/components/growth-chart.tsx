'use client'

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface GrowthChartPoint {
  label: string
  value: number
  /** Đường chuẩn WHO tại tháng đo (null khi chưa xác định giới tính). */
  p3: number | null
  p97: number | null
}

/** Biểu đồ tăng trưởng: đường số đo của bé + nền P3/P97 theo chuẩn WHO. */
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
  if (!data.length) return null
  return (
    <div style={{ height }} role="img" aria-label="Biểu đồ tăng trưởng kèm đường chuẩn WHO">
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
            formatter={(value: number | string, name: string) => [`${value}${yUnit}`, name]}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="p3" name="P3" stroke="var(--mv-text-muted)" strokeWidth={1} strokeDasharray="4 4" dot={false} />
          <Line type="monotone" dataKey="p97" name="P97" stroke="var(--mv-text-muted)" strokeWidth={1} strokeDasharray="4 4" dot={false} />
          <Line type="monotone" dataKey="value" name="Bé" stroke={color} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </RechartsLine>
      </ResponsiveContainer>
    </div>
  )
}
