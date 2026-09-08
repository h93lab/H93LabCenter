-- Foundation extensions, API defaults, internal schema, enums, shared trigger helper
create extension if not exists vector with schema extensions;
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;
create extension if not exists pgmq;

-- Application-private routines live outside the exposed Data API schema.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Opt in to explicit Data API exposure for objects created from this point forward.
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public;

create type public.app_or_game as enum ('app','game');
create type public.recommendation_status as enum ('STRONG_BUILD','BUILD','VALIDATE_FIRST','WATCH','PASS','KILLED');
create type public.user_disposition as enum ('undecided','shortlisted','watching','go','passed','archived');
create type public.research_run_status as enum ('queued','running','completed','completed_with_warnings','budget_limited','failed','cancelled');
create type public.research_job_status as enum ('queued','leased','running','succeeded','retry_wait','dead_letter','cancelled');
create type public.verification_status as enum ('verified','supported','inferred','estimated','unknown','contradicted');
create type public.evidence_relation as enum ('supports','contradicts','contextualizes','estimates');
create type public.competitor_relation as enum ('direct','indirect','substitute');
create type public.project_status as enum ('blueprint_draft','blueprint_review','prototype_ready','quality_blocked','ready_for_development','archived');
create type public.blueprint_version_status as enum ('draft','validating','published','superseded','failed_validation');
create type public.change_request_status as enum ('created','analyzing','impact_ready','approved','applying','validating','published','failed_validation','cancelled');
create type public.prototype_status as enum ('not_generated','generating','current','stale','failed');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
