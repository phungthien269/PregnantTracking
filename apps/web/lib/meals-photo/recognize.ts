// ===========================================================================
// Nhận diện bữa ăn từ ảnh (server-only). Seam: recognizeMealFromPhoto() trả về
// MealProposal dù chạy AI thật (lib/ai/client — OpenRouter) hay fallback
// heuristic theo tên file. KHÔNG tự lưu — chỉ trả đề xuất để UI xác nhận.
// ===========================================================================

import { z } from 'zod'
import { chatCompletion, visionCompletion, aiConfigured } from '../ai/client'
import { extractJson } from '../ai/quiz-gen'
import { mealTypeEnumSchema, type MealTypeValue } from './constants'

const MAX_PHOTO_BYTES = 10 * 1024 * 1024
// Base64 ≈ 4/3 × bytes; data:image/...;base64, (chừa đủ cho ảnh 10MB).
const MAX_DATA_URL_LEN = Math.ceil((MAX_PHOTO_BYTES * 4) / 3) + 64
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|heic|heif|avif)$/i

// ---- Input biên giới (route build từ FormData) ----
export interface PhotoInput {
  filename: string
  mimeType: string
  sizeBytes: number
  mealType?: MealTypeValue
  /** Pixel ảnh dạng data URL (data:image/...;base64,...) — có thì AI nhìn ảnh thật. */
  imageDataUrl?: string
}

export const photoInputSchema = z
  .object({
    filename: z.string().min(1).max(200),
    mimeType: z.string().max(100),
    sizeBytes: z.number().int().positive().max(MAX_PHOTO_BYTES),
    mealType: mealTypeEnumSchema.optional(),
    imageDataUrl: z.string().startsWith('data:image/').max(MAX_DATA_URL_LEN).optional(),
  })
  .refine((v) => v.mimeType.startsWith('image/') || IMAGE_EXT.test(v.filename), {
    message: 'File phải là ảnh (image/png, jpeg, webp…)',
  })

// ---- Đề xuất trả về cho UI xác nhận ----
export const proposalCoreSchema = z.object({
  meal_type: mealTypeEnumSchema,
  name: z.string().min(1).max(200),
  calories: z.number().int().nonnegative().nullable(),
  note: z.string().max(1000).nullable(),
})
export type ProposalCore = z.infer<typeof proposalCoreSchema>

export const mealProposalSchema = proposalCoreSchema.extend({
  source: z.enum(['ai', 'heuristic']),
  model: z.string().nullable(),
  provider: z.string().nullable(),
})
export type MealProposal = z.infer<typeof mealProposalSchema>

// ---- Heuristic: nhận diện theo tên file ----
/** Chuẩn hoá: lowercase, bỏ dấu tiếng Việt, bỏ đuôi ảnh, xoá separator. */
export function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\.(png|jpe?g|gif|webp|heic|heif|avif)$/i, '')
    .replace(/[^a-z0-9]/g, '')
}

/** Món Việt phổ biến — thứ tự cụ thể TRƯỚC (vd 'pho ga' trước 'pho'). */
const DISHES: Array<{
  keys: string[]
  dish: string
  type: MealTypeValue
  kcal: number | null
  note: string
}> = [
  { keys: ['pho ga'], dish: 'Phở gà', type: 'breakfast', kcal: 400, note: 'Phở gà — giàu đạm, tinh bột; thêm rau sống và chanh.' },
  { keys: ['pho'], dish: 'Phở bò', type: 'breakfast', kcal: 450, note: 'Phở bò — giàu đạm, sắt; uống kèm nước cam tăng hấp thu sắt.' },
  { keys: ['banh mi'], dish: 'Bánh mì', type: 'breakfast', kcal: 350, note: 'Bánh mì — nên kèm rau và trứng/thịt nạc.' },
  { keys: ['com tam'], dish: 'Cơm tấm sườn', type: 'lunch', kcal: 600, note: 'Cơm tấm — giàu tinh bột, đạm; cân bằng rau.' },
  { keys: ['com'], dish: 'Cơm', type: 'lunch', kcal: 500, note: 'Cơm với món mặn + rau — đủ 4 nhóm chất.' },
  { keys: ['bun'], dish: 'Bún', type: 'lunch', kcal: 400, note: 'Bún — ăn kèm rau sống; chọn nước dùng ít mỡ.' },
  { keys: ['chao'], dish: 'Cháo', type: 'breakfast', kcal: 300, note: 'Cháo — dễ tiêu; thêm thịt băm, rau củ.' },
  { keys: ['ca kho'], dish: 'Cá kho tộ', type: 'dinner', kcal: 250, note: 'Cá kho — giàu đạm, canxi; ăn kèm rau luộc.' },
  { keys: ['thit kho'], dish: 'Thịt kho tàu', type: 'dinner', kcal: 380, note: 'Thịt kho — hạn chế nước kho mặn.' },
  { keys: ['rau'], dish: 'Rau luộc', type: 'dinner', kcal: 80, note: 'Rau luộc — giàu vitamin, chất xơ.' },
  { keys: ['canh'], dish: 'Canh rau', type: 'dinner', kcal: 100, note: 'Canh rau — bổ sung nước và chất xơ.' },
  { keys: ['trai cay', 'fruit'], dish: 'Trái cây', type: 'snack', kcal: 100, note: 'Trái cây — chọn quả ít ngọt, rửa sạch.' },
  { keys: ['sua', 'milk'], dish: 'Sữa tươi', type: 'drink', kcal: 120, note: 'Sữa tươi — bổ sung canxi; chọn loại tiệt trùng.' },
  { keys: ['nuoc cam'], dish: 'Nước cam', type: 'drink', kcal: 90, note: 'Nước cam — giàu vitamin C.' },
  { keys: ['trung'], dish: 'Trứng luộc', type: 'breakfast', kcal: 80, note: 'Trứng luộc — giàu đạm; nấu chín kỹ.' },
  { keys: ['mi'], dish: 'Mì', type: 'lunch', kcal: 420, note: 'Mì — hạn chế ăn nhiều vì muối; thêm rau.' },
  { keys: ['banh'], dish: 'Bánh ngọt', type: 'snack', kcal: 250, note: 'Bánh ngọt — hạn chế vì đường.' },
]

