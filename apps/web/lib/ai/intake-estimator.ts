// ===========================================================================
// intake-estimator.ts — AI ước lượng vi chất cho món/TPCN không có số liệu
// chính xác (Agent 6J). CHỈ import `lib/ai/client` (không sửa file ai/*).
//
// Quy tắc:
//  - Thiếu OPENROUTER_API_KEY / lỗi mạng / JSON không parse được → trả `null`
//    (KHÔNG crash). Caller gắn `estimated=true`, nutrients rỗng, vẫn lưu log.
//  - Output chuẩn hóa JSON dùng ĐÚNG id vi chất của nutrient-reference-data.ts
//    (energy, protein, folate, iron, calcium, vitamin_d, dha, iodine, zinc,
//    vitamin_b12, choline, vitamin_c, fiber, water, vitamin_a).
// ===========================================================================

import { chatCompletion } from './client'
import { NUTRIENT_IDS } from '../nutrition/intake-calcs'
import type { IntakeItemInput, NutrientValueMap } from '../data/api'

const UNITS: Record<(typeof NUTRIENT_IDS)[number], string> = {
  energy: 'kcal',
  protein: 'g',
  folate: 'mcg',
  iron: 'mg',
  calcium: 'mg',
  vitamin_d: 'IU',
  dha: 'mg',
  iodine: 'mcg',
  zinc: 'mg',
  vitamin_b12: 'mcg',
  choline: 'mg',
  vitamin_c: 'mg',
  fiber: 'g',
  water: 'L',
  vitamin_a: 'mcg RAE',
}

const SYSTEM_PROMPT = `Bạn là chuyên gia dinh dưỡng thai kỳ. Ước lượng hàm lượng VI CHẤT của một món ăn/thực phẩm chức năng theo khẩu phần người dùng nhập.
Trả về JSON THUẦN (không markdown, không chú thích) dạng object, key là id vi chất (chỉ dùng các key sau), value là số ≥ 0:
${Object.entries(UNITS)
  .map(([id, unit]) => `- "${id}": số ${unit}`)
  .join('\n')}
Quy tắc:
- Chỉ đưa vào các chất có đóng góp đáng kể; chất không ước lượng được thì bỏ qua (không để 0 tràn lan).
- vitamin_d tính bằng IU (1 mcg = 40 IU). dha tính bằng mg EPA+DHA. water tính bằng lít (L).
- Nếu là thực phẩm chức năng: nhân hàm lượng mỗi viên với số viên/ngày.
- Dữ liệu giáo dục sức khỏe, không khuyến nghị y khoa.`

function buildUserPrompt(item: Pick<IntakeItemInput, 'kind' | 'name' | 'amount_g' | 'qty' | 'dose_mg' | 'pills' | 'note'>): string {
  const parts: string[] = []
  if (item.kind === 'meal') parts.push('Đây là một bữa ăn/món ăn đã ăn.')
  if (item.kind === 'food') parts.push('Đây là một loại thực phẩm đơn lẻ.')
  if (item.kind === 'supplement') parts.push('Đây là thực phẩm chức năng / vitamin bổ sung.')
  if (item.kind === 'custom') parts.push('Đây là món ăn tự do (mô tả).')
  parts.push(`Tên: ${item.name}`)
  if (item.qty) parts.push(`Số phần ăn: ${item.qty}`)
  if (item.amount_g) parts.push(`Khối lượng: ${item.amount_g} g`)
  if (item.dose_mg) parts.push(`Hàm lượng mỗi viên: ${item.dose_mg}`)
  if (item.pills) parts.push(`Số viên/ngày: ${item.pills}`)
  if (item.note) parts.push(`Ghi chú: ${item.note}`)
  parts.push('Hãy ước lượng vi chất KHẨU PHẦN đã ăn/uống hôm nay (tổng, không phải trên 100 g).')
  return parts.join('\n')
}

/**
 * Ước lượng vi chất qua OpenRouter cho 1 item không có số liệu chính xác.
 * Trả `NutrientValueMap` (chỉ các chất hợp lệ) hoặc `null` nếu không gọi được AI
 * (thiếu key, lỗi mạng, parse JSON fail, phản hồi trống). KHÔNG bao giờ throw.
 */
export async function estimateItemNutrients(
  item: Pick<IntakeItemInput, 'kind' | 'name' | 'amount_g' | 'qty' | 'dose_mg' | 'pills' | 'note'>,
): Promise<NutrientValueMap | null> {
  try {
    const reply = await chatCompletion({
      temperature: 0.2,
      maxTokens: 800,
      json: true,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(item) },
      ],
    })
    const parsed = JSON.parse(reply.content) as Record<string, unknown>
    const nutrients: NutrientValueMap = {}
    for (const id of NUTRIENT_IDS) {
      const v = parsed[id]
      if (typeof v === 'number' && Number.isFinite(v) && v > 0) nutrients[id] = Math.round(v * 100) / 100
    }
    return Object.keys(nutrients).length > 0 ? nutrients : null
  } catch {
    return null
  }
}
