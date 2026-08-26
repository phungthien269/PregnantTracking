-- 0009: nước/caffeine — hydration_logs, caffeine_logs (ghi nhanh mỗi lần).
-- Gia đình cùng family; private_owner_id chỉ chủ đọc (ADR-005).
begin;

create table public.hydration_logs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  logged_at timestamptz not null,
  amount_ml int not null check (amount_ml > 0),
  source public.data_source not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index hydration_logs_family_logged_idx on public.hydration_logs (family_id, logged_at desc);

create table public.caffeine_logs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  logged_at timestamptz not null,
  amount_mg int not null check (amount_mg >= 0),
  source public.data_source not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index caffeine_logs_family_logged_idx on public.caffeine_logs (family_id, logged_at desc);

do $$
declare t text;
begin
  foreach t in array array['hydration_logs', 'caffeine_logs'] loop
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ---- RLS (chuẩn 0008: family + private_owner) ----
do $$
declare t text;
begin
  foreach t in array array['hydration_logs', 'caffeine_logs'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "family_read" on public.%I for select using (public.can_access_row(family_id, private_owner_id))', t);
    execute format('create policy "family_insert" on public.%I for insert with check (public.is_family_member(family_id) and (private_owner_id is null or private_owner_id = auth.uid()))', t);
    execute format('create policy "family_update" on public.%I for update using (public.can_access_row(family_id, private_owner_id)) with check (public.is_family_member(family_id) and (private_owner_id is null or private_owner_id = auth.uid()))', t);
    execute format('create policy "family_delete" on public.%I for delete using (public.can_access_row(family_id, private_owner_id))', t);
  end loop;
end $$;

commit;
