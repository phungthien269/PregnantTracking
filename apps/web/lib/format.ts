// Định dạng ngày theo múi giờ Việt Nam (ADR-006).
// Dùng Intl.DateTimeFormat native — date-fns v4 không hỗ trợ timeZone nếu thiếu
// addon @date-fns/tz (không được thêm dependency).

export const VN_TZ = 'Asia/Ho_Chi_Minh'

const dayFmt = new Intl.DateTimeFormat('vi-VN', {
  timeZone: VN_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const dateTimeFmt = new Intl.DateTimeFormat('vi-VN', {
  timeZone: VN_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

/** en-CA -> yyyy-MM-dd */
const isoFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: VN_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const dayMonthFmt = new Intl.DateTimeFormat('vi-VN', {
  timeZone: VN_TZ,
  month: '2-digit',
  day: '2-digit',
})

export function fmtDate(d: string | Date): string {
  return dayFmt.format(new Date(d))
}

/** dd/MM — dùng làm nhãn trục biểu đồ. */
export function fmtDayMonth(d: string | Date): string {
  return dayMonthFmt.format(new Date(d))
}

export function fmtDateTime(d: string | Date): string {
  return dateTimeFmt.format(new Date(d))
}

/** Ngày hôm nay theo giờ VN, dạng yyyy-MM-dd (khoá lọc dữ liệu). */
export function todayStr(): string {
  return isoFmt.format(new Date())
}
