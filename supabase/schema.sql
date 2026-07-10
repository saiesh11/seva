-- Local Services Marketplace: initial schema + RLS
-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query)

-- ============================================================
-- profiles
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text,
  full_name text,
  role text not null check (role in ('customer', 'provider', 'both')),
  preferred_language text not null default 'en' check (preferred_language in ('en', 'te', 'hi')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own row or public provider rows"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or role in ('provider', 'both'));

create policy "profiles: insert own row"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "profiles: update own row"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ============================================================
-- categories
-- ============================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_te text,
  name_hi text,
  icon_url text
);

alter table public.categories enable row level security;

create policy "categories: read for authenticated users"
  on public.categories for select
  to authenticated
  using (true);

-- ============================================================
-- subcategories
-- ============================================================
create table public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  name_en text not null,
  name_te text,
  name_hi text
);

create index subcategories_category_id_idx on public.subcategories (category_id);

alter table public.subcategories enable row level security;

create policy "subcategories: read for authenticated users"
  on public.subcategories for select
  to authenticated
  using (true);

-- ============================================================
-- provider_details
-- ============================================================
create table public.provider_details (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles (id) on delete cascade,
  bio text,
  years_experience integer,
  location geography(point, 4326),
  service_radius_km integer,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create index provider_details_location_idx on public.provider_details using gist (location);

alter table public.provider_details enable row level security;

create policy "provider_details: read for authenticated users"
  on public.provider_details for select
  to authenticated
  using (true);

create policy "provider_details: insert own row"
  on public.provider_details for insert
  to authenticated
  with check (profile_id = auth.uid());

create policy "provider_details: update own row"
  on public.provider_details for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy "provider_details: delete own row"
  on public.provider_details for delete
  to authenticated
  using (profile_id = auth.uid());

-- ============================================================
-- provider_services (join table)
-- ============================================================
create table public.provider_services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_details (id) on delete cascade,
  subcategory_id uuid not null references public.subcategories (id) on delete cascade,
  unique (provider_id, subcategory_id)
);

create index provider_services_provider_id_idx on public.provider_services (provider_id);
create index provider_services_subcategory_id_idx on public.provider_services (subcategory_id);

alter table public.provider_services enable row level security;

create policy "provider_services: read for authenticated users"
  on public.provider_services for select
  to authenticated
  using (true);

create policy "provider_services: insert own rows"
  on public.provider_services for insert
  to authenticated
  with check (
    provider_id in (
      select id from public.provider_details where profile_id = auth.uid()
    )
  );

create policy "provider_services: delete own rows"
  on public.provider_services for delete
  to authenticated
  using (
    provider_id in (
      select id from public.provider_details where profile_id = auth.uid()
    )
  );
