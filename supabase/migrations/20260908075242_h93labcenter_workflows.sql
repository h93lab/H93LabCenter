-- H93LabCenter workflow boundaries. All RPCs are server-only.
alter table public.research_jobs add column if not exists queue_message_id bigint;
alter table public.research_runs add column if not exists request_key text;
create unique index center_run_request on public.research_runs(owner_id,request_key) where request_key is not null;
create unique index center_concept_identity on public.product_concepts(owner_id,opportunity_id,title);
create unique index center_opportunity_identity on public.opportunities(owner_id,normalized_key) where normalized_key is not null;

create function public.center_enqueue(p_owner uuid,p_type text,p_key text,p_payload jsonb,p_run uuid default null)
returns uuid language plpgsql security invoker set search_path='' as $$
declare j uuid; m bigint;
begin
 insert into public.research_jobs(owner_id,research_run_id,job_type,idempotency_key,payload)
 values(p_owner,p_run,p_type,p_key,p_payload) on conflict(owner_id,idempotency_key) do nothing returning id into j;
 if j is null then select id into j from public.research_jobs where owner_id=p_owner and idempotency_key=p_key; return j; end if;
 select pgmq.send(case when p_type like 'BLUEPRINT%' then 'blueprint_jobs' else 'research_jobs' end,jsonb_build_object('job_id',j)) into m;
 update public.research_jobs set queue_message_id=m where id=j;
 return j;
end $$;

create function public.center_claim(p_queue text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare msg record; j public.research_jobs;
begin
 if p_queue not in ('research_jobs','blueprint_jobs') then raise exception 'INVALID_QUEUE'; end if;
 for msg in select * from pgmq.read(p_queue,180,1) loop
  select * into j from public.research_jobs where id=(msg.message->>'job_id')::uuid for update;
  if j.id is null or j.status in ('succeeded','cancelled','dead_letter') then perform pgmq.delete(p_queue,msg.msg_id); return null; end if;
  if j.attempt_count>=j.max_attempts then
   update public.research_jobs set status='dead_letter',last_error_code='LEASE_EXHAUSTED' where id=j.id;
   perform pgmq.archive(p_queue,msg.msg_id); return null;
  end if;
  update public.research_jobs set status='running',leased_at=now(),started_at=coalesce(started_at,now()),attempt_count=attempt_count+1 where id=j.id returning * into j;
  return to_jsonb(j)||jsonb_build_object('queue',p_queue,'message_id',msg.msg_id);
 end loop;
 return null;
end $$;

create function public.center_finish(p_job uuid,p_queue text,p_message bigint,p_result jsonb,p_error text default null,p_retry boolean default false)
returns void language plpgsql security invoker set search_path='' as $$
declare j public.research_jobs;
begin
 if p_queue not in ('research_jobs','blueprint_jobs') then raise exception 'INVALID_QUEUE'; end if;
 select * into strict j from public.research_jobs where id=p_job for update;
 if j.queue_message_id<>p_message then raise exception 'INVALID_LEASE'; end if;
 if p_error is null then
  update public.research_jobs set status='succeeded',result_ref=p_result,completed_at=now(),last_error_code=null where id=p_job;
  perform pgmq.delete(p_queue,p_message);
 elsif p_retry and j.attempt_count<j.max_attempts then
  update public.research_jobs set status='retry_wait',last_error_code=p_error,next_retry_at=now()+interval '30 seconds' where id=p_job;
  perform pgmq.set_vt(p_queue,p_message,30);
 else
  update public.research_jobs set status='dead_letter',last_error_code=p_error,completed_at=now() where id=p_job;
  perform pgmq.archive(p_queue,p_message);
 end if;
end $$;

create function public.center_start_run(p_owner uuid,p_key text,p_config jsonb,p_budget numeric,p_mode text default 'manual')
returns uuid language plpgsql security invoker set search_path='' as $$
declare r uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text,1));
 select id into r from public.research_runs where owner_id=p_owner and request_key=p_key;
 if r is not null then return r; end if;
 if exists(select 1 from public.research_runs where owner_id=p_owner and status in ('queued','running')) then raise exception 'RUN_ALREADY_ACTIVE'; end if;
 insert into public.research_runs(owner_id,mode,config_snapshot,ai_budget_usd,request_key) values(p_owner,p_mode,p_config,p_budget,p_key) returning id into r;
 perform public.center_enqueue(p_owner,'COLLECT',r::text||':COLLECT','{}',r);
 return r;
