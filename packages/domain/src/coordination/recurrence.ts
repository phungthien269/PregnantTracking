import type { ReminderFrequency } from '../core'

// ===========================================================================
// Sinh nhắc lặp cho reminder: once/daily/weekly/monthly.
// once → không lặp (trả null). Tính theo lịch tháng thật (không cộng 30 ngày).
// ===========================================================================

const DAY_MS = 86_400_000

export function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * DAY_MS)
}

/** Lần tiếp theo sau `from` (độc quyền) theo tần suất. once → null. */
export function nextOccurrence(
  freq: Exclude<ReminderFrequency, 'custom'>,
  from: Date,
): Date | null {
  switch (freq) {
    case 'once':
      return null
    case 'daily':
      return addDays(from, 1)
    case 'weekly':
      return addDays(from, 7)
    case 'monthly': {
      const y = from.getFullYear()
      const m = from.getMonth() + 1
      const t = new Date(y, m, from.getDate(), from.getHours(), from.getMinutes())
      // 31/1 → 31/2 không tồn tại: JS tự roll sang 3/3 → clamp về ngày cuối tháng 2
      const rolledToNextMonth = t.getMonth() !== (m % 12) || t.getFullYear() !== (m > 11 ? y + 1 : y)
      return rolledToNextMonth ? new Date(y, m + 1, 0, from.getHours(), from.getMinutes()) : t
    }
    default:
      return null
  }
}

/** Các lần nhắc trong [from, to] (bao gồm từ `start`, trước `to`). */
export function occurrencesBetween(
  freq: Exclude<ReminderFrequency, 'custom'>,
  start: Date,
  from: Date,
  to: Date,
): Date[] {
  const out: Date[] = []
  if (freq === 'once') {
    return start >= from && start <= to ? [start] : out
  }
  let cur = start
  let n = 0
  while (cur <= to && n < 1000) {
    if (cur >= from) out.push(new Date(cur))
    const next = nextOccurrence(freq, cur)
    if (!next) break
    cur = next
    n++
  }
  return out
}

// ---------------------------------------------------------------------------
// demo
// ---------------------------------------------------------------------------
function demo(): void {
  const assert = (cond: boolean, msg: string): void => {
    if (!cond) throw new Error('recurrence.demo: ' + msg)
  }
  const t = (y: number, m: number, d: number): Date => new Date(y, m, d, 8, 0)
  assert(nextOccurrence('once', t(2026, 0, 1)) === null, 'once → null')
  const daily = nextOccurrence('daily', t(2026, 0, 1))
  assert(daily?.getDate() === 2, 'daily +1 ngày')
  const monthly = nextOccurrence('monthly', t(2026, 0, 31))
  assert(monthly?.getMonth() === 1 && monthly?.getDate() === 28, 'tháng sau 31 → 28/2')
  const weeklies = occurrencesBetween('weekly', t(2026, 0, 1), t(2026, 0, 1), t(2026, 0, 22))
  assert(weeklies.length === 4, '4 tuần liên tiếp')
  console.log('✅ recurrence.ts OK')
}

const isMain = (): boolean =>
  (globalThis as { process?: { argv?: string[] } }).process?.argv?.[1]?.endsWith('recurrence.ts') === true
if (isMain()) demo()
