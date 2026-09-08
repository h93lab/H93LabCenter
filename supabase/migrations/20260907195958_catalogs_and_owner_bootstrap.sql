-- Canonical V1 markets. IDs remain generated; code is the stable external key.
insert into public.markets(code,name,region,is_global,enabled_by_default) values
('GLOBAL','Global','Global',true,true),
('US','United States','North America',false,true),
('CA','Canada','North America',false,true),
('MX','Mexico','Latin America',false,true),
('BR','Brazil','Latin America',false,true),
('AR','Argentina','Latin America',false,false),
('GB','United Kingdom','Europe',false,true),
('DE','Germany','Europe',false,true),
('FR','France','Europe',false,true),
('ES','Spain','Europe',false,true),
('IT','Italy','Europe',false,true),
('NL','Netherlands','Europe',false,false),
('SE','Sweden','Europe',false,false),
('NO','Norway','Europe',false,false),
('DK','Denmark','Europe',false,false),
('CH','Switzerland','Europe',false,false),
('AT','Austria','Europe',false,false),
('PL','Poland','Europe',false,false),
('SA','Saudi Arabia','Middle East',false,true),
('AE','United Arab Emirates','Middle East',false,true),
('EG','Egypt','Middle East / North Africa',false,true),
('TR','Türkiye','Europe / Middle East',false,true),
('QA','Qatar','Middle East',false,false),
('KW','Kuwait','Middle East',false,false),
('JP','Japan','Asia',false,true),
('KR','South Korea','Asia',false,true),
('IN','India','Asia',false,true),
('ID','Indonesia','Asia',false,true),
('SG','Singapore','Asia',false,false),
('MY','Malaysia','Asia',false,false),
('TH','Thailand','Asia',false,false),
('VN','Vietnam','Asia',false,false),
('PH','Philippines','Asia',false,false),
('AU','Australia','Oceania',false,true),
('NZ','New Zealand','Oceania',false,false),
('ZA','South Africa','Africa',false,false),
('NG','Nigeria','Africa',false,false)
on conflict(code) do update set
  name = excluded.name,
  region = excluded.region,
  is_global = excluded.is_global,
  enabled_by_default = excluded.enabled_by_default;

-- Broad mobile taxonomy; provider-specific IDs stay in external_mappings later.
insert into public.categories(key,name,app_or_game) values
('productivity','Productivity','app'),
('utilities','Utilities','app'),
('photo-video','Photo & Video','app'),
('health-fitness','Health & Fitness','app'),
('education','Education','app'),
('finance','Finance','app'),
('lifestyle','Lifestyle','app'),
('business','Business','app'),
('social','Social','app'),
('shopping','Shopping','app'),
('food-drink','Food & Drink','app'),
('travel','Travel','app'),
('navigation','Navigation','app'),
('weather','Weather','app'),
('music-audio','Music & Audio','app'),
('entertainment','Entertainment','app'),
('sports','Sports','app'),
('news-magazines','News & Magazines','app'),
('books-reference','Books & Reference','app'),
('medical','Medical','app'),
('parenting-family','Parenting & Family','app'),
('communication','Communication','app'),
('personalization','Personalization','app'),
('developer-tools','Developer Tools','app'),
('graphics-design','Graphics & Design','app'),
('casual-games','Casual Games','game'),
('puzzle-games','Puzzle Games','game'),
('simulation-games','Simulation Games','game'),
('strategy-games','Strategy Games','game'),
('action-games','Action Games','game'),
('adventure-games','Adventure Games','game'),
('arcade-games','Arcade Games','game'),
('racing-games','Racing Games','game'),
('sports-games','Sports Games','game'),
('role-playing-games','Role Playing Games','game'),
('word-games','Word Games','game'),
('card-board-games','Card & Board Games','game')
on conflict(key) do update set
  name = excluded.name,
  app_or_game = excluded.app_or_game;

-- Dedupe invariants for stable entities.
create unique index opportunities_owner_normalized_key_uq
on public.opportunities(owner_id,normalized_key)
where normalized_key is not null;

create unique index competitors_owner_canonical_key_uq
on public.competitors(owner_id,canonical_key)
where canonical_key is not null;

create unique index scoring_models_one_active_per_key_uq
on public.scoring_models(owner_id,model_key)
where active = true;

create unique index prompt_versions_one_active_per_role_uq
on public.prompt_versions(owner_id,role_key)
where is_active = true;

