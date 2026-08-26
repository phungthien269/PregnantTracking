// ===========================================================================
// Client data proxy — DataApi chạy trong browser, gọi qua API routes.
//
// `node:sqlite` chỉ chạy server-side → client KHÔNG import `lib/db/local` hay
// `lib/data/local`. Thay vào đó, client dùng proxy này: mọi method gọi
// fetch('/api/v1/...') (server đọc/ghi SQLite) và unwrap envelope `{data}`.
// Mutation client gọi trực tiếp (data.addX) giờ persist thật qua API — hết
// split-brain mock.
//
// Các getter không có route riêng (getDashboard/getWeekInfo/…) không được client
// component gọi (server page render chúng); trả default an toàn để không vỡ UI.
// ===========================================================================

import type * as D from '@mevabe/domain'
import type {
  AppointmentInput,
  AppointmentUpdateInput,
  BirthRecordInput,
  BudgetInput,
  BudgetUpdateInput,
  ChildInput,
  ConditionMeasurementInput,
  ConditionPlanInput,
  DailyIntakeInput,
  DailyIntakeLog,
  DataApi,
  DashboardSummary,
  FetusInput,
  GrowthPoint,
  GrowthPointInput,
  KnowledgeChunkInput,
  MealEntryInput,
  MealPhotoInput,
  MeasurementInput,
  MedicalVisit,
  MedicalVisitInput,
  NutritionFocus,
  NutritionProfileInput,
  NutrientSummary,
  ReminderInput,
  ShoppingItemUpdateInput,
  SymptomReportInput,
  TaskInput,
  VaccinationInput,
  VisitDocument,
  VisitDocumentInput,
  WaterCaffeine,
  WeekInfo,
} from './api'

