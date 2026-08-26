// ===========================================================================
// parse.check.ts — self-check parser triệu chứng (apps/web/lib/import/parse.ts).
// Chạy: cd code && node --experimental-strip-types --import scripts/test-web-loader.mjs apps/web/lib/import/parse.check.ts
// ===========================================================================

import { parseSymptoms, todayIso } from './parse'

const assert = (cond: unknown, msg: string): void => {
  if (!cond) throw new Error(`❌ ${msg}`)
}

let n = 0
const test = (name: string, fn: () => void): void => {
  n++
  try {
    fn()
    console.log(`  ✔ ${n}. ${name}`)
  } catch (e) {
    console.error(`  ✘ ${n}. ${name} — ${(e as Error).message}`)
    throw e
  }
}

test('mỗi dòng 1 triệu chứng, mức nhẹ → mild + ngày YYYY-MM-DD', () => {
  const r = parseSymptoms('Đau đầu | nhẹ | 2026-08-01')
  assert(r.items.length === 1, '1 item')
  assert(r.items[0]!.symptom === 'Đau đầu', 'tên đúng')
  assert(r.items[0]!.severity === 'mild', 'nhẹ → mild')
  assert(r.items[0]!.started_at === '2026-08-01T00:00:00+07:00', 'ISO +07:00 đúng')
  assert(r.errors.length === 0, 'không lỗi')
})

test('mức nặng, ngày dd/mm/yyyy', () => {
  const r = parseSymptoms('Chuột rút chân | nặng | 01/08/2026')
  assert(r.items[0]!.severity === 'severe', 'nặng → severe')
  assert(r.items[0]!.started_at === '2026-08-01T00:00:00+07:00', 'dd/mm/yyyy → ISO')
})

test('mức vừa, ngày dd/mm (năm hiện tại, giờ VN)', () => {
  const r = parseSymptoms('Mệt mỏi | vừa | 4/8')
  assert(r.items[0]!.severity === 'moderate', 'vừa → moderate')
  const y = new Date().getFullYear()
  assert(r.items[0]!.started_at === `${y}-08-04T00:00:00+07:00`, 'dd/mm → ISO năm hiện tại')
})

test('chỉ tên → mặc định mild + hôm nay', () => {
  const r = parseSymptoms('Mệt mỏi')
  assert(r.items[0]!.severity === 'mild', 'mặc định mild')
  assert(r.items[0]!.started_at === todayIso(), 'hôm nay VN')
})

test('tiếng Anh + không dấu: moderate/trung binh', () => {
  const r1 = parseSymptoms('Đau lưng | moderate | 2026-07-30')
  assert(r1.items[0]!.severity === 'moderate', 'moderate')
  const r2 = parseSymptoms('Đau bụng | trung binh')
  assert(r2.items[0]!.severity === 'moderate', 'trung binh (không dấu)')
  const r3 = parseSymptoms('Sốt | NHE | 2026-08-02')
  assert(r3.items[0]!.severity === 'mild', 'NHE hoa + không dấu')
})

test('thứ tự mức/ngày linh hoạt', () => {
  const r = parseSymptoms('Ho | 2026-08-03 | nặng')
  assert(r.items[0]!.severity === 'severe', 'mức sau ngày vẫn nhận')
  assert(r.items[0]!.started_at === '2026-08-03T00:00:00+07:00', 'ngày đúng')
})

test('nhiều dòng + comment + dòng trống', () => {
  const r = parseSymptoms('# danh sách\n\nĐau đầu\nChuột rút chân | nặng')
  assert(r.items.length === 2, '2 item, bỏ qua comment/dòng trống')
  assert(r.errors.length === 0, 'không lỗi')
})

test('dòng không nhận diện → ghi chú, không chặn', () => {
  const r = parseSymptoms('Đau đầu | nhẹ | sau khi ăn')
  assert(r.items.length === 1, '1 item')
  assert(r.items[0]!.note === 'sau khi ăn', 'trường lạ → note')
})

test('mảng JSON hợp lệ', () => {
  const r = parseSymptoms('[{"symptom":"Buồn nôn","severity":"moderate","started_at":"2026-07-30"}]')
  assert(r.items.length === 1, '1 item')
  assert(r.items[0]!.severity === 'moderate', 'severity đúng')
  assert(r.items[0]!.started_at === '2026-07-30T00:00:00+07:00', 'date-only → ISO')
})

test('JSON thiếu severity → mặc định mild', () => {
  const r = parseSymptoms('[{"symptom":"Đau đầu"}]')
  assert(r.items.length === 1 && r.items[0]!.severity === 'mild', 'mặc định mild')
})

test('JSON lỗi cú pháp → báo lỗi', () => {
  const r = parseSymptoms('[{ bad ]')
  assert(r.items.length === 0, '0 item')
  assert(r.errors.length > 0, 'có lỗi')
})

test('mức không nhận diện → coi là ghi chú (khoan dung, không chặn)', () => {
  const r = parseSymptoms('Đau đầu | cực nặng')
  assert(r.items.length === 1, '1 item')
  assert(r.items[0]!.severity === 'mild', 'giữ mặc định mild')
  assert(r.items[0]!.note === 'cực nặng', 'trường lạ → note')
})

test('ngày không hợp lệ (32/13) → lỗi', () => {
  const r = parseSymptoms('Đau đầu | 32/13')
  assert(r.errors.length > 0, 'ngày sai → lỗi')
})

console.log(`\n✅ parse.check OK — ${n} test`)
