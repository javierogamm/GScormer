create table if not exists public.scorms_cursos_cambios_scorms (
  id bigserial primary key,
  curso_id bigint not null references public.scorms_cursos(id) on delete cascade,
  acknowledged_scorms jsonb not null default '[]'::jsonb,
  resolved_at timestamptz,
  resolved_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scorms_cursos_cambios_scorms_curso_id_key unique (curso_id)
);

create index if not exists scorms_cursos_cambios_scorms_curso_id_idx
  on public.scorms_cursos_cambios_scorms (curso_id);

create or replace function public.set_scorms_cursos_cambios_scorms_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_scorms_cursos_cambios_scorms_updated_at on public.scorms_cursos_cambios_scorms;

create trigger set_scorms_cursos_cambios_scorms_updated_at
before update on public.scorms_cursos_cambios_scorms
for each row
execute function public.set_scorms_cursos_cambios_scorms_updated_at();
