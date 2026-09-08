-- Keep the canonical runtime role catalog usable when the earlier owner bootstrap
-- has already inserted overlapping role keys without model configuration.
create or replace function private.center_owner_roles()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.ai_roles (
    owner_id,
    role_key,
    enabled,
    primary_model,
    max_cost_per_call_usd,
    settings
  )
  select
    new.id,
    role_key,
    true,
    'openai/gpt-4.1-mini',
    0.15,
    '{"temperature":0.15,"max_tokens":12000}'::jsonb
  from unnest(array[
    'claim_extractor',
    'signal_classifier',
    'signal_cluster_analyst',
    'opportunity_generator',
    'concept_generator',
    'competitor_analyst',
    'review_miner',
    'market_analyst',
    'monetization_distribution_analyst',
    'risk_analyst',
    'dedupe_adjudicator',
    'final_judge',
    'executive_brief_writer',
    'blueprint_product_architect',
    'blueprint_ux_architect',
    'blueprint_technical_architect',
    'blueprint_business_architect',
    'blueprint_task_planner',
    'prototype_spec_generator',
    'consistency_reviewer',
    'change_manager'
  ]) as canonical(role_key)
  on conflict (owner_id, role_key) do update
  set
    enabled = true,
    primary_model = coalesce(public.ai_roles.primary_model, excluded.primary_model),
    max_cost_per_call_usd = coalesce(
      public.ai_roles.max_cost_per_call_usd,
      excluded.max_cost_per_call_usd
    ),
    settings = excluded.settings || coalesce(public.ai_roles.settings, '{}'::jsonb);

  update public.ai_roles
  set enabled = false
  where owner_id = new.id
    and role_key = any(array[
      'competitor_discovery',
      'review_analyzer',
      'product_architect',
      'ux_architect',
      'blueprint_writer'
    ]);

  return new;
end;
$$;

revoke all on function private.center_owner_roles() from public, anon, authenticated;

-- Repair owners created before this migration.
update public.ai_roles
set
  primary_model = coalesce(primary_model, 'openai/gpt-4.1-mini'),
  max_cost_per_call_usd = coalesce(max_cost_per_call_usd, 0.15),
  settings = '{"temperature":0.15,"max_tokens":12000}'::jsonb || coalesce(settings, '{}'::jsonb)
where role_key = any(array[
  'claim_extractor',
  'signal_classifier',
  'signal_cluster_analyst',
  'opportunity_generator',
  'concept_generator',
  'competitor_analyst',
  'review_miner',
  'market_analyst',
  'monetization_distribution_analyst',
  'risk_analyst',
  'dedupe_adjudicator',
  'final_judge',
  'executive_brief_writer',
  'blueprint_product_architect',
  'blueprint_ux_architect',
  'blueprint_technical_architect',
  'blueprint_business_architect',
  'blueprint_task_planner',
  'prototype_spec_generator',
  'consistency_reviewer',
  'change_manager'
]);

update public.ai_roles
set enabled = false
where role_key = any(array[
  'competitor_discovery',
  'review_analyzer',
  'product_architect',
  'ux_architect',
  'blueprint_writer'
]);
