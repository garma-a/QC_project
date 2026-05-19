# AHC QC Backend

NestJS backend for the AHC QC platform. This service provides authentication, role-based access, QC domain APIs, and alert workflows for laboratory quality control operations.

## What This Service Covers

- JWT-based authentication
- Role-based authorization (`ADMIN`, `TECHNICIAN`)
- QC domain modules for machines, tests, control lots, and results
- Alert state transitions (`UNSEEN`, `SEEN`, `RESOLVED`)
- OpenAPI/Swagger documentation

## Backend Responsibilities

- enforce request validation and payload contracts
- protect routes via auth guards and role checks
- persist QC entities and relationships in PostgreSQL
- evaluate QC results and expose alert workflows
- provide stable APIs for frontend dashboards

## Stack

- NestJS 11
- Drizzle ORM + PostgreSQL
- Passport JWT
- Argon2 password hashing
- Bun runtime/tooling

## Project Modules

- `auth` - login and token issuance
- `users` - user management and role-protected operations
- `machines` - machine CRUD and status context
- `qc-tests` - test definitions per machine
- `control-lots` - lot metadata and QC thresholds
- `qc-results` - measured QC runs and status evaluation
- `alerts` - alert retrieval and acknowledgement workflow

## API Base and Docs

- Base path: `/api/v1`
- Swagger UI: `/api/v1/docs`

By default, local server URL is `http://localhost:3000`.

## Environment Variables

Create `.env` in this directory:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mydb"
JWT_SECRET="replace-with-a-strong-secret"
PORT=4000
```

Notes:

- `DATABASE_URL` is used by Drizzle.
- `JWT_SECRET` is required for token signing and verification.
- `PORT` is optional (defaults to `3000`). Use `4000` for local full-stack runs to avoid clashing with Next.js.

## Local Development

### 1) Install dependencies

```bash
bun install
```

### 2) Start PostgreSQL (from repo root)

```bash
docker compose up -d db
```

### 3) Run backend in watch mode

```bash
bun run start:dev
```

## Seed Data

To populate demo QC data:

```bash
bun run seed
```

The script creates sample users, machines, tests, control lots, and results, then prints login emails in the terminal.

## Commands

- `bun run start:dev` - development server with watch mode
- `bun run start:prod` - run compiled server
- `bun run build` - compile backend
- `bun run test` - run test suite
- `bun run test:cov` - coverage run
- `bun run lint` - lint code
- `bun run seed` - seed demo data

## Suggested Backend Validation Flow

After startup, validate core behavior in this order:

1. Open Swagger and verify API docs load.
2. Execute login request and obtain token.
3. Call one protected endpoint with Bearer token.
4. Create/read one QC domain entity (machine/test/lot/result).
