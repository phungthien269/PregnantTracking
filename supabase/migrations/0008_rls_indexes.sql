-- 0008: RLS cho MỌI bảng + indexes (FK, full-text, pgvector).
-- Nguyên tắc (ADR-005): bảng gia đình → chỉ thành viên cùng family;
-- private_owner_id → chỉ chủ đọc. Helper hàm security definer để tránh
-- chicken-and-egg với RLS trên chính family_members.
begin;

-- ---- Helper RLS ----
create or replace function public.is_family_member(fid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.family_members fm
    where fm.family_id = fid and fm.user_id = auth.uid()
  )
$$;

create or replace function public.can_access_row(fid uuid, owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_family_member(fid) and (owner is null or owner = auth.uid())
$$;

-- ---- profiles: chỉ chính mình ----
alter table public.profiles enable row level security;
create policy "profiles_own" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- ---- families: thành viên đọc/sửa; tạo → trigger tạo owner + privacy mặc định ----
create or replace function public.handle_new_family()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.family_members (family_id, user_id, role)
  values (new.id, auth.uid(), 'owner');
  insert into public.privacy_settings (family_id)
  values (new.id);
  return new;
end;
$$;

create trigger on_family_created after insert on public.families
  for each row execute function public.handle_new_family();

alter table public.families enable row level security;
create policy "families_read" on public.families
  for select using (public.is_family_member(id));
create policy "families_insert" on public.families
  for insert with check (auth.uid() is not null);
create policy "families_update" on public.families
  for update using (public.is_family_member(id))
  with check (public.is_family_member(id));
create policy "families_delete" on public.families
  for delete using (
    exists (
      select 1 from public.family_members fm
      where fm.family_id = id and fm.user_id = auth.uid() and fm.role = 'owner'
    )
  );

-- ---- family_members: thành viên đọc; insert invite bởi member (owner tạo qua trigger) ----
alter table public.family_members enable row level security;
create policy "family_members_read" on public.family_members
  for select using (public.is_family_member(family_id));
create policy "family_members_insert" on public.family_members
  for insert with check (public.is_family_member(family_id));
create policy "family_members_delete" on public.family_members
  for delete using (public.is_family_member(family_id));

-- ---- privacy_settings / consents / audit_events / ai_consents (không có private_owner_id) ----
alter table public.privacy_settings enable row level security;
create policy "privacy_settings_read" on public.privacy_settings
  for select using (public.is_family_member(family_id));
create policy "privacy_settings_update" on public.privacy_settings
  for update using (public.is_family_member(family_id));

alter table public.consents enable row level security;
create policy "consents_read" on public.consents
  for select using (public.is_family_member(family_id));
create policy "consents_insert" on public.consents
  for insert with check (public.is_family_member(family_id));
create policy "consents_update" on public.consents
  for update using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));

alter table public.audit_events enable row level security;
create policy "audit_events_read" on public.audit_events
  for select using (public.is_family_member(family_id));
-- audit_events chỉ ghi từ server (service role), không cho client insert trực tiếp

alter table public.ai_consents enable row level security;
create policy "ai_consents_read" on public.ai_consents
  for select using (public.is_family_member(family_id));
create policy "ai_consents_update" on public.ai_consents
  for update using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));

-- ---- 49 bảng gia đình: policy chuẩn family + private_owner ----
do $$
declare t text;
begin
  foreach t in array array[
    -- thai kỳ
    'pregnancies', 'fetuses', 'health_profiles', 'pregnancy_week_snapshots',
    'maternal_measurements', 'symptom_reports', 'fetal_movement_logs',
    'appointments', 'document_records', 'document_extractions',
    -- dinh dưỡng
    'nutrition_profiles', 'meal_entries', 'meal_photos', 'food_preferences',
    'food_safety_flags', 'supplement_plans', 'supplement_adherence',
    'condition_plans', 'condition_measurements', 'saved_meals',
    -- sau sinh & bé
    'birth_records', 'children', 'feeding_logs', 'sleep_logs', 'diaper_logs',
    'growth_measurements', 'milestones', 'vaccinations', 'child_medications',
    -- điều phối
    'tasks', 'checklists', 'shopping_items', 'budget_entries', 'reminders',
    'notification_preferences',
    -- nội dung
    'content_sources', 'articles', 'weekly_guides', 'alert_rules', 'content_versions',
    -- AI & học
    'chat_sessions', 'chat_messages', 'knowledge_sources', 'knowledge_chunks',
    'knowledge_stage_tags', 'quiz_sets', 'quiz_questions', 'quiz_attempts',
    'question_reports'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "family_read" on public.%I for select using (public.can_access_row(family_id, private_owner_id))', t);
    execute format('create policy "family_insert" on public.%I for insert with check (public.is_family_member(family_id) and (private_owner_id is null or private_owner_id = auth.uid()))', t);
    execute format('create policy "family_update" on public.%I for update using (public.can_access_row(family_id, private_owner_id)) with check (public.is_family_member(family_id) and (private_owner_id is null or private_owner_id = auth.uid()))', t);
    execute format('create policy "family_delete" on public.%I for delete using (public.can_access_row(family_id, private_owner_id))', t);
  end loop;
end $$;

-- ---- Indexes bổ sung ----
-- full-text search (fallback 'simple'; Việt dấu cần config riêng — ponytail)
create index articles_fts_idx on public.articles
  using gin (to_tsvector('simple', coalesce(title, ' ') || ' ' || coalesce(body, ' ')));
create index knowledge_chunks_fts_idx on public.knowledge_chunks
  using gin (to_tsvector('simple', content));

-- pg_trgm cho tìm tên nhanh
create index articles_title_trgm_idx on public.articles using gin (title gin_trgm_ops);
create index content_sources_title_trgm_idx on public.content_sources using gin (title gin_trgm_ops);
create index knowledge_sources_title_trgm_idx on public.knowledge_sources using gin (title gin_trgm_ops);

-- pgvector cho embedding (cosine)
create index knowledge_chunks_embedding_idx on public.knowledge_chunks
  using hnsw (embedding vector_cosine_ops);

-- bảng có unique (family_id, week) riêng đã tạo; thêm index thường dùng còn thiếu
create index articles_stage_idx on public.articles using gin (stages);
create index chat_messages_family_idx on public.chat_messages (family_id, created_at);

commit;
