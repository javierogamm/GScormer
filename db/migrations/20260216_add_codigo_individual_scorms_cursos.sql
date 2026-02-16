alter table if exists public.scorms_cursos
  add column if not exists codigo_individual text null;

create index if not exists idx_scorms_cursos_codigo_individual
  on public.scorms_cursos (codigo_individual);
