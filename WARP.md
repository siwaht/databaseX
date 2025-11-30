# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Common Commands

All commands are run from the `vectorhub/` directory.

**Development & Building:**
- `npm install` - Install dependencies
- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint to check for style issues

**Testing & Verification:**
- `npm run lint` - Check for linting errors (ESLint with Next.js config)

## Architecture Overview

VectorHub is a **Next.js 14 full-stack application** for managing vector database connections and collections with a unified UI.

### Core Structure

**UI Layer (`src/app/` and `src/components/`):**
- Next.js App Router with dashboard layout in `(dashboard)/`
- Pages: Collections, Connections, Documents, Search, Settings, Upload
- Reusable UI components in `components/ui/` (Radix UI + Tailwind)
- Feature-specific components (Collections, Connections, Documents, Search) handle domain logic

**State Management (`src/store/`):**
- Zustand with persistence middleware for localStorage
- Three slices: Connections, Collections, Documents
- Slices follow StateCreator pattern for composability
- Persisted key: `vectorhub-storage`

**Database Abstraction Layer (`src/lib/db/adapters/`):**
- `base.ts` defines `VectorDBAdapter` interface (required contract for all database implementations)
- `mock-adapter.ts` provides in-memory implementation for development
- Adapter interface includes connection management, collection CRUD, document/vector operations, and search

**Supported Vector Databases (`src/types/connections.ts`):**
ChromaDB, MongoDB Atlas, Supabase, Weaviate, Pinecone, Qdrant, Redis, Upstash

Each database type has a unique config interface with specific connection parameters stored in `ConnectionConfig.config`.

### Data Flow

1. UI components dispatch actions to Zustand store slices
2. Store persists state to localStorage
3. Adapters execute operations against the connected vector database
4. Results flow back to UI for display

### Key Design Patterns

- **Adapter Pattern:** Database implementations extend `VectorDBAdapter` interface
- **Slice Pattern:** Store logic modularized into independent slices that compose into one store
- **React Components:** Use Radix UI for accessible, unstyled components with Tailwind styling
- **Type Safety:** Strict TypeScript with path alias `@/*` mapping to `src/`

## Project Configuration

- **TypeScript:** Strict mode enabled, paths configured with `@/*` -> `src/`
- **Styling:** Tailwind CSS with Radix UI components
- **State Persistence:** Zustand with localStorage
- **Next.js Version:** 14.2.16