-- First-user bootstrap: creates personal configuration but never provider secrets.
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

  insert into public.owner_market_preferences(owner_id,market_id,enabled,priority)
  select new.id, m.id, m.enabled_by_default,
    case
      when m.code = 'GLOBAL' then 100
      when m.code in ('SA','AE','EG','US','DE','GB','JP') then 90
      else 50
    end
  from public.markets m
  on conflict(owner_id,market_id) do nothing;

  insert into public.scoring_models(owner_id,model_key,version,app_or_game,weights,thresholds,active)
  values
  (
    new.id,'APP','APP-1.0','app',
    '{"demand_strength":15,"trend_momentum":10,"problem_intensity":10,"market_gap":15,"monetization_attractiveness":10,"distribution_feasibility":10,"solo_developer_fit":8,"technical_feasibility":5,"localization_market_leverage":5,"wedge_strength":7,"competition_attractiveness":5}'::jsonb,
    '{"strong_build":{"score":85,"confidence":75},"build":{"score":75,"confidence":65},"validate_first":{"score":70},"watch":{"score_min":60,"score_max":74},"idea_of_day":{"score":82,"confidence":70}}'::jsonb,
    true
  ),
  (
    new.id,'GAME','GAME-1.0','game',
    '{"audience_demand":12,"trend_momentum":12,"core_gameplay_hook":12,"differentiation":10,"retention_potential":12,"monetization_potential":10,"production_feasibility":10,"content_burden_inverse":7,"distribution_virality":10,"platform_fit":5}'::jsonb,
    '{"strong_build":{"score":85,"confidence":75},"build":{"score":75,"confidence":65},"validate_first":{"score":70},"watch":{"score_min":60,"score_max":74},"idea_of_day":{"score":82,"confidence":70}}'::jsonb,
    true
  )
  on conflict(owner_id,model_key,version) do nothing;

  insert into public.research_sources(owner_id,key,name,source_type,enabled,is_paid,reliability_profile,capabilities,config)
  values
    (new.id,'apple_app_store','Apple App Store','official_store',true,false,'{"listing_metadata":"high","ratings_metadata":"high","downloads":"unsupported","revenue":"unsupported"}'::jsonb,'{"app_identity":true,"pricing":true,"ratings":true,"versions":true,"store_presence":true}'::jsonb,'{}'::jsonb),
    (new.id,'google_play','Google Play','official_store',true,false,'{"listing_metadata":"high","ratings_metadata":"high","downloads":"do_not_infer","revenue":"unsupported"}'::jsonb,'{"app_identity":true,"pricing":true,"ratings":true,"versions":true,"store_presence":true}'::jsonb,'{}'::jsonb),
    (new.id,'reddit','Reddit','community',true,false,'{"user_pain":"medium_high","quantitative_market_facts":"low"}'::jsonb,'{"complaints":true,"recommendations":true,"switching_stories":true,"niche_demand":true}'::jsonb,'{}'::jsonb),
    (new.id,'hacker_news','Hacker News','community',true,false,'{"developer_prosumer_signals":"medium","broad_consumer_demand":"low"}'::jsonb,'{"technology_signals":true,"launches":true,"developer_pain":true}'::jsonb,'{}'::jsonb),
    (new.id,'github','GitHub','official_api',true,false,'{"technical_signals":"high","consumer_demand":"low"}'::jsonb,'{"repository_momentum":true,"new_libraries":true,"api_discovery":true,"technical_feasibility":true}'::jsonb,'{}'::jsonb),
    (new.id,'product_hunt','Product Hunt','official_api',true,false,'{"launch_signals":"medium_high","market_size":"low"}'::jsonb,'{"launches":true,"emerging_products":true,"category_signals":true}'::jsonb,'{}'::jsonb),
    (new.id,'official_websites','Official Product Websites','website',true,false,'{"pricing_features":"high","self_reported_market_claims":"medium_low"}'::jsonb,'{"pricing":true,"features":true,"platform_support":true}'::jsonb,'{}'::jsonb),
    (new.id,'web_news_search','Web & News Search','search',true,false,'{"depends_on_result_source":true}'::jsonb,'{"discovery":true,"cross_checking":true,"news":true}'::jsonb,'{}'::jsonb),
    (new.id,'trend_search_interest','Trend / Search Interest','trend',true,false,'{"trend_direction":"medium","exact_volume":"source_dependent"}'::jsonb,'{"trend_momentum":true,"search_interest":true}'::jsonb,'{}'::jsonb),
    (new.id,'sensor_tower','Sensor Tower','paid_provider',false,true,'{"modeled_metrics":"provider_estimate"}'::jsonb,'{"downloads_estimate":true,"revenue_estimate":true,"market_intelligence":true}'::jsonb,'{}'::jsonb),
    (new.id,'apptweak','AppTweak','paid_provider',false,true,'{"modeled_metrics":"provider_estimate"}'::jsonb,'{"aso":true,"market_intelligence":true,"review_intelligence":true}'::jsonb,'{}'::jsonb),
    (new.id,'mobile_action','MobileAction','paid_provider',false,true,'{"modeled_metrics":"provider_estimate"}'::jsonb,'{"downloads_estimate":true,"revenue_estimate":true,"aso":true}'::jsonb,'{}'::jsonb)
  on conflict(owner_id,key) do nothing;

  insert into public.ai_roles(owner_id,role_key,enabled,settings)
  select new.id, x.role_key, true, '{}'::jsonb
  from (values
    ('signal_classifier'),('competitor_discovery'),('review_analyzer'),('market_analyst'),
    ('opportunity_generator'),('risk_analyst'),('product_architect'),('ux_architect'),
    ('blueprint_writer'),('consistency_reviewer'),('final_judge')
  ) as x(role_key)
  on conflict(owner_id,role_key) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_owner() from public, anon, authenticated;
