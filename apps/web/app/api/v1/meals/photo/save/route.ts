import { z } from 'zod'
import { data } from '@/lib/data'
import { apiOk, apiError } from '@/lib/api-utils'
import { photoInputSchema } from '@/lib/meals-photo/recognize'
import { storeMealPhoto } from '@/lib/meals-photo/storage'

// POST /api/v1/meals/photo/save — lưu ẢNH kèm bữa ăn ĐÃ XÁC NHẬN.
// Client: data.addMeal xong → POST FormData { meal_id, photo } → lưu file vào
// storage + ghi record bảng `meal_photos` qua data.addMealPhoto.
// KHÔNG tự tạo bữa ăn — bữa ăn do client lưu trước (confirm-before-save).
// Envelope: { data } | { error }.
export async function POST(req: Request): Promise<Response> {
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return apiError('BAD_FORM', 'Không đọc được dữ liệu gửi lên (cần multipart/form-data)')
  }

  const rawMealId = form.get('meal_id')
  const mealId = typeof rawMealId === 'string' ? rawMealId : ''
  if (!z.string().uuid().safeParse(mealId).success) {
    return apiError('VALIDATION_ERROR', 'meal_id không hợp lệ (cần UUID của bữa ăn đã lưu)')
  }

  const file = form.get('photo')
  if (!(file instanceof File)) {
    return apiError('MISSING_PHOTO', 'Thiếu file ảnh (field "photo")')
  }
  const fileCheck = photoInputSchema.safeParse({
    filename: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  })
  if (!fileCheck.success) {
    return apiError('VALIDATION_ERROR', 'Ảnh không hợp lệ', fileCheck.error.flatten())
  }

  try {
    const stored = await storeMealPhoto(file, file.name)
    const record = await data.addMealPhoto({
      meal_id: mealId,
      file_name: file.name,
      mime: file.type,
      size_bytes: file.size,
      storage_path: stored.storage_path,
    })
    return apiOk(record, 201)
  } catch (err) {
    return apiError('SAVE_PHOTO_FAILED', 'Không lưu được ảnh bữa ăn', (err as Error).message, 500)
  }
}
