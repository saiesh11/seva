-- Lets a customer pin a search location in Settings instead of always
-- using live GPS. Plain lat/lng (not geography) since this is only ever
-- read back and passed straight into nearby_providers() as p_lat/p_lng -
-- no spatial querying needed on it, so no WKB round-trip headache.
-- Run this in the Supabase SQL Editor after schema.sql.

alter table public.profiles
  add column search_location_lat double precision,
  add column search_location_lng double precision,
  add column search_location_label text;
