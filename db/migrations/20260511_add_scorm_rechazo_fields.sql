alter table if exists public.scorms_master
  add column if not exists scorm_rechazo_comentario text null,
  add column if not exists scorm_rechazo_user text null,
  add column if not exists scorm_rechazo_fecha timestamp with time zone null,
  add column if not exists scorm_rechazo_estado_anterior text null;
