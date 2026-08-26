// ===========================================================================
// check.ts — tự kiểm tra module meals-photo (heuristic + schema + parse +
// confirm-before-save). Chạy:
//   cd apps/web && node --experimental-strip-types --import ./lib/library/node-loader.mjs lib/meals-photo/check.ts
// Không gọi aiRecognize (cần network/key) — chỉ kiểm tra heuristic + parse.
// ===========================================================================

import { fold, heuristicRecognize, photoInputSchema, parseMealJson } from './recognize'
import { buildMealEntryInput } from './confirm'

const assert = (cond: unknown, msg: string): void => {
  if (!cond) throw new Error(`❌ ${msg}`)
  console.log(`  ✔ ${msg}`)
}

function main(): void {
  console.log('1. fold — bỏ dấu + bỏ separator/extension')
  assert(fold('Phở bò') === 'phobo', `fold('Phở bò') === 'phobo'`)
  assert(fold('pho-bo.jpg') === 'phobo', 'fold bỏ separator + extension')

  console.log('2. heuristicRecognize — theo tên file')
  const pho = heuristicRecognize({ filename: 'pho-bo.jpg', mimeType: 'image/jpeg', sizeBytes: 1024 })
  assert(pho.name === 'Phở bò' && pho.meal_type === 'breakfast', `pho-bo.jpg → ${pho.name} (${pho.meal_type})`)
  assert(pho.calories === 450 && pho.source === 'heuristic', 'calories + source heuristic')

  const comGa = heuristicRecognize({ filename: 'com-ga.png', mimeType: 'image/png', sizeBytes: 2048 })
  assert(comGa.name === 'Cơm', `com-ga.png → ${comGa.name} (không nhầm cơm tấm)`)

  const banhMi = heuristicRecognize({ filename: 'banh-mi.jpg', mimeType: 'image/jpeg', sizeBytes: 512 })
  assert(banhMi.name === 'Bánh mì', `banh-mi.jpg → ${banhMi.name} (specific trước generic)`)

  const milk = heuristicRecognize({ filename: 'milk.jpg', mimeType: 'image/jpeg', sizeBytes: 512 })
  assert(milk.name === 'Sữa tươi', `milk.jpg → ${milk.name} (không nhầm 'mi')`)

  const unknown = heuristicRecognize({ filename: 'IMG_20260804_1234.jpg', mimeType: 'image/jpeg', sizeBytes: 4096 })
  assert(unknown.name === 'Món ăn (ảnh)' && unknown.calories === null, 'ảnh không rõ → generic + calories null')

  const dinnerOverride = heuristicRecognize({
    filename: 'pho-bo.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 1024,
    mealType: 'dinner',
  })
  assert(dinnerOverride.meal_type === 'dinner', 'mealType người dùng chọn được tôn trọng')

  console.log('3. photoInputSchema — validate ảnh biên giới')
  assert(photoInputSchema.safeParse({ filename: 'a.jpg', mimeType: 'image/jpeg', sizeBytes: 1 }).success, 'ảnh hợp lệ')
  assert(!photoInputSchema.safeParse({ filename: 'a.txt', mimeType: 'text/plain', sizeBytes: 1 }).success, 'file không phải ảnh bị từ chối')
  assert(!photoInputSchema.safeParse({ filename: 'a.jpg', mimeType: 'image/jpeg', sizeBytes: 11 * 1024 * 1024 }).success, 'ảnh > 10MB bị từ chối')
  assert(!photoInputSchema.safeParse({ filename: 'a.jpg', mimeType: 'image/jpeg', sizeBytes: 0 }).success, 'ảnh rỗng bị từ chối')

  console.log('4. parseMealJson — chuẩn hoá phản hồi')
  const ok = parseMealJson('{"meal_type":"lunch","name":"Cơm gà","calories":500,"note":"Ăn kèm rau."}')
  assert(ok.name === 'Cơm gà' && ok.meal_type === 'lunch', 'parse JSON hợp lệ')
  let threw = false
  try {
    parseMealJson('{"meal_type":"tối","name":"X","calories":null,"note":null}')
  } catch {
    threw = true
  }
  assert(threw, 'meal_type sai → throw')

  console.log('5. buildMealEntryInput — confirm-before-save')
  const draft = buildMealEntryInput({ meal_type: 'breakfast', name: '  Phở bò  ', note: ' thêm rau ' })
  assert(draft.name === 'Phở bò' && draft.note === 'thêm rau', 'trim name + note')
  assert(typeof draft.logged_at === 'string' && draft.logged_at.length > 0, 'logged_at = ISO hiện tại')
  const draftCal = buildMealEntryInput({ meal_type: 'dinner', name: 'Bún riêu', calories: 520 })
  assert(draftCal.calories === 520, 'calories từ proposal chạy qua draft')

  console.log('\n✅ meals-photo.check OK — heuristic, schema, parse, confirm')
}

main()
