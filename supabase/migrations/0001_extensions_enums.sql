-- 0001: extensions + enum types (tên trùng core.ts) + set_updated_at()
begin;

create extension if not exists "uuid-ossp";
create extension if not exists pg_trgm;
create extension if not exists vector;

-- ---- Core enums (khớp packages/domain/src/core.ts) ----
create type public.data_source as enum ('manual', 'healthkit', 'document');
create type public.gender as enum ('male', 'female', 'unknown');
create type public.trimester as enum ('first', 'second', 'third');
create type public.pregnancy_status as enum ('ongoing', 'birth_recorded', 'ended');
create type public.measurement_type as enum (
  'weight', 'blood_pressure', 'blood_glucose', 'waist_circumference',
  'bmi', 'fundal_height', 'heart_rate'
);
create type public.symptom_severity as enum ('mild', 'moderate', 'severe');
create type public.fetal_movement_feeling as enum ('normal', 'reduced', 'absent', 'strong');
create type public.appointment_type as enum (
  'first_visit', 'prenatal', 'ultrasound', 'blood_test', 'screening',
  'vaccination', 'postpartum_check', 'baby_check'
);
create type public.document_status as enum ('uploaded', 'processing', 'ready', 'failed');
create type public.extraction_status as enum ('pending', 'awaiting_confirmation', 'confirmed', 'rejected');
create type public.meal_type as enum ('breakfast', 'lunch', 'dinner', 'snack', 'drink');
create type public.dietary_pattern as enum ('omnivore', 'vegetarian', 'vegan', 'pescatarian', 'halal', 'low_carb', 'other');
create type public.supplement_status as enum ('prescribed', 'confirmed', 'taken', 'skipped');
create type public.condition_type as enum (
  'gestational_diabetes', 'hypertension', 'preeclampsia_risk',
  'hypothyroidism', 'hyperemesis', 'anemia', 'cholestasis'
);
create type public.birth_type as enum ('vaginal', 'c_section', 'assisted');
create type public.feeding_method as enum ('breast', 'pumped_milk', 'formula', 'mixed');
create type public.feeding_side as enum ('left', 'right', 'both');
create type public.diaper_type as enum ('pee', 'poo', 'mixed');
create type public.sleep_place as enum ('cot', 'bassinet', 'co_sleeping', 'carrier', 'stroller', 'other');
create type public.milestone_status as enum ('achieved', 'not_yet', 'questionable');
create type public.task_status as enum ('todo', 'in_progress', 'done', 'cancelled');
create type public.shopping_status as enum ('pending', 'bought', 'cancelled');
create type public.reminder_frequency as enum ('once', 'daily', 'weekly', 'monthly', 'custom');
create type public.notification_channel as enum ('in_app', 'email', 'push');
create type public.content_source_type as enum ('article', 'guide', 'pdf', 'epub', 'url');
create type public.knowledge_stage as enum ('pregnancy', 'postpartum', 'newborn', 'age_1_6m', 'age_6_12m', 'age_12_24m');
create type public.chat_role as enum ('user', 'assistant', 'system');
create type public.quiz_question_type as enum ('multiple_choice', 'scenario');
create type public.quiz_attempt_status as enum ('in_progress', 'completed', 'abandoned');

-- ---- Enums riêng của module domain ----
create type public.family_role as enum ('owner', 'member');
create type public.consent_type as enum ('ai_chat', 'ai_analysis', 'data_export', 'notifications');
create type public.blood_type as enum ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown');
create type public.food_safety_level as enum ('avoid', 'limit', 'ok');
create type public.food_preference as enum ('like', 'dislike');
create type public.adherence_status as enum ('taken', 'skipped');
create type public.growth_type as enum ('weight', 'height', 'head_circumference');
create type public.budget_type as enum ('income', 'expense');
create type public.notification_group as enum (
  'appointments', 'reminders', 'feeding', 'growth', 'tasks', 'safety'
);
create type public.content_source_status as enum ('uploaded', 'processing', 'ready', 'failed');
create type public.content_version_type as enum ('article', 'weekly_guide', 'knowledge_source');
create type public.alert_severity as enum ('info', 'warning', 'critical');
create type public.chat_session_status as enum ('active', 'archived');
create type public.knowledge_source_status as enum ('processing', 'ready', 'failed');
create type public.quiz_set_status as enum ('draft', 'ready');
create type public.question_report_status as enum ('open', 'resolved', 'rejected');

-- ---- set_updated_at() ----
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

commit;
