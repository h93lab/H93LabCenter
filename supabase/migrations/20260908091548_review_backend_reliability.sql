-- Review fixes: server-only atomic publication, attempt fencing, and bounded spend.
alter table public.ai_roles add column daily_budget_usd numeric(12,4) check(daily_budget_usd is null or daily_budget_usd>=0);
alter table public.ai_roles add column daily_call_limit integer not null default 200 check(daily_call_limit between 1 and 10000);
alter table public.recommendations add column research_job_id uuid references public.research_jobs(id) on delete set null;
create index recommendations_research_job_idx on public.recommendations(research_job_id);
alter table public.blueprint_versions add column generated_by_job_id uuid references public.research_jobs(id) on delete set null;
create unique index blueprint_generated_job_idx on public.blueprint_versions(generated_by_job_id) where generated_by_job_id is not null;
drop index public.opportunities_owner_normalized_key_uq;
create unique index opportunities_owner_normalized_key_uq on public.opportunities(owner_id,normalized_key,app_or_game) where normalized_key is not null;

create function private.center_locked_job(p_owner uuid,p_job uuid,p_attempt integer)
returns public.research_jobs language plpgsql security invoker set search_path='' as $$
declare j public.research_jobs; r public.research_runs;
begin
 select * into strict j from public.research_jobs where id=p_job and owner_id=p_owner;
 if j.research_run_id is not null then
  select * into strict r from public.research_runs where id=j.research_run_id and owner_id=p_owner for update;
  if r.status='cancelled' then raise exception 'JOB_CANCELLED'; end if;
 end if;
 select * into strict j from public.research_jobs where id=p_job and owner_id=p_owner for update;
 if j.status='cancelled' then raise exception 'JOB_CANCELLED'; end if;
 if j.status<>'running' or j.attempt_count<>p_attempt or j.leased_at+interval '180 seconds'<now() then raise exception 'STALE_JOB_ATTEMPT'; end if;
 return j;
end $$;
revoke all on function private.center_locked_job(uuid,uuid,integer) from public,anon,authenticated;
grant usage on schema private to service_role;
grant execute on function private.center_locked_job(uuid,uuid,integer) to service_role;

create function public.center_cache_job_result(p_owner uuid,p_job uuid,p_attempt integer,p_result jsonb)
returns void language plpgsql security invoker set search_path='' as $$
declare j public.research_jobs;
begin
 j:=private.center_locked_job(p_owner,p_job,p_attempt);
 update public.research_jobs set result_ref=coalesce(result_ref,'{}')||p_result where id=j.id;
end $$;

