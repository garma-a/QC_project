# AHC QC Project

AHC QC Project is a laboratory quality control platform built as a monorepo with a NestJS backend and a Next.js frontend. It centralizes machine monitoring, QC execution, control-lot management, and alert workflows for lab teams.

## Repository Structure

```text
.
|-- apps/
|   |-- backend/    # NestJS API + Drizzle/PostgreSQL
|   `-- frontend/   # Next.js dashboard
|-- docker-compose.yml
`-- Dockerfile
```

## Key Capabilities

- Role-aware authentication and authorization (ADMIN, TECHNICIAN)
- QC data lifecycle: machines, tests, control lots, and QC results
- Alerting workflow with seen/resolved state tracking
- Swagger API documentation for backend endpoints
- Modern dashboard UX for login, monitor, QC history, users, and alerts

## Tech Stack

- Backend: NestJS 11, Drizzle ORM, PostgreSQL, JWT, Swagger
- Frontend: Next.js 16, React 19, TypeScript, Zustand, Recharts
- Runtime: Bun
- Infra: Docker and Docker Compose for local services

## Prerequisites

- Bun 1.0+
- Docker (recommended for PostgreSQL)

## Quick Start

### 1) Clone the repository

```bash
git clone https://github.com/garma-a/QC_project.git
cd QC_project
```

### 2) Start PostgreSQL

```bash
docker compose up -d db
```

### 3) Run backend

```bash
cd apps/backend
cp .env-example .env
```

Set at least the following variables in `apps/backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mydb"
JWT_SECRET="replace-with-a-strong-secret"
PORT=3000
```

Then start the backend:

```bash
bun install
bun run start:dev
```

Backend default URL: `http://localhost:3000`

Swagger docs: `http://localhost:3000/api/v1/docs`

### 4) Run frontend

In a new terminal:

```bash
cd apps/frontend
bun install
```

Create `apps/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

Start the frontend:

```bash
bun run dev
```

Frontend default URL: `http://localhost:3000` (Next.js)

## Optional: Seed Demo Data

From `apps/backend`:

```bash
bun run seed
```

The seed script creates users and prints demo credentials in the terminal.

## Useful Commands

From repository root:

- `npm run docker:up` - build and start local containers
- `npm run docker:down` - stop containers

From `apps/backend`:

- `bun run start:dev` - run API in watch mode
- `bun run test` - run tests
- `bun run build` - compile production build

From `apps/frontend`:

- `bun run dev` - run Next.js app locally
- `bun run build` - build frontend
- `bun run lint` - lint frontend code

## Contributors

<a href="https://github.com/garma-a/qc_project/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=garma-a/qc_project" alt="Contributors" />
</a>



