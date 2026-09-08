-- Remove inherited broad table privileges first; RLS does not protect TRUNCATE.
revoke all privileges on all tables in schema public from public, anon, authenticated;
revoke all privileges on all sequences in schema public from public, anon, authenticated;

-- Re-grant only the browser capabilities explicitly required by V1.
grant select on public.markets, public.categories to authenticated;
grant select, update on public.profiles, public.app_settings to authenticated;
grant select, insert, update, delete on
  public.owner_market_preferences,
  public.research_sources,
  public.ai_roles,
  public.prompt_versions
to authenticated;

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

-- Backend role remains explicitly privileged.
grant select, insert, update, delete, truncate, references, trigger on all tables in schema public to service_role;
grant usage, select, update on all sequences in schema public to service_role;
