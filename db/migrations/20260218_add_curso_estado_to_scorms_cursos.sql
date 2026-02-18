alter table if exists public.scorms_cursos
add column if not exists curso_estado text;

update public.scorms_cursos
set curso_estado = 'En proceso'
where curso_estado is null or btrim(curso_estado) = '';
