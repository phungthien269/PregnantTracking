import { apiOk, apiError } from '@/lib/api-utils'
import { photoInputSchema, recognizeMealFromPhoto } from '@/lib/meals-photo/recognize'

// POST /api/v1/meals/photo — nhận ảnh bữa ăn, TRẢ ĐỀ XUẤT (món + dinh dưỡng) để
// UI XÁC NHẬN. KHÔNG tự lưu bữa ăn — việc lưu do client gọi data.addMeal sau khi
// người dùng duyệt (confirm-before-save). Envelope: { data } | { error }.
export async function POST(req: Request): Promise<Response> {
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return apiError('BAD_FORM', 'Không đọc được dữ liệu gửi lên (cần multipart/form-data)')
  }

  const file = form.get('photo')
  if (!(file instanceof File)) {
    return apiError('MISSING_PHOTO', 'Thiếu file ảnh (field "photo")')
  }
  const rawType = form.get('meal_type')
  // Đọc pixel ảnh → data URL để AI NHÌN ẢNH THẬT (vision). Không đọc được → vẫn
  // nhận diện theo tên file (heuristic) — không bế tắc.
  let imageDataUrl: string | undefined
  if (file.type.startsWith('image/')) {
    try {
      const bytes = new Uint8Array(await file.arrayBuffer())
      imageDataUrl = `data:${file.type};base64,${Buffer.from(bytes).toString('base64')}`
    } catch {
      imageDataUrl = undefined
    }
  }
  const parsed = photoInputSchema.safeParse({
    filename: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    mealType: typeof rawType === 'string' && rawType ? rawType : undefined,
    imageDataUrl,
  })
  if (!parsed.success) {
    return apiError('VALIDATION_ERROR', 'Ảnh không hợp lệ', parsed.error.flatten())
  }

  try {
    const proposal = await recognizeMealFromPhoto(parsed.data)
    return apiOk(proposal)
  } catch (err) {
    return apiError('RECOGNITION_FAILED', 'Không nhận diện được bữa ăn', (err as Error).message, 500)
  }
}