export function heuristicRecognize(input: PhotoInput): MealProposal {
  const folded = fold(input.filename)
  const hit = DISHES.find((d) => d.keys.some((k) => folded.includes(fold(k))))
  if (!hit) {
    return {
      meal_type: input.mealType ?? 'lunch',
      name: 'Món ăn (ảnh)',
      calories: null,
      note: 'Chưa nhận diện được món từ ảnh — mẹ vui lòng sửa tên món trước khi lưu.',
      source: 'heuristic',
      model: null,
      provider: null,
    }
  }
  return {
    meal_type: input.mealType ?? hit.type,
    name: hit.dish,
    calories: hit.kcal,
    note: hit.note,
    source: 'heuristic',
    model: null,
    provider: null,
  }
}

// ---- AI (OpenRouter qua lib/ai/client) ----
const MEAL_AI_SYSTEM = `Bạn là trợ lý "Mẹ & Bé" — ứng dụng theo dõi dinh dưỡng thai kỳ cho gia đình Việt.
Người dùng tải lên ảnh bữa ăn. Từ ẢNH bữa ăn (nếu có ảnh) và TÊN FILE, hãy đề xuất món ăn nhiều khả năng nhất (tiếng Việt) và ước tính dinh dưỡng.
Trả lời JSON THUẦN, không kèm giải thích:
{"meal_type":"breakfast|lunch|dinner|snack|drink","name":"Tên món tiếng Việt","calories":số nguyên ước tính hoặc null,"note":"gợi ý dinh dưỡng ngắn ≤ 200 ký tự, tiếng Việt"}
- meal_type phải nằm trong danh sách trên.
- calories = null khi không chắc chắn.
- Không bịa: nếu không đủ thông tin, name chung chung như "Món ăn từ ảnh" và calories null.
- Không hỏi hoặc nhắc thông tin định danh (tên, SĐT, email).`

/** Chuẩn hoá JSON từ model → ProposalCore (throw nếu sai định dạng). */
export function parseMealJson(text: string): ProposalCore {
  const parsed = proposalCoreSchema.safeParse(JSON.parse(extractJson(text)))
  if (!parsed.success) throw new Error(`MEAL_PARSE_FAIL: ${parsed.error.message}`)
  return parsed.data
}

export async function aiRecognize(input: PhotoInput): Promise<MealProposal> {
  const text = `Tên file ảnh: ${input.filename.slice(0, 120)}\nKích thước: ${input.sizeBytes} byte${input.mealType ? `\nBữa: ${input.mealType}` : ''}\nHãy đề xuất món ăn + dinh dưỡng.`
  // Có pixel ảnh → gửi multimodal (AI NHÌN ẢNH THẬT); chỉ có tên file → text như cũ.
  const reply = input.imageDataUrl
    ? await visionCompletion({
        messages: [
          { role: 'system', text: MEAL_AI_SYSTEM },
          { role: 'user', text, imageDataUrl: input.imageDataUrl },
        ],
        temperature: 0.3,
        json: true,
        maxTokens: 400,
      })
    : await chatCompletion({
        messages: [
          { role: 'system', content: MEAL_AI_SYSTEM },
          { role: 'user', content: text },
        ],
        temperature: 0.3,
        json: true,
        maxTokens: 400,
      })
  const core = parseMealJson(reply.content)
  return { ...core, source: 'ai', model: reply.model, provider: reply.provider }
}

// ---- Seam chính ----
/** Nhận diện: AI nếu có key + thành công; ngược lại fallback heuristic theo tên file. */
export async function recognizeMealFromPhoto(input: PhotoInput): Promise<MealProposal> {
  if (aiConfigured()) {
    try {
      return await aiRecognize(input)
    } catch {
      // AI lỗi (network/parse) → heuristic, giữ seam không đổi
    }
  }
  return heuristicRecognize(input)
}
