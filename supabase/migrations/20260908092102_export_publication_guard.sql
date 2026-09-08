-- Publication requires a generated, private export for this exact version.
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
 if not exists(select 1 from public.export_packages e join storage.objects o on o.bucket_id='blueprint-exports' and o.name=e.storage_path where e.owner_id=p_owner and e.project_id=p_project and e.blueprint_version_id=p_version and e.archive_checksum is not null and e.manifest->>'version_id'=p_version::text) then raise exception 'EXPORT_NOT_READY'; end if;
 update public.blueprint_versions set status='superseded',is_current=false where project_id=p_project and status='published';
 update public.blueprint_versions set status='published',is_current=true,published_at=now(),quality_score=(p_report->>'overall_score')::numeric where id=p_version;
 update public.projects set status='ready_for_development' where id=p_project;
 update public.change_requests set status='published',completed_at=now() where applied_version_id=p_version and owner_id=p_owner;
end $$;
