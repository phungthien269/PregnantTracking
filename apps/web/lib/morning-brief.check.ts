// Self-check "Bản tin sáng" — render dữ liệu (không JSX): lấy đúng các nguồn mà
// MorningBrief dùng, in ra bản tin như component sẽ vẽ, rồi kiểm tra bất biến.
// Chạy: cd code && node --experimental-strip-types --import scripts/test-web-loader.mjs apps/web/lib/morning-brief.check.ts
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { rmSync } from 'node:fs'
import { isDueToday, isAppointmentToday, isTaskDueToday, hcmParts } from './notification-due'
import { todayStr } from './format'

process.env.MEVABE_DB_PATH = join(tmpdir(), `mevabe-morning-brief-${process.pid}.db`)
rmSync(process.env.MEVABE_DB_PATH, { force: true })

async function main(): Promise<void> {
  const { localApi } = await import('./data/local')
  const today = todayStr()
  const todayParts = hcmParts(new Date().toISOString())

  const preg = await localApi.getPregnancy()
  assert.ok(preg, 'có thai kỳ')

  const dash = await localApi.getDashboard()
  const weekInfo = await localApi.getWeekInfo(dash.week)
  const water = await localApi.getWaterCaffeine()
  const reminders = await localApi.getReminders()
  const tasks = await localApi.getTasks()
  const appointments = await localApi.getAppointments()

  // Nhắc hôm nay — cùng lọc như collectDueNotifications/engine.ts.
  const dueToday: string[] = []
  for (const r of reminders) {
    if (!r.active) continue
    if (isDueToday(r.scheduled_at, r.frequency, today, todayParts)) dueToday.push(r.title)
  }
  for (const t of tasks) {
    if (t.status === 'done' || t.status === 'cancelled') continue
    if (isTaskDueToday(t.due_date, today)) dueToday.push(`Task: ${t.title}`)
  }
  const aptToday = appointments.filter((a) => isAppointmentToday(a.scheduled_at, today))

  const upcoming = dash.upcomingAppointments
  const waterPct = water.waterGoalMl > 0 ? Math.round((water.waterLoggedMl / water.waterGoalMl) * 100) : 0
  const severe = dash.recentSymptoms.filter((s) => s.severity === 'severe')

  // --- Render dữ liệu (như MorningBrief sẽ hiển thị) ---
  console.log('===== BẢN TIN SÁNG =====')
  console.log(`Ngày: ${today}`)
  console.log(`Tuần ${dash.week} · ${weekInfo.trimester} · Bé ~ ${weekInfo.fetalSize}`)
  console.log(`Dự sinh: ${dash.dueDate} · còn ${dash.daysLeft} ngày`)
  console.log(`Insight: ${dash.dailyInsight}`)
  console.log(`Mốc: ${weekInfo.momChanges.slice(0, 2).join(' | ')}`)
  console.log(`Dinh dưỡng: ${weekInfo.nutritionFocus.slice(0, 2).join(', ')}`)
  console.log(`Caffeine: ${water.caffeineLoggedMg}/${water.caffeineLimitMg} mg`)
  console.log(`Nước: ${water.waterLoggedMl}/${water.waterGoalMl} ml (${waterPct}%)`)
  console.log(`Bữa ăn hôm nay: ${dash.mealCountToday}`)
  console.log(`Lịch khám sắp tới: ${upcoming.map((a) => a.type).join(', ') || '—'}`)
  console.log(`Khám hôm nay: ${aptToday.length} lịch`)
  console.log(`Nhắc hôm nay: ${dueToday.join('; ') || '—'}`)
  console.log(`Cảnh báo nặng: ${severe.map((s) => s.symptom).join('; ') || 'không có'}`)

  // --- Bất biến render ---
  assert.ok(dash.week >= 1 && dash.week <= 42, 'tuần trong khoảng 1..42')
  assert.ok(dash.dueDate && dash.daysLeft > 0, 'có dự sinh + daysLeft')
  assert.ok(weekInfo.fetalSize, 'có fetalSize')
  assert.ok(weekInfo.momChanges.length >= 1, 'có mốc momChanges')
  assert.ok(water.waterGoalMl > 0, 'có mục tiêu nước')
  assert.ok(upcoming.length >= 1, 'mock seed có lịch khám sắp tới')
  assert.ok(dueToday.length >= 1, 'mock seed có nhắc hằng ngày (vitamin…)')
  assert.ok(appointments.every((a) => a.type), 'appointment có type hợp lệ')
  console.log('✅ morning-brief selfcheck OK')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
