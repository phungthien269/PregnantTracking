import { data } from '@/lib/data'
import { apiOk } from '@/lib/api-utils'

// GET /api/v1/quizzes — bộ quiz từ thư viện người dùng import.
export async function GET(): Promise<Response> {
  return apiOk(await data.getQuizSets())
}
