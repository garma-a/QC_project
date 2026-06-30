#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# local-setup.sh — One-shot local dev environment setup
# Run from the repo root: bash local-setup.sh
# ─────────────────────────────────────────────────────────────────────────────
set -e

BACKEND_DIR="apps/backend"
FRONTEND_DIR="apps/frontend"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}✔ $*${NC}"; }
warn() { echo -e "${YELLOW}⚠ $*${NC}"; }
err()  { echo -e "${RED}✖ $*${NC}"; }

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  QC Project — Local Development Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── 1. Check bun ─────────────────────────────────────────────────────────────
if ! command -v bun &>/dev/null; then
  err "bun is not installed. Install it from https://bun.sh"
  exit 1
fi
log "bun $(bun --version) found"

# ── 2. Install dependencies ──────────────────────────────────────────────────
log "Installing root dependencies..."
bun install --frozen-lockfile

log "Installing backend dependencies..."
cd "$BACKEND_DIR" && bun install --frozen-lockfile && cd ../..

log "Installing frontend dependencies..."
cd "$FRONTEND_DIR" && bun install --frozen-lockfile && cd ../..

# ── 3. Check PostgreSQL ───────────────────────────────────────────────────────
echo ""
echo "Checking PostgreSQL..."
if PGPASSWORD=postgres psql -h localhost -U postgres -c '\q' 2>/dev/null; then
  log "PostgreSQL is reachable at localhost:5432"

  # Create database if missing
  if ! PGPASSWORD=postgres psql -h localhost -U postgres -lqt | cut -d\| -f1 | grep -qw qc_project; then
    warn "Database 'qc_project' does not exist — creating it..."
    PGPASSWORD=postgres createdb -h localhost -U postgres qc_project
    log "Database 'qc_project' created"
  else
    log "Database 'qc_project' already exists"
  fi

  # Run migrations
  log "Running database migrations..."
  cd "$BACKEND_DIR" && bun run db:migrate && cd ../..
  log "Migrations complete"
else
  warn "PostgreSQL not reachable. Start it first, then re-run this script."
  echo ""
  echo "  Ubuntu/Debian : sudo service postgresql start"
  echo "  macOS         : brew services start postgresql"
  echo "  Docker        : docker compose up -d db"
  echo ""
fi

# ── 4. Verify .env ────────────────────────────────────────────────────────────
echo ""
if [[ -f "$BACKEND_DIR/.env" ]]; then
  log "Backend .env exists"
else
  warn ".env not found — copying from .env-example"
  cp "$BACKEND_DIR/.env-example" "$BACKEND_DIR/.env"
  log "Created $BACKEND_DIR/.env — edit SMTP_* settings if needed"
fi

# ── 5. Summary ────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Setup complete! Start the services:"
echo ""
echo "  Backend  →  cd apps/backend  && bun run start:dev"
echo "  Frontend →  cd apps/frontend && bun run dev"
echo ""
echo "  Email dev mode: OTP preview URLs will appear in"
echo "  the backend terminal (no email client needed)."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
