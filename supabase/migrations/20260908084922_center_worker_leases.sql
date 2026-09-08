-- Fence queue completion by claim attempt; cancelled work cannot become succeeded.
create function public.center_finish_attempt(p_job uuid,p_queue text,p_message bigint,p_attempt integer,p_result jsonb,p_error text default null,p_retry boolean default false)
returns void language plpgsql security invoker set search_path='' as $$
declare j public.research_jobs;
begin
 if p_queue not in ('research_jobs','blueprint_jobs') then raise exception 'INVALID_QUEUE'; end if;
 select * into strict j from public.research_jobs where id=p_job for update;
 if j.queue_message_id is distinct from p_message or j.attempt_count<>p_attempt then raise exception 'STALE_JOB_ATTEMPT'; end if;
 if j.status='cancelled' or p_error='JOB_CANCELLED' then
  update public.research_jobs set status='cancelled',completed_at=now() where id=p_job;
  perform pgmq.delete(p_queue,p_message); return;
 end if;
 if j.status<>'running' then raise exception 'STALE_JOB_ATTEMPT'; end if;
 perform public.center_finish(p_job,p_queue,p_message,p_result,p_error,p_retry);
end $$;
revoke all on function public.center_finish_attempt(uuid,text,bigint,integer,jsonb,text,boolean) from public,anon,authenticated;
grant execute on function public.center_finish_attempt(uuid,text,bigint,integer,jsonb,text,boolean) to service_role;
