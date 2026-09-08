create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  research_run_id uuid references public.research_runs(id) on delete set null,
  source_id uuid not null references public.research_sources(id),
  source_run_id uuid references public.source_runs(id) on delete set null,
  external_id text,
  canonical_url text,
  title text,
  source_type text not null,
  market_id uuid references public.markets(id),
  language text,
  published_at timestamptz,
  collected_at timestamptz not null default now(),
  raw_text text,
  normalized_text text,
  raw_payload jsonb,
  normalized_payload jsonb,
  content_hash text not null,
  parser_version text,
  retention_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(owner_id,source_id,content_hash)
);

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  claim_type text not null,
  claim_text text not null,
  normalized_claim text,
  verification public.verification_status not null default 'unknown',
  confidence numeric(5,2) not null default 0 check (confidence between 0 and 100),
  market_id uuid references public.markets(id),
  created_by_role text,
  created_at timestamptz not null default now()
);

create table public.claim_evidence (
  owner_id uuid not null references auth.users(id) on delete cascade,
  claim_id uuid not null references public.claims(id) on delete cascade,
  evidence_id uuid not null references public.evidence(id) on delete cascade,
  relation public.evidence_relation not null,
  strength numeric(5,2) check (strength between 0 and 100),
  rationale text,
  primary key (claim_id,evidence_id,relation)
);

create table public.signals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  research_run_id uuid references public.research_runs(id) on delete set null,
  signal_type text not null,
  title text not null,
  summary text not null,
  direction text not null check (direction in ('positive','negative','mixed','neutral')),
  strength numeric(5,2) check (strength between 0 and 100),
  strength_class text,
  raw_value numeric,
  raw_unit text,
  is_estimate boolean not null default false,
  market_id uuid references public.markets(id),
  category_id uuid references public.categories(id),
  observed_at timestamptz not null default now(),
  confidence numeric(5,2) not null default 0 check (confidence between 0 and 100),
  created_at timestamptz not null default now()
);

create table public.signal_evidence (
  owner_id uuid not null references auth.users(id) on delete cascade,
  signal_id uuid not null references public.signals(id) on delete cascade,
  evidence_id uuid references public.evidence(id) on delete cascade,
  claim_id uuid references public.claims(id) on delete cascade,
  check (evidence_id is not null or claim_id is not null)
);

create table public.signal_clusters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  research_run_id uuid references public.research_runs(id) on delete set null,
  cluster_key text,
  title text not null,
  summary text not null,
  embedding extensions.vector,
  confidence numeric(5,2) not null default 0 check (confidence between 0 and 100),
  created_at timestamptz not null default now()
);

create table public.signal_cluster_members (
  owner_id uuid not null references auth.users(id) on delete cascade,
  cluster_id uuid not null references public.signal_clusters(id) on delete cascade,
  signal_id uuid not null references public.signals(id) on delete cascade,
  similarity numeric(6,5) check (similarity is null or similarity between -1 and 1),
  primary key(cluster_id,signal_id)
);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  problem_statement text not null,
  job_to_be_done text not null,
  target_audience text not null,
  why_now text not null,
  opportunity_type text not null,
  app_or_game public.app_or_game not null,
  category_id uuid references public.categories(id),
  normalized_key text,
  embedding extensions.vector,
  lifecycle_status text not null default 'discovered',
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint opportunities_seen_order check (last_seen_at >= first_seen_at)
);

create table public.opportunity_markets (
  owner_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  market_id uuid not null references public.markets(id),
  relevance numeric(5,2) check (relevance between 0 and 100),
  notes jsonb not null default '{}'::jsonb,
  primary key(opportunity_id,market_id)
);

create table public.opportunity_signals (
  owner_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  signal_id uuid not null references public.signals(id) on delete cascade,
  primary key(opportunity_id,signal_id)
);

create table public.product_concepts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  title text not null,
  value_proposition text not null,
  target_user text not null,
  wedge text not null,
  differentiation_hypothesis text,
  mvp_thesis text,
  monetization_candidates jsonb not null default '[]'::jsonb,
  distribution_candidates jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  technical_dependencies jsonb not null default '[]'::jsonb,
  ai_dependency text check (ai_dependency in ('none','supporting','core')),
  disposition public.user_disposition not null default 'undecided',
  first_analyzed_at timestamptz,
  last_analyzed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_concepts_analysis_order check (last_analyzed_at is null or first_analyzed_at is null or last_analyzed_at >= first_analyzed_at)
);

create table public.concept_markets (
  owner_id uuid not null references auth.users(id) on delete cascade,
  concept_id uuid not null references public.product_concepts(id) on delete cascade,
  market_id uuid not null references public.markets(id),
  priority smallint default 50 check(priority between 0 and 100),
  primary key(concept_id,market_id)
);

create table public.opportunity_timeline_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  opportunity_id uuid references public.opportunities(id) on delete cascade,
  concept_id uuid references public.product_concepts(id) on delete cascade,
  event_type text not null,
  summary text not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  check (opportunity_id is not null or concept_id is not null)
);

