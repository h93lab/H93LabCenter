create index if not exists change_requests_applied_version_idx
  on public.change_requests (applied_version_id)
  where applied_version_id is not null;
