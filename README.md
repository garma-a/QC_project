# 🔬 AHC QC Project - Monorepo

> **An enterprise-grade laboratory quality control platform built as a monorepo.**  
> It centralizes machine monitoring, QC execution, control-lot management, and alert workflows for lab teams.

![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)
![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/postgresql-4169e1?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)

---

## Motivation

This platform was built to modernize laboratory quality control operations by offering an enterprise-grade monorepo solution. The goal is to provide reliable, real-time alert workflows and Westgard rule evaluations, ensuring the accuracy of medical laboratory instruments.

## 🌟 Platform Preview

### 📈 QC Monitoring & Westgard Rules Validation
*Real-time evaluation of QC results against standard Westgard rules with interactive charts.*

https://github.com/user-attachments/assets/bcf2121d-d396-4e4e-82ba-5d02165f2b7e

### 🔔 Real-time Alerting Workflow
*Comprehensive alert management inbox for tracking and resolving QC deviations.*

https://github.com/user-attachments/assets/46f372b0-e36d-4ba7-abf5-87e5ee0f0e29

---

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

## Backend-Centric Scope

This project is designed around backend reliability for laboratory operations:

- clear domain boundaries in the API layer
- validation and role-guarded endpoints
- relational modeling for QC auditability
- alert-state lifecycle for operational follow-up

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
PORT=4000
```

Then start the backend:

```bash
bun install
bun run start:dev
```

Backend URL in this setup: `http://localhost:4000`

Swagger docs: `http://localhost:4000/api/v1/docs`

### 4) Run frontend

In a new terminal:

```bash
cd apps/frontend
bun install
```

Create `apps/frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

Start the frontend:

```bash
bun run dev
```

Frontend default URL: `http://localhost:3000` (Next.js)

## Usage

After starting both backend and frontend servers, you can navigate to `http://localhost:3000` to access the QC Dashboard. Log in with the technician or admin credentials created by the seed script to start monitoring machine tests, recording QC results, and resolving alerts.

## API Domains (Backend)

Main backend modules exposed under `/api/v1`:

- `auth` - login and token issuance
- `users` - role-protected user management
- `machines` - machine registration and updates
- `qc-tests` - test definitions by machine
- `control-lots` - lot metadata and target ranges
- `qc-results` - measured values and status computation
- `alerts` - alert retrieval and resolution workflow

## Optional: Seed Demo Data

From `apps/backend`:

```bash
bun run seed
```

The seed script creates users and prints demo credentials in the terminal.

## Troubleshooting

- If frontend requests fail, verify `NEXT_PUBLIC_API_URL` points to the backend port you actually run.
- If backend fails to connect, verify PostgreSQL is up and `DATABASE_URL` matches your local container config.
- If auth-protected calls return `401`, ensure login succeeded and token is included in requests.

## Performance Benchmarks

The backend API is highly optimized for enterprise-scale laboratory workloads. To validate its performance under realistic, high-concurrency conditions, we conducted a rigorous `k6` load test.

### Test Environment
- **Database Size:** ~8,000,000 rows (1,000,000 rows across all core tables: machines, tests, lots, runs, results, sections, users).
- **Concurrency:** 50 simultaneous Virtual Users (VUs) constantly interacting with the system.
- **Duration:** 3 minutes of sustained load.
- **Test Workflow:** A full cycle (fetching dashboard, checking machine history, fetching QC machines, retrieving history, submitting new QC results, fetching alerts, etc.) simulating an active lab technician.

### k6 Benchmark Results

```text
     execution: local
        script: k6-benchmark.js
        output: -

     scenarios: (100.00%) 1 scenario, 50 max VUs, 3m30s max duration (incl. graceful stop):
              * default: Up to 50 looping VUs for 3m0s over 3 stages (gracefulRampDown: 30s, gracefulStop: 30s)

     ✓ fetched dashboard successfully
     ✓ fetched machine history successfully
     ✓ fetched qc machines successfully
     ✓ fetched qc history successfully
     ✓ submitted qc result successfully
     ✓ fetched users
     ✓ fetched sections
     ✓ fetched machines
     ✓ fetched tests
     ✓ fetched control lots
     ✓ fetched alerts successfully

     http_req_duration..............: avg=6.53ms   min=270.97µs med=4.26ms   max=374.76ms p(90)=14.74ms  p(95)=19.41ms
     http_reqs......................: 27149  148.849001/s
     iterations.....................: 2468   13.531229/s
```

### Scalability & Capacity Estimation

Based on these verified results on an 8 million row dataset, the system demonstrates exceptional scalability:

- **Average API Latency:** An incredibly fast **~6.53ms** average response time across complex relational queries.
- **Throughput:** Safely sustains **~149 requests per second** under constant load from 50 concurrent active technicians.
- **Daily Request Capacity (24 Hours):** Running at a continuous average of 149 requests per second, the backend is capable of processing **~12.8 million requests every 24 hours**.
- **Active Users Per Day:** Assuming a highly active laboratory technician makes roughly 500 API requests during their shift, this single node can comfortably support over **25,000 active users per day** without any performance degradation.

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

## Contributing

We welcome contributions to the AHC QC Project! If you want to contribute, please clone the repo, run the local environment as described in the Quick Start section, and open a pull request with your changes.

## Contributors

<a href="https://github.com/garma-a/qc_project/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=garma-a/qc_project" alt="Contributors" />
</a>

