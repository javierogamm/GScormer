alter table if exists public.scorms_cursos_actualizaciones
  add column if not exists actualizacion_estado text default 'Pendiente',
  add column if not exists scorms_orden_anterior text,
  add column if not exists scorms_orden_nuevo text;

update public.scorms_cursos_actualizaciones
set actualizacion_estado = 'Pendiente'
where actualizacion_estado is null;

create index if not exists scorms_cursos_actualizaciones_estado_idx
  on public.scorms_cursos_actualizaciones (actualizacion_estado);

notify pgrst, 'reload schema';
