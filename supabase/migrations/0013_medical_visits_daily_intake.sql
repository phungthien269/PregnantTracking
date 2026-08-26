-- 0013: Hồ sơ khám (medical_visits + visit_documents) và Theo dõi dinh dưỡng
-- hằng ngày (daily_intake_logs + intake_items).
-- Cả 2 tính năng đều PER-USER (private_owner_id = người tạo) — ADR-005.
-- RLS + helper dùng chung từ 0008 (is_family_member / can_access_row), pattern
-- giống 0009 (hydration_logs / caffeine_logs).
begin;

create type public.intake_item_kind as enum ('meal', 'food', 'custom', 'supplement');

-- ---- Phase 7: Hồ sơ khám ----
create table public.medical_visits (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  visit_date date not null,
  clinic text,
  reason text,
  notes text,
  child_id uuid references public.children (id) on delete set null,
  pregnancy_id uuid references public.pregnancies (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index medical_visits_owner_date_idx on public.medical_visits (private_owner_id, visit_date desc);
create index medical_visits_family_date_idx on public.medical_visits (family_id, visit_date desc);

create table public.visit_documents (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  visit_id uuid not null references public.medical_visits (id) on delete cascade,
  filename text not null,
  mime text not null,
  image_data text not null,
  ocr_text text,
  created_at timestamptz not null default now()
);
create index visit_documents_visit_idx on public.visit_documents (visit_id);
create index visit_documents_owner_idx on public.visit_documents (private_owner_id);

-- ---- Phase 6J: Theo dõi dinh dưỡng hằng ngày ----
create table public.daily_intake_logs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  date date not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index daily_intake_logs_owner_date_idx on public.daily_intake_logs (private_owner_id, date desc);
create index daily_intake_logs_family_date_idx on public.daily_intake_logs (family_id, date desc);

create table public.intake_items (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  log_id uuid not null references public.daily_intake_logs (id) on delete cascade,
  kind public.intake_item_kind not null,
  name text not null,
  ref_id text,
  amount_g numeric,
  qty numeric,
  dose_mg numeric,
  pills numeric,
  nutrients jsonb not null default '{}',
  estimated boolean not null default false,
  note text,
  created_at timestamptz not null default now()
);
create index intake_items_log_idx on public.intake_items (log_id);
create index intake_items_owner_idx on public.intake_items (private_owner_id);

-- ---- Trigger updated_at (bảng có updated_at) ----
do $$
declare t text;
begin
  foreach t in array array['medical_visits', 'daily_intake_logs'] loop
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ---- RLS (chuẩn 0008/0009: family + private_owner) ----
do $$
declare t text;
begin
  foreach t in array array['medical_visits', 'visit_documents', 'daily_intake_logs', 'intake_items'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "family_read" on public.%I for select using (public.can_access_row(family_id, private_owner_id))', t);
    execute format('create policy "family_insert" on public.%I for insert with check (public.is_family_member(family_id) and (private_owner_id is null or private_owner_id = auth.uid()))', t);
    execute format('create policy "family_update" on public.%I for update using (public.can_access_row(family_id, private_owner_id)) with check (public.is_family_member(family_id) and (private_owner_id is null or private_owner_id = auth.uid()))', t);
    execute format('create policy "family_delete" on public.%I for delete using (public.can_access_row(family_id, private_owner_id))', t);
  end loop;
end $$;

commit;
