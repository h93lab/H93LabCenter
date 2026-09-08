-- Enable RLS on every application table in the exposed public schema.
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','app_settings','markets','owner_market_preferences','categories','research_sources','research_runs','research_jobs','source_runs',
    'ai_roles','prompt_versions','ai_invocations','evidence','claims','claim_evidence','signals','signal_evidence','signal_clusters','signal_cluster_members',
    'opportunities','opportunity_markets','opportunity_signals','product_concepts','concept_markets','opportunity_timeline_events',
    'competitors','competitor_snapshots','concept_competitors','review_items','review_clusters','review_cluster_members',
    'scoring_models','score_snapshots','confidence_snapshots','kill_assessments','recommendations','projects','blueprint_versions','blueprint_documents',
    'blueprint_requirements','blueprint_features','blueprint_rules','blueprint_screens','blueprint_flows','blueprint_decisions','blueprint_tasks','blueprint_tests',
    'traceability_links','change_requests','change_impacts','prototype_artifacts','quality_reports','export_packages','daily_promotions'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Global catalogs: signed-in owner can read; writes remain backend/migration-owned.
create policy markets_read_authenticated on public.markets
for select to authenticated using (true);
create policy categories_read_authenticated on public.categories
for select to authenticated using (true);

-- Personal profile/settings.
create policy profile_select_self on public.profiles
for select to authenticated using (id = (select auth.uid()));
create policy profile_update_self on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy settings_select_self on public.app_settings
for select to authenticated using (owner_id = (select auth.uid()));
create policy settings_update_self on public.app_settings
for update to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy market_preferences_select_self on public.owner_market_preferences
for select to authenticated using (owner_id = (select auth.uid()));
create policy market_preferences_insert_self on public.owner_market_preferences
for insert to authenticated with check (owner_id = (select auth.uid()));
create policy market_preferences_update_self on public.owner_market_preferences
for update to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));
create policy market_preferences_delete_self on public.owner_market_preferences
for delete to authenticated using (owner_id = (select auth.uid()));

create policy research_sources_select_self on public.research_sources
for select to authenticated using (owner_id = (select auth.uid()));
create policy research_sources_insert_self on public.research_sources
for insert to authenticated with check (owner_id = (select auth.uid()));
create policy research_sources_update_self on public.research_sources
for update to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));
create policy research_sources_delete_self on public.research_sources
for delete to authenticated using (owner_id = (select auth.uid()));

create policy ai_roles_select_self on public.ai_roles
for select to authenticated using (owner_id = (select auth.uid()));
create policy ai_roles_insert_self on public.ai_roles
for insert to authenticated with check (owner_id = (select auth.uid()));
create policy ai_roles_update_self on public.ai_roles
for update to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));
create policy ai_roles_delete_self on public.ai_roles
for delete to authenticated using (owner_id = (select auth.uid()));

create policy prompt_versions_select_self on public.prompt_versions
for select to authenticated using (owner_id = (select auth.uid()));
create policy prompt_versions_insert_self on public.prompt_versions
for insert to authenticated with check (owner_id = (select auth.uid()));
create policy prompt_versions_update_self on public.prompt_versions
for update to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));
create policy prompt_versions_delete_self on public.prompt_versions
for delete to authenticated using (owner_id = (select auth.uid()));

-- Analytical, research, project and Blueprint data are backend-owned in V1.
-- The browser receives owner-scoped read access only.
do $$
declare t text;
begin
  foreach t in array array[
    'research_runs','research_jobs','source_runs','ai_invocations','evidence','claims','claim_evidence','signals','signal_evidence','signal_clusters','signal_cluster_members',
    'opportunities','opportunity_markets','opportunity_signals','product_concepts','concept_markets','opportunity_timeline_events',
    'competitors','competitor_snapshots','concept_competitors','review_items','review_clusters','review_cluster_members',
    'scoring_models','score_snapshots','confidence_snapshots','kill_assessments','recommendations','projects','blueprint_versions','blueprint_documents',
    'blueprint_requirements','blueprint_features','blueprint_rules','blueprint_screens','blueprint_flows','blueprint_decisions','blueprint_tasks','blueprint_tests',
    'traceability_links','change_requests','change_impacts','prototype_artifacts','quality_reports','export_packages','daily_promotions'
  ] loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (owner_id = (select auth.uid()))',
      t || '_read_self', t
    );
  end loop;
end $$;

-- Explicit Data API privileges. No application data is exposed to anon.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

-- Catalog and personal/configuration access for authenticated browser sessions.
grant select on public.markets, public.categories to authenticated;
grant select, update on public.profiles, public.app_settings to authenticated;
grant select, insert, update, delete on public.owner_market_preferences, public.research_sources, public.ai_roles, public.prompt_versions to authenticated;

grant select on
  public.research_runs, public.research_jobs, public.source_runs, public.ai_invocations,
  public.evidence, public.claims, public.claim_evidence, public.signals, public.signal_evidence, public.signal_clusters, public.signal_cluster_members,
  public.opportunities, public.opportunity_markets, public.opportunity_signals, public.product_concepts, public.concept_markets, public.opportunity_timeline_events,
  public.competitors, public.competitor_snapshots, public.concept_competitors, public.review_items, public.review_clusters, public.review_cluster_members,
  public.scoring_models, public.score_snapshots, public.confidence_snapshots, public.kill_assessments, public.recommendations,
  public.projects, public.blueprint_versions, public.blueprint_documents, public.blueprint_requirements, public.blueprint_features, public.blueprint_rules,
  public.blueprint_screens, public.blueprint_flows, public.blueprint_decisions, public.blueprint_tasks, public.blueprint_tests,
  public.traceability_links, public.change_requests, public.change_impacts, public.prototype_artifacts, public.quality_reports, public.export_packages,
  public.daily_promotions
to authenticated;

-- Backend secret-key/service-role code owns all application writes and bypasses RLS.
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Trigger helper remains inaccessible as an API callable function.
revoke all on schema private from public, anon, authenticated;
revoke all on function private.handle_new_owner() from public, anon, authenticated;
