alter table public.opportunities add column embedding_model text;
alter table public.app_settings add column dedupe_policy jsonb not null default '{"version":"1.0","candidate_threshold":0.80,"auto_merge_threshold":0.97}'::jsonb;
create function public.center_similar_opportunities(p_owner uuid,p_vector extensions.vector,p_model text,p_kind public.app_or_game,p_threshold float default 0.8)
returns table(id uuid,similarity float) language sql stable security invoker set search_path='' as $$
 select o.id,1-(o.embedding operator(extensions.<=>) p_vector) from public.opportunities o
 where o.owner_id=p_owner and o.embedding_model=p_model and o.app_or_game=p_kind and o.embedding is not null and extensions.vector_dims(o.embedding)=extensions.vector_dims(p_vector)
 and 1-(o.embedding operator(extensions.<=>) p_vector)>=p_threshold
 order by o.embedding operator(extensions.<=>) p_vector limit 5;
$$;
revoke all on function public.center_similar_opportunities(uuid,extensions.vector,text,public.app_or_game,float) from public,anon,authenticated;
grant execute on function public.center_similar_opportunities(uuid,extensions.vector,text,public.app_or_game,float) to service_role;
insert into public.ai_roles(owner_id,role_key,primary_model,max_cost_per_call_usd,settings)
select id,'dedupe_embeddings','openai/text-embedding-3-small',0.02,'{}' from auth.users on conflict(owner_id,role_key) do nothing;
create function private.center_embedding_role() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.ai_roles(owner_id,role_key,primary_model,max_cost_per_call_usd,settings) values(new.id,'dedupe_embeddings','openai/text-embedding-3-small',0.02,'{}') on conflict(owner_id,role_key) do nothing;return new;
end $$;
revoke all on function private.center_embedding_role() from public,anon,authenticated;
create trigger zz_center_embedding_role after insert on auth.users for each row execute function private.center_embedding_role();

-- Scheduler reads secrets only from Vault. Jobs are installed explicitly after deployment verification.
create function private.center_wake(p_action text) returns bigint language plpgsql security definer set search_path='' as $$
declare endpoint text; token text; request_id bigint;
begin
 if p_action not in ('worker','dispatch') then raise exception 'INVALID_ACTION'; end if;
 select decrypted_secret into endpoint from vault.decrypted_secrets where name='h93_center_endpoint';
 select decrypted_secret into token from vault.decrypted_secrets where name='h93_center_worker_secret';
 if endpoint is null or token is null then return null; end if;
 select net.http_post(url:=endpoint||'/'||p_action,headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||token),body:='{}'::jsonb,timeout_milliseconds:=1000) into request_id;
 return request_id;
end $$;
revoke all on function private.center_wake(text) from public,anon,authenticated;
