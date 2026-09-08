-- Read models and owner-reported research. Privileged writes use validated Edge APIs.
alter table public.evidence add column requested_market_id uuid references public.markets(id);
alter table public.evidence add column observed_market_code text;
create index evidence_requested_market_idx on public.evidence(requested_market_id);

create table public.concept_evidence (
  owner_id uuid not null references auth.users(id) on delete cascade,
  concept_id uuid not null references public.product_concepts(id) on delete cascade,
  evidence_id uuid not null references public.evidence(id) on delete cascade,
  origin text not null default 'owner_import' check(origin in ('owner_import','validation')),
  created_at timestamptz not null default now(),
  primary key(concept_id,evidence_id)
);
create index concept_evidence_owner_idx on public.concept_evidence(owner_id,concept_id);
create index concept_evidence_evidence_idx on public.concept_evidence(evidence_id);
alter table public.concept_evidence enable row level security;
create policy concept_evidence_owner_read on public.concept_evidence for select to authenticated using(owner_id=(select auth.uid()));
revoke all on public.concept_evidence from anon,authenticated;
grant select on public.concept_evidence to authenticated;
grant all on public.concept_evidence to service_role;

create table public.validation_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  concept_id uuid not null references public.product_concepts(id) on delete cascade,
  request_key uuid not null,
  question text not null check(length(question) between 1 and 500),
  method text not null check(length(method) between 1 and 1000),
  success_criterion text not null check(length(success_criterion) between 1 and 1000),
  estimated_hours numeric not null default 0 check(estimated_hours between 0 and 1000),
  estimated_cost_usd numeric not null default 0 check(estimated_cost_usd between 0 and 100000),
  outcome text not null check(outcome in ('planned','supported','rejected','inconclusive')),
  result text check(length(result)<=4000),
  evidence_ids uuid[] not null default '{}',
  observed_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique(owner_id,request_key),
  check(outcome='planned' or (length(trim(result))>0 and cardinality(evidence_ids)>0))
);
create index validation_records_concept_idx on public.validation_records(owner_id,concept_id,created_at desc);
create index validation_records_concept_fk_idx on public.validation_records(concept_id);
alter table public.validation_records enable row level security;
create policy validation_records_owner_read on public.validation_records for select to authenticated using(owner_id=(select auth.uid()));
revoke all on public.validation_records from anon,authenticated;
grant select on public.validation_records to authenticated;
grant all on public.validation_records to service_role;

create table public.review_import_batches (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  concept_id uuid not null references public.product_concepts(id) on delete cascade,
  request_key uuid not null,
  source_id uuid not null references public.research_sources(id),
  content_hash text not null,
  source_name text not null,
  source_url text not null,
  platform text not null check(platform in ('ios','android','web','other')),
  market_code text not null,
  language text not null,
  sampled_at timestamptz not null,
  item_count integer not null check(item_count between 1 and 100),
  verification_origin text not null default 'owner_import' check(verification_origin='owner_import'),
  created_at timestamptz not null default now(),
  unique(owner_id,request_key)
);
create index review_import_batches_concept_idx on public.review_import_batches(owner_id,concept_id,created_at desc);
create index review_import_batches_concept_fk_idx on public.review_import_batches(concept_id);
create index review_import_batches_source_idx on public.review_import_batches(source_id);
alter table public.review_import_batches enable row level security;
create policy review_import_batches_owner_read on public.review_import_batches for select to authenticated using(owner_id=(select auth.uid()));
revoke all on public.review_import_batches from anon,authenticated;
grant select on public.review_import_batches to authenticated;
grant all on public.review_import_batches to service_role;

create index recommendations_decision_lookup_idx on public.recommendations(owner_id,concept_id,market_id,created_at desc,id);

create or replace function public.center_decision_list(p_owner uuid,p_filter jsonb default '{}') returns jsonb
language sql stable security invoker set search_path=public,pg_temp as $$
with base as (
 select c.id,c.title,c.value_proposition,c.target_user,c.wedge,c.mvp_thesis,c.disposition,c.created_at,
 o.id opportunity_id,o.app_or_game,o.opportunity_type,o.category_id,cat.name category,
 r.id recommendation_id,r.status recommendation,r.rationale,r.biggest_risk,r.validation_priorities,
 r.created_at analyzed_at,r.market_id,m.code market_code,m.name market_name,
 ss.id score_snapshot_id,ss.overall_score score,ss.factors,
 cs.id confidence_snapshot_id,cs.confidence,cs.components confidence_components,
 sm.id scoring_model_id,sm.model_key,sm.version scoring_model_version
 from product_concepts c join opportunities o on o.id=c.opportunity_id and o.owner_id=p_owner
 left join categories cat on cat.id=o.category_id
 left join lateral (
   select rr.* from recommendations rr left join markets mm on mm.id=rr.market_id
   where rr.owner_id=p_owner and rr.concept_id=c.id
   and (coalesce(p_filter->>'market','')='' or mm.code=p_filter->>'market')
   order by rr.created_at desc,rr.id desc limit 1
 ) r on true
 left join markets m on m.id=r.market_id
 left join score_snapshots ss on ss.id=r.score_snapshot_id and ss.owner_id=p_owner and ss.concept_id=c.id
 left join confidence_snapshots cs on cs.id=r.confidence_snapshot_id and cs.owner_id=p_owner and cs.concept_id=c.id
 left join scoring_models sm on sm.id=ss.scoring_model_id and sm.owner_id=p_owner
 where c.owner_id=p_owner
), filtered as (
 select * from base where
 (coalesce(p_filter->>'q','')='' or title ilike '%'||replace(replace(p_filter->>'q','%','\%'),'_','\_')||'%')
 and (not(p_filter ? 'ids') or id::text in(select jsonb_array_elements_text(p_filter->'ids')))
 and (coalesce(p_filter->>'market','')='' or market_code=p_filter->>'market')
 and (coalesce(p_filter->>'category','')='' or category_id::text=p_filter->>'category')
 and (coalesce(p_filter->>'kind','')='' or app_or_game::text=p_filter->>'kind')
 and (coalesce(p_filter->>'opportunity_type','')='' or opportunity_type=p_filter->>'opportunity_type')
 and (coalesce(p_filter->>'recommendation','')='' or recommendation::text=p_filter->>'recommendation')
 and (coalesce(p_filter->>'disposition','')='' or disposition::text=p_filter->>'disposition')
 and (not(p_filter ? 'min_score') or score >= (p_filter->>'min_score')::numeric)
 and (not(p_filter ? 'min_confidence') or confidence >= (p_filter->>'min_confidence')::numeric)
 and (not(p_filter ? 'from') or analyzed_at >= (p_filter->>'from')::timestamptz)
 and (not(p_filter ? 'to') or analyzed_at < (p_filter->>'to')::date + interval '1 day')
), page as (
 select * from filtered order by
 case when p_filter->>'sort'='score' then score end desc nulls last,
 case when p_filter->>'sort'='confidence' then confidence end desc nulls last,
 case when p_filter->>'sort'='title' then title end asc nulls last,
 analyzed_at desc nulls last,id
 limit 30 offset least(greatest(coalesce((p_filter->>'page')::integer,0),0),10000)*30
)
select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(page)) from page),'[]'::jsonb),
 'count',(select count(*) from filtered),'page',coalesce((p_filter->>'page')::integer,0));
$$;
revoke all on function public.center_decision_list(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.center_decision_list(uuid,jsonb) to service_role;