create function public.center_commit_analysis(p_owner uuid,p_job uuid,p_attempt integer,p_writes jsonb,p_result jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare j public.research_jobs; item jsonb; rowdata jsonb; t text; conflicts text; cols text; pairs text; updates text; affected integer; c uuid;
begin
 select * into strict j from public.research_jobs where id=p_job and owner_id=p_owner;
 if j.status='succeeded' and j.result_ref->>'committed'='true' then return j.result_ref; end if;
 j:=private.center_locked_job(p_owner,p_job,p_attempt);
 if j.job_type<>'ANALYZE' then raise exception 'INVALID_JOB_TYPE'; end if;
 c:=(j.payload->>'concept_id')::uuid;
 perform 1 from public.product_concepts where id=c and owner_id=p_owner;
 if not found then raise exception 'NOT_FOUND'; end if;
 if p_result->>'concept_id' is distinct from c::text or p_result->>'committed' is distinct from 'true' then raise exception 'INVALID_ANALYSIS_RESULT'; end if;
 if jsonb_typeof(p_writes)<>'array' or jsonb_array_length(p_writes)>1000 then raise exception 'INVALID_ANALYSIS_WRITES'; end if;
 if (select count(*) from jsonb_array_elements(p_writes) w where w->>'table'='recommendations')<>1 then raise exception 'INVALID_ANALYSIS_RESULT'; end if;
 for item in select value from jsonb_array_elements(p_writes) loop
  t:=item->>'table';
  if t not in ('score_snapshots','confidence_snapshots','kill_assessments','recommendations','competitors','concept_competitors','competitor_snapshots','review_clusters','review_cluster_members','product_concepts','opportunity_timeline_events','concept_evidence') then raise exception 'INVALID_ANALYSIS_TABLE'; end if;
  rowdata:=(item->'row')||jsonb_build_object('owner_id',p_owner);
  if rowdata ? 'concept_id' and rowdata->>'concept_id'<>c::text then raise exception 'INVALID_ANALYSIS_CONCEPT'; end if;
  if t='recommendations' then rowdata:=rowdata||jsonb_build_object('research_job_id',p_job); end if;
  select string_agg(format('%I',key),','),string_agg(format('x.%I',key),','),string_agg(format('%I=excluded.%I',key,key),',')
   into cols,pairs,updates from jsonb_object_keys(rowdata) key;
  if t='product_concepts' then
   if item->>'operation'<>'update' or rowdata->>'id'<>c::text then raise exception 'INVALID_ANALYSIS_UPDATE'; end if;
   update public.product_concepts set first_analyzed_at=coalesce(first_analyzed_at,(rowdata->>'first_analyzed_at')::timestamptz),last_analyzed_at=(rowdata->>'last_analyzed_at')::timestamptz,risks=rowdata->'risks' where id=c and owner_id=p_owner;
  else
   conflicts:=case t when 'concept_competitors' then 'concept_id,competitor_id' when 'review_cluster_members' then 'cluster_id,review_item_id' when 'concept_evidence' then 'concept_id,evidence_id' else 'id' end;
   if item->>'conflict'<>conflicts then raise exception 'INVALID_ANALYSIS_CONFLICT'; end if;
   execute format('insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I,$1) x on conflict (%s) do update set %s where %I.owner_id=$2',t,cols,pairs,t,conflicts,updates,t) using rowdata,p_owner;
   get diagnostics affected=row_count;
   if affected<>1 then raise exception 'ANALYSIS_OWNER_CONFLICT'; end if;
  end if;
 end loop;
 -- Publishing results and acknowledging the durable job are one transaction.
 perform public.center_finish_attempt(p_job,'research_jobs',j.queue_message_id,p_attempt,p_result,null,false);
 return p_result;
end $$;

create function public.center_save_generated_blueprint(p_owner uuid,p_job uuid,p_attempt integer,p_bundle jsonb,p_report jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare j public.research_jobs; p public.projects; v uuid;
begin
 select id into v from public.blueprint_versions where generated_by_job_id=p_job and owner_id=p_owner;
 if v is not null then return v; end if;
 j:=private.center_locked_job(p_owner,p_job,p_attempt);
 if j.job_type<>'BLUEPRINT_PLAN' then raise exception 'INVALID_JOB_TYPE'; end if;
 select * into strict p from public.projects where id=(j.payload->>'project_id')::uuid and owner_id=p_owner for update;
 select id into v from public.blueprint_versions where generated_by_job_id=p_job and owner_id=p_owner;
 if v is not null then return v; end if;
 -- Initial generation may not replace a concurrently created/forked version.
 v:=public.center_save_blueprint(p_owner,p.id,null,p_bundle,'Generated from frozen research');
 update public.blueprint_versions set generated_by_job_id=p_job where id=v;
 insert into public.quality_reports(owner_id,project_id,blueprint_version_id,mandatory_pass,overall_score,gates,findings)
 values(p_owner,p.id,v,(p_report->>'mandatory_pass')::boolean,(p_report->>'overall_score')::numeric,p_report->'gates',p_report->'findings');
 perform public.center_enqueue(p_owner,'BLUEPRINT_REVIEW',v::text||':REVIEW',jsonb_build_object('project_id',p.id,'version_id',v));
 update public.projects set status='blueprint_review' where id=p.id;
 perform public.center_finish_attempt(p_job,'blueprint_jobs',j.queue_message_id,p_attempt,jsonb_build_object('version',v,'committed',true),null,false);
 return v;
end $$;

create function public.center_merge_run_concepts(p_owner uuid,p_run uuid,p_job uuid,p_attempt integer,p_concepts jsonb)
returns void language plpgsql security invoker set search_path='' as $$
declare j public.research_jobs; merged jsonb;
begin
 j:=private.center_locked_job(p_owner,p_job,p_attempt);
 if j.research_run_id is distinct from p_run then raise exception 'INVALID_RUN'; end if;
 if exists(select 1 from jsonb_array_elements_text(p_concepts) x where not exists(select 1 from public.product_concepts c where c.id=x.value::uuid and c.owner_id=p_owner)) then raise exception 'NOT_FOUND'; end if;
 select coalesce(jsonb_agg(distinct x.value),'[]') into merged from public.research_runs r,
  jsonb_array_elements(coalesce(r.stats->'concept_ids','[]')||p_concepts) x where r.id=p_run;
 update public.research_runs set stats=stats||jsonb_build_object('concept_ids',merged,'concepts',jsonb_array_length(merged)) where id=p_run and owner_id=p_owner;
end $$;

create function public.center_fail_attempt(p_job uuid,p_queue text,p_message bigint,p_attempt integer,p_result jsonb,p_error text,p_retry boolean,p_retry_seconds integer)
returns void language plpgsql security invoker set search_path='' as $$
declare j public.research_jobs; delay integer:=greatest(1,least(3600,p_retry_seconds));
begin
 perform public.center_finish_attempt(p_job,p_queue,p_message,p_attempt,p_result,p_error,p_retry);
 select * into strict j from public.research_jobs where id=p_job for update;
 if j.status='retry_wait' then
  update public.research_jobs set next_retry_at=now()+make_interval(secs=>delay) where id=p_job;
  perform pgmq.set_vt(p_queue,p_message,delay);
 end if;
end $$;

create or replace function public.center_reserve_ai(p_owner uuid,p_role text,p_max numeric,p_run uuid default null,p_job uuid default null,p_project uuid default null)
returns uuid language plpgsql security invoker set search_path='' as $$
declare s public.app_settings; r public.ai_roles; i uuid; spent numeric; calls integer; tz text;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text,2));
 select * into strict s from public.app_settings where owner_id=p_owner;
 select * into strict r from public.ai_roles where owner_id=p_owner and role_key=p_role;
 if not r.enabled then raise exception 'ROLE_DISABLED'; end if;
 if p_max is null or p_max<0 or p_max='NaN'::numeric or p_max>coalesce(r.max_cost_per_call_usd,0.15) then raise exception 'CALL_BUDGET_LIMIT'; end if;
 tz:=s.timezone;
 select coalesce(sum(cost_usd),0),count(*) into spent,calls from public.ai_invocations where owner_id=p_owner and role_key=p_role and (created_at at time zone tz)::date=(now() at time zone tz)::date;
 if r.daily_budget_usd is not null and spent+p_max>r.daily_budget_usd then raise exception 'ROLE_BUDGET_LIMIT'; end if;
 if calls>=r.daily_call_limit then raise exception 'ROLE_CALL_LIMIT'; end if;
 select coalesce(sum(cost_usd),0) into spent from public.ai_invocations where owner_id=p_owner and (created_at at time zone tz)::date=(now() at time zone tz)::date;
 if spent+p_max>s.daily_ai_budget_usd then raise exception 'BUDGET_LIMIT'; end if;
 select coalesce(sum(cost_usd),0) into spent from public.ai_invocations where owner_id=p_owner and date_trunc('month',created_at at time zone tz)=date_trunc('month',now() at time zone tz);
 if spent+p_max>s.monthly_ai_budget_usd then raise exception 'BUDGET_LIMIT'; end if;
 if p_run is not null then
  perform 1 from public.research_runs where id=p_run and owner_id=p_owner and status in ('queued','running');
  if not found then raise exception 'JOB_CANCELLED'; end if;
  select coalesce(sum(cost_usd),0) into spent from public.ai_invocations where research_run_id=p_run and owner_id=p_owner;
  if spent+p_max>(select ai_budget_usd from public.research_runs where id=p_run and owner_id=p_owner) then raise exception 'BUDGET_LIMIT'; end if;
 end if;
 if p_job is not null and not exists(select 1 from public.research_jobs where id=p_job and owner_id=p_owner and status='running') then raise exception 'JOB_CANCELLED'; end if;
 if p_project is not null and not exists(select 1 from public.projects where id=p_project and owner_id=p_owner) then raise exception 'NOT_FOUND'; end if;
 insert into public.ai_invocations(owner_id,role_key,research_run_id,research_job_id,project_id,cost_usd,status) values(p_owner,p_role,p_run,p_job,p_project,p_max,'reserved') returning id into i;
 return i;
