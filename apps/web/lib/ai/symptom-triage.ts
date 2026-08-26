// ===========================================================================
// Phân loại triệu chứng — rule cứng, chạy TRƯỚC khi gọi AI.
// Dấu hiệu nguy hiểm → chỉ hành động + nguồn, KHÔNG gọi AI.
// Tự chứa (không import sibling) để chạy được bằng `node --experimental-strip-types`.
// ===========================================================================

import { z } from 'zod'

export interface DangerSign {
  label: string
  /** Từ khóa khớp với mô tả tự do (đã hạ thường). */
  keywords: string[]
}

export const DANGER_SIGNS: DangerSign[] = [
  { label: 'Ra máu âm đạo', keywords: ['ra máu', 'chảy máu', 'xuất huyết', 'máu âm đạo'] },
  { label: 'Đau bụng dữ dội, không đỡ', keywords: ['đau bụng dữ dội', 'đau quặn dữ dội', 'đau bụng không đỡ'] },
  { label: 'Đau đầu dữ dội, nhìn mờ', keywords: ['đau đầu dữ dội', 'nhìn mờ', 'mờ mắt'] },
  { label: 'Sưng phù đột ngột mặt, tay, chân', keywords: ['sưng phù đột ngột', 'phù nề mặt', 'sưng mặt', 'phù đột ngột'] },
  { label: 'Thai máy giảm hẳn hoặc mất', keywords: ['thai máy giảm', 'thai máy yếu', 'bé đạp ít hẳn', 'mất thai máy', 'không cảm nhận thai máy'] },
  { label: 'Vỡ ối (dịch chảy ra)', keywords: ['vỡ ối', 'nước ối chảy', 'dịch ối chảy'] },
  { label: 'Sốt cao', keywords: ['sốt cao', 'sốt trên 38'] },
  { label: 'Co giật', keywords: ['co giật', 'lên cơn giật', 'mất ý thức'] },
]

/** Dấu hiệu cần lưu ý (không cấp cứu nhưng nên trao đổi bác sĩ nếu kéo dài). */
const WARNING_KEYWORDS = [
  'đau bụng', 'chóng mặt', 'hoa mắt', 'nôn nhiều', 'buồn nôn nhiều',
  'sốt', 'ngứa', 'ra dịch lạ', 'tiểu rát', 'tiểu buốt', 'tăng cân quá nhanh',
] as const

export type Urgency = 'danger' | 'warning' | 'info'

export interface TriageResult {
  urgent: boolean
  urgency: Urgency
  /** Nhãn dấu hiệu nguy hiểm khớp được. */
  matched: string[]
  reason: string
}

export function triageSymptom(symptom: string, checkedSigns: string[] = []): TriageResult {
  const text = (symptom || '').toLowerCase()
  const matched = DANGER_SIGNS.filter(
    (s) => checkedSigns.includes(s.label) || s.keywords.some((k) => text.includes(k)),
  ).map((s) => s.label)

  if (matched.length > 0) {
    return {
      urgent: true,
      urgency: 'danger',
      matched,
      reason: 'Có dấu hiệu nguy hiểm — cần xử lý ngay, không chờ phân tích AI.',
    }
  }

  const warnings = WARNING_KEYWORDS.filter((k) => text.includes(k))
  if (warnings.length > 0) {
    return {
      urgent: false,
      urgency: 'warning',
      matched: [],
      reason: 'Có dấu hiệu cần lưu ý — nên trao đổi với bác sĩ nếu kéo dài.',
    }
  }

  return { urgent: false, urgency: 'info', matched: [], reason: 'Chưa thấy dấu hiệu nguy hiểm.' }
}

/** Hành động + nguồn khi có dấu hiệu nguy hiểm — luôn kèm nguồn. */
export function dangerActions(): { actions: string[]; sources: string[] } {
  return {
    actions: [
      'Gọi cấp cứu 115 hoặc đến bệnh viện phụ sản gần nhất ngay lập tức.',
      'Không tự dùng thuốc, không chờ "theo dõi thêm".',
      'Nằm nghiêng trái, giữ bình tĩnh, nhờ người thân đưa đi nếu có thể.',
    ],
    sources: [
      'Hướng dẫn quốc gia về chăm sóc sức khỏe sinh sản — Bộ Y tế Việt Nam',
      'WHO — Dấu hiệu nguy hiểm cần cấp cứu trong thai kỳ',
    ],
  }
}

// ---- Parse phản hồi JSON của AI cho triệu chứng (không khẩn) ----

const symptomAiSchema = z.object({
  possible_causes: z.array(z.string()).min(1),
  actions: z.array(z.string()).min(1),
  sources: z.array(z.string()).min(1),
})
export type SymptomAiResult = z.infer<typeof symptomAiSchema>

/** Trích JSON thuần từ phản hồi model (nhiều model bọc trong markdown). */
export function extractJson(text: string): string {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) throw new Error('JSON_MISSING')
  return text.slice(start, end + 1)
}

export function parseSymptomJson(text: string): SymptomAiResult {
  const parsed = symptomAiSchema.safeParse(JSON.parse(extractJson(text)))
  if (!parsed.success) throw new Error(`SYMPTOM_JSON_INVALID: ${parsed.error.message}`)
  return parsed.data
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg)
}

/** demo() chạy bằng `node --experimental-strip-types symptom-triage.ts`. */
export function demo(): void {
  assert(triageSymptom('Đau bụng dữ dội từ chiều, kèm ra máu').urgent === true, 'free-text danger')
  assert(triageSymptom('', ['Ra máu âm đạo']).urgent === true, 'checked danger')
  assert(triageSymptom('', ['Sốt cao']).matched.length === 1, 'checked danger 2')
  assert(triageSymptom('đau bụng âm ỉ, hơi mệt').urgency === 'warning', 'warning keyword')
  assert(triageSymptom('mệt mỏi nhẹ cuối ngày').urgency === 'info', 'info')
  const d = dangerActions()
  assert(d.actions.length > 0 && d.sources.length > 0, 'danger actions + sources')
  const ai = parseSymptomJson('{"possible_causes":["a"],"actions":["b"],"sources":["c"]}')
  assert(ai.actions[0] === 'b', 'parse symptom json')
  let threw = false
  try {
    parseSymptomJson('{"possible_causes":[]}')
  } catch {
    threw = true
  }
  assert(threw, 'reject invalid symptom json')
  console.log('✅ symptom-triage.demo OK')
}

if (process.argv[1]?.endsWith('symptom-triage.ts')) demo()
