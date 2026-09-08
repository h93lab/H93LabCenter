create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  concept_id uuid not null references public.product_concepts(id),
  name text not null,
  slug text not null,
  status public.project_status not null default 'blueprint_draft',
  frozen_research_snapshot jsonb not null,
  current_blueprint_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id,slug)
);

create table public.blueprint_versions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  base_version_id uuid,
  status public.blueprint_version_status not null default 'draft',
  is_current boolean not null default false,
  change_summary text,
  manifest jsonb not null default '{}'::jsonb,
  quality_score numeric(5,2) check(quality_score between 0 and 100),
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique(project_id,version_number),
  unique(project_id,id)
);

alter table public.blueprint_versions
  add constraint blueprint_versions_base_same_project_fk
  foreign key(project_id,base_version_id) references public.blueprint_versions(project_id,id);

alter table public.projects
  add constraint projects_current_version_same_project_fk
  foreign key(id,current_blueprint_version_id) references public.blueprint_versions(project_id,id);

create table public.blueprint_documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  blueprint_version_id uuid not null references public.blueprint_versions(id) on delete cascade,
  path text not null,
  document_type text not null,
  title text not null,
  content_md text not null default '',
  checksum text,
  validation_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(blueprint_version_id,path)
);

create table public.blueprint_requirements (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  blueprint_version_id uuid not null references public.blueprint_versions(id) on delete cascade,
  stable_key text not null, title text not null, requirement_text text not null, rationale text,
  priority text not null default 'MVP', acceptance_criteria jsonb not null default '[]'::jsonb,
  trace jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(),
  unique(blueprint_version_id,stable_key)
);

create table public.blueprint_features (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  blueprint_version_id uuid not null references public.blueprint_versions(id) on delete cascade,
  stable_key text not null, name text not null, outcome text not null, description text not null,
  priority text not null default 'MVP', data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), unique(blueprint_version_id,stable_key)
);

create table public.blueprint_rules (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  blueprint_version_id uuid not null references public.blueprint_versions(id) on delete cascade,
  stable_key text not null, name text not null, condition_text text not null, behavior_text text not null,
  exceptions jsonb not null default '[]'::jsonb, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), unique(blueprint_version_id,stable_key)
);

create table public.blueprint_screens (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  blueprint_version_id uuid not null references public.blueprint_versions(id) on delete cascade,
  stable_key text not null, name text not null, purpose text not null,
  entry_points jsonb not null default '[]'::jsonb, components jsonb not null default '[]'::jsonb,
  states jsonb not null default '{}'::jsonb, actions jsonb not null default '[]'::jsonb,
  navigation jsonb not null default '[]'::jsonb, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), unique(blueprint_version_id,stable_key)
);

create table public.blueprint_flows (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  blueprint_version_id uuid not null references public.blueprint_versions(id) on delete cascade,
  stable_key text not null, name text not null, trigger_text text, preconditions jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb, completion_text text, data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), unique(blueprint_version_id,stable_key)
);

create table public.blueprint_decisions (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  blueprint_version_id uuid not null references public.blueprint_versions(id) on delete cascade,
  stable_key text not null, decision_text text not null, rationale text not null,
  alternatives jsonb not null default '[]'::jsonb, consequences jsonb not null default '[]'::jsonb,
  research_trace jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(),
  unique(blueprint_version_id,stable_key)
);

create table public.blueprint_tasks (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  blueprint_version_id uuid not null references public.blueprint_versions(id) on delete cascade,
  stable_key text not null, title text not null, objective text not null,
  dependencies jsonb not null default '[]'::jsonb, implements jsonb not null default '[]'::jsonb,
  guidance text, test_obligations jsonb not null default '[]'::jsonb, definition_of_done jsonb not null default '[]'::jsonb,
  sequence integer check (sequence is null or sequence >= 0), created_at timestamptz not null default now(), unique(blueprint_version_id,stable_key)
);

create table public.blueprint_tests (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  blueprint_version_id uuid not null references public.blueprint_versions(id) on delete cascade,
  stable_key text not null, title text not null, test_type text not null, validates jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb, expected_result text not null,
  created_at timestamptz not null default now(), unique(blueprint_version_id,stable_key)
);

create table public.traceability_links (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  blueprint_version_id uuid,
  source_kind text not null, source_key text not null, target_kind text not null, target_key text not null,
  relation text not null, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(),
  foreign key(project_id,blueprint_version_id) references public.blueprint_versions(project_id,id) on delete cascade
);

create table public.change_requests (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  base_blueprint_version_id uuid not null,
  request_text text not null, normalized_request text, status public.change_request_status not null default 'created',
  impact_summary jsonb, requested_at timestamptz not null default now(), completed_at timestamptz,
  foreign key(project_id,base_blueprint_version_id) references public.blueprint_versions(project_id,id),
  constraint change_requests_time_order check (completed_at is null or completed_at >= requested_at)
);

create table public.change_impacts (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  change_request_id uuid not null references public.change_requests(id) on delete cascade,
  artifact_kind text not null, artifact_key text not null, action text not null check(action in ('add','update','remove','review','stale')),
  reason text not null, risk text not null, proposed_change text, created_at timestamptz not null default now()
);

create table public.prototype_artifacts (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  blueprint_version_id uuid not null,
  artifact_type text not null check(artifact_type in ('internal','figma')),
  status public.prototype_status not null default 'not_generated',
  spec jsonb not null default '{}'::jsonb, external_ref jsonb not null default '{}'::jsonb,
  stale_keys jsonb not null default '[]'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(project_id,blueprint_version_id) references public.blueprint_versions(project_id,id)
);

create table public.quality_reports (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  blueprint_version_id uuid not null,
  overall_score numeric(5,2) check(overall_score between 0 and 100), mandatory_pass boolean not null default false,
  gates jsonb not null, findings jsonb not null default '[]'::jsonb, created_at timestamptz not null default now(),
  foreign key(project_id,blueprint_version_id) references public.blueprint_versions(project_id,id)
);

create table public.export_packages (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  blueprint_version_id uuid not null,
  storage_path text not null, manifest jsonb not null, archive_checksum text,
  status text not null default 'generated', created_at timestamptz not null default now(),
  foreign key(project_id,blueprint_version_id) references public.blueprint_versions(project_id,id)
);

create trigger projects_set_updated_at before update on public.projects for each row execute function public.set_updated_at();
create trigger blueprint_documents_set_updated_at before update on public.blueprint_documents for each row execute function public.set_updated_at();
create trigger prototype_artifacts_set_updated_at before update on public.prototype_artifacts for each row execute function public.set_updated_at();

alter table public.ai_invocations
  add constraint ai_invocations_project_fk foreign key(project_id) references public.projects(id) on delete set null;
alter table public.ai_invocations
  add constraint ai_invocations_change_request_fk foreign key(change_request_id) references public.change_requests(id) on delete set null;
