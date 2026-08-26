-- 0003: thai kỳ — pregnancies, fetuses, health_profiles, pregnancy_week_snapshots,
-- maternal_measurements, symptom_reports, fetal_movement_logs, appointments,
-- document_records, document_extractions.
begin;

create table public.pregnancies (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  lmp date,
  edd date,
  status public.pregnancy_status not null default 'ongoing',
  source public.data_source not null default 'manual',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index pregnancies_family_idx on public.pregnancies (family_id);

create table public.fetuses (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  pregnancy_id uuid not null references public.pregnancies (id) on delete cascade,
  name text,
  sex public.gender not null default 'unknown',
  birth_order int not null check (birth_order >= 1),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index fetuses_pregnancy_idx on public.fetuses (pregnancy_id);

create table public.health_profiles (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  pregnancy_id uuid not null references public.pregnancies (id) on delete cascade,
  height_cm numeric,
  pre_pregnancy_weight_kg numeric,
  blood_type public.blood_type not null default 'unknown',
  allergies text[] not null default '{}',
  preexisting_conditions text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index health_profiles_pregnancy_idx on public.health_profiles (pregnancy_id);

create table public.pregnancy_week_snapshots (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  pregnancy_id uuid not null references public.pregnancies (id) on delete cascade,
  week int not null check (week between 1 and 42),
  snapshot_date date not null,
  fetal_length_cm numeric,
  fetal_weight_g numeric,
  mom_changes text[] not null default '{}',
  nutrition_focus text[] not null default '{}',
  todo text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pregnancy_id, week)
);

create table public.maternal_measurements (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  pregnancy_id uuid not null references public.pregnancies (id) on delete cascade,
  type public.measurement_type not null,
  value numeric not null,
  unit text not null,
  diastolic numeric,
  taken_at timestamptz not null,
  note text,
  source public.data_source not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index maternal_measurements_pregnancy_taken_idx on public.maternal_measurements (pregnancy_id, taken_at desc);

create table public.symptom_reports (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  pregnancy_id uuid not null references public.pregnancies (id) on delete cascade,
  symptom text not null,
  severity public.symptom_severity not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  note text,
  source public.data_source not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index symptom_reports_pregnancy_idx on public.symptom_reports (pregnancy_id, started_at desc);

create table public.fetal_movement_logs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  pregnancy_id uuid not null references public.pregnancies (id) on delete cascade,
  felt_at timestamptz not null,
  feeling public.fetal_movement_feeling not null,
  duration_min int,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index fetal_movement_logs_pregnancy_idx on public.fetal_movement_logs (pregnancy_id, felt_at desc);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  pregnancy_id uuid not null references public.pregnancies (id) on delete cascade,
  type public.appointment_type not null,
  scheduled_at timestamptz not null,
  location text,
  doctor text,
  summary_before text,
  outcome text,
  notes text,
  followup_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index appointments_pregnancy_idx on public.appointments (pregnancy_id, scheduled_at);

create table public.document_records (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  pregnancy_id uuid not null references public.pregnancies (id) on delete cascade,
  title text not null,
  file_name text,
  file_url text,
  status public.document_status not null default 'uploaded',
  notes text,
  source public.data_source not null default 'document',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index document_records_pregnancy_idx on public.document_records (pregnancy_id);

create table public.document_extractions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  document_id uuid not null references public.document_records (id) on delete cascade,
  field_name text not null,
  raw_value text not null,
  normalized_value text,
  status public.extraction_status not null default 'pending',
  confidence numeric check (confidence between 0 and 1),
  confirmed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index document_extractions_document_idx on public.document_extractions (document_id);

do $$
declare t text;
begin
  foreach t in array array[
    'pregnancies', 'fetuses', 'health_profiles', 'pregnancy_week_snapshots',
    'maternal_measurements', 'symptom_reports', 'fetal_movement_logs',
    'appointments', 'document_records', 'document_extractions'
  ] loop
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

commit;
