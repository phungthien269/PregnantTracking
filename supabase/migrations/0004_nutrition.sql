-- 0004: dinh dưỡng — nutrition_profiles, meal_entries, meal_photos,
-- food_preferences, food_safety_flags, supplement_plans, supplement_adherence,
-- condition_plans, condition_measurements, saved_meals.
begin;

create table public.nutrition_profiles (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  pregnancy_id uuid references public.pregnancies (id) on delete set null,
  dietary_pattern public.dietary_pattern not null default 'omnivore',
  allergies text[] not null default '{}',
  dislikes text[] not null default '{}',
  budget_per_week numeric,
  cook_time_min int,
  pre_pregnancy_weight_kg numeric,
  conditions public.condition_type[] not null default '{}',
  doctor_instructions text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meal_entries (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  meal_type public.meal_type not null,
  name text not null,
  logged_at timestamptz not null,
  calories numeric,
  note text,
  source public.data_source not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index meal_entries_logged_at_idx on public.meal_entries (logged_at desc);

create table public.meal_photos (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  meal_id uuid not null references public.meal_entries (id) on delete cascade,
  file_url text not null,
  ai_suggested_name text,
  confirmed boolean not null default false,
  confirmed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index meal_photos_meal_idx on public.meal_photos (meal_id);

create table public.food_preferences (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  item text not null,
  preference public.food_preference not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.food_safety_flags (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  food text not null,
  level public.food_safety_level not null,
  reason text not null,
  week_from int check (week_from between 1 and 42),
  week_to int check (week_to between 1 and 42),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.supplement_plans (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  name text not null,
  dosage text not null,
  unit text not null,
  frequency public.reminder_frequency not null default 'daily',
  start_date date,
  end_date date,
  status public.supplement_status not null default 'prescribed',
  prescribed_by text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.supplement_adherence (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  supplement_id uuid not null references public.supplement_plans (id) on delete cascade,
  taken_at timestamptz not null,
  status public.adherence_status not null default 'taken',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index supplement_adherence_supplement_idx on public.supplement_adherence (supplement_id, taken_at desc);

create table public.condition_plans (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  condition_type public.condition_type not null,
  plan_text text not null,
  start_date date,
  end_date date,
  doctor_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.condition_measurements (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  condition_plan_id uuid not null references public.condition_plans (id) on delete cascade,
  type text not null,
  value numeric not null,
  unit text not null,
  measured_at timestamptz not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index condition_measurements_plan_idx on public.condition_measurements (condition_plan_id, measured_at desc);

create table public.saved_meals (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  private_owner_id uuid references auth.users (id) on delete set null,
  name text not null,
  meal_type public.meal_type not null,
  servings text,
  calories numeric,
  ingredients text[] not null default '{}',
  instructions text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array[
    'nutrition_profiles', 'meal_entries', 'meal_photos', 'food_preferences',
    'food_safety_flags', 'supplement_plans', 'supplement_adherence',
    'condition_plans', 'condition_measurements', 'saved_meals'
  ] loop
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

commit;
