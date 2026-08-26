-- 0007: nội dung (5 bảng) + AI/học (10 bảng).
begin;

-- ---- Nội dung ----
create table public.content_sources (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  source_type public.content_source_type not null,
  title text not null,
  url text,
  file_url text,
  status public.content_source_status not null default 'uploaded',
  error text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index content_sources_family_idx on public.content_sources (family_id);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  title text not null,
  slug text not null unique,
  summary text,
  body text not null,
  stages public.knowledge_stage[] not null default '{}',
  tags text[] not null default '{}',
  author text,
  published_at timestamptz,
  medical_reviewed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.weekly_guides (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  week int not null check (week between 1 and 42),
  trimester public.trimester not null,
  title text not null,
  content text not null,
  nutrition_focus text[] not null default '{}',
  appointments_due text[] not null default '{}',
  todo text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (family_id, week)
);

create table public.alert_rules (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  trigger_type text not null,
  trigger_value text,
  message text not null,
  severity public.alert_severity not null default 'info',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.content_versions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  content_type public.content_version_type not null,
  content_id uuid not null,
  version int not null,
  body text not null,
  changelog text,
  created_by uuid,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_type, content_id, version)
);

-- ---- AI & học ----
create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  title text,
  stage public.knowledge_stage,
  model text,
  status public.chat_session_status not null default 'active',
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  session_id uuid not null references public.chat_sessions (id) on delete cascade,
  role public.chat_role not null,
  content text not null,
  sources uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index chat_messages_session_idx on public.chat_messages (session_id, created_at);

create table public.ai_consents (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  model_provider text not null,
  version text not null,
  created_at timestamptz not null default now(),
  unique (family_id, user_id)
);

create table public.knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  content_source_id uuid references public.content_sources (id) on delete set null,
  title text not null,
  stage public.knowledge_stage,
  status public.knowledge_source_status not null default 'processing',
  chunk_count int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index knowledge_sources_family_idx on public.knowledge_sources (family_id);

create table public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  knowledge_source_id uuid not null references public.knowledge_sources (id) on delete cascade,
  content text not null,
  citation text not null,
  position int not null,
  embedding vector (1536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index knowledge_chunks_source_idx on public.knowledge_chunks (knowledge_source_id, position);

create table public.knowledge_stage_tags (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  knowledge_source_id uuid not null references public.knowledge_sources (id) on delete cascade,
  stage public.knowledge_stage not null,
  confirmed_by uuid,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (knowledge_source_id, stage)
);

create table public.quiz_sets (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  title text not null,
  stage public.knowledge_stage,
  source_ids uuid[] not null default '{}',
  status public.quiz_set_status not null default 'draft',
  question_count int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  quiz_set_id uuid not null references public.quiz_sets (id) on delete cascade,
  type public.quiz_question_type not null default 'multiple_choice',
  prompt text not null,
  options text[] not null,
  correct_index int not null,
  explanation text not null,
  citation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index quiz_questions_set_idx on public.quiz_questions (quiz_set_id);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  quiz_set_id uuid not null references public.quiz_sets (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status public.quiz_attempt_status not null default 'in_progress',
  score int,
  correct_count int,
  total_questions int,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index quiz_attempts_user_idx on public.quiz_attempts (user_id, quiz_set_id);

create table public.question_reports (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  quiz_question_id uuid not null references public.quiz_questions (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null,
  status public.question_report_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index question_reports_question_idx on public.question_reports (quiz_question_id);

do $$
declare t text;
begin
  foreach t in array array[
    'content_sources', 'articles', 'weekly_guides', 'alert_rules', 'content_versions',
    'chat_sessions', 'chat_messages', 'knowledge_sources', 'knowledge_chunks',
    'knowledge_stage_tags', 'quiz_sets', 'quiz_questions', 'quiz_attempts', 'question_reports'
  ] loop
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

commit;
