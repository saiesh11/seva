-- Run this in the Supabase SQL Editor after schema.sql.
-- Adds customer reviews/ratings for providers. One review per customer per provider.

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_details (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (provider_id, reviewer_id)
);

create index reviews_provider_id_idx on public.reviews (provider_id);

alter table public.reviews enable row level security;

create policy "reviews: read for authenticated users"
  on public.reviews for select
  to authenticated
  using (true);

create policy "reviews: insert own review"
  on public.reviews for insert
  to authenticated
  with check (
    reviewer_id = auth.uid()
    and reviewer_id <> (select profile_id from public.provider_details where id = provider_id)
  );

create policy "reviews: update own review"
  on public.reviews for update
  to authenticated
  using (reviewer_id = auth.uid())
  with check (
    reviewer_id = auth.uid()
    and reviewer_id <> (select profile_id from public.provider_details where id = provider_id)
  );

create policy "reviews: delete own review"
  on public.reviews for delete
  to authenticated
  using (reviewer_id = auth.uid());
