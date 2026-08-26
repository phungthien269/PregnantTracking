// ===========================================================================
// lib/ai — gateway OpenRouter + rule cứng (triage, alert) + fallback nguồn.
// Dùng server-side (route handler / server component). Không dùng client.
// Re-export tường minh (không `export *` từ các module thuần vì trùng tên demo/extractJson).
// ===========================================================================

export * from './client'
export * from './prompts'
export * from './sources'
export * from './insight'

export {
  DANGER_SIGNS,
  triageSymptom,
  dangerActions,
  parseSymptomJson,
  type Urgency,
  type TriageResult,
  type DangerSign,
  type SymptomAiResult,
} from './symptom-triage'

export {
  runAlertRules,
  type RuleAlert,
  type AlertSeverity,
  type AlertInput,
  type WaterLike,
} from './alert-rules'

export {
  buildQuizMessages,
  parseQuizResponse,
  extractJson,
  quizQuestionOutputSchema,
  type QuizGenInput,
  type QuizQuestionOutput,
} from './quiz-gen'
