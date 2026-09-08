create table public.daily_promotions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  promotion_date date not null,
  timezone text not null,
  concept_id uuid references public.product_concepts(id) on delete set null,
  score_snapshot_id uuid references public.score_snapshots(id) on delete set null,
  confidence_snapshot_id uuid references public.confidence_snapshots(id) on delete set null,
  recommendation_id uuid references public.recommendations(id) on delete set null,
  promoted boolean not null default false,
  no_promotion_reason text,
  best_candidate_concept_id uuid references public.product_concepts(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(owner_id,promotion_date),
  constraint daily_promotions_state_check check (
    (promoted = true and concept_id is not null)
    or (promoted = false)
  )
);

create unique index blueprint_one_current_version_idx
on public.blueprint_versions(project_id)
where is_current = true and status = 'published';

create unique index signal_evidence_unique_evidence_idx
on public.signal_evidence(signal_id,evidence_id)
where evidence_id is not null;
create unique index signal_evidence_unique_claim_idx
on public.signal_evidence(signal_id,claim_id)
where claim_id is not null;

create index research_runs_owner_created_idx on public.research_runs(owner_id,created_at desc);
create index research_jobs_run_status_idx on public.research_jobs(research_run_id,status,created_at);
create index research_jobs_retry_idx on public.research_jobs(status,next_retry_at) where status='retry_wait';
create index evidence_owner_collected_idx on public.evidence(owner_id,collected_at desc);
create index evidence_source_market_idx on public.evidence(source_id,market_id,collected_at desc);
create index claims_owner_type_idx on public.claims(owner_id,claim_type,created_at desc);
create index signals_owner_type_time_idx on public.signals(owner_id,signal_type,observed_at desc);
create index signals_market_time_idx on public.signals(market_id,observed_at desc);
create index opportunities_owner_last_seen_idx on public.opportunities(owner_id,last_seen_at desc);
create index concepts_owner_updated_idx on public.product_concepts(owner_id,updated_at desc);
create index competitor_snapshots_comp_time_idx on public.competitor_snapshots(competitor_id,captured_at desc);
create index review_clusters_concept_idx on public.review_clusters(concept_id,member_count desc);
create index score_snapshots_concept_market_time_idx on public.score_snapshots(concept_id,market_id,calculated_at desc);
create index confidence_snapshots_concept_market_time_idx on public.confidence_snapshots(concept_id,market_id,calculated_at desc);
create index recommendations_concept_time_idx on public.recommendations(concept_id,created_at desc);
create index ai_invocations_owner_time_idx on public.ai_invocations(owner_id,created_at desc);
create index ai_invocations_role_time_idx on public.ai_invocations(role_key,created_at desc);
create index blueprint_versions_project_idx on public.blueprint_versions(project_id,version_number desc);
create index blueprint_documents_version_idx on public.blueprint_documents(blueprint_version_id,path);
create index trace_links_project_version_idx on public.traceability_links(project_id,blueprint_version_id,source_kind,source_key);
create index change_requests_project_time_idx on public.change_requests(project_id,requested_at desc);
create index prototype_artifacts_project_version_idx on public.prototype_artifacts(project_id,blueprint_version_id);
create index daily_promotions_owner_date_idx on public.daily_promotions(owner_id,promotion_date desc);
create index competitors_owner_key_idx on public.competitors(owner_id,canonical_key) where canonical_key is not null;
create index opportunities_owner_normalized_key_idx on public.opportunities(owner_id,normalized_key) where normalized_key is not null;
create index signal_clusters_owner_key_idx on public.signal_clusters(owner_id,cluster_key) where cluster_key is not null;

create or replace function public.calculate_weighted_score(factors jsonb, weights jsonb)
returns numeric
language plpgsql
immutable
set search_path = ''
as $$
declare
  k text;
  total numeric := 0;
  weight_total numeric := 0;
  f numeric;
  w numeric;
begin
  for k in select jsonb_object_keys(weights)
  loop
    w := coalesce((weights->>k)::numeric,0);
    if w < 0 then
      raise exception 'weight % cannot be negative: %', k, w;
    end if;
    f := coalesce((factors->k->>'value')::numeric,0);
    if f < 0 or f > 100 then
      raise exception 'factor % out of range: %', k, f;
    end if;
    total := total + (f * w);
    weight_total := weight_total + w;
  end loop;
  if weight_total = 0 then raise exception 'weight total cannot be zero'; end if;
  return round(total / weight_total, 2);
end;
$$;

create or replace function public.can_be_ready_for_development(p_project_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists(
    select 1
    from public.quality_reports qr
    join public.projects p on p.id = qr.project_id
    where p.id = p_project_id
      and p.owner_id = auth.uid()
      and qr.owner_id = auth.uid()
      and qr.blueprint_version_id = p.current_blueprint_version_id
      and qr.mandatory_pass = true
  );
$$;

-- Trigger-only privileged routine is intentionally outside exposed public schema.
create or replace function private.handle_new_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles(id,display_name)
  values(new.id,coalesce(new.raw_user_meta_data->>'name',new.email))
  on conflict(id) do nothing;

  insert into public.app_settings(owner_id)
  values(new.id)
  on conflict(owner_id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_owner() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_owner();

-- Public helper functions are opt-in, not automatically callable by anonymous clients.
revoke execute on function public.calculate_weighted_score(jsonb,jsonb) from public, anon, authenticated;
revoke execute on function public.can_be_ready_for_development(uuid) from public, anon;
grant execute on function public.can_be_ready_for_development(uuid) to authenticated, service_role;
grant execute on function public.calculate_weighted_score(jsonb,jsonb) to service_role;
