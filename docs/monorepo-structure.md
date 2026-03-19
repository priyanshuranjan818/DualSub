# Monorepo Structure
# DualSub — German + English Dual Subtitle YouTube Player

**Document Version:** 1.0
**Package manager:** npm workspaces
**Node version:** 20 LTS

---

## 1. Overview

DualSub is organised as a **monorepo** using npm workspaces. Both the `frontend` and `backend` packages live in a single Git repository with shared tooling (linting, formatting, CI configuration) at the root.

```
dualsub/                          ← Git repository root
├── package.json                  ← Root workspace config + shared scripts
├── .npmrc                        ← npm workspace settings
├── .nvmrc                        ← Node version pin (20)
├── .gitignore
├── .eslintrc.json                ← Shared ESLint config
├── .prettierrc                   ← Shared Prettier config
├── README.md
│
├── frontend/                     ← React SPA (Vite)
│   └── ...
│
├── backend/                      ← Node.js + Express API
│   └── ...
│
├── shared/                       ← Shared types + utilities
│   └── ...
│
├── docs/                         ← All project documentation
│   └── ...
│
└── .github/
    └── workflows/                ← CI/CD pipeline definitions
        └── ...
```

---

## 2. Root Package Configuration

**`/package.json`**

```json
{
  "name": "dualsub",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "frontend",
    "backend",
    "shared"
  ],
  "scripts": {
    "dev":          "concurrently \"npm run dev -w frontend\" \"npm run dev -w backend\"",
    "build":        "npm run build -w frontend && npm run build -w backend",
    "test":         "npm run test -w frontend && npm run test -w backend",
    "test:e2e":     "npm run test:e2e -w frontend",
    "lint":         "eslint . --ext .js,.jsx,.ts,.tsx",
    "format":       "prettier --write .",
    "format:check": "prettier --check .",
    "audit":        "npm audit --workspaces"
  },
  "devDependencies": {
    "concurrently":   "^8.0.0",
    "eslint":         "^8.0.0",
    "prettier":       "^3.0.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "npm":  ">=9.0.0"
  }
}
```

---

## 3. Frontend Package

**`/frontend/`** — React 18 + Vite SPA

```
frontend/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── index.html
│
├── public/
│   └── favicon.ico
│
├── src/
│   ├── main.jsx                    ← React app entry point
│   ├── App.jsx                     ← Root component + router
│   │
│   ├── context/
│   │   └── AppContext.jsx          ← Global state (videoId, cues, settings)
│   │
│   ├── components/
│   │   ├── Header/
│   │   │   ├── Header.jsx
│   │   │   └── Header.test.jsx
│   │   ├── URLInputPanel/
│   │   │   ├── URLInputPanel.jsx
│   │   │   ├── URLInput.jsx
│   │   │   ├── ImportButton.jsx
│   │   │   ├── StatusMessage.jsx
│   │   │   └── URLInputPanel.test.jsx
│   │   ├── VideoSection/
│   │   │   ├── VideoSection.jsx
│   │   │   ├── VideoPlayer.jsx     ← YouTube IFrame API wrapper
│   │   │   ├── SubtitleOverlay.jsx
│   │   │   ├── GermanLine.jsx
│   │   │   ├── EnglishLine.jsx
│   │   │   └── VideoSection.test.jsx
│   │   ├── PlayerControls/
│   │   │   ├── PlayerControls.jsx
│   │   │   ├── PlayPauseButton.jsx
│   │   │   ├── FontSizeToggle.jsx
│   │   │   ├── SubtitleToggle.jsx
│   │   │   └── PlayerControls.test.jsx
│   │   └── SettingsModal/
│   │       ├── SettingsModal.jsx
│   │       └── SettingsModal.test.jsx
│   │
│   ├── hooks/
│   │   ├── useYouTubePlayer.js     ← YouTube IFrame API hook
│   │   ├── useSubtitleSync.js      ← Polling + cue matching hook
│   │   └── useImport.js            ← API call + state management
│   │
│   ├── services/
│   │   └── api.js                  ← fetch wrappers for backend API
│   │
│   ├── engine/
│   │   └── SubtitleSyncEngine.js   ← Sync engine class (no React deps)
│   │
│   ├── utils/
│   │   ├── validateYouTubeUrl.js
│   │   └── formatTime.js
│   │
│   └── styles/
│       └── global.css              ← Tailwind directives + custom vars
│
└── tests/
    └── e2e/
        ├── import.spec.js          ← Playwright E2E: import a video
        └── subtitles.spec.js       ← Playwright E2E: subtitle display
```

**`/frontend/package.json`**

```json
{
  "name": "@dualsub/frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev":      "vite",
    "build":    "vite build",
    "preview":  "vite preview",
    "test":     "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "react":      "^18.2.0",
    "react-dom":  "^18.2.0",
    "@dualsub/shared": "*"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "autoprefixer":         "^10.0.0",
    "postcss":              "^8.0.0",
    "tailwindcss":          "^3.0.0",
    "vite":                 "^5.0.0",
    "vitest":               "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@playwright/test":     "^1.40.0",
    "jsdom":                "^24.0.0"
  }
}
```

---

## 4. Backend Package

**`/backend/`** — Node.js + Express API

