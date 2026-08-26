// Tính tuổi bé theo ngày sinh (YYYY-MM-DD).
// Quy ước: tháng theo lịch dương (không phải 30 ngày cố định) — gần cách đọc
// tuổi bé hằng ngày ("3 tháng 12 ngày"). Thuần — không import, tự chạy được
// với node (xem baby-age.check.ts).

export interface BabyAge {
  /** Số tháng đủ (0 nếu chưa đủ 1 tháng). */
  months: number
  /** Số ngày lẻ còn lại sau các tháng đủ. */
  days: number
  /** Ví dụ "3 tháng 12 ngày"; chưa đủ 1 tháng → "5 ngày tuổi"; ngày không hợp lệ → "—". */
  label: string
}

export function babyAge(birthDate: string, today: string): BabyAge {
  const b = new Date(`${birthDate}T00:00:00`)
  const t = new Date(`${today}T00:00:00`)
  if (Number.isNaN(b.getTime()) || Number.isNaN(t.getTime()) || b > t) {
    return { months: 0, days: 0, label: '—' }
  }
  let months = (t.getFullYear() - b.getFullYear()) * 12 + (t.getMonth() - b.getMonth())
  let days = t.getDate() - b.getDate()
  if (days < 0) {
    months--
    days += new Date(t.getFullYear(), t.getMonth(), 0).getDate()
  }
  return { months, days, label: months > 0 ? `${months} tháng ${days} ngày` : `${days} ngày tuổi` }
}

export type BabyPhase = 'infant' | 'toddler'

/** Giai đoạn kiến thức theo tháng: dưới 12 tháng → infant (gồm bé dưới 1 tháng); từ 12 tháng → toddler. */
export function babyPhase(months: number): BabyPhase {
  return months < 12 ? 'infant' : 'toddler'
}
