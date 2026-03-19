# Environment & DevOps
# DualSub — German + English Dual Subtitle YouTube Player

**Document Version:** 1.0

---

## 1. Environment Overview

DualSub runs across three environments:

| Environment | Purpose | URLs |
|---|---|---|
| **Local** | Developer workstation | `http://localhost:5173` (FE), `http://localhost:3001` (BE) |
| **Staging** | Pre-production validation | `https://staging.dualsub.app`, `https://api-staging.dualsub.app` |
| **Production** | Live public environment | `https://dualsub.app`, `https://api.dualsub.app` |

---

## 2. Environment Variables

### 2.1 Complete Variable Reference

All environment variables for both frontend and backend. Stored in `.env` files locally and in platform dashboards (Vercel, Railway) for production.

**Backend environment variables:**

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | Yes | `development` | Runtime environment: `development`, `staging`, `production` |
| `PORT` | Yes | `3001` | Port the Express server listens on |
| `CACHE_DIR` | Yes | `./cache` | Absolute or relative path to subtitle cache directory |
| `DEEPL_KEY` | Yes | — | DeepL API authentication key (format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx`) |
| `ALLOWED_ORIGIN` | Yes | `http://localhost:5173` | Frontend origin for CORS allow list |
| `RATE_LIMIT_WINDOW_MS` | No | `3600000` | Rate limit window in ms (default: 1 hour) |
| `RATE_LIMIT_MAX` | No | `10` | Max import requests per IP per window |
| `SENTRY_DSN` | No | — | Sentry Data Source Name for error tracking |
| `LOG_LEVEL` | No | `info` | Pino log level: `trace`, `debug`, `info`, `warn`, `error` |
| `YTDLP_PATH` | No | `yt-dlp` | Path to yt-dlp binary (override if not in PATH) |
| `YTDLP_TIMEOUT_MS` | No | `60000` | Max time in ms to wait for yt-dlp subprocess |
| `MAX_VTT_SIZE_BYTES` | No | `5242880` | Max VTT file size to accept (default: 5MB) |

**Frontend environment variables (Vite — must be prefixed `VITE_`):**

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | Yes | `http://localhost:3001` | Backend API base URL |
| `VITE_SENTRY_DSN` | No | — | Sentry DSN for frontend error tracking |
| `VITE_APP_VERSION` | No | `1.0.0` | Displayed in footer |

### 2.2 `.env.example`

This file lives at the project root. It must be kept up to date. Never put real values here.

```env
# ─── Backend ─────────────────────────────────────────────────────────────────
NODE_ENV=development
PORT=3001
CACHE_DIR=./cache

# DeepL API key — get free key at https://www.deepl.com/pro#developer
DEEPL_KEY=your-deepl-api-key-here

# Frontend origin for CORS (no trailing slash)
ALLOWED_ORIGIN=http://localhost:5173

# Optional: rate limiting overrides
RATE_LIMIT_WINDOW_MS=3600000
RATE_LIMIT_MAX=10

# Optional: observability
SENTRY_DSN=
LOG_LEVEL=info

# Optional: yt-dlp path override
YTDLP_PATH=yt-dlp
YTDLP_TIMEOUT_MS=60000

# ─── Frontend ────────────────────────────────────────────────────────────────
VITE_API_BASE_URL=http://localhost:3001
VITE_SENTRY_DSN=
VITE_APP_VERSION=1.0.0
```

### 2.3 Local `.env` Files

```
dualsub/
├── .env              ← Shared local secrets (gitignored)
├── frontend/.env     ← Frontend-specific overrides (gitignored)
└── backend/.env      ← Backend-specific overrides (gitignored)
```

Vite automatically reads `frontend/.env`. Express reads `backend/.env` via `dotenv` (or root `.env` via workspace config).

---

## 3. Local Development Setup

### 3.1 Prerequisites

```bash
# Required
node --version    # must be 20+
npm --version     # must be 9+
python3 --version # must be 3.11+
pip3 install yt-dlp

# Verify yt-dlp works
yt-dlp --version
```

### 3.2 First-Time Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/dualsub.git
cd dualsub

# 2. Install all workspace dependencies
npm install

# 3. Copy env template and fill in your DeepL key
cp .env.example .env
# Edit .env: set DEEPL_KEY=your-actual-key

# 4. Create cache directory
mkdir -p backend/cache

# 5. Start both servers
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:3001`

### 3.3 Development Commands

```bash
npm run dev             # Start frontend + backend concurrently
npm run dev -w frontend # Start frontend only
npm run dev -w backend  # Start backend only

npm test                # Run all unit + integration tests
npm run test:e2e        # Run Playwright E2E tests
npm run lint            # ESLint across all workspaces
npm run format          # Prettier write
npm run format:check    # Prettier check (used in CI)
npm run build           # Production build both packages
npm run audit           # npm audit all workspaces
```

---

## 4. CI/CD Pipeline

### 4.1 Pipeline Overview

```
Developer pushes to feature branch
        │
        ▼
GitHub Actions: CI workflow (ci.yml)
├── Lint (ESLint + Prettier check)
├── Unit tests (Vitest + Jest)
├── Integration tests (supertest)
└── Security audit (npm audit)
        │
    All pass?
        │
   NO → Block merge (PR cannot merge)
   YES → PR can be reviewed and merged
        │
        ▼
Developer merges PR to main
        │
        ├──────────────────────────┐
        ▼                          ▼
GitHub Actions:            GitHub Actions:
deploy-fe.yml              deploy-be.yml
└── Vercel CLI deploy      └── Railway redeploy
    (auto via Vercel           (webhook trigger)
     GitHub integration)
        │                          │
        ▼                          ▼
dualsub.app updated        api.dualsub.app updated
```

### 4.2 `ci.yml` — CI Pipeline

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Format check
        run: npm run format:check

      - name: Run frontend tests
        run: npm test -w frontend

      - name: Run backend tests
        run: npm test -w backend
        env:
          NODE_ENV: test
          CACHE_DIR: /tmp/dualsub-test-cache
          DEEPL_KEY: ${{ secrets.DEEPL_KEY_TEST }}

      - name: Security audit
        run: npm run audit
```

### 4.3 `deploy-fe.yml` — Frontend Deploy

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'
      - 'shared/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build -w frontend
        env:
          VITE_API_BASE_URL: https://api.dualsub.app
          VITE_SENTRY_DSN: ${{ secrets.VITE_SENTRY_DSN }}
          VITE_APP_VERSION: ${{ github.sha }}
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: frontend
          vercel-args: '--prod'
```

### 4.4 `deploy-be.yml` — Backend Deploy

```yaml
name: Deploy Backend

on:
  push:
    branches: [main]
    paths:
      - 'backend/**'
      - 'shared/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Trigger Railway deployment
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.RAILWAY_TOKEN }}" \
            "https://backboard.railway.app/graphql/v2" \
            -H "Content-Type: application/json" \
            -d '{"query":"mutation { deploymentTrigger(input: { serviceId: \"${{ secrets.RAILWAY_SERVICE_ID }}\" }) { id } }"}'
