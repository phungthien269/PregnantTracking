-- 0002: bảng gia đình + auth: profiles, families, family_members,
-- privacy_settings, consents, audit_events.
begin;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  avatar_url text,
  phone text,
  birth_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.family_role not null default 'member',
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (family_id, user_id)
);
create index family_members_user_idx on public.family_members (user_id);

create table public.privacy_settings (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null unique references public.families (id) on delete cascade,
  share_measurements boolean not null default true,
  share_symptoms boolean not null default true,
  share_documents boolean not null default true,
  share_chat boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  consent_type public.consent_type not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  version text not null,
  created_at timestamptz not null default now(),
  unique (family_id, user_id, consent_type)
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families (id) on delete cascade,
  actor_user_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  created_at timestamptz not null default now()
);
-- audit_events KHÔNG chứa dữ liệu sức khỏe (ADR-005)

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger families_set_updated_at before update on public.families
  for each row execute function public.set_updated_at();
create trigger family_members_set_updated_at before update on public.family_members
  for each row execute function public.set_updated_at();
create trigger privacy_settings_set_updated_at before update on public.privacy_settings
  for each row execute function public.set_updated_at();

commit;
