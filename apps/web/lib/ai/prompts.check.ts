// Self-check buildChatContext — chạy qua scripts/test-web.sh (node strip-types).
import type { SymptomReport, SymptomSeverity } from '@mevabe/domain'
import { buildChatContext } from './prompts'

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error('prompts.check fail: ' + msg)
}

/** Dựng SymptomReport hợp lệ tối thiểu cho check. */
function sym(symptom: string, severity: SymptomSeverity, started_at: string): SymptomReport {
  return {
    id: symptom,
    family_id: 'f',
    private_owner_id: 'm',
    created_at: started_at,
    updated_at: started_at,
    pregnancy_id: 'p',
    symptom,
    severity,
    started_at,
    ended_at: null,
    note: null,
    source: 'manual',
  }
}

const ctx = buildChatContext({
  week: 20,
  trimester: 'second',
  dueDate: '2026-12-21',
  daysLeft: 140,
  mealCountToday: 3,
  waterLoggedMl: 1400,
  waterGoalMl: 2000,
  taskCount: 7,
  tasksDone: 2,
  recentSymptoms: [
    { symptom: 'Đau lưng nhẹ', severity: 'mild' },
    { symptom: 'Ợ nóng', severity: 'mild' },
  ],
  latestMeasurements: [
    { type: 'weight', value: 62.5, unit: 'kg', taken_at: '2026-08-03T08:00:00+07:00' },
    { type: 'blood_pressure', value: 110, unit: 'mmHg', taken_at: '2026-08-03T08:00:00+07:00' },
  ],
  upcomingAppointments: [{ type: 'ultrasound', scheduled_at: '2026-08-10T08:30:00+07:00' }],
})

assert(ctx.includes('Tuần thai: 20'), 'week')
assert(ctx.includes('62.5 kg'), 'weight')
assert(ctx.includes('110 mmHg'), 'bp')
assert(ctx.includes('Đau lưng nhẹ (mild)'), 'symptom')
assert(ctx.includes('Bữa ăn hôm nay: 3 bữa'), 'meals')
assert(ctx.includes('1400/2000 ml'), 'water')
assert(ctx.includes('ultrasound (2026-08-10)'), 'appointment')
assert(ctx.includes('Còn 5 việc'), 'tasks')
assert(!ctx.includes('còn 0'), 'no zero-task noise')

// ---- buildChatContext với opts.symptoms + lmp: triệu chứng gắn tuần thai ----
const base = {
  week: 20,
  trimester: 'second',
  dueDate: '2026-12-21',
  daysLeft: 140,
  mealCountToday: 0,
  waterLoggedMl: 0,
  waterGoalMl: 0,
  taskCount: 0,
  tasksDone: 0,
  recentSymptoms: [] as { symptom: string; severity: string }[],
  latestMeasurements: [] as { type: string; value: number; unit: string; taken_at: string }[],
  upcomingAppointments: [] as { type: string; scheduled_at: string }[],
}

// LMP 2026-03-16: 2026-08-01 → tuần 19, 2026-07-15 → tuần 17 (completed-weeks quy ước chung).
const ctx2 = buildChatContext(base, {
  lmp: '2026-03-16',
  symptoms: [
    sym('Ợ nóng', 'moderate', '2026-08-01T08:00:00+07:00'),
    sym('Đau lưng', 'mild', '2026-07-15T08:00:00+07:00'),
  ],
})
assert(ctx2.includes('Tuần 19'), 'symptom week 19')
assert(ctx2.includes('Tuần 17'), 'symptom week 17')
assert(ctx2.includes('Ợ nóng'), 'symptom name 1')
assert(ctx2.includes('Đau lưng'), 'symptom name 2')
assert(ctx2.includes('Triệu chứng đã trải qua 2 tuần (từ tuần 17 đến tuần 19)'), 'week span summary')

// Giới hạn tối đa 10 triệu chứng gần nhất (mới nhất trước).
const many = Array.from({ length: 12 }, (_, i) =>
  sym(`Triệu chứng ${i + 1}`, 'mild', `2026-07-${String(25 - i).padStart(2, '0')}T08:00:00+07:00`),
)
const ctx3 = buildChatContext(base, { lmp: '2026-03-16', symptoms: many })
assert(ctx3.includes('Triệu chứng 1'), 'cap keeps newest')
assert(ctx3.includes('Triệu chứng 10'), 'cap keeps 10th')
assert(!ctx3.includes('Triệu chứng 11'), 'cap drops 11th')
assert((ctx3.match(/Triệu chứng \d+/g) ?? []).length === 10, 'exactly 10 symptoms')

console.log('✅ prompts.check OK')
