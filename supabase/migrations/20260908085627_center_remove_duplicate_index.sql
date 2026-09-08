-- Keep the original equivalent unique index; avoid duplicate write/index maintenance.
drop index public.center_opportunity_identity;
