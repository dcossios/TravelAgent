# AI Travel Agent - Developer Guide

## Setup & Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Tech Stack
- Next.js 13.5 with App Router
- TypeScript 5.2 (strict mode enabled)
- Supabase for database/authentication
- TailwindCSS with shadcn/ui components
- Zustand for state management
- React Hook Form + Zod for validation

## Code Conventions
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Imports**: React core first, UI libraries second, local modules last
- **Types**: Strong typing via TypeScript, DB types in `lib/supabase/types.ts`
- **Error Handling**: try/catch with specific error types, errors stored in state
- **Components**: UI components in `/components/ui`, feature components at root
- **Path Aliases**: `@/*` resolves to project root

## Data Flow
- Zustand store for global state (`use-trip-store.ts`)
- Supabase for data persistence
- Client-side components with 'use client' directive
- DnD-kit for drag-and-drop functionality