insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values
  ('blueprint-exports','blueprint-exports',false,52428800,array['application/zip','application/x-zip-compressed','application/octet-stream']),
  ('prototype-assets','prototype-assets',false,20971520,array['image/png','image/jpeg','image/webp','image/svg+xml','application/json']),
  ('research-raw','research-raw',false,52428800,array['application/json','text/plain','text/html','application/octet-stream'])
on conflict(id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Owner browser sessions may read only objects stored under <uid>/... .
-- Upload/update/delete remain backend-only in V1.
create policy blueprint_exports_read_own
on storage.objects for select to authenticated
using (
  bucket_id = 'blueprint-exports'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy prototype_assets_read_own
on storage.objects for select to authenticated
using (
  bucket_id = 'prototype-assets'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy research_raw_read_own
on storage.objects for select to authenticated
using (
  bucket_id = 'research-raw'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