```
backend/
├── package.json
├── server.js                       ← App entry point (starts Express)
├── app.js                          ← Express app setup (for testing)
│
├── config/
│   └── index.js                    ← Reads + validates env variables
│
├── middleware/
│   ├── cors.js                     ← CORS policy
│   ├── rateLimit.js                ← express-rate-limit config
│   ├── requestLogger.js            ← Structured JSON logging
│   └── errorHandler.js             ← Global error handler middleware
│
├── routes/
│   ├── health.js                   ← GET /health
│   ├── import.js                   ← POST /api/import
│   ├── subtitles.js                ← GET /api/subtitles/:videoId/:lang
│   └── meta.js                     ← GET /api/meta/:videoId
│
├── services/
│   ├── importService.js            ← Orchestrates import pipeline
│   ├── ytdlpService.js             ← yt-dlp subprocess wrapper
│   ├── vttParser.js                ← VTT → JSON cue array
│   ├── translatorService.js        ← DeepL / LibreTranslate calls
│   └── cacheService.js             ← File system read/write
│
├── validators/
│   ├── urlValidator.js             ← YouTube URL regex + videoId extract
│   └── videoIdValidator.js         ← videoId format check
│
├── utils/
│   ├── logger.js                   ← Structured JSON logger (pino)
│   └── errors.js                   ← Custom error classes
│
├── cache/                          ← Runtime subtitle cache (gitignored)
│   └── .gitkeep
│
└── tests/
    ├── unit/
    │   ├── vttParser.test.js
    │   ├── urlValidator.test.js
    │   └── translatorService.test.js
    └── integration/
        ├── import.test.js
        └── subtitles.test.js
```

**`/backend/package.json`**

```json
{
  "name": "@dualsub/backend",
  "version": "1.0.0",
  "private": true,
  "main": "server.js",
  "scripts": {
    "dev":   "nodemon server.js",
    "start": "node server.js",
    "test":  "jest --runInBand",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "express":            "^5.0.0",
    "cors":               "^2.8.5",
    "express-rate-limit": "^7.0.0",
    "pino":               "^8.0.0",
    "pino-pretty":        "^10.0.0",
    "node-fetch":         "^3.0.0",
    "@dualsub/shared":    "*"
  },
  "devDependencies": {
    "nodemon":    "^3.0.0",
    "jest":       "^29.0.0",
    "supertest":  "^6.0.0"
  }
}
```

---

## 5. Shared Package

**`/shared/`** — Types and utilities shared by both frontend and backend

```
shared/
├── package.json
└── src/
    ├── types/
    │   ├── Cue.js           ← Cue object type definition + JSDoc
    │   ├── VideoMeta.js     ← Video metadata type
    │   └── ApiTypes.js      ← Request/response type definitions
    └── constants/
        ├── errors.js        ← Shared error code constants
        └── langs.js         ← Supported language codes
```

**`/shared/package.json`**

```json
{
  "name": "@dualsub/shared",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.js",
  "scripts": {
    "test": "echo 'No tests in shared package'"
  }
}
```

---

## 6. Documentation Directory

**`/docs/`** — All project documentation files

```
docs/
├── Architecture.md
├── MVP Tech Doc.md
├── PRD.md
├── System Design.md
├── production-requirements.md
├── user-stories-and-acceptance-criteria.md
├── information-architecture.md
├── system-architecture.md
├── database-schema.md
├── api-contract.md
├── monorepo-structure.md              ← This file
├── scoring-engine-spec.md
├── engineering-scope-definition.md
├── development-phases.md
├── environment-and-devops.md
└── testing-strategy.md
```

---

## 7. CI/CD Directory

**`/.github/workflows/`**

```
.github/
└── workflows/
    ├── ci.yml           ← Runs on every push: lint + test + audit
    ├── deploy-fe.yml    ← Deploys frontend to Vercel on push to main
    └── deploy-be.yml    ← Deploys backend to Railway on push to main
```

---

## 8. Root-Level Configuration Files

| File | Purpose |
|---|---|
| `.gitignore` | Ignores `node_modules/`, `cache/`, `.env`, `dist/`, `.vite/` |
| `.nvmrc` | Pins Node.js to `20` |
| `.npmrc` | `workspaces=true` |
| `.eslintrc.json` | ESLint: React + Node rules, no unused vars, no console in prod |
| `.prettierrc` | 2-space indent, single quotes, trailing commas, 100 char line width |
| `README.md` | Project overview, quick start guide, env var reference |
| `.env.example` | Template for required environment variables (no real values) |

---

## 9. Development Commands

```bash
# Clone and install all workspaces
git clone https://github.com/your-org/dualsub.git
cd dualsub
npm install

# Start both frontend and backend in dev mode
npm run dev

# Run all tests across all workspaces
npm test

# Lint all files
npm run lint

# Format all files
npm run format

# Check for security vulnerabilities
npm run audit

# Build for production
npm run build

# Run E2E tests only
npm run test:e2e
```

---

## 10. Environment Variable Files

| File | Location | Purpose |
|---|---|---|
| `.env.example` | Root | Template showing all required variables |
| `.env` | Root (gitignored) | Local development secrets |
| `backend/.env` | Backend (gitignored) | Backend-specific local overrides |

All environment variables are documented in `environment-and-devops.md`.
