// ===========================================================================
// pregnancy-nutrition.check.ts — self-check cho module dinh-duong-thai-ky.
// Chạy tự động qua scripts/test-web.sh (tự phát hiện *.check.ts) hoặc trực tiếp:
//   node --experimental-strip-types --import scripts/test-web-loader.mjs \
//     apps/web/lib/knowledge/pregnancy-nutrition.check.ts
// Kiểm tra: (1) topic có đủ section; (2) mọi section kết bằng sources có URL;
// (3) món trong cột "Mã món" của thực đơn trỏ ĐÚNG id trong MEALS (meals-data).
// ===========================================================================
import { topics } from './pregnancy-nutrition'
import { getMeal } from '../nutrition/meals-data'

const assert = (cond: unknown, msg: string): void => {
  if (!cond) throw new Error(`❌ ${msg}`)
}

const topic = topics.find((t) => t.slug === 'dinh-duong-thai-ky')
if (!topic) throw new Error('❌ KHÔNG tìm thấy topic slug="dinh-duong-thai-ky"')

// 1) Đủ các section bắt buộc.
const REQUIRED: string[] = [
  'Năng lượng',
  'Nhóm thực phẩm',
  'Thực đơn mẫu',
  'Bổ sung theo giai đoạn',
  'Mẹo theo tình trạng',
  'Hỏi & đáp',
]
for (const h of REQUIRED) {
  assert(topic.sections.some((s) => s.heading.includes(h)), `Thiếu section "${h}"`)
}
assert(topic.sections.length >= 6, `Mong muốn ≥6 section, có ${topic.sections.length}`)

// 2) Mọi section kết bằng sources; mọi nguồn có org + title + URL.
for (const sec of topic.sections) {
  const last = sec.blocks[sec.blocks.length - 1]
  if (!last || last.kind !== 'sources') {
    throw new Error(`❌ Section "${sec.heading}" không kết bằng khối sources`)
  }
  for (const s of last.sources) {
    assert(s.org && s.org.trim().length > 0, `Source thiếu org (section "${sec.heading}")`)
    assert(s.title && s.title.trim().length > 0, `Source thiếu title (org ${s.org})`)
    assert(typeof s.url === 'string' && s.url.startsWith('http'), `Source thiếu URL hợp lệ (org ${s.org})`)
  }
}

// 3) Thực đơn: mọi id ở cột "Mã món" phải tồn tại trong MEALS.
const MEAL_ID_COL = 'Mã món'
let mealCount = 0
for (const sec of topic.sections) {
  for (const block of sec.blocks) {
    if (block.kind !== 'table') continue
    const idx = block.headers.indexOf(MEAL_ID_COL)
    if (idx < 0) continue
    for (const row of block.rows) {
      const id = (row[idx] ?? '').trim()
      assert(!!id && id !== '-', `Hàng trống mã món (section "${sec.heading}")`)
      assert(getMeal(id) !== undefined, `Món "${id}" (section "${sec.heading}") KHÔNG tồn tại trong MEALS`)
      mealCount++
    }
  }
}
assert(mealCount >= 15, `Số món trong thực đơn quá ít (${mealCount} < 15)`)

console.log(
  `✅ pregnancy-nutrition.check OK — slug="${topic.slug}" · ${topic.sections.length} section · ${mealCount} món hợp lệ trong MEALS · mọi sources có URL`,
)
