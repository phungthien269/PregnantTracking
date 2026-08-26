// components/pregnancy-overview.tsx — Tóm tắt đầy đủ hành trình thai kỳ hiện tại
// cho trang chủ (dashboard). Server component: nhận `dash` từ trang, tự nạp thêm
// weekInfo / lịch khám / reminder / nước. Chỉ IMPORT dữ liệu dinh dưỡng
// (getWeeklyFocus) — không sửa lib/data, lib/knowledge hay tuan/**.
import Link from 'next/link'
import { data, type DashboardSummary } from '@/lib/data'
import { fmtDate, fmtDateTime, todayStr } from '@/lib/format'
import { APPOINTMENT_LABELS, TRIMESTER_LABELS } from '@/lib/labels'
import { getNutrientReference, getWeeklyFocus } from '@/lib/nutrition'
import { hcmParts, isDueToday } from '@/lib/notification-due'
import { DEFAULT_APPOINTMENT_SCHEDULE, type Trimester } from '@mevabe/domain'
import { Badge, buttonClasses, Card } from '@mevabe/ui'

/** Gợi ý ngắn vận động & giấc ngủ theo tam cá nguyệt (knowledge lifestyle-exercise-sleep). */
const LIFESTYLE_TIPS: Record<Trimester, { exercise: string; sleep: string }> = {
  first: {
    exercise: 'Vận động nhẹ, chia nhỏ 5–10 phút; tránh quá nóng và môn dễ ngã.',
    sleep: 'Buồn ngủ nhiều hơn — ngủ đủ 7–10 giờ/đêm.',
  },
  second: {
    exercise: 'Giai đoạn nhiều năng lượng — vận động ≥150 phút/tuần cường độ vừa.',
    sleep: 'Giấc ngủ tốt nhất thai kỳ — duy trì 7–8 giờ, tập nằm nghiêng.',
  },
  third: {
    exercise: 'Giảm cường độ — đi bộ nhẹ, hít thở, giãn cơ chuẩn bị sinh.',
    sleep: 'Nằm nghiêng khi ngủ (từ tuần 28), kê gối đỡ bụng và chân.',
  },
}

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
  const weekFocus = getWeeklyFocus(dash.week)
  const tips = LIFESTYLE_TIPS[dash.trimester]

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
      {/* 1. Tuần hiện tại nổi bật */}
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

      {/* 2. Trọng tâm tuần này: dinh dưỡng + vận động/giấc ngủ */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          title="Dinh dưỡng tuần này"
          description={
            weekFocus ? `${weekFocus.phaseLabel} · tuần ${weekFocus.weekStart}–${weekFocus.weekEnd}` : `Tuần ${dash.week}`
          }
        >
          {weekFocus ? (
            <div className="space-y-3">
              <ul className="space-y-2">
                {weekFocus.focus.slice(0, 3).map((f) => (
                  <li key={f.nutrientId} className="border-l-2 border-border pl-3">
                    <p className="text-sm font-medium text-fg">
                      {getNutrientReference(f.nutrientId)?.name ?? f.nutrientId}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">{f.reason}</p>
                  </li>
                ))}
              </ul>
              {weekFocus.dailyGoals && (
                <p className="rounded-md bg-accent-soft/40 p-3 text-xs leading-relaxed text-success">
                  🎯 {weekFocus.dailyGoals}
                </p>
              )}
              <div>
                <p className="text-xs font-medium text-muted">Thực phẩm gợi ý</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {weekFocus.suggestedFoods.slice(0, 6).map((f) => (
                    <span key={f} className="rounded-full bg-accent-soft px-2.5 py-0.5 text-xs text-success">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">Chưa có hướng dẫn dinh dưỡng cho tuần này.</p>
          )}
          <div className="mt-3">
            <Link className={buttonClasses('secondary', 'sm')} href="/dinh-duong">
              Xem khuyến nghị đầy đủ →
            </Link>
          </div>
        </Card>

        <Card title="Vận động & giấc ngủ" description={TRIMESTER_LABELS[dash.trimester]}>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2">
              <span aria-hidden>🏃‍♀️</span>
              <span className="text-fg">{tips.exercise}</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden>😴</span>
              <span className="text-fg">{tips.sleep}</span>
            </li>
          </ul>
          <p className="mt-4 border-t border-border pt-3 text-xs text-muted">
            Khuyến nghị tham khảo ACOG/WHO/NHS — không thay thế tư vấn bác sĩ.
          </p>
        </Card>
      </div>

      {/* 3. Việc cần làm / checklist */}
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
            <span className="font-medium text-fg">💧 Nước hôm nay</span>
            <span className="text-xs text-muted">
              {water.waterLoggedMl} / {water.waterGoalMl} ml ({waterPct}%)
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
