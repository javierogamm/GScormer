alter table if exists public.scorms_cursos
add column if not exists curso_idioma text;

update public.scorms_cursos
set curso_idioma = coalesce(nullif(trim(curso_idioma), ''), 'ES')
where coalesce(nullif(trim(curso_idioma), ''), '') = '';
