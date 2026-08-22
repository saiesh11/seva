-- Run this in the Supabase SQL Editor after schema.sql.
-- Adds a photo to provider listings.

alter table public.provider_details
  add column photo_url text;
