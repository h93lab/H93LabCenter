-- Only adapters implemented by the Edge Function should start enabled. Catalog
-- entries stay available so future integrations can be configured explicitly.
create function private.center_source_defaults()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.research_sources
  set enabled = false
  where owner_id = new.id
    and key <> all(array['apple_app_store', 'hacker_news', 'github']);
  return new;
end;
$$;

revoke all on function private.center_source_defaults() from public, anon, authenticated;

create trigger zzz_center_source_defaults
after insert on auth.users
for each row execute function private.center_source_defaults();

update public.research_sources
set enabled = false
where key <> all(array['apple_app_store', 'hacker_news', 'github']);
