create or replace function public.center_apply_change(p_owner uuid,p_change uuid,p_report jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare c public.change_requests; v uuid;
begin
 select * into strict c from public.change_requests where id=p_change and owner_id=p_owner for update;
 if c.applied_version_id is not null then return c.applied_version_id; end if;
 if c.status<>'impact_ready' then raise exception 'CHANGE_NOT_READY'; end if;
 v:=public.center_save_blueprint(p_owner,c.project_id,c.base_blueprint_version_id,c.impact_summary->'bundle',c.request_text);
 update public.change_requests set applied_version_id=v,status='validating',completed_at=now() where id=p_change;
 insert into public.quality_reports(owner_id,project_id,blueprint_version_id,mandatory_pass,overall_score,gates,findings) values(p_owner,c.project_id,v,(p_report->>'mandatory_pass')::boolean,(p_report->>'overall_score')::numeric,p_report->'gates',p_report->'findings');
 perform public.center_enqueue(p_owner,'BLUEPRINT_REVIEW',v::text||':REVIEW',jsonb_build_object('project_id',c.project_id,'version_id',v));
 return v;
end $$;
create or replace function public.center_go(p_owner uuid,p_concept uuid,p_key text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare c public.product_concepts; p uuid; snapshot jsonb;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text||p_concept::text,3));
 select * into strict c from public.product_concepts where id=p_concept and owner_id=p_owner;
 select id into p from public.projects where owner_id=p_owner and concept_id=p_concept and status<>'archived' limit 1;
 if p is not null then return p; end if;
 if not exists(select 1 from public.recommendations where concept_id=p_concept and owner_id=p_owner) then raise exception 'ANALYSIS_REQUIRED'; end if;
 if (select status from public.recommendations where concept_id=p_concept and owner_id=p_owner order by created_at desc limit 1)='KILLED' then raise exception 'CONCEPT_KILLED'; end if;
 snapshot:=jsonb_build_object('concept',to_jsonb(c),'scores',(select coalesce(jsonb_agg(x),'[]') from public.score_snapshots x where concept_id=p_concept),'recommendations',(select coalesce(jsonb_agg(x),'[]') from public.recommendations x where concept_id=p_concept),'evidence',(select coalesce(jsonb_agg(x),'[]') from public.evidence x where id in (select value::uuid from public.recommendations r,jsonb_array_elements_text(r.strongest_evidence_ids) where r.concept_id=p_concept)));
 insert into public.projects(owner_id,concept_id,name,slug,frozen_research_snapshot) values(p_owner,p_concept,c.title,'project-'||p_concept::text,snapshot) returning id into p;
 update public.product_concepts set disposition='go' where id=p_concept;
 perform public.center_enqueue(p_owner,'BLUEPRINT_GENERATE',p::text||':GENERATE',jsonb_build_object('project_id',p));
 return p;
end $$;
create or replace function public.center_publish(p_owner uuid,p_project uuid,p_version uuid,p_report jsonb)
returns void language plpgsql security invoker set search_path='' as $$
declare v public.blueprint_versions;
begin
 perform 1 from public.projects where id=p_project and owner_id=p_owner and current_blueprint_version_id=p_version for update;
 if not found then raise exception 'VERSION_CONFLICT'; end if;
 select * into strict v from public.blueprint_versions where id=p_version and owner_id=p_owner;
 if not coalesce((p_report->>'mandatory_pass')::boolean,false) then raise exception 'QUALITY_BLOCKED'; end if;
 if v.consistency_review is null or exists(select 1 from jsonb_array_elements(v.consistency_review->'findings') f where f->>'severity' in ('critical','major')) then raise exception 'CONSISTENCY_REVIEW_REQUIRED'; end if;
 if not exists(select 1 from public.prototype_artifacts where project_id=p_project and blueprint_version_id=p_version and artifact_type='internal' and status='current') then raise exception 'PROTOTYPE_NOT_CURRENT'; end if;
 update public.blueprint_versions set status='superseded',is_current=false where project_id=p_project and status='published';
 update public.blueprint_versions set status='published',is_current=true,published_at=now(),quality_score=(p_report->>'overall_score')::numeric where id=p_version;
 update public.projects set status='ready_for_development' where id=p_project;
 update public.change_requests set status='published',completed_at=now() where applied_version_id=p_version and owner_id=p_owner;
end $$;
create or replace function private.center_immutable_artifact() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if TG_OP<>'INSERT' and exists(select 1 from public.blueprint_versions where id=old.blueprint_version_id and status in ('published','superseded')) then raise exception 'PUBLISHED_VERSION_IMMUTABLE'; end if;
 if TG_OP<>'DELETE' and exists(select 1 from public.blueprint_versions where id=new.blueprint_version_id and status in ('published','superseded')) then raise exception 'PUBLISHED_VERSION_IMMUTABLE'; end if;
 if TG_OP='DELETE' then return old; end if;return new;
end $$;
