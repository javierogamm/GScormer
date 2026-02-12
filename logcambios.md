# Log de cambios

## v1.0.0 - Base inicial consolidada
- Se crea estructura de aplicación Next.js (App Router) con configuración para desarrollo y build.
- Se integra cliente de Supabase usando variables `SUPABASE_URL` y `SUPABASE_ANON_KEY` (incluyendo soporte `NEXT_PUBLIC_*` para cliente).
- Se implementa la pantalla principal con diseño moderno y orientado a futura ampliación de módulos dinámicos.
- Se implementa la **Vista de Tabla** como vista por defecto, leyendo `scorms_master` y permitiendo editar/guardar campos editables por fila.
- Se documenta setup local y despliegue en Vercel en `README.md`.
- Se añade `.env.example` con variables necesarias.
