# GScormer

Aplicación base para gestionar SCORMs con Next.js + Supabase, preparada para despliegue en Vercel.

## Requisitos

- Node.js 18+
- Proyecto de Supabase con tabla `public.scorms_master`

## Configuración

1. Copia `.env.example` a `.env.local`.
2. Configura estas variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SESSION_SECRET`
   - *(Compatibilidad temporal, opcional)* `SUPABASE_ANON_KEY` solo en backend si aún no configuraste la service role

## Desarrollo

```bash
npm install
npm run dev
```

## Build de producción

```bash
npm run build
npm run start
```

## Despliegue en Vercel

- Framework: Next.js.
- Build command: `npm run build`
- Output: `.next`
- Variables de entorno recomendadas:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SESSION_SECRET`
- Compatibilidad temporal:
  - `SUPABASE_ANON_KEY` (solo backend) si todavía no has cargado `SUPABASE_SERVICE_ROLE_KEY`.
- Seguridad: no expongas `SUPABASE_SERVICE_ROLE_KEY` en variables `NEXT_PUBLIC_*` ni en código cliente.

La aplicación carga por defecto una vista tabla editable para todos los registros de `scorms_master`.
