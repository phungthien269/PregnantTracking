import Link from 'next/link'
import { data } from '@/lib/data'
import { todayStr, fmtDayMonth } from '@/lib/format'
import { buttonClasses, Card, EmptyState, StatCard } from '@mevabe/ui'
import { babyAge } from '@/lib/baby-age'
import { KnowledgeForAge } from '@/components/knowledge-for-age'

export default async function ChildOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [children, feedings, sleeps, diapers, growth] = await Promise.all([
    data.getChildren(),
    data.getFeedings(id),
    data.getSleeps(id),
    data.getDiapers(id),
    data.getGrowth(id),
  ])
  const today = todayStr()
  const child = children.find((c) => c.id === id)
  const age = child ? babyAge(child.birth_date, today) : null
  const feedToday = feedings.filter((f) => f.started_at.slice(0, 10) === today).length
  const sleepToday = sleeps.filter((s) => s.started_at.slice(0, 10) === today).length
  const diaperToday = diapers.filter((d) => d.changed_at.slice(0, 10) === today).length
  const latest = growth[growth.length - 1]

  return (
    <div className="space-y-6">
      {child && age && age.label !== '—' && (
        <p className="text-sm text-muted">
          Bé <span className="font-medium text-fg">{child.name}</span> · {age.label}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Bú hôm nay" value={feedToday} hint="lần" />
        <StatCard label="Ngủ hôm nay" value={sleepToday} hint="giấc" tone="accent" />
        <StatCard label="Tã hôm nay" value={diaperToday} hint="lần" />
        <StatCard
          label="Tăng trưởng gần nhất"
          value={latest ? `${latest.weightKg ?? '—'} kg` : '—'}
          hint={latest ? `Cập nhật ${fmtDayMonth(latest.date)}` : 'Chưa có'}
          tone="success"
        />
      </div>

      <Card title="Nhật ký nhanh">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { href: `/be/${id}/an`, label: '🍼 Bú', desc: 'Sữa mẹ, sữa công thức…' },
            { href: `/be/${id}/ngu`, label: '😴 Ngủ', desc: 'Giấc ngủ, vị trí…' },
            { href: `/be/${id}/ta`, label: '🧷 Tã', desc: 'Tè, ỉa…' },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg border border-border bg-surface p-4 text-sm text-fg shadow-card transition-colors hover:bg-surface-muted"
            >
              <p className="font-semibold">{l.label}</p>
              <p className="mt-0.5 text-xs text-muted">{l.desc}</p>
            </Link>
          ))}
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { href: `/be/${id}/lon-cao`, label: '📈 Tăng trưởng', desc: 'Biểu đồ cân nặng & chiều dài' },
          { href: `/be/${id}/cot-moc`, label: '⭐ Cột mốc', desc: 'Phát triển theo giai đoạn' },
          { href: `/be/${id}/tien-chung`, label: '💉 Tiêm chủng', desc: 'Lịch tiêm và trạng thái' },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-lg border border-border bg-surface p-4 text-sm text-fg shadow-card transition-colors hover:bg-surface-muted"
          >
            <p className="font-semibold">{l.label}</p>
            <p className="mt-0.5 text-xs text-muted">{l.desc}</p>
          </Link>
        ))}
      </div>

      {growth.length === 0 && (
        <EmptyState title="Chưa có số đo tăng trưởng" description="Thêm số đo ở trang Tăng trưởng." />
      )}

      {age && <KnowledgeForAge months={age.months} />}
    </div>
  )
}
