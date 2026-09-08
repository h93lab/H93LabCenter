alter table public.change_requests add column applied_version_id uuid references public.blueprint_versions(id);
alter table public.blueprint_versions add column consistency_review jsonb;
create function public.center_apply_change(p_owner uuid,p_change uuid,p_report jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare c public.change_requests; v uuid;
begin
 select * into strict c from public.change_requests where id=p_change and owner_id=p_owner for update;
 if c.applied_version_id is not null then return c.applied_version_id; end if;
 if c.status<>'impact_ready' then raise exception 'CHANGE_NOT_READY'; end if;
 v:=public.center_save_blueprint(p_owner,c.project_id,c.base_blueprint_version_id,c.impact_summary->'bundle',c.request_text);
 update public.change_requests set applied_version_id=v,status=case when (p_report->>'mandatory_pass')::boolean then 'validating'::public.change_request_status else 'failed_validation'::public.change_request_status end,completed_at=now() where id=p_change;
 insert into public.quality_reports(owner_id,project_id,blueprint_version_id,mandatory_pass,overall_score,gates,findings) values(p_owner,c.project_id,v,(p_report->>'mandatory_pass')::boolean,(p_report->>'overall_score')::numeric,p_report->'gates',p_report->'findings');
 perform public.center_enqueue(p_owner,'BLUEPRINT_REVIEW',v::text||':REVIEW',jsonb_build_object('project_id',c.project_id,'version_id',v));
 return v;
end $$;
revoke all on function public.center_apply_change(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.center_apply_change(uuid,uuid,jsonb) to service_role;

create function private.center_protect_version() returns trigger language plpgsql set search_path='' as $$
begin
 if old.status in ('published','superseded') and (new.manifest is distinct from old.manifest or new.project_id<>old.project_id or new.owner_id<>old.owner_id or new.version_number<>old.version_number or new.status='draft') then raise exception 'PUBLISHED_VERSION_IMMUTABLE'; end if;
 return new;
end $$;
create trigger center_protect_version before update on public.blueprint_versions for each row execute function private.center_protect_version();

create function public.center_activate_prompt(p_owner uuid,p_prompt uuid)
returns void language plpgsql security invoker set search_path='' as $$
declare r public.prompt_versions;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text,4));
 select * into strict r from public.prompt_versions where id=p_prompt and owner_id=p_owner;
 update public.prompt_versions set is_active=false where owner_id=p_owner and role_key=r.role_key and is_active;
 update public.prompt_versions set is_active=true where id=p_prompt;
end $$;
revoke all on function public.center_activate_prompt(uuid,uuid) from public,anon,authenticated;
grant execute on function public.center_activate_prompt(uuid,uuid) to service_role;

create function public.center_retry_job(p_owner uuid,p_job uuid)
returns void language plpgsql security invoker set search_path='' as $$
declare j public.research_jobs; q text; m bigint;
begin
 select * into strict j from public.research_jobs where id=p_job and owner_id=p_owner for update;
 if j.status not in ('dead_letter','cancelled') then raise exception 'JOB_NOT_RETRYABLE'; end if;
 q:=case when j.job_type like 'BLUEPRINT%' then 'blueprint_jobs' else 'research_jobs' end;
 if j.research_run_id is not null then
  perform pg_advisory_xact_lock(hashtextextended(p_owner::text,1));
  if exists(select 1 from public.research_runs where owner_id=p_owner and status in ('running','queued') and id<>j.research_run_id) then raise exception 'RUN_ALREADY_ACTIVE'; end if;
  update public.research_runs set status='running',completed_at=null where id=j.research_run_id;
 end if;
 perform pgmq.delete(q,j.queue_message_id);
 select pgmq.send(q,jsonb_build_object('job_id',j.id)) into m;
 update public.research_jobs set status='queued',attempt_count=0,last_error_code=null,completed_at=null,queue_message_id=m where id=j.id;
end $$;
revoke all on function public.center_retry_job(uuid,uuid) from public,anon,authenticated;
grant execute on function public.center_retry_job(uuid,uuid) to service_role;

-- Complete new owner configuration; the original bootstrap still owns catalogs and settings.
create function private.center_owner_roles() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.ai_roles(owner_id,role_key,primary_model,max_cost_per_call_usd,settings)
 select new.id,k,'openai/gpt-4.1-mini',0.15,'{"temperature":0.15,"max_tokens":12000}'::jsonb from unnest(array['claim_extractor','signal_classifier','signal_cluster_analyst','opportunity_generator','concept_generator','competitor_analyst','review_miner','market_analyst','monetization_distribution_analyst','risk_analyst','dedupe_adjudicator','final_judge','executive_brief_writer','blueprint_product_architect','blueprint_ux_architect','blueprint_technical_architect','blueprint_business_architect','blueprint_task_planner','prototype_spec_generator','consistency_reviewer','change_manager']) k on conflict(owner_id,role_key) do nothing;
 return new;
end $$;
revoke all on function private.center_owner_roles() from public,anon,authenticated;
create trigger z_center_owner_roles after insert on auth.users for each row execute function private.center_owner_roles();
