// ===========================================================================
// export-csv.check.ts — tự kiểm tra CSV xuất dữ liệu gia đình:
//   - escape RFC4180 (quote "", dấu phẩy, xuống dòng)
//   - đủ bảng, thứ tự ổn định, header tiếng Việt (không rò tên field gốc)
//   - assembleCsv có BOM; parse lại được (round-trip trả đúng giá trị)
// Chạy:
//   cd apps/web && node --experimental-strip-types --import ./lib/library/node-loader.mjs lib/export-csv.check.ts
// ===========================================================================

import {
  COLUMNS,
  TABLE_LABELS,
  TABLE_ORDER,
  VI,
  assembleCsv,
  csvCell,
  toCsv,
  type Row,
} from './export-csv'

const assert = (cond: unknown, msg: string): void => {
  if (!cond) throw new Error(`❌ ${msg}`)
  console.log(`  ✔ ${msg}`)
}

/** Parse CSV tối giản (RFC4180) — đủ cho round-trip trong check. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let cur = ''
  let row: string[] = []
  let inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"'
          i++
        } else inQ = false
      } else cur += c
    } else if (c === '"') inQ = true
    else if (c === ',') {
      row.push(cur)
      cur = ''
    } else if (c === '\n') {
      row.push(cur)
      rows.push(row)
      row = []
      cur = ''
    } else cur += c
  }
  if (cur !== '' || row.length) {
    row.push(cur)
    rows.push(row)
  }
  return rows
}

let n = 0
const ok = (cond: unknown, msg: string): void => {
  n++
  if (!cond) throw new Error(`❌ #${n}: ${msg}`)
}
const log = (msg: string): void => console.log(`  ✔ #${n}: ${msg}`)

// ---- 1. Escape cơ bản ----
console.log('1. Escape RFC4180')
assert(csvCell('đơn giản') === 'đơn giản', 'chuỗi thường (kèm dấu tiếng Việt)')
assert(csvCell('a,b') === '"a,b"', 'dấu phẩy → bọc ngoặc kép')
assert(csvCell('a"b') === '"a""b"', 'ngoặc kép → nhân đôi')
assert(csvCell('a\nb') === '"a\nb"', 'xuống dòng → bọc ngoặc kép')
assert(csvCell(null) === '' && csvCell(undefined) === '', 'null/undefined → ô trống')
assert(csvCell(123) === '123', 'số giữ nguyên')

// ---- 2. toCsv: cột + header tiếng Việt ----
console.log('2. toCsv với cột chỉ định')
const rows: Row[] = [
  { id: 'r1', name: 'Phở gà, bánh mì', note: 'Thêm "hành" và\nớt', unused: 'bỏ qua' },
]
const csv = toCsv(rows, ['id', 'name', 'note'])
ok(csv.split('\n')[0] === 'ID,Tên,Ghi chú', 'header là tiếng Việt')
ok(!csv.includes('unused'), 'cột không khai báo bị lược')
ok(parseCsv(csv)[1]![1] === 'Phở gà, bánh mì' && parseCsv(csv)[1]![2] === 'Thêm "hành" và\nớt', 'round-trip phẩy/ngoặc/xuống dòng')
log('toCsv đúng header + round-trip')

// ---- 3. Catalog bảng ----
console.log('3. Catalog bảng')
ok(TABLE_ORDER.length >= 10, `đủ ≥10 bảng, hiện ${TABLE_ORDER.length}`)
for (const name of [
  'pregnancy',
  'fetuses',
  'measurements',
  'symptoms',
  'appointments',
  'meals',
  'hydration_logs',
  'caffeine_logs',
  'children',
  'tasks',
  'shopping',
  'budget',
  'question_reports',
]) {
  ok(TABLE_ORDER.includes(name), `bảng ${name} có trong TABLE_ORDER`)
  ok(!!TABLE_LABELS[name], `bảng ${name} có nhãn tiếng Việt`)
  const cols = COLUMNS[name]
  ok(Array.isArray(cols) && cols.length > 0, `bảng ${name} có cột`)
  for (const col of cols ?? []) ok(VI[col] !== undefined, `bảng ${name}.${col} có nhãn tiếng Việt`)
}
const unique = new Set(TABLE_ORDER).size === TABLE_ORDER.length
ok(unique, 'thứ tự bảng không trùng')
log('đủ 13 bảng, cột + nhãn tiếng Việt đầy đủ')

// ---- 4. assembleCsv: BOM + round-trip toàn file ----
console.log('4. assembleCsv — BOM + parse lại được')
const samples: Record<string, Row[]> = {
  pregnancy: [{ id: 'p-1', lmp: '2026-03-16', edd: '2026-12-21', status: 'ongoing', notes: null, source: 'manual', created_at: '2026-08-03T00:00:00+07:00', updated_at: '2026-08-03T00:00:00+07:00' }],
  meals: [
    { id: 'm-1', meal_type: 'breakfast', name: 'Phở gà, bánh mì', logged_at: '2026-08-03T07:00:00+07:00', calories: 450, note: 'Thêm "hành" và, xuống\ndòng', source: 'manual', created_at: '2026-08-03T07:00:00+07:00', updated_at: '2026-08-03T07:00:00+07:00' },
    { id: 'm-2', meal_type: 'lunch', name: 'Cơm cá', logged_at: '2026-08-03T12:00:00+07:00', calories: null, note: null, source: 'manual', created_at: '2026-08-03T12:00:00+07:00', updated_at: '2026-08-03T12:00:00+07:00' },
  ],
  question_reports: [{ id: 'q-1', quiz_question_id: '40000000-0000-0000-0000-0000000000aa', reporter_id: 'r-1', reason: 'Sai đáp án, cần sửa', status: 'open', created_at: '2026-08-03T10:00:00+07:00', updated_at: '2026-08-03T10:00:00+07:00' }],
}
const full = assembleCsv(samples)
ok(full.charCodeAt(0) === 0xfeff, 'file bắt đầu bằng BOM U+FEFF')
ok(full.slice(1).startsWith('# Thai kỳ'), 'section đầu tiên là bảng đầu tiên')
ok(!full.slice(1).includes('private_owner_id') && !full.includes('family_id'), 'không rò cột nội bộ family_id/private_owner_id')

// Bóc BOM rồi tách theo dòng `# Bảng`.
const body = full.slice(1)
const blocks = body.split(/\n(?=# )/)
ok(blocks.length === TABLE_ORDER.length, `đủ ${TABLE_ORDER.length} block bảng`)

const mealsBlock = blocks.find((b) => b.startsWith('# Bữa ăn'))!
const parsedMeals = parseCsv(mealsBlock.replace(/^# [^\n]+\n/, ''))
ok(parsedMeals[0]![0] === 'ID' && parsedMeals[0]!.includes('Năng lượng (kcal)'), 'header bảng Bữa ăn là tiếng Việt')
ok(parsedMeals[1]![2] === 'Phở gà, bánh mì', 'round-trip: dấu phẩy trong tên món')
ok(parsedMeals[1]![4] === '450', 'round-trip: số calories')
ok(parsedMeals[1]![5] === 'Thêm "hành" và, xuống\ndòng', 'round-trip: ngoặc kép + phẩy + xuống dòng')
ok(parsedMeals[2]![4] === '' && parsedMeals[2]![5] === '', 'round-trip: null → ô trống')

const pregBlock = blocks.find((b) => b.startsWith('# Thai kỳ'))!
const parsedPreg = parseCsv(pregBlock.replace(/^# [^\n]+\n/, ''))
ok(parsedPreg[1]![1] === '2026-03-16' && parsedPreg[1]![2] === '2026-12-21', 'round-trip: dữ liệu thai kỳ')

const qrBlock = blocks.find((b) => b.startsWith('# Báo lỗi câu hỏi'))!
const parsedQr = parseCsv(qrBlock.replace(/^# [^\n]+\n/, ''))
ok(parsedQr[1]![3] === 'Sai đáp án, cần sửa' && parsedQr[1]![4] === 'open', 'round-trip: báo lỗi câu hỏi')

console.log('\n✅ export-csv.check OK — BOM, escape, 13 bảng, header tiếng Việt, round-trip')
