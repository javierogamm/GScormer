# GScormer

Aplicación base para gestionar SCORMs con Next.js + Supabase, preparada para despliegue en Vercel.

## Requisitos

- Node.js 18+
- Proyecto de Supabase con tabla `public.scorms_master`

## Configuración

1. Copia `.env.example` a `.env.local`.
2. Configura estas variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

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
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Compatibilidad adicional: si en Vercel solo defines `SUPABASE_URL` y `SUPABASE_ANON_KEY`, `next.config.mjs` las mapea automáticamente a `NEXT_PUBLIC_*` durante el build.

La aplicación carga por defecto una vista tabla editable para todos los registros de `scorms_master`.
