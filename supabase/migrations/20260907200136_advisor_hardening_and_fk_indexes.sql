-- Supabase platform helper is an event-trigger routine, not an application RPC.
-- Keep the event trigger functional while removing direct Data API execution.
-- LOCAL-PLATFORM GUARD (TASK-002 reconciliation): public.rls_auto_enable() exists on the
-- hosted h93lab project but not in the CLI local image (verified 2026-09-08). The revoke
-- below is wrapped in an existence check so the authoritative statement applies wherever
-- the function exists and is a no-op where the platform never provisioned it. No semantic
-- change to the remote state.
do $$
begin
  if exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    execute 'revoke execute on function public.rls_auto_enable() from public, anon, authenticated, service_role';
  end if;
end $$;

-- Make signal_evidence a first-class relational entity while retaining its partial uniqueness rules.
alter table public.signal_evidence
  add column id uuid not null default gen_random_uuid();
alter table public.signal_evidence
  add constraint signal_evidence_pkey primary key(id);

-- Add covering indexes for every currently-unindexed public-schema foreign key.
-- These support FK checks/cascades and the owner-scoped access patterns used throughout the platform.
do $$
declare
  r record;
  idx_name text;
  cols_sql text;
begin
  for r in
    select
      con.oid as constraint_oid,
      c.relname as table_name,
      con.conname,
      con.conrelid,
      con.conkey,
      array_agg(a.attname order by u.ord) as column_names
    from pg_constraint con
    join pg_class c on c.oid = con.conrelid
    join pg_namespace n on n.oid = c.relnamespace
    cross join lateral unnest(con.conkey) with ordinality as u(attnum, ord)
    join pg_attribute a on a.attrelid = con.conrelid and a.attnum = u.attnum
    where con.contype = 'f'
      and n.nspname = 'public'
      and not exists (
        select 1
        from pg_index i
        where i.indrelid = con.conrelid
          and i.indisvalid
          and i.indisready
          and (
            select array_agg(k.attnum order by k.ord)
            from unnest(i.indkey::smallint[]) with ordinality as k(attnum, ord)
            where k.ord <= cardinality(con.conkey)
          ) = con.conkey
      )
    group by con.oid, c.relname, con.conname, con.conrelid, con.conkey
  loop
    select string_agg(format('%I', x), ', ')
    into cols_sql
    from unnest(r.column_names) as x;

    idx_name := left(r.table_name || '_fk_' || substr(md5(r.conname),1,10) || '_idx', 63);
    execute format('create index if not exists %I on public.%I (%s)', idx_name, r.table_name, cols_sql);
  end loop;
end $$;