end $$;

-- Existing historical recommendations remain intact. All new linked recommendations
-- are accepted only after their analysis commit transaction completed successfully.
create or replace function public.center_go(p_owner uuid,p_concept uuid,p_key text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare c public.product_concepts; p uuid; snapshot jsonb; r public.recommendations;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text||p_concept::text,3));
 select * into strict c from public.product_concepts where id=p_concept and owner_id=p_owner;
 select id into p from public.projects where owner_id=p_owner and concept_id=p_concept and status<>'archived' limit 1;
 if p is not null then return p; end if;
 select * into r from public.recommendations where concept_id=p_concept and owner_id=p_owner order by created_at desc,id desc limit 1;
 if r.id is null then raise exception 'ANALYSIS_REQUIRED'; end if;
 if r.research_job_id is not null and not exists(select 1 from public.research_jobs where id=r.research_job_id and owner_id=p_owner and status='succeeded' and result_ref->>'committed'='true') then raise exception 'ANALYSIS_REQUIRED'; end if;
 if r.status='KILLED' then raise exception 'CONCEPT_KILLED'; end if;
 snapshot:=jsonb_build_object('concept',to_jsonb(c),'scores',(select coalesce(jsonb_agg(x),'[]') from public.score_snapshots x where concept_id=p_concept and owner_id=p_owner),'recommendations',(select coalesce(jsonb_agg(x),'[]') from public.recommendations x where concept_id=p_concept and owner_id=p_owner),'evidence',(select coalesce(jsonb_agg(x),'[]') from public.evidence x where owner_id=p_owner and id in (select value::uuid from public.recommendations rr,jsonb_array_elements_text(rr.strongest_evidence_ids) where rr.concept_id=p_concept and rr.owner_id=p_owner)));
 insert into public.projects(owner_id,concept_id,name,slug,frozen_research_snapshot) values(p_owner,p_concept,c.title,'project-'||p_concept::text,snapshot) returning id into p;
 update public.product_concepts set disposition='go' where id=p_concept;
 perform public.center_enqueue(p_owner,'BLUEPRINT_GENERATE',p::text||':GENERATE',jsonb_build_object('project_id',p));
 return p;
end $$;

do $$ declare f record; begin
 for f in select oid::regprocedure signature from pg_proc where pronamespace='public'::regnamespace and proname in ('center_cache_job_result','center_commit_analysis','center_save_generated_blueprint','center_merge_run_concepts','center_fail_attempt','center_reserve_ai','center_go') loop
  execute format('revoke all on function %s from public,anon,authenticated',f.signature);
  execute format('grant execute on function %s to service_role',f.signature);
 end loop;
end $$;
