alter table public.concept_evidence drop constraint concept_evidence_origin_check;
alter table public.concept_evidence add constraint concept_evidence_origin_check check(origin in ('owner_import','validation','research'));
