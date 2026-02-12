# Log de cambios

## v1.0.0 - Base inicial consolidada
- Se crea estructura de aplicación Next.js (App Router) con configuración para desarrollo y build.
- Se integra cliente de Supabase usando variables `SUPABASE_URL` y `SUPABASE_ANON_KEY` (incluyendo soporte `NEXT_PUBLIC_*` para cliente).
- Se implementa la pantalla principal con diseño moderno y orientado a futura ampliación de módulos dinámicos.
- Se implementa la **Vista de Tabla** como vista por defecto, leyendo `scorms_master` y permitiendo editar/guardar campos editables por fila.
- Se documenta setup local y despliegue en Vercel en `README.md`.
- Se añade `.env.example` con variables necesarias.


## v1.1.0 - Integración Supabase corregida para Vercel
- Se corrige `lib/supabaseClient.js` para usar únicamente variables públicas `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en frontend.
- Se elimina el fallback incorrecto a `process.env.SUPABASE_URL` y `process.env.SUPABASE_ANON_KEY` en código cliente.
- Se añade validación explícita con errores claros cuando faltan variables de entorno de Supabase.
- Se crea `lib/supabaseServer.js` para separar inicialización de Supabase para uso en servidor (App Router).
- Se actualizan `.env.example` y `README.md` con las variables requeridas para local y Vercel.


## v1.1.1 - Fix de build Vercel por variables Supabase
- Se corrige `next.config.mjs` para mapear `SUPABASE_URL`/`SUPABASE_ANON_KEY` hacia `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` durante build.
- Se mantiene `lib/supabaseClient.js` usando solo variables públicas en frontend, sin exponer variables privadas en navegador.
- Se ajusta `lib/supabaseServer.js` para aceptar variables de servidor (`SUPABASE_*`) con fallback a `NEXT_PUBLIC_*` en contexto server.
- Se actualiza `README.md` para documentar la compatibilidad con entornos Vercel ya configurados solo con `SUPABASE_*`.
