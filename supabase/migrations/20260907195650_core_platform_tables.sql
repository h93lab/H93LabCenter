create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text not null default 'Africa/Cairo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.app_settings (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  daily_research_enabled boolean not null default true,
  daily_research_local_time time not null default '08:00',
  timezone text not null default 'Africa/Cairo',
  apps_allocation smallint not null default 80 check (apps_allocation between 0 and 100),
  games_allocation smallint not null default 20 check (games_allocation between 0 and 100),
  daily_ai_budget_usd numeric(12,4) not null default 5 check (daily_ai_budget_usd >= 0),
  monthly_ai_budget_usd numeric(12,4) not null default 100 check (monthly_ai_budget_usd >= 0),
  max_deep_candidates integer not null default 10 check (max_deep_candidates > 0),
  idea_of_day_min_score numeric(5,2) not null default 82 check (idea_of_day_min_score between 0 and 100),
  idea_of_day_min_confidence numeric(5,2) not null default 70 check (idea_of_day_min_confidence between 0 and 100),
  development_profile jsonb not null default '{"framework":"Flutter","targets":["iOS","Android"],"primary_downstream_agent":"Claude Code","agent_agnostic":true}'::jsonb,
  research_config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint app_settings_allocation_total check (apps_allocation + games_allocation = 100)
);

create table public.markets (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  region text,
  is_global boolean not null default false,
  enabled_by_default boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.owner_market_preferences (
  owner_id uuid not null references auth.users(id) on delete cascade,
  market_id uuid not null references public.markets(id) on delete cascade,
  enabled boolean not null default true,
  priority smallint not null default 50 check (priority between 0 and 100),
  primary key (owner_id, market_id)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  app_or_game public.app_or_game not null,
  parent_id uuid references public.categories(id),
  external_mappings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint categories_no_self_parent check (parent_id is null or parent_id <> id)
);

create table public.research_sources (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  name text not null,
  source_type text not null,
  enabled boolean not null default true,
  is_paid boolean not null default false,
  reliability_profile jsonb not null default '{}'::jsonb,
  capabilities jsonb not null default '{}'::jsonb,
  config jsonb not null default '{}'::jsonb,
  last_success_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id,key)
);

create table public.research_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('scheduled','manual','scoped_refresh')),
  status public.research_run_status not null default 'queued',
  config_snapshot jsonb not null,
  started_at timestamptz,
  completed_at timestamptz,
  ai_budget_usd numeric(12,4) not null default 0 check (ai_budget_usd >= 0),
  external_budget_usd numeric(12,4) not null default 0 check (external_budget_usd >= 0),
  ai_cost_usd numeric(12,4) not null default 0 check (ai_cost_usd >= 0),
  external_cost_usd numeric(12,4) not null default 0 check (external_cost_usd >= 0),
  warning_count integer not null default 0 check (warning_count >= 0),
  error_summary jsonb not null default '[]'::jsonb,
  stats jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint research_runs_time_order check (completed_at is null or started_at is null or completed_at >= started_at)
);

create table public.research_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  research_run_id uuid references public.research_runs(id) on delete cascade,
  job_type text not null,
  status public.research_job_status not null default 'queued',
  idempotency_key text not null,
  payload jsonb not null default '{}'::jsonb,
  result_ref jsonb,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 3 check (max_attempts > 0),
  leased_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  next_retry_at timestamptz,
  last_error_code text,
  last_error_message text,
  created_at timestamptz not null default now(),
  unique(owner_id,idempotency_key),
  constraint research_jobs_attempt_bounds check (attempt_count <= max_attempts),
  constraint research_jobs_time_order check (completed_at is null or started_at is null or completed_at >= started_at)
);

create table public.source_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  research_run_id uuid not null references public.research_runs(id) on delete cascade,
  source_id uuid not null references public.research_sources(id) on delete cascade,
  market_id uuid references public.markets(id),
  status text not null,
  coverage jsonb not null default '{}'::jsonb,
  item_count integer not null default 0 check (item_count >= 0),
  started_at timestamptz,
  completed_at timestamptz,
  error_code text,
  created_at timestamptz not null default now(),
  constraint source_runs_time_order check (completed_at is null or started_at is null or completed_at >= started_at)
);

create table public.ai_roles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  role_key text not null,
  enabled boolean not null default true,
  primary_model text,
  fallback_models jsonb not null default '[]'::jsonb,
  provider_preferences jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  max_cost_per_call_usd numeric(12,4) check (max_cost_per_call_usd is null or max_cost_per_call_usd >= 0),
  active_prompt_version_id uuid,
  active_schema_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id,role_key)
);

create table public.prompt_versions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  role_key text not null,
  version text not null,
  template text not null,
  schema_version text,
  release_notes text,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  unique(owner_id,role_key,version)
);

alter table public.ai_roles
  add constraint ai_roles_prompt_fk foreign key (active_prompt_version_id) references public.prompt_versions(id) on delete set null;

create table public.ai_invocations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  research_run_id uuid references public.research_runs(id) on delete set null,
  research_job_id uuid references public.research_jobs(id) on delete set null,
  project_id uuid,
  change_request_id uuid,
  role_key text not null,
  prompt_version_id uuid references public.prompt_versions(id) on delete set null,
  schema_version text,
  requested_model text,
  resolved_model text,
  provider text,
  input_tokens bigint check (input_tokens is null or input_tokens >= 0),
  output_tokens bigint check (output_tokens is null or output_tokens >= 0),
  cost_usd numeric(12,6) not null default 0 check (cost_usd >= 0),
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  status text not null,
  retry_count integer not null default 0 check (retry_count >= 0),
  external_request_id text,
  output_checksum text,
  error_code text,
  created_at timestamptz not null default now()
);

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger settings_set_updated_at before update on public.app_settings for each row execute function public.set_updated_at();
create trigger sources_set_updated_at before update on public.research_sources for each row execute function public.set_updated_at();
create trigger ai_roles_set_updated_at before update on public.ai_roles for each row execute function public.set_updated_at();
