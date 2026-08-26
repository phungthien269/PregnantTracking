// ===========================================================================
// parse.ts — trích xuất chỉ số khám thai bằng heuristic (regex + nhãn).
// - Tự chứa (chỉ import zod) để chạy được bằng `node --experimental-strip-types`.
// - Danh sách type tự khai báo (mirror MEASUREMENT_TYPES trong core.ts). Nếu lệch
//   với domain, route confirm (z.enum(MEASUREMENT_TYPES)) sẽ chặn khi lưu.
// - AI seam: xem seam.ts — khi cấu hình OpenRouter, parse này là fallback.
// ===========================================================================

import { z } from 'zod'

const OCR_MEASUREMENT_TYPES = [
  'weight',
  'blood_pressure',
  'blood_glucose',
  'waist_circumference',
  'bmi',
  'fundal_height',
  'heart_rate',
] as const
export const ocrMeasurementTypeSchema = z.enum(OCR_MEASUREMENT_TYPES)
export type OcrMeasurementType = z.infer<typeof ocrMeasurementTypeSchema>

export const OCR_LABELS: Record<OcrMeasurementType, string> = {
  weight: 'Cân nặng',
  blood_pressure: 'Huyết áp',
  blood_glucose: 'Đường huyết',
  waist_circumference: 'Vòng eo',
  bmi: 'BMI',
  fundal_height: 'Chiều cao tử cung',
  heart_rate: 'Nhịp tim',
}

export const OCR_UNITS: Record<OcrMeasurementType, string> = {
  weight: 'kg',
  blood_pressure: 'mmHg',
  blood_glucose: 'mmol/L',
  waist_circumference: 'cm',
  bmi: '',
  fundal_height: 'cm',
  heart_rate: 'lần/phút',
}

/** Bí danh nhãn (đã viết thường, có dấu) cho từng loại — khớp trên text đã fold. */
const ALIASES: Record<OcrMeasurementType, string[]> = {
  weight: ['cân nặng', 'trọng lượng', 'weight'],
  blood_pressure: ['huyết áp', 'blood pressure'],
  blood_glucose: ['đường huyết', 'đường máu', 'blood glucose', 'glucose'],
  waist_circumference: ['vòng eo', 'vòng bụng', 'waist'],
  bmi: ['bmi'],
  fundal_height: ['chiều cao tử cung', 'chiều cao tc', 'chiều cao t/c', 'fundal height', 'tử cung'],
  heart_rate: ['nhịp tim', 'nhịp mạch', 'heart rate', 'pulse', 'mạch'],
}

/** Bỏ dấu tiếng Việt + hạ thường để khớp cả text có/không dấu. */
export function fold(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd')
}

const FOLDED_ALIASES = Object.fromEntries(
  (Object.keys(ALIASES) as OcrMeasurementType[]).map((t) => [t, ALIASES[t].map(fold)]),
) as Record<OcrMeasurementType, string[]>

export const ocrExtractionSchema = z.object({
  type: ocrMeasurementTypeSchema,
  label: z.string(),
  value: z.number(),
  unit: z.string(),
  /** Huyết áp: tâm trương (tâm thu để ở value). */
  diastolic: z.number().nullable().optional(),
  /** Dòng gốc chứa nhãn, để UI đối chiếu. */
  raw: z.string().optional(),
})
export type OcrExtraction = z.infer<typeof ocrExtractionSchema>

