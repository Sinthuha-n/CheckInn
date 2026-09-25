# CheckInn frontend

The React client for CheckInn, built with TypeScript and Vite. The current foundation includes the application shell, design system, routing, typed backend contracts, authentication, and role-aware navigation. Room and booking experiences remain isolated for their dedicated milestones.

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

The development server is available at `http://localhost:5173` by default. When `VITE_API_BASE_URL` is omitted locally, Vite proxies the relative `/api` path to `http://localhost:8080`.

## Scripts

- `npm run dev` starts the Vite development server.
- `npm run typecheck` checks strict TypeScript compilation.
- `npm run lint` runs ESLint with zero warnings allowed.
- `npm test` runs the Vitest suite once.
- `npm run build` type-checks and creates a production bundle.
- `npm run preview` serves the production bundle locally.

## Environment

Copy `.env.example` to `.env.local` to override the API origin. `VITE_API_BASE_URL` must point to the Spring Boot `/api` root. Environment files other than the example are ignored and must never contain committed credentials or JWT secrets.

## Authentication

The client uses the backend's bearer JWT contract. Login identity and the token are kept in `sessionStorage`, restored only while the token has a valid `exp` claim, and removed on logout or an expired/rejected session. Client role guards improve navigation but do not replace backend authorization.

## Architecture

- `src/app` owns application composition, providers, and routing.
- `src/components/layout` contains shared page chrome.
- `src/components/ui` contains reusable, typed interface primitives.
- `src/features/auth` owns authentication API calls, session state, and guards.
- `src/pages` contains route-level views.
- `src/services` contains the shared native-fetch client and error normalization.
- `src/types` mirrors verified backend DTO and enum contracts.
- `src/config` is the single entry point for runtime configuration.
- `src/styles` contains design tokens and global/feature styles.
- `src/test` contains shared test setup and factories.

Future product work should introduce room, booking, review, and admin feature folders only as those implementations begin. Visual-only data must stay isolated from API models, and network code must remain separate from presentation components.
