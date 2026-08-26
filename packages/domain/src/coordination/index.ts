import { z } from 'zod'
import {
  idSchema,
  baseEntitySchema,
  taskStatusSchema,
  shoppingStatusSchema,
  reminderFrequencySchema,
  notificationChannelSchema,
} from '../core'
import { dateSchema } from '../pregnancy'

// ===========================================================================
// Điều phối gia đình: tasks, checklists, shopping_items, budget_entries,
// reminders, notification_preferences.
// ===========================================================================

// ---- tasks (có người phụ trách, hạn, lịch sử hoàn thành) ----
export const taskSchema = baseEntitySchema.extend({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable(),
  status: taskStatusSchema,
  due_date: dateSchema.nullable(),
  assignee_id: idSchema.nullable(),
  completed_at: z.string().datetime({ offset: true }).nullable(),
  reminder_id: idSchema.nullable(),
})
export type Task = z.infer<typeof taskSchema>

// ---- checklists ----
export const checklistSchema = baseEntitySchema.extend({
  task_id: idSchema.nullable(),
  title: z.string().min(1).max(200),
  completed: z.boolean(),
  position: z.number().int().nonnegative(),
})
export type Checklist = z.infer<typeof checklistSchema>

// ---- shopping_items (giá dự kiến/chi thực tế) ----
export const shoppingItemSchema = baseEntitySchema.extend({
  name: z.string().min(1).max(200),
  category: z.string().max(80).nullable(),
  quantity: z.number().positive().nullable(),
  unit: z.string().max(20).nullable(),
  estimated_price: z.number().nonnegative().nullable(),
  actual_price: z.number().nonnegative().nullable(),
  status: shoppingStatusSchema,
  note: z.string().max(500).nullable(),
})
export type ShoppingItem = z.infer<typeof shoppingItemSchema>

// ---- budget_entries ----
export const BUDGET_TYPES = ['income', 'expense'] as const
export const budgetTypeSchema = z.enum(BUDGET_TYPES)
export type BudgetType = z.infer<typeof budgetTypeSchema>

export const budgetEntrySchema = baseEntitySchema.extend({
  title: z.string().min(1).max(200),
  amount: z.number().nonnegative(),
  type: budgetTypeSchema,
  category: z.string().max(80).nullable(),
  occurred_at: dateSchema,
  note: z.string().max(500).nullable(),
})
export type BudgetEntry = z.infer<typeof budgetEntrySchema>

// ---- reminders (lặp theo recurrence) ----
export const reminderSchema = baseEntitySchema.extend({
  title: z.string().min(1).max(200),
  scheduled_at: z.string().datetime({ offset: true }),
  frequency: reminderFrequencySchema,
  channels: z.array(notificationChannelSchema).min(1),
  active: z.boolean(),
  last_sent_at: z.string().datetime({ offset: true }).nullable(),
  payload: z.string().max(1000).nullable(),
})
export type Reminder = z.infer<typeof reminderSchema>

// ---- notification_preferences ----
export const NOTIFICATION_GROUPS = [
  'appointments',
  'reminders',
  'feeding',
  'growth',
  'tasks',
  'safety',
] as const
export const notificationGroupSchema = z.enum(NOTIFICATION_GROUPS)
export type NotificationGroup = z.infer<typeof notificationGroupSchema>

export const notificationPreferenceSchema = baseEntitySchema.extend({
  group: notificationGroupSchema,
  channel: notificationChannelSchema,
  enabled: z.boolean(),
  quiet_start: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
  quiet_end: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
})
export type NotificationPreference = z.infer<typeof notificationPreferenceSchema>