```

---

## 5. Hosting Configuration

### 5.1 Vercel (Frontend)

**`/frontend/vercel.json`**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://api.dualsub.app/api/$1" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; frame-src https://www.youtube.com; script-src 'self' 'unsafe-inline' https://www.youtube.com https://www.youtube-nocookie.com; img-src 'self' https://img.youtube.com data:; connect-src 'self' https://api.dualsub.app;"
        }
      ]
    }
  ]
}
```

### 5.2 Railway (Backend)

**`/backend/railway.toml`** (or Nixpacks auto-detect)

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "node server.js"
healthcheckPath = "/health"
healthcheckTimeout = 10
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```

**`/backend/Dockerfile`** (alternative to Nixpacks)

```dockerfile
FROM node:20-slim

# Install Python and yt-dlp
RUN apt-get update && apt-get install -y python3 python3-pip ffmpeg \
    && pip3 install yt-dlp==2024.10.7 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/
RUN npm ci --workspace=backend --workspace=shared

COPY backend/ ./backend/
COPY shared/ ./shared/

EXPOSE 3001
CMD ["node", "backend/server.js"]
```

---

## 6. Secrets Management

### 6.1 Secret Inventory

| Secret | Environment | Where stored |
|---|---|---|
| `DEEPL_KEY` | Production + Staging | Railway environment variables |
| `DEEPL_KEY_TEST` | CI | GitHub Actions secrets |
| `SENTRY_DSN` (backend) | Production | Railway environment variables |
| `VITE_SENTRY_DSN` (frontend) | Production | Vercel environment variables |
| `VERCEL_TOKEN` | CI | GitHub Actions secrets |
| `VERCEL_ORG_ID` | CI | GitHub Actions secrets |
| `VERCEL_PROJECT_ID` | CI | GitHub Actions secrets |
| `RAILWAY_TOKEN` | CI | GitHub Actions secrets |
| `RAILWAY_SERVICE_ID` | CI | GitHub Actions secrets |

### 6.2 Rules

1. No secrets in code, ever
2. No secrets in git history (use `git secret` or rotate if accidentally committed)
3. `.env` files are gitignored at root, frontend, and backend levels
4. Rotate `DEEPL_KEY` if it appears in any log output

---

## 7. Monitoring & Alerting

### 7.1 Health Check

```
GET https://api.dualsub.app/health

Expected response:
  HTTP 200
  { "status": "ok", "uptime": 7200, "version": "1.0.0" }

Polling: Railway health check every 30 seconds
Action on failure: Auto-restart after 3 consecutive failures
```

### 7.2 Error Tracking (Sentry)

- Backend: All unhandled exceptions captured automatically via `@sentry/node`
- Frontend: All unhandled JS errors captured via `@sentry/react`
- Alert: Email notification if error rate exceeds 10 errors/minute

### 7.3 Uptime Monitoring (Optional, V2)

- UptimeRobot or Better Uptime: Monitor `https://dualsub.app` and `https://api.dualsub.app/health` every 5 minutes
- Alert via email if downtime exceeds 2 minutes

---

## 8. Rollback Procedure

### Frontend Rollback (Vercel)

```
1. Open Vercel dashboard → dualsub project → Deployments
2. Find the last known-good deployment
3. Click "..." → "Promote to Production"
4. Confirm — takes effect immediately
```

### Backend Rollback (Railway)

```
1. Open Railway dashboard → dualsub-backend → Deployments
2. Find the last known-good deployment
3. Click "Redeploy" on that version
4. Monitor health check to confirm recovery
```

Target rollback time: **< 5 minutes** for both frontend and backend.
