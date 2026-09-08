-- LOCAL/REPO reconciliation migration (TASK-002) — NOT part of the authoritative
-- remote 10-migration history. The remote h93lab project already has these two
-- durable PGMQ queues, created out-of-history on 2026-09-07 20:26 UTC.
-- This file exists so a fresh LOCAL environment reproduces the remote state.
-- Do NOT push/apply this to the remote project without an explicit decision on
-- how to register it in remote migration history.
--
-- Queues stay server-side only: pgmq lives in its own schema, is not in
-- api.schemas, and no anon/authenticated grants are added here.
--
-- pgmq 1.5.1 has no create_if_not_exists; guard with list_queues() so replay
-- is idempotent and safe if the queues already exist (e.g. a database where
-- they were created out-of-band).

do $$
begin
  if not exists (select 1 from pgmq.list_queues() where queue_name = 'research_jobs') then
    perform pgmq.create('research_jobs');
  end if;

  if not exists (select 1 from pgmq.list_queues() where queue_name = 'blueprint_jobs') then
    perform pgmq.create('blueprint_jobs');
  end if;
end
$$;
