alter table if exists public.scorms_master
  add column if not exists scorm_observaciones text null;

alter table if exists public.scorms_cursos
  add column if not exists curso_observaciones text null;
