-- 0005: sau sinh & bé — birth_records, children, feeding_logs, sleep_logs,
-- diaper_logs, growth_measurements, milestones, vaccinations, child_medications.
begin;

create table public.birth_records (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  pregnancy_id uuid references public.pregnancies (id) on delete set null,
  birth_date date not null,
  birth_type public.birth_type not null,
  hospital text,
  duration_hours numeric,
  complications text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  birth_record_id uuid references public.birth_records (id) on delete set null,
  name text not null,
  sex public.gender not null default 'unknown',
  birth_date date not null,
  birth_weight_kg numeric,
  birth_length_cm numeric,
  head_circumference_cm numeric,
  blood_type text,
  allergies text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index children_birth_record_idx on public.children (birth_record_id);

create table public.feeding_logs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  child_id uuid not null references public.children (id) on delete cascade,
  method public.feeding_method not null,
  side public.feeding_side,
  amount_ml numeric,
  started_at timestamptz not null,
  duration_min numeric,
  note text,
  source public.data_source not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index feeding_logs_child_idx on public.feeding_logs (child_id, started_at desc);

create table public.sleep_logs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  child_id uuid not null references public.children (id) on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  place public.sleep_place not null default 'cot',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index sleep_logs_child_idx on public.sleep_logs (child_id, started_at desc);

create table public.diaper_logs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  child_id uuid not null references public.children (id) on delete cascade,
  changed_at timestamptz not null,
  type public.diaper_type not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index diaper_logs_child_idx on public.diaper_logs (child_id, changed_at desc);

create table public.growth_measurements (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  child_id uuid not null references public.children (id) on delete cascade,
  type public.growth_type not null,
  value numeric not null,
  unit text not null,
  measured_at timestamptz not null,
  note text,
  source public.data_source not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index growth_measurements_child_idx on public.growth_measurements (child_id, measured_at desc);

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  child_id uuid not null references public.children (id) on delete cascade,
  name text not null,
  stage text,
  achieved_at timestamptz,
  status public.milestone_status not null default 'not_yet',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index milestones_child_idx on public.milestones (child_id);

create table public.vaccinations (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  child_id uuid not null references public.children (id) on delete cascade,
  vaccine_name text not null,
  dose_number int check (dose_number >= 1),
  scheduled_date date not null,
  administered_date date,
  location text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index vaccinations_child_idx on public.vaccinations (child_id, scheduled_date);

create table public.child_medications (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  child_id uuid not null references public.children (id) on delete cascade,
  medication_name text not null,
  dosage text not null,
  unit text not null,
  frequency public.reminder_frequency not null default 'daily',
  start_date date,
  end_date date,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index child_medications_child_idx on public.child_medications (child_id);

do $$
declare t text;
begin
  foreach t in array array[
    'birth_records', 'children', 'feeding_logs', 'sleep_logs', 'diaper_logs',
    'growth_measurements', 'milestones', 'vaccinations', 'child_medications'
  ] loop
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

commit;
