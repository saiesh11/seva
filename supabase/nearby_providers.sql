-- Run this in the Supabase SQL Editor after schema.sql.
-- Finds providers offering a given subcategory whose service radius covers
-- the customer's current location, sorted nearest-first.

create or replace function public.nearby_providers(
  p_subcategory_id uuid,
  p_lat double precision,
  p_lng double precision
)
returns table (
  provider_id uuid,
  profile_id uuid,
  full_name text,
  phone text,
  bio text,
  years_experience integer,
  distance_km double precision
)
language sql
stable
as $$
  select
    pd.id as provider_id,
    pd.profile_id,
    p.full_name,
    p.phone,
    pd.bio,
    pd.years_experience,
    ST_Distance(pd.location, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography) / 1000 as distance_km
  from public.provider_services ps
  join public.provider_details pd on pd.id = ps.provider_id
  join public.profiles p on p.id = pd.profile_id
  where ps.subcategory_id = p_subcategory_id
    and ST_DWithin(
      pd.location,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
      pd.service_radius_km * 1000
    )
  order by distance_km asc;
$$;

grant execute on function public.nearby_providers(uuid, double precision, double precision) to authenticated;