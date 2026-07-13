# 🧪 AHC QC Platform - Frontend Application

> **A modern, high-performance Next.js dashboard for the AHC Quality Control platform.** 
> Providing authenticated workflows for laboratory monitoring, real-time QC history analysis, strict Westgard rules evaluation, alert handling, and comprehensive user administration.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

---

## 🌟 Platform Preview

### 📈 Westgard Rules & Error Detection
*Real-time evaluation of QC results against standard Westgard rules.*
<img src="../../imgs/westgard_graph_cropped.gif" alt="Westgard Rules & Error Detection" width="100%" />

### 🔔 Alerts & Notifications Inbox
*Centralized management for tracking and resolving QC deviations.*
<img src="../../imgs/alerts_cropped.gif" alt="Alerts & Notifications Inbox" width="100%" />

---

## 📱 Main Screens & Features

- **🔐 Secure Login:** Role-based access control (Admin & Technician).
- **📊 Dashboard Overview:** High-level metrics and machine statuses.
- **🖥️ Machine Monitor View:** Live tracking of connected laboratory equipment.
- **🧪 QC History & Submissions:** Intuitive flows for submitting new tests and reviewing historical data.
- **⚠️ Alerts Inbox:** Actionable alert resolution and acknowledgment flows.
- **👥 User Management:** Full administrative control over lab personnel.

## 🔗 Backend Integration Focus

This frontend is designed as a robust API consumer for the AHC backend workflows:

- 🔒 Authenticated requests to protected endpoints.
- 🔄 QC entity creation/update flows via efficient server actions.
- 📈 Dashboard rendering derived from backend datasets.
- ✅ Alert acknowledgement and resolution actions.

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