/** "62,5" → 62.5; "120" → 120. Không xử lý dấu phân tách hàng nghìn (hiếm trên tờ khám). */
export function toNumber(raw: string): number | null {
  const s = raw.trim().replace(/\s+/g, '')
  if (!/^\d+([.,]\d+)?$/.test(s)) return null
  const n = Number(s.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

const BP_RE = /(\d{2,3})\s*\/\s*(\d{2,3})/
const NUM_RE = /(\d+(?:[.,]\d+)?)/

/** Vị trí khớp trái nhất; trùng vị trí thì ưu alias dài hơn (vd "cân nặng" hơn "cân"). */
function findAlias(text: string, aliases: string[]): { index: number; alias: string } | null {
  let best: { index: number; alias: string } | null = null
  for (const alias of aliases) {
    let i = text.indexOf(alias)
    while (i !== -1) {
      if (!best || i < best.index || (i === best.index && alias.length > best.alias.length)) {
        best = { index: i, alias }
      }
      i = text.indexOf(alias, i + 1)
    }
  }
  return best
}

/** Tìm dòng gốc (còn dấu) chứa alias đã fold — cho UI đối chiếu. */
function sourceLine(raw: string, foldedAlias: string): string {
  for (const line of raw.split(/\n+/)) {
    if (fold(line).includes(foldedAlias)) return line.trim()
  }
  return ''
}

/**
 * Trích các chỉ số từ text tờ khám. Trả [] nếu không khớp nhãn nào.
 * `ponytail:` chỉ lấy occurrence trái nhất mỗi loại; nâng cấp khi cần đa lần khám/trang.
 */
export function parseMeasurements(raw: string): OcrExtraction[] {
  const text = raw.replace(/\s+/g, ' ').trim()
  const folded = fold(text)
  if (!folded) return []

  const found: { index: number; item: OcrExtraction }[] = []

  for (const type of OCR_MEASUREMENT_TYPES) {
    const occ = findAlias(folded, FOLDED_ALIASES[type])
    if (!occ) continue
    const segment = folded.slice(occ.index + occ.alias.length, occ.index + occ.alias.length + 100)

    let value: number | null = null
    let diastolic: number | undefined
    if (type === 'blood_pressure') {
      const bp = segment.match(BP_RE)
      if (bp) {
        value = toNumber(bp[1]!)
        const d = toNumber(bp[2]!)
        if (value != null && d != null) diastolic = d
      }
      if (value == null) value = toNumber(segment.match(NUM_RE)?.[1] ?? '')
    } else {
      value = toNumber(segment.match(NUM_RE)?.[1] ?? '')
    }
    if (value == null) continue

    found.push({
      index: occ.index,
      item: {
        type,
        label: OCR_LABELS[type],
        value,
        unit: OCR_UNITS[type],
        diastolic,
        raw: sourceLine(text, occ.alias),
      },
    })
  }

  return found
    .sort((a, b) => a.index - b.index)
    .map((f) => f.item)
}

// ---------------------------------------------------------------------------
// Self-check — `cd apps/web && node --experimental-strip-types lib/ocr/parse.ts`
// ---------------------------------------------------------------------------

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(`❌ ${msg}`)
  console.log(`  ✔ ${msg}`)
}

export function demo(): void {
  const r1 = parseMeasurements('Cân nặng: 62,5 kg\nHuyết áp: 110/70 mmHg\nNhịp tim: 82 lần/phút\nVòng eo: 90 cm')
  assert(r1.length === 4, 'nhận 4 chỉ số từ text có dấu')
  const w = r1.find((i) => i.type === 'weight')
  assert(w?.value === 62.5 && w?.unit === 'kg', 'cân nặng 62,5 → 62.5 kg')
  const bp = r1.find((i) => i.type === 'blood_pressure')
  assert(bp?.value === 110 && bp?.diastolic === 70, 'huyết áp 110/70 → value 110, diastolic 70')
  const hr = r1.find((i) => i.type === 'heart_rate')
  assert(hr?.value === 82, 'nhịp tim 82')

  const r2 = parseMeasurements('Can nang 60kg\nNhip tim 75\nDuong huyet 5.2')
  assert(r2.find((i) => i.type === 'weight')?.value === 60, 'không dấu: cân nặng 60')
  assert(r2.find((i) => i.type === 'heart_rate')?.value === 75, 'không dấu: nhịp tim 75')
  assert(r2.find((i) => i.type === 'blood_glucose')?.value === 5.2, 'đường huyết 5.2')

  assert(parseMeasurements('').length === 0, 'text rỗng → []')
  assert(parseMeasurements('Xét nghiệm máu bình thường, không ghi chỉ số').length === 0, 'không nhãn → []')

  const r3 = parseMeasurements('Huyết áp 120')
  assert(r3[0]?.type === 'blood_pressure' && r3[0]?.value === 120 && r3[0]?.diastolic == null, 'huyết áp 1 số → không diastolic')

  assert(toNumber('62,5') === 62.5, 'toNumber comma')
  assert(toNumber('82') === 82, 'toNumber nguyên')
  assert(toNumber('abc') === null, 'toNumber từ chối chữ')

  console.log('✅ ocr.parse.demo OK')
}

if (process.argv[1]?.endsWith('parse.ts')) demo()
