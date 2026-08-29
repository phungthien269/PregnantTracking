import Link from 'next/link'
import { data } from '@/lib/data'
import { generateInsight } from '@/lib/ai'
import { fmtDate, fmtDayMonth, fmtDateTime, todayStr } from '@/lib/format'
import { APPOINTMENT_LABELS, MEAL_LABELS, SEVERITY_LABELS, TRIMESTER_LABELS } from '@/lib/labels'
import { EmergencyCard } from '@/components/emergency-card'
import { PageHeader } from '@/components/page-header'
import { LineChart } from '@/components/line-chart'
import { PregnancyOverview } from '@/components/pregnancy-overview'
import { Badge, buttonClasses, Card, EmptyState, ProgressRing, StatCard } from '@mevabe/ui'
import type { MealType, SymptomSeverity } from '@mevabe/domain'
import { fetusDisplayName, fetusSummary } from '@/lib/multi-fetus'

export default async function DashboardPage() {
  // A2 (perf): 1 lượt getHomeBundle thay 6 gọi riêng; tầng chưa implement → fallback cũ.
  const bundle = data.getHomeBundle
    ? await data.getHomeBundle()
    : await (async () => {
        const pregnancy = await data.getPregnancy().catch(() => null)
        if (!pregnancy) return null
        const [dashboard, mealsToday, water, fetuses, birthRecord] = await Promise.all([
          data.getDashboard(),
          data.getMealsByDate(todayStr()),
          data.getWaterCaffeine(),
          data.getFetuses(),
          data.getBirthRecord().catch(() => null),
        ])
        return { pregnancy, dashboard, mealsToday, water, fetuses, birthRecord }
      })()
  if (!bundle?.pregnancy) {
    return (
      <div className="space-y-6">
        <PageHeader title="Chào mừng" description="Tạo hành trình thai kỳ để bắt đầu theo dõi." />
        <EmptyState
          title="Chưa có hành trình thai kỳ"
          description="Nhập ngày đầu kỳ kinh hoặc ngày dự sinh để xem thông tin theo từng tuần."
          action={
            <Link className={buttonClasses()} href="/onboarding">
              Bắt đầu →
            </Link>
          }
        />
      </div>
    )
  }
  const { pregnancy: preg, dashboard: dash, mealsToday: meals, water, fetuses, birthRecord: birth } = bundle
  // getFetuses() trả toàn bộ thai của gia đình → lọc theo thai kỳ đang theo dõi.
  const activeFetuses = fetuses.filter((f) => f.pregnancy_id === preg.id)
  const isMulti = activeFetuses.length > 1

  // Insight tiếng Việt — AI nếu có key, ngược lại fallback template theo tuần.
  // ponytail: gọi AI mỗi lần load; thêm cache (vd theo ngày) khi đi production.
  const insight = await generateInsight({
    week: dash.week,
    trimester: dash.trimester,
    measurements: dash.latestMeasurements,
    symptoms: dash.recentSymptoms,
    mealCountToday: dash.mealCountToday,
  })

  const weightPoints = dash.latestMeasurements
    .filter((m) => m.type === 'weight')
    .map((m) => ({ label: fmtDayMonth(m.taken_at), value: m.value }))
  const waterPct = dash.waterGoalMl > 0 ? (dash.waterLoggedMl / dash.waterGoalMl) * 100 : 0

  return (
    <div className="space-y-6">
      <EmergencyCard />

      {/* Bản tin sáng hôm nay — tóm tắt nhanh, bấm xem đầy đủ */}
      <section className="rounded-lg border border-border bg-surface p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-fg">🌅 Bản tin sáng hôm nay</p>
            <p className="mt-1 text-2xl font-semibold text-fg">
              Tuần {dash.week} · {TRIMESTER_LABELS[dash.trimester]}
            </p>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">{dash.dailyInsight}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              {dash.upcomingAppointments[0] && (
                <span>📅 {APPOINTMENT_LABELS[dash.upcomingAppointments[0].type]}</span>
              )}
              <span>💧 {dash.waterLoggedMl}/{dash.waterGoalMl} ml</span>
              <span>🍽 {dash.mealCountToday} bữa hôm nay</span>
            </div>
          </div>
          <Link className={buttonClasses('secondary', 'sm')} href="/ban-tin-sang">
            Xem đầy đủ →
          </Link>
        </div>
      </section>

      {/* Đã sinh — chuyển hậu sản */}
      {birth && (
        <section className="rounded-lg border border-border bg-surface p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-2xl font-semibold text-fg">Đã sinh 🎉</p>
              <p className="mt-1 text-sm text-muted">
                Giai đoạn thai kỳ kết thúc — chuyển sang theo dõi bé & chăm sóc sau sinh.
              </p>
            </div>
            <Link className={buttonClasses()} href="/hau-san">
              Chăm sóc sau sinh →
            </Link>
          </div>
        </section>
      )}

      {/* Khu vực thai kỳ — tóm tắt đầy đủ hành trình: tuần nổi bật, trọng tâm tuần,
          việc cần làm, lịch khám & mốc sắp tới, nút đi nhanh. */}
      <PregnancyOverview dash={dash} isMulti={isMulti} fetusCount={activeFetuses.length} />

      {/* Đa thai — theo dõi riêng từng bé */}
      {isMulti && (
        <section className="rounded-lg border border-border bg-surface p-5 shadow-card">
          <p className="text-sm font-medium text-fg">Theo dõi từng bé</p>
          <p className="mt-0.5 text-xs text-muted">
            Các bé cùng tuổi thai (tuần {dash.week}) và cùng ngày dự sinh {fmtDate(dash.dueDate)}; chỉ số phát
            triển từng bé có thể khác nhau — tham khảo bác sĩ khi khám.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeFetuses.map((f) => (
              <div key={f.id} className="rounded-lg border border-border bg-primary-soft p-4">
                <p className="text-lg font-semibold text-fg">{fetusDisplayName(f)}</p>
                {fetusSummary(f) ? (
                  <p className="mt-1 text-sm text-muted">{fetusSummary(f)}</p>
                ) : (
                  <p className="mt-1 text-xs text-muted">Thai thứ {f.birth_order}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Chỉ số */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Việc cần làm" value={`${dash.tasksDone}/${dash.taskCount}`} hint="đã hoàn thành" />
        <StatCard label="Bữa ăn hôm nay" value={dash.mealCountToday} hint="đã ghi nhận" tone="accent" />
        <StatCard
          label="Lịch khám sắp tới"
          value={dash.upcomingAppointments.length}
          hint={dash.upcomingAppointments[0] ? APPOINTMENT_LABELS[dash.upcomingAppointments[0].type] : 'chưa có'}
        />
        <div className="rounded-lg border border-border bg-surface p-4 shadow-card">
          <p className="text-xs text-muted">Nước hôm nay</p>
          <div className="mt-1 flex items-center gap-3">
            <ProgressRing value={waterPct} size={56} strokeWidth={6} label={`Nước: ${waterPct.toFixed(0)}%`} />
            <p className="text-sm text-muted">
              {dash.waterLoggedMl} / {dash.waterGoalMl} ml
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Insight ngày */}
        <Card title="Insight hôm nay" description="Gợi ý nhẹ cho mẹ">
          <p className="text-sm text-fg">{insight.insight}</p>
          {insight.ai && (
            <p className="mt-1 text-xs text-muted">
              ✨ {insight.provider}/{insight.model}
            </p>
          )}
          <p className="mt-2 text-xs text-muted">
            Caffeine: {water.caffeineLoggedMg}/{water.caffeineLimitMg} mg — chỉ theo dõi, không khuyến cáo cứng.
          </p>
        </Card>

        {/* Xu hướng cân nặng */}
        <Card title="Xu hướng cân nặng" description="Dựa trên các lần đo gần đây">
          {weightPoints.length ? (
            <LineChart data={weightPoints} yUnit=" kg" />
          ) : (
            <EmptyState title="Chưa có số đo" description="Vào Đo lường để thêm lần đo đầu tiên." />
          )}
        </Card>

        {/* Bữa ăn hôm nay */}
        <Card title="Bữa ăn hôm nay" description={fmtDate(todayStr())}>
          {meals.length ? (
            <ul className="divide-y divide-border">
              {meals.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div>
                    <Badge tone="accent">{MEAL_LABELS[m.meal_type as MealType]}</Badge>
                    <span className="ml-2 text-fg">{m.name}</span>
                  </div>
                  <span className="shrink-0 text-xs text-muted">{fmtDateTime(m.logged_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Chưa có bữa ăn" description="Ghi nhanh bữa ăn hôm nay ở trang Bữa ăn." />
          )}
        </Card>

        {/* Triệu chứng gần đây */}
        <Card title="Triệu chứng gần đây">
          {dash.recentSymptoms.length ? (
            <ul className="divide-y divide-border">
              {dash.recentSymptoms.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-fg">{s.symptom}</span>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      tone={s.severity === 'severe' ? 'danger' : s.severity === 'moderate' ? 'warning' : 'neutral'}
                    >
                      {SEVERITY_LABELS[s.severity as SymptomSeverity]}
                    </Badge>
                    <span className="text-xs text-muted">{fmtDate(s.started_at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Không có triệu chứng" description="Mẹ khỏe! Nếu có dấu hiệu bất thường, ghi ở trang Triệu chứng." />
          )}
        </Card>
      </div>

    </div>
  )
}
export const dynamic = 'force-dynamic'
