-- Run this in the Supabase SQL Editor after add_provider_photo.sql.
-- Creates the storage bucket for provider listing photos and its access policies.
--
-- If the `insert into storage.buckets` below fails because your SQL Editor
-- role doesn't have permission, create the bucket manually instead:
-- Storage > New bucket > name "provider-photos" > Public bucket: ON.
-- Then run just the two `create policy` statements below.

insert into storage.buckets (id, name, public)
values ('provider-photos', 'provider-photos', true)
on conflict (id) do nothing;

create policy "provider-photos: public read"
  on storage.objects for select
  to public
  using (bucket_id = 'provider-photos');

create policy "provider-photos: owner write"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'provider-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "provider-photos: owner update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'provider-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "provider-photos: owner delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'provider-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
