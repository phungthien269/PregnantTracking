import Link from 'next/link'
import { data } from '@/lib/data'
import { collectDueNotifications } from '@/lib/inngest/engine'
import { fmtDate, fmtDateTime } from '@/lib/format'
import { APPOINTMENT_LABELS, SEVERITY_LABELS, TRIMESTER_LABELS } from '@/lib/labels'
import { EmergencyCard } from '@/components/emergency-card'
import { Badge, buttonClasses, Card, EmptyState, ProgressRing } from '@mevabe/ui'
import type { SymptomSeverity } from '@mevabe/domain'

const KIND_BADGE: Record<string, { tone: 'primary' | 'warning' | 'neutral' | 'success'; label: string }> = {
  appointment: { tone: 'primary', label: 'Lịch khám' },
  task: { tone: 'warning', label: 'Việc cần làm' },
  milestone: { tone: 'success', label: 'Mốc tuần' },
  reminder: { tone: 'neutral', label: 'Nhắc' },
}

/** Bản tin sáng — tổng quan mỗi sáng: tuần thai, lịch khám, nhắc hôm nay, mục tiêu nước/ăn. */
export async function MorningBrief() {
  const preg = await data.getPregnancy().catch(() => null)
  if (!preg) {
    return (
      <EmptyState
        title="Chưa có hành trình thai kỳ"
        description="Nhập ngày đầu kỳ kinh hoặc ngày dự sinh để xem bản tin sáng theo từng tuần."
        action={
          <Link className={buttonClasses()} href="/onboarding">
            Bắt đầu →
          </Link>
        }
      />
    )
  }

  const dash = await data.getDashboard()
  const [weekInfo, water, due] = await Promise.all([
    data.getWeekInfo(dash.week),
    data.getWaterCaffeine(),
    collectDueNotifications(),
  ])

  const waterPct = water.waterGoalMl > 0 ? (water.waterLoggedMl / water.waterGoalMl) * 100 : 0
  const caffeineOver = water.caffeineLimitMg > 0 && water.caffeineLoggedMg >= water.caffeineLimitMg
  const severeSymptoms = dash.recentSymptoms.filter((s) => s.severity === 'severe')
  const latestBp = dash.latestMeasurements.find((m) => m.type === 'blood_pressure')
  const latestWeight = dash.latestMeasurements.find((m) => m.type === 'weight')

  // Gộp thông báo trùng id (cùng nhắc qua nhiều kênh in_app/email/push).
  const seen = new Set<string>()
  const dueToday = due.filter((n) => {
    if (seen.has(n.id)) return false
    seen.add(n.id)
    return true
  })

  return (
    <div className="space-y-6">
      <EmergencyCard />

      {/* Tuần thai + dự sinh */}
      <section className="rounded-lg border border-border bg-surface p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted">Tuần thai hiện tại</p>
            <p className="mt-1 text-3xl font-semibold text-fg">Tuần {dash.week}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone="primary">{TRIMESTER_LABELS[dash.trimester]}</Badge>
              <span className="text-sm text-muted">Bé ~ {weekInfo.fetalSize}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted">Ngày dự sinh</p>
            <p className="mt-1 text-lg font-semibold text-fg">{fmtDate(dash.dueDate)}</p>
            <p className="mt-1 text-sm text-muted">Còn {dash.daysLeft} ngày</p>
          </div>
        </div>
        <p className="mt-4 border-t border-border pt-3 text-sm text-muted">{dash.dailyInsight}</p>
      </section>

      {/* Mốc nổi bật */}
      <Card title="Mốc nổi bật tuần này" description={`Điều đáng chú ý ở tuần ${dash.week}`}>
        <ul className="space-y-3 text-sm">
          {weekInfo.momChanges.slice(0, 2).map((m, i) => (
            <li key={`m${i}`} className="flex gap-2">
              <span aria-hidden>🌸</span>
              <span className="text-fg">{m}</span>
            </li>
          ))}
          {weekInfo.nutritionFocus.slice(0, 2).map((n, i) => (
            <li key={`n${i}`} className="flex gap-2">
              <span aria-hidden>🥗</span>
              <span className="text-fg">
                Dinh dưỡng: <strong className="font-medium text-fg">{n}</strong>
              </span>
            </li>
          ))}
          {weekInfo.appointmentsDue.slice(0, 2).map((a, i) => (
            <li key={`a${i}`} className="flex gap-2">
              <span aria-hidden>📅</span>
              <span className="text-fg">{a}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Chỉ số & lưu ý */}
        <Card title="Chỉ số & lưu ý" description="Chỉ số đo gần đây và điều mẹ nên để ý hôm nay">
          <div className="space-y-3 text-sm">
            {latestBp && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-fg">Huyết áp gần nhất</span>
                <Badge tone="neutral">
                  {latestBp.value}/{latestBp.diastolic ?? '—'} mmHg
                </Badge>
              </div>
            )}
            {latestWeight && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-fg">Cân nặng gần nhất</span>
                <Badge tone="neutral">{latestWeight.value} kg</Badge>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <span className="text-fg">Caffeine hôm nay</span>
              <Badge tone={caffeineOver ? 'warning' : 'neutral'}>
                {water.caffeineLoggedMg}/{water.caffeineLimitMg} mg
              </Badge>
            </div>
            {severeSymptoms.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3">
                <span className="text-fg">{s.symptom}</span>
                <Badge tone="danger">{SEVERITY_LABELS[s.severity as SymptomSeverity]}</Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Lịch khám sắp tới */}
        <Card
          title="Lịch khám sắp tới"
          action={
            <Link className={buttonClasses('secondary', 'sm')} href="/lich-kham">
              Xem tất cả
            </Link>
          }
        >
          {dash.upcomingAppointments.length ? (
            <ul className="divide-y divide-border">
              {dash.upcomingAppointments.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div>
                    <span className="text-fg">{APPOINTMENT_LABELS[a.type]}</span>
                    {a.location && <p className="text-xs text-muted">{a.location}</p>}
                  </div>
                  <span className="shrink-0 text-xs text-muted">{fmtDateTime(a.scheduled_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Chưa có lịch hẹn" description="Thêm lịch khám ở trang Lịch khám." />
          )}
        </Card>
      </div>

      {/* Nhắc nhở hôm nay */}
      <Card title="Nhắc nhở hôm nay" description="Nhắc đến hạn hôm nay theo giờ Việt Nam">
        {dueToday.length ? (
          <ul className="space-y-3">
            {dueToday.map((n) => {
              const meta = KIND_BADGE[n.kind] ?? KIND_BADGE.reminder!
              return (
                <li key={n.id} className="flex items-start gap-2 text-sm">
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  <div>
                    <p className="text-fg">{n.title}</p>
                    <p className="text-xs text-muted">{n.detail}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <EmptyState title="Không có nhắc hôm nay" description="Mẹ đã nắm mọi việc. Nhớ uống nước và ăn đủ bữa nhé!" />
        )}
      </Card>

      {/* Mục tiêu ngắn + nút đi nhanh */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Nước hôm nay">
          <div className="flex items-center gap-4">
            <ProgressRing value={waterPct} size={64} strokeWidth={6} label="Tiến độ nước" />
            <div>
              <p className="text-sm text-fg">
                {water.waterLoggedMl} / {water.waterGoalMl} ml
              </p>
              <p className="mt-1 text-xs text-muted">{waterPct.toFixed(0)}% mục tiêu</p>
              <Link className={buttonClasses('secondary', 'sm')} href="/nuoc-cafeine">
                Ghi nước →
              </Link>
            </div>
          </div>
        </Card>
        <Card title="Bữa ăn hôm nay">
          <p className="text-2xl font-semibold text-fg">{dash.mealCountToday} bữa</p>
          <p className="mt-1 text-xs text-muted">Đã ghi nhận hôm nay</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link className={buttonClasses('secondary', 'sm')} href="/bo-an">
              Ghi bữa ăn →
            </Link>
            <Link className={buttonClasses('soft', 'sm')} href="/bo-sung">
              💊 Vitamin
            </Link>
            <Link className={buttonClasses('soft', 'sm')} href="/do-luong">
              ⚖️ Đo lường
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
