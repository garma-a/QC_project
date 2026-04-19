# AHC QC Frontend

Next.js dashboard for the AHC QC platform. The frontend provides authenticated workflows for laboratory monitoring, QC history analysis, alert handling, and user administration.

## Main Screens

- Login
- Dashboard overview
- Machine monitor view
- QC history and submission flows
- Alerts inbox and resolution actions
- User management (admin)

## Backend Integration Focus

This frontend is primarily an API consumer for backend workflows:

- authenticated requests to protected endpoints
- QC entity creation/update flows via server actions
- dashboard rendering from backend datasets
- alert acknowledgement and resolution actions

## Stack

- Next.js 16 + React 19
- TypeScript
- Zustand for client-side state
- Recharts for data visualization
- Tailwind CSS

## API Integration

The UI calls backend endpoints under `/api/v1/*` through shared helpers in `src/lib/api`.

Default backend fallback URL is `http://localhost:3000`, and can be overridden using an environment variable.

For local full-stack development, running backend on `4000` is recommended to avoid port collision with Next.js.

Important: the frontend currently defaults internally to `http://localhost:3000` when `NEXT_PUBLIC_API_URL` is not set.

## Environment

Create `apps/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

## Run Locally

```bash
bun install
bun run dev
```

Open `http://localhost:3000`.

## Scripts

- `bun run dev` - start Next.js dev server
- `bun run build` - production build
- `bun run start` - run production build
- `bun run lint` - run linter
- `bun run dev:vinext` - run Vinext/Vite dev mode (experimental)
- `bun run build:vinext` - build Vinext/Vite mode

## Suggested Local Workflow

1. Start backend from `apps/backend`.
2. Start frontend from this directory.
3. Sign in using seeded credentials from backend seeding output.