end $$;

create function public.center_reserve_ai(p_owner uuid,p_role text,p_max numeric,p_run uuid default null,p_job uuid default null,p_project uuid default null)
returns uuid language plpgsql security invoker set search_path='' as $$
declare s public.app_settings; i uuid; spent numeric; tz text;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text,2));
 select * into strict s from public.app_settings where owner_id=p_owner;
 if p_max<=0 then raise exception 'INVALID_RESERVATION'; end if;
 tz:=s.timezone;
 select coalesce(sum(cost_usd),0) into spent from public.ai_invocations where owner_id=p_owner and (created_at at time zone tz)::date=(now() at time zone tz)::date;
 if spent+p_max>s.daily_ai_budget_usd then raise exception 'BUDGET_LIMIT'; end if;
 select coalesce(sum(cost_usd),0) into spent from public.ai_invocations where owner_id=p_owner and date_trunc('month',created_at at time zone tz)=date_trunc('month',now() at time zone tz);
 if spent+p_max>s.monthly_ai_budget_usd then raise exception 'BUDGET_LIMIT'; end if;
 if p_run is not null then
  select coalesce(sum(cost_usd),0) into spent from public.ai_invocations where research_run_id=p_run;
  if spent+p_max>(select ai_budget_usd from public.research_runs where id=p_run and owner_id=p_owner) then raise exception 'BUDGET_LIMIT'; end if;
 end if;
 insert into public.ai_invocations(owner_id,role_key,research_run_id,research_job_id,project_id,cost_usd,status) values(p_owner,p_role,p_run,p_job,p_project,p_max,'reserved') returning id into i;
 return i;
end $$;

create function public.center_go(p_owner uuid,p_concept uuid,p_key text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare c public.product_concepts; p uuid; snapshot jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text||p_concept::text,3));
 select * into strict c from public.product_concepts where id=p_concept and owner_id=p_owner;
 select id into p from public.projects where owner_id=p_owner and concept_id=p_concept and status<>'archived' limit 1;
 if p is not null then return p; end if;
 if exists(select 1 from public.kill_assessments where concept_id=p_concept and result='fail' and severity='hard') then raise exception 'CONCEPT_KILLED'; end if;
 snapshot:=jsonb_build_object('concept',to_jsonb(c),'scores',(select coalesce(jsonb_agg(x),'[]') from public.score_snapshots x where concept_id=p_concept),'recommendations',(select coalesce(jsonb_agg(x),'[]') from public.recommendations x where concept_id=p_concept),'evidence',(select coalesce(jsonb_agg(x),'[]') from public.evidence x where id in (select value::uuid from public.recommendations r,jsonb_array_elements_text(r.strongest_evidence_ids) where r.concept_id=p_concept)));
 insert into public.projects(owner_id,concept_id,name,slug,frozen_research_snapshot) values(p_owner,p_concept,c.title,'project-'||p_concept::text,snapshot) returning id into p;
 update public.product_concepts set disposition='go' where id=p_concept;
 perform public.center_enqueue(p_owner,'BLUEPRINT_GENERATE',p::text||':GENERATE',jsonb_build_object('project_id',p));
 return p;
end $$;

