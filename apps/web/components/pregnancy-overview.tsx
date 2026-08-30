// components/pregnancy-overview.tsx — Hero tuần thai + việc cần làm + lịch khám
// (R-UX: gọn — chi tiết dinh dưỡng/vận động đã về /dinh-duong và /tuan/[week]).
// Server component: nhận `dash` từ trang, tự nạp weekInfo / lịch khám / reminder / nước.
import Link from 'next/link'
import { data, type DashboardSummary } from '@/lib/data'
import { fmtDate, fmtDateTime } from '@/lib/format'
import { APPOINTMENT_LABELS, TRIMESTER_LABELS } from '@/lib/labels'
import { hcmParts, isDueToday } from '@/lib/notification-due'
import { DEFAULT_APPOINTMENT_SCHEDULE } from '@mevabe/domain'
import { Badge, buttonClasses, Card } from '@mevabe/ui'
import { todayStr } from '@/lib/format'

export async function PregnancyOverview({
  dash,
  isMulti,
  fetusCount,
}: {
  dash: DashboardSummary
  isMulti: boolean
  fetusCount: number
}) {
  const [weekInfo, appointments, reminders, water] = await Promise.all([
    data.getWeekInfo(dash.week),
    data.getAppointments(),
    data.getReminders(),
    data.getWaterCaffeine(),
  ])

  // Reminder đến hạn hôm nay theo giờ VN — cùng pattern lib/notification-due.
  const today = todayStr()
  const todayParts = hcmParts(new Date().toISOString())
  const dueReminders = reminders
    .filter((r) => r.active && isDueToday(r.scheduled_at, r.frequency, today, todayParts))
    .slice(0, 3)

  // Lịch khám còn ở phía trước (sớm nhất trước).
  const upcoming = appointments
    .filter((a) => new Date(a.scheduled_at).getTime() > Date.now())
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))

  // Mốc khám/sàng lọc quan trọng kế tiếp theo lịch mẫu (domain).
  const nextMilestone = DEFAULT_APPOINTMENT_SCHEDULE.find((a) => a.week > dash.week)

  const waterPct = water.waterGoalMl > 0 ? Math.round((water.waterLoggedMl / water.waterGoalMl) * 100) : 0

  return (
    <div className="space-y-6">
      {/* 1. Hero tuần hiện tại — gọn: tuần + dự sinh + bé + liên kết nhanh */}
      <section className="rounded-lg border border-border bg-surface p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-muted">Tuần thai hiện tại</p>
            <p className="mt-1 text-3xl font-semibold text-fg">Tuần {dash.week}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="primary">{TRIMESTER_LABELS[dash.trimester]}</Badge>
              {isMulti && <Badge tone="accent">Đa thai · {fetusCount} bé</Badge>}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted">Ngày dự sinh</p>
            <p className="mt-1 text-lg font-semibold text-fg">{fmtDate(dash.dueDate)}</p>
            <p className="mt-1 text-sm text-muted">Còn {dash.daysLeft} ngày</p>
          </div>
        </div>
        <div className="mt-4 border-t border-border pt-3">
          <p className="text-sm text-fg">
            <span className="font-medium text-primary-strong">Bé đang lớn như {weekInfo.fetalSize}</span>
            {(weekInfo.fetalLengthCm || weekInfo.fetalWeightG) && (
              <span className="text-muted">
                {' '}· {weekInfo.fetalLengthCm ? `${weekInfo.fetalLengthCm} cm` : ''}
                {weekInfo.fetalLengthCm && weekInfo.fetalWeightG ? ' · ' : ''}
                {weekInfo.fetalWeightG ? `${weekInfo.fetalWeightG} g` : ''}
              </span>
            )}
          </p>
          {weekInfo.momChanges[0] && <p className="mt-1 text-sm text-muted">🌸 {weekInfo.momChanges[0]}</p>}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link className={buttonClasses('secondary', 'sm')} href={`/tuan/${dash.week}`}>
            Chi tiết tuần này →
          </Link>
          <Link className={buttonClasses('soft', 'sm')} href="/lich-kham">
            📅 Lịch khám
          </Link>
          <Link className={buttonClasses('soft', 'sm')} href="/do-luong">
            ⚖️ Đo lường
          </Link>
          <Link className={buttonClasses('soft', 'sm')} href="/dinh-duong">
            🥗 Dinh dưỡng
          </Link>
        </div>
      </section>

      {/* 2. Việc cần làm hôm nay | Lịch khám sắp tới */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Việc cần làm"
          description="Checklist tuần này · nhắc hôm nay · nước"
          action={
            <Link className={buttonClasses('secondary', 'sm')} href="/cong-viec">
              Xem tất cả
            </Link>
          }
        >
          <ul className="space-y-2">
            {weekInfo.todo.slice(0, 3).map((t) => (
              <li key={t} className="flex items-start gap-2 text-sm text-fg">
                <span aria-hidden className="mt-0.5 text-primary-strong">
                  ☐
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
          {dueReminders.length > 0 && (
            <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
              {dueReminders.map((r) => (
                <li key={r.id} className="flex items-start gap-2 text-sm text-fg">
                  <span aria-hidden>⏰</span>
                  <span>{r.title}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3 text-sm">
            <span className="font-medium text-fg">💧 Nước · caffeine</span>
            <span className="text-xs text-muted">
              {water.waterLoggedMl}/{water.waterGoalMl} ml ({waterPct}%) · {water.caffeineLoggedMg}/
              {water.caffeineLimitMg} mg
            </span>
          </div>
          <div className="mt-3">
            <Link className={buttonClasses('soft', 'sm')} href="/nuoc-cafeine">
              Ghi nước →
            </Link>
          </div>
        </Card>

        <Card
          title="Lịch khám sắp tới"
          description="Lịch hẹn còn phía trước"
          action={
            <Link className={buttonClasses('secondary', 'sm')} href="/lich-kham">
              Xem tất cả
            </Link>
          }
        >
          {upcoming.length ? (
            <ul className="space-y-2">
              {upcoming.slice(0, 3).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-fg">{APPOINTMENT_LABELS[a.type]}</span>
                  <span className="shrink-0 text-xs text-muted">{fmtDateTime(a.scheduled_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Chưa có lịch hẹn phía trước — thêm ở trang Lịch khám.</p>
          )}

          {(weekInfo.appointmentsDue.length > 0 || nextMilestone) && (
            <div className="mt-4 border-t border-border pt-3">
              {weekInfo.appointmentsDue.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted">Khám/sàng lọc nên làm tuần này</p>
                  {weekInfo.appointmentsDue.slice(0, 2).map((a) => (
                    <p key={a} className="text-sm text-fg">
                      📅 {a}
                    </p>
                  ))}
                </div>
              )}
              {nextMilestone && (
                <div className={weekInfo.appointmentsDue.length > 0 ? 'mt-3' : ''}>
                  <p className="text-xs font-medium text-muted">Mốc khám quan trọng kế tiếp</p>
                  <p className="mt-0.5 text-sm font-medium text-fg">
                    Tuần {nextMilestone.week} · {nextMilestone.title}
                  </p>
                  <p className="text-xs text-muted">
                    {nextMilestone.note} — còn {nextMilestone.week - dash.week} tuần nữa.
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