create table public.competitors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  canonical_name text not null,
  entity_type text not null,
  website text,
  apple_app_id text,
  google_play_id text,
  developer_name text,
  category_id uuid references public.categories(id),
  canonical_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.competitor_snapshots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  competitor_id uuid not null references public.competitors(id) on delete cascade,
  evidence_id uuid references public.evidence(id) on delete set null,
  market_id uuid references public.markets(id),
  platform text,
  captured_at timestamptz not null default now(),
  price_summary text,
  monetization_summary text,
  rating numeric(4,2) check (rating is null or rating between 0 and 5),
  review_count bigint check (review_count is null or review_count >= 0),
  category_rank integer check (category_rank is null or category_rank > 0),
  version text,
  last_update_at timestamptz,
  features jsonb not null default '{}'::jsonb,
  languages jsonb not null default '[]'::jsonb,
  download_estimate numeric check (download_estimate is null or download_estimate >= 0),
  revenue_estimate numeric check (revenue_estimate is null or revenue_estimate >= 0),
  estimate_provider text,
  payload jsonb not null default '{}'::jsonb
);

create table public.concept_competitors (
  owner_id uuid not null references auth.users(id) on delete cascade,
  concept_id uuid not null references public.product_concepts(id) on delete cascade,
  competitor_id uuid not null references public.competitors(id) on delete cascade,
  relation public.competitor_relation not null,
  incumbent_pressure numeric(5,2) check(incumbent_pressure between 0 and 100),
  analysis jsonb not null default '{}'::jsonb,
  primary key(concept_id,competitor_id)
);

create table public.review_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  competitor_id uuid references public.competitors(id) on delete cascade,
  evidence_id uuid references public.evidence(id) on delete cascade,
  external_id text,
  market_id uuid references public.markets(id),
  language text,
  rating numeric(3,2) check (rating is null or rating between 0 and 5),
  review_text text,
  published_at timestamptz,
  classification jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint review_items_has_origin check (competitor_id is not null or evidence_id is not null)
);

create table public.review_clusters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  concept_id uuid references public.product_concepts(id) on delete cascade,
  competitor_id uuid references public.competitors(id) on delete cascade,
  category text not null,
  theme text not null,
  sentiment text not null,
  market_id uuid references public.markets(id),
  language text,
  sample_size integer not null default 0 check (sample_size >= 0),
  member_count integer not null default 0 check (member_count >= 0),
  confidence numeric(5,2) not null default 0 check(confidence between 0 and 100),
  summary text,
  first_observed_at timestamptz,
  last_observed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint review_clusters_observed_order check (last_observed_at is null or first_observed_at is null or last_observed_at >= first_observed_at)
);

create table public.review_cluster_members (
  owner_id uuid not null references auth.users(id) on delete cascade,
  cluster_id uuid not null references public.review_clusters(id) on delete cascade,
  review_item_id uuid not null references public.review_items(id) on delete cascade,
  primary key(cluster_id,review_item_id)
);

create table public.scoring_models (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  model_key text not null,
  version text not null,
  app_or_game public.app_or_game not null,
  weights jsonb not null,
  thresholds jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(owner_id,model_key,version)
);

create table public.score_snapshots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  concept_id uuid not null references public.product_concepts(id) on delete cascade,
  market_id uuid references public.markets(id),
  scoring_model_id uuid not null references public.scoring_models(id),
  overall_score numeric(5,2) not null check(overall_score between 0 and 100),
  factors jsonb not null,
  calculated_at timestamptz not null default now()
);

create table public.confidence_snapshots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  concept_id uuid not null references public.product_concepts(id) on delete cascade,
  market_id uuid references public.markets(id),
  confidence numeric(5,2) not null check(confidence between 0 and 100),
  components jsonb not null,
  calculated_at timestamptz not null default now()
);

create table public.kill_assessments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  concept_id uuid not null references public.product_concepts(id) on delete cascade,
  market_id uuid references public.markets(id),
  rule_key text not null,
  rule_version text not null,
  result text not null check(result in ('pass','fail','unknown')),
  severity text not null,
  rationale text,
  evidence_ids jsonb not null default '[]'::jsonb,
  evaluated_at timestamptz not null default now()
);

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  concept_id uuid not null references public.product_concepts(id) on delete cascade,
  market_id uuid references public.markets(id),
  score_snapshot_id uuid references public.score_snapshots(id) on delete set null,
  confidence_snapshot_id uuid references public.confidence_snapshots(id) on delete set null,
  status public.recommendation_status not null,
  rationale text not null,
  strongest_evidence_ids jsonb not null default '[]'::jsonb,
  biggest_risk text,
  validation_priorities jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create trigger opportunities_set_updated_at before update on public.opportunities for each row execute function public.set_updated_at();
create trigger concepts_set_updated_at before update on public.product_concepts for each row execute function public.set_updated_at();
create trigger competitors_set_updated_at before update on public.competitors for each row execute function public.set_updated_at();