create function public.center_save_blueprint(p_owner uuid,p_project uuid,p_expected uuid,p_bundle jsonb,p_summary text default 'Generated blueprint')
returns uuid language plpgsql security invoker set search_path='' as $$
declare p public.projects; v uuid; n integer; family text; rowdata jsonb; cols text; pairs text; newdoc jsonb;
begin
 select * into strict p from public.projects where id=p_project and owner_id=p_owner for update;
 if p.current_blueprint_version_id is distinct from p_expected then raise exception 'VERSION_CONFLICT'; end if;
 select coalesce(max(version_number),0)+1 into n from public.blueprint_versions where project_id=p_project;
 insert into public.blueprint_versions(owner_id,project_id,version_number,base_version_id,manifest,change_summary)
 values(p_owner,p_project,n,p_expected,p_bundle,p_summary) returning id into v;
 for family in select unnest(array['requirements','features','rules','screens','flows','decisions','tasks','tests']) loop
  for rowdata in select value from jsonb_array_elements(coalesce(p_bundle->family,'[]')) loop
   rowdata:=rowdata||jsonb_build_object('id',gen_random_uuid(),'owner_id',p_owner,'blueprint_version_id',v,'created_at',now());
   select string_agg(quote_ident(key),','), string_agg('x.'||quote_ident(key),',') into cols,pairs from jsonb_object_keys(rowdata) as key;
   execute format('insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I,$1) x','blueprint_'||family,cols,pairs,'blueprint_'||family) using rowdata;
  end loop;
 end loop;
 for newdoc in select value from jsonb_array_elements(p_bundle->'documents') loop
  insert into public.blueprint_documents(owner_id,blueprint_version_id,path,title,document_type,content_md) values(p_owner,v,newdoc->>'path',newdoc->>'title','markdown',newdoc->>'content_md');
 end loop;
 for rowdata in select value from jsonb_array_elements(coalesce(p_bundle->'links','[]')) loop
  insert into public.traceability_links(owner_id,project_id,blueprint_version_id,source_kind,source_key,target_kind,target_key,relation) values(p_owner,p_project,v,rowdata->>'source_kind',rowdata->>'source_key',rowdata->>'target_kind',rowdata->>'target_key',rowdata->>'relation');
 end loop;
 update public.prototype_artifacts set status='stale' where project_id=p_project and status='current';
 insert into public.prototype_artifacts(owner_id,project_id,blueprint_version_id,artifact_type,status,spec) values(p_owner,p_project,v,'internal','current',p_bundle->'prototype');
 update public.projects set current_blueprint_version_id=v,status='blueprint_review' where id=p_project;
 return v;
end $$;

create function private.center_immutable_artifact() returns trigger language plpgsql security invoker set search_path='' as $$
declare version_id uuid;
begin
 version_id:=case when TG_OP='DELETE' then old.blueprint_version_id else new.blueprint_version_id end;
 if exists(select 1 from public.blueprint_versions where id=version_id and status in ('published','superseded')) then raise exception 'PUBLISHED_VERSION_IMMUTABLE'; end if;
 if TG_OP='DELETE' then return old; end if; return new;
end $$;
do $$ declare t text; begin
 foreach t in array array['blueprint_documents','blueprint_requirements','blueprint_features','blueprint_rules','blueprint_screens','blueprint_flows','blueprint_decisions','blueprint_tasks','blueprint_tests'] loop
 execute format('create trigger center_immutable before insert or update or delete on public.%I for each row execute function private.center_immutable_artifact()',t);
 end loop;
end $$;

create function public.center_publish(p_owner uuid,p_project uuid,p_version uuid,p_report jsonb)
returns void language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.projects where id=p_project and owner_id=p_owner and current_blueprint_version_id=p_version for update;
 if not found then raise exception 'VERSION_CONFLICT'; end if;
 if not coalesce((p_report->>'mandatory_pass')::boolean,false) then raise exception 'QUALITY_BLOCKED'; end if;
 update public.blueprint_versions set status='superseded',is_current=false where project_id=p_project and status='published';
 update public.blueprint_versions set status='published',is_current=true,published_at=now(),quality_score=(p_report->>'overall_score')::numeric where id=p_version;
 update public.projects set status='ready_for_development' where id=p_project;
end $$;

do $$ declare f record; begin
 for f in select oid::regprocedure as signature from pg_proc where pronamespace='public'::regnamespace and proname like 'center_%' loop
 execute format('revoke all on function %s from public,anon,authenticated',f.signature);
 execute format('grant execute on function %s to service_role',f.signature);
 end loop;
end $$;
grant usage on schema pgmq to service_role;
grant execute on all functions in schema pgmq to service_role;
grant all on all tables in schema pgmq to service_role;
grant all on all sequences in schema pgmq to service_role;