const JSON_HEADERS = { 'Content-Type': 'application/json' }

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(path, init)
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const msg = (body as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`
    throw new Error(msg)
  }
  return (body as { data?: unknown })?.data
}

const post = (path: string, body: unknown): Promise<unknown> =>
  request(path, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(body) })
const patch = (path: string, body: unknown): Promise<unknown> =>
  request(path, { method: 'PATCH', headers: JSON_HEADERS, body: JSON.stringify(body) })
const get = (path: string): Promise<unknown> => request(path)

// ---- Default cho getter không có route (không được client dùng) ----
const EMPTY_DASH: DashboardSummary = {
  week: 0,
  trimester: 'first',
  dueDate: '',
  daysLeft: 0,
  taskCount: 0,
  tasksDone: 0,
  mealCountToday: 0,
  waterLoggedMl: 0,
  waterGoalMl: 2000,
  upcomingAppointments: [],
  latestMeasurements: [],
  recentSymptoms: [],
  dailyInsight: '',
}
const EMPTY_WEEK: WeekInfo = {
  week: 0,
  trimester: 'first',
  fetalSize: '',
  momChanges: [],
  nutritionFocus: [],
  appointmentsDue: [],
  todo: [],
}
const EMPTY_FOCUS: NutritionFocus = { week: 0, nutrients: [] }

export const clientApi: DataApi = {
  // ---- Thai kỳ & sức khỏe ----
  async getPregnancy(): Promise<D.Pregnancy | null> {
    return (await get('/api/v1/pregnancies/current')) as D.Pregnancy | null
  },
  async getFetuses(): Promise<D.Fetus[]> {
    return (await get('/api/v1/fetuses')) as D.Fetus[]
  },
  async getWeekInfo(): Promise<WeekInfo> {
    return EMPTY_WEEK
  },
  async getDashboard(): Promise<DashboardSummary> {
    return EMPTY_DASH
  },
  async getMeasurements(): Promise<D.MaternalMeasurement[]> {
    return (await get('/api/v1/measurements')) as D.MaternalMeasurement[]
  },
  async getSymptoms(): Promise<D.SymptomReport[]> {
    return (await get('/api/v1/symptoms')) as D.SymptomReport[]
  },
  async getFetalMovementLogs(): Promise<D.FetalMovementLog[]> {
    return (await get('/api/v1/fetal-movements')) as D.FetalMovementLog[]
  },
  async getAppointments(): Promise<D.Appointment[]> {
    return (await get('/api/v1/appointments')) as D.Appointment[]
  },
  async addAppointment(input: AppointmentInput): Promise<D.Appointment> {
    return (await post('/api/v1/appointments', input)) as D.Appointment
  },
  async updateAppointment(id: string, input: AppointmentUpdateInput): Promise<D.Appointment> {
    return (await patch(`/api/v1/appointments/${id}`, input)) as D.Appointment
  },
  async getDocuments(): Promise<D.DocumentRecord[]> {
    return (await get('/api/v1/documents')) as D.DocumentRecord[]
  },

  // ---- Dinh dưỡng ----
  async getMeals(): Promise<D.MealEntry[]> {
    return (await get('/api/v1/meals')) as D.MealEntry[]
  },
  async getMealsByDate(date: string): Promise<D.MealEntry[]> {
    return (await get(`/api/v1/meals?date=${encodeURIComponent(date)}`)) as D.MealEntry[]
  },
  async getNutritionFocus(): Promise<NutritionFocus> {
    return EMPTY_FOCUS
  },
  async getWaterCaffeine(): Promise<WaterCaffeine> {
    // Phase 7 polish: đọc thật qua route /api/v1/hydration (trước hardcode EMPTY_WATER).
    return (await get('/api/v1/hydration')) as WaterCaffeine
  },
  async getSupplements(): Promise<D.SupplementPlan[]> {
    return (await get('/api/v1/supplements')) as D.SupplementPlan[]
  },
  async getSavedMeals(): Promise<D.SavedMeal[]> {
    return []
  },
  async getNutritionProfile(): Promise<D.NutritionProfile | null> {
    return (await get('/api/v1/conditions')) as D.NutritionProfile | null
  },
  async updateNutritionProfile(input: NutritionProfileInput): Promise<D.NutritionProfile> {
    return (await patch('/api/v1/conditions', input)) as D.NutritionProfile
  },

  // ---- Sau sinh & bé ----
  async getBirthRecord(): Promise<D.BirthRecord | null> {
    return null
  },
  async getChildren(): Promise<D.Child[]> {
    return (await get('/api/v1/children')) as D.Child[]
  },
  async getFeedings(childId: string): Promise<D.FeedingLog[]> {
    return (await get(`/api/v1/children/${childId}/feedings`)) as D.FeedingLog[]
  },
  async getSleeps(childId: string): Promise<D.SleepLog[]> {
    return (await get(`/api/v1/children/${childId}/sleeps`)) as D.SleepLog[]
  },
  async getDiapers(childId: string): Promise<D.DiaperLog[]> {
    return (await get(`/api/v1/children/${childId}/diapers`)) as D.DiaperLog[]
  },
  async getGrowth(childId: string): Promise<GrowthPoint[]> {
    return (await get(`/api/v1/children/${childId}/growth`)) as GrowthPoint[]
  },
  async getMilestones(childId: string): Promise<D.Milestone[]> {
    return (await get(`/api/v1/children/${childId}/milestones`)) as D.Milestone[]
  },
  async getVaccinations(childId: string): Promise<D.Vaccination[]> {
    return (await get(`/api/v1/children/${childId}/vaccinations`)) as D.Vaccination[]
  },
  // ---- Phase 7: Sau sinh — mutation ----
  async addBirthRecord(input: BirthRecordInput): Promise<D.BirthRecord> {
    return (await post('/api/v1/birth-record', input)) as D.BirthRecord
  },
  async updateBirthRecord(id: string, input: Partial<BirthRecordInput>): Promise<D.BirthRecord> {
    return (await patch(`/api/v1/birth-record/${id}`, input)) as D.BirthRecord
  },
  async addChild(input: ChildInput): Promise<D.Child> {
    return (await post('/api/v1/children', input)) as D.Child
  },
  async addGrowthPoint(childId: string, input: GrowthPointInput): Promise<GrowthPoint> {
    return (await post(`/api/v1/children/${childId}/growth`, input)) as GrowthPoint
  },
  async addVaccination(childId: string, input: VaccinationInput): Promise<D.Vaccination> {
    return (await post(`/api/v1/children/${childId}/vaccinations`, input)) as D.Vaccination
  },

  // ---- Điều phối gia đình ----
  async getTasks(): Promise<D.Task[]> {
    return (await get('/api/v1/tasks')) as D.Task[]
  },
  async getShopping(): Promise<D.ShoppingItem[]> {
    return (await get('/api/v1/shopping-items')) as D.ShoppingItem[]
  },
  async getBudget(): Promise<D.BudgetEntry[]> {
    return (await get('/api/v1/budget')) as D.BudgetEntry[]
  },
  async addBudget(input: BudgetInput): Promise<D.BudgetEntry> {
    return (await post('/api/v1/budget', input)) as D.BudgetEntry
  },
  async updateBudget(id: string, input: BudgetUpdateInput): Promise<D.BudgetEntry> {
    return (await patch(`/api/v1/budget/${id}`, input)) as D.BudgetEntry
  },
  async getReminders(): Promise<D.Reminder[]> {
    return (await get('/api/v1/reminders')) as D.Reminder[]
  },
  async addReminder(input: ReminderInput): Promise<D.Reminder> {
    return (await post('/api/v1/reminders', input)) as D.Reminder
  },
  async updateReminder(id: string, input: { active?: boolean }): Promise<D.Reminder> {
    return (await patch(`/api/v1/reminders/${id}`, input)) as D.Reminder
  },
  async getNotificationPreferences(): Promise<D.NotificationPreference[]> {
    return (await get('/api/v1/notifications/preferences')) as D.NotificationPreference[]
  },
  async getFamilyMembers() {
    return []
  },
  async getFamilyCode() {
    return null
  },
  async setNotificationPreference(input: {
    group: D.NotificationGroup
    channel: D.NotificationChannel
    enabled: boolean
  }): Promise<void> {
    await post('/api/v1/notifications', input)
  },

  // ---- Nội dung & học cùng con ----
  async getWeeklyGuides(): Promise<D.WeeklyGuide[]> {
    return []
  },
  async getArticles(): Promise<D.Article[]> {
    return []
  },
  async getQuizSets(): Promise<D.QuizSet[]> {
    return (await get('/api/v1/quizzes')) as D.QuizSet[]
  },
  async getQuizQuestions(): Promise<D.QuizQuestion[]> {
    return []
  },
  async getKnowledgeSources(): Promise<D.KnowledgeSource[]> {
    return (await get('/api/v1/knowledge-sources')) as D.KnowledgeSource[]
  },
  async getChatMessages(): Promise<D.ChatMessage[]> {
    return []
  },
  async searchKnowledgeChunks(query: string): Promise<D.KnowledgeChunk[]> {
    return (await get(`/api/v1/knowledge-search?q=${encodeURIComponent(query)}`)) as D.KnowledgeChunk[]
  },
  async saveKnowledgeChunks(sourceId: string, chunks: KnowledgeChunkInput[]): Promise<void> {
    await post(`/api/v1/knowledge-sources/${sourceId}/chunks`, { chunks })
  },
  async getConditionPlans(): Promise<D.ConditionPlan[]> {
    return (await get('/api/v1/conditions/plans')) as D.ConditionPlan[]
  },
  async addConditionPlan(input: ConditionPlanInput): Promise<D.ConditionPlan> {
    return (await post('/api/v1/conditions/plans', input)) as D.ConditionPlan
  },
  async getConditionMeasurements(): Promise<D.ConditionMeasurement[]> {
    return (await get('/api/v1/conditions/measurements')) as D.ConditionMeasurement[]
  },
  async addConditionMeasurement(input: ConditionMeasurementInput): Promise<D.ConditionMeasurement> {
    return (await post('/api/v1/conditions/measurements', input)) as D.ConditionMeasurement
  },
  async getContentVersions(
    contentType: D.ContentVersion['content_type'],
    contentId: string,
  ): Promise<D.ContentVersion[]> {
    return (
      (await get(
        `/api/v1/content-versions?contentType=${encodeURIComponent(contentType)}&contentId=${encodeURIComponent(contentId)}`,
      )) as D.ContentVersion[]
    )
  },

  // ---- Phase 6J: Theo dõi dinh dưỡng hằng ngày ----
  async addDailyIntake(input: DailyIntakeInput): Promise<DailyIntakeLog> {
    return (await post('/api/v1/daily-intake', input)) as DailyIntakeLog
  },
  async getDailyIntake(id: string): Promise<DailyIntakeLog | null> {
    return (await get(`/api/v1/daily-intake/${encodeURIComponent(id)}`)) as DailyIntakeLog | null
  },
  async listIntakeHistory(limit = 30): Promise<DailyIntakeLog[]> {
    return (await get(`/api/v1/daily-intake/history?limit=${limit}`)) as DailyIntakeLog[]
  },
  async getNutrientSummary(period: { from: string; to: string }): Promise<NutrientSummary> {
    return (await get(
      `/api/v1/daily-intake/summary?from=${encodeURIComponent(period.from)}&to=${encodeURIComponent(period.to)}`,
    )) as NutrientSummary
  },

  // ---- Phase 7: Hồ sơ khám (medical visits) ----
  async getMedicalVisits(): Promise<MedicalVisit[]> {
    return (await get('/api/v1/medical-visits')) as MedicalVisit[]
  },
  async addMedicalVisit(input: MedicalVisitInput): Promise<MedicalVisit> {
    return (await post('/api/v1/medical-visits', input)) as MedicalVisit
  },
  async getVisitDocuments(visitId: string): Promise<VisitDocument[]> {
    return (await get(`/api/v1/medical-visits/${encodeURIComponent(visitId)}/documents`)) as VisitDocument[]
  },
  async addVisitDocument(visitId: string, input: VisitDocumentInput): Promise<VisitDocument> {
    return (await post(`/api/v1/medical-visits/${encodeURIComponent(visitId)}/documents`, input)) as VisitDocument
  },

  // ---- Mutation ----
  async addMeal(entry: MealEntryInput): Promise<D.MealEntry> {
    return (await post('/api/v1/meals', entry)) as D.MealEntry
  },
  async addMealPhoto(input: MealPhotoInput): Promise<D.MealPhoto> {
    return (await post('/api/v1/meals/photo', input)) as D.MealPhoto
  },
  async addMeasurement(m: MeasurementInput): Promise<D.MaternalMeasurement> {
    return (await post('/api/v1/measurements', m)) as D.MaternalMeasurement
  },
  async addSymptom(s: SymptomReportInput): Promise<D.SymptomReport> {
    return (await post('/api/v1/symptoms', s)) as D.SymptomReport
  },
  async importSymptoms(items: SymptomReportInput[]): Promise<{ created: number }> {
    return (await post('/api/v1/import/symptoms', { items })) as { created: number }
  },
  async addTask(t: TaskInput): Promise<D.Task> {
    return (await post('/api/v1/tasks', t)) as D.Task
  },
  async toggleTask(id: string, done: boolean): Promise<void> {
    await patch(`/api/v1/tasks/${id}`, { done })
  },
  async startPregnancy(input: { lmp: string; edd?: string | null; fetalCount?: number }): Promise<D.Pregnancy> {
    return (await post('/api/v1/pregnancies', input)) as D.Pregnancy
  },
  async addFetus(input: FetusInput): Promise<D.Fetus> {
    return (await post('/api/v1/fetuses', input)) as D.Fetus
  },
  async updatePregnancy(input: { lmp?: string; edd?: string; notes?: string }): Promise<D.Pregnancy> {
    return (await patch('/api/v1/pregnancies/current', input)) as D.Pregnancy
  },
  async updateHealthProfile(input: {
    height_cm?: number
    pre_pregnancy_weight_kg?: number
    blood_type?: string
    allergies?: string[]
    preexisting_conditions?: string[]
    notes?: string
  }): Promise<D.HealthProfile> {
    return (await patch('/api/v1/health-profile', input)) as D.HealthProfile
  },
  async addFeeding(
    childId: string,
    input: {
      method: D.FeedingMethod
      amount_ml?: number | null
      started_at: string
      duration_min?: number | null
      side?: D.FeedingSide | null
      note?: string
    },
  ): Promise<D.FeedingLog> {
    return (await post(`/api/v1/children/${childId}/feedings`, input)) as D.FeedingLog
  },
  async addSleep(
    childId: string,
    input: { started_at: string; ended_at?: string | null; place: D.SleepPlace; note?: string },
  ): Promise<D.SleepLog> {
    return (await post(`/api/v1/children/${childId}/sleeps`, input)) as D.SleepLog
  },
  async addDiaper(
    childId: string,
    input: { changed_at: string; type: D.DiaperType; note?: string },
  ): Promise<D.DiaperLog> {
    return (await post(`/api/v1/children/${childId}/diapers`, input)) as D.DiaperLog
  },
  async addFetalMovement(
    input: { felt_at: string; feeling: D.FetalMovementFeeling; duration_min?: number | null; note?: string },
  ): Promise<D.FetalMovementLog> {
    return (await post('/api/v1/fetal-movements', input)) as D.FetalMovementLog
  },
  async addWater(input: { logged_at: string; amount_ml: number }): Promise<void> {
    await post('/api/v1/hydration', input)
  },
  async addShoppingItem(
    input: { name: string; category?: string | null; quantity?: number | null; unit?: string | null; estimated_price?: number | null },
  ): Promise<D.ShoppingItem> {
    return (await post('/api/v1/shopping-items', input)) as D.ShoppingItem
  },
  async toggleShopping(id: string, done: boolean): Promise<void> {
    await patch(`/api/v1/shopping-items/${id}`, { done })
  },
  async deleteShoppingItem(id: string): Promise<void> {
    await request(`/api/v1/shopping-items/${id}`, { method: 'DELETE' })
  },
  async updateShoppingItem(id: string, input: ShoppingItemUpdateInput): Promise<D.ShoppingItem> {
    return (await patch(`/api/v1/shopping-items/${id}`, input)) as D.ShoppingItem
  },
  async addMealToShopping(meal: D.SavedMeal): Promise<D.ShoppingItem[]> {
    return (await post('/api/v1/shopping-items/from-meal', { meal })) as D.ShoppingItem[]
  },
  async addMilestone(
    childId: string,
    input: { name: string; stage?: string | null; status: D.MilestoneStatus; achieved_at?: string | null; note?: string },
  ): Promise<D.Milestone> {
    return (await post(`/api/v1/children/${childId}/milestones`, input)) as D.Milestone
  },
  async deleteFamilyData(): Promise<void> {
    await request('/api/v1/export', { method: 'POST' })
  },
}
