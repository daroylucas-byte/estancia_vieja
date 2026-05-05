# Compras Municipal - PWA

Sistema de gestión de compras para el municipio.

## Stack Tecnológico

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS
- **Estado:** Zustand, React Query
- **Formularios:** React Hook Form + Zod
- **Backend:** Supabase (Auth, DB, Storage)
- **PWA:** vite-plugin-pwa

## Requisitos Previos

- Node.js 18+
- Cuenta en Supabase

## Instalación

1. Clonar el repositorio.
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar variables de entorno en `.env.local`:
   ```env
   VITE_SUPABASE_URL=tu-url-de-supabase
   VITE_SUPABASE_ANON_KEY=tu-anon-key
   ```

## Desarrollo

Correr el servidor de desarrollo:
```bash
npm run dev
```

## Producción

Generar el build:
```bash
npm run build
```

Previsualizar el build:
```bash
npm run preview
```
