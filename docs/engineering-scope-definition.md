# Engineering Scope Definition
# DualSub — German + English Dual Subtitle YouTube Player

**Document Version:** 1.0

---

## 1. Purpose

This document precisely defines what engineering work is **in scope** and **out of scope** for the DualSub MVP. It is the source of truth for sprint planning and prevents scope creep. Any feature not listed under "In Scope" requires a formal change request.

---

## 2. In Scope — MVP Engineering Work

### 2.1 Frontend

| # | Task | Complexity |
|---|---|---|
| FE-01 | Scaffold React 18 + Vite + Tailwind project | S |
| FE-02 | Implement `URLInputPanel` with regex validation | S |
| FE-03 | Integrate YouTube IFrame Player API | M |
| FE-04 | Build `SubtitleOverlay` component (DE + EN lines) | M |
| FE-05 | Implement `SubtitleSyncEngine` with binary search | M |
| FE-06 | Connect sync engine to YouTube player time events | M |
| FE-07 | Build `PlayerControls` (Play/Pause, Font Size, Toggles) | S |
| FE-08 | Build `SettingsModal` (overlay opacity, flag toggle) | S |
| FE-09 | Implement `AppContext` for global state | S |
| FE-10 | Implement all error state UI (5 error types) | S |
| FE-11 | Implement loading/progress states for import | S |
| FE-12 | Apply responsive layout for desktop (min 1024px) | S |
| FE-13 | Subtitle overlay CSS (positioning, fonts, pill BG) | S |
| FE-14 | Integrate `/api/import` and `/api/subtitles` API calls | S |
| FE-15 | Unit tests for `SubtitleSyncEngine` | S |
| FE-16 | Unit tests for `validateYouTubeUrl` | S |
| FE-17 | Unit tests for `URLInputPanel` component | S |
| FE-18 | E2E test: import video + subtitle display (Playwright) | M |
| FE-19 | Build Privacy Policy page (`/privacy`) | S |
| FE-20 | Build Terms of Use page (`/terms`) | S |
| FE-21 | Configure Vite for production build | S |
| FE-22 | Configure Vercel deployment | S |

**Total frontend tasks: 22**

---

### 2.2 Backend

| # | Task | Complexity |
|---|---|---|
| BE-01 | Scaffold Node.js + Express 5 project | S |
| BE-02 | Implement `POST /api/import` route | M |
| BE-03 | Implement `GET /api/subtitles/:videoId/:lang` route | S |
| BE-04 | Implement `GET /api/meta/:videoId` route | S |
| BE-05 | Implement `GET /health` route | S |
| BE-06 | Build `urlValidator` (regex + videoId extraction) | S |
| BE-07 | Build `ytdlpService` (execFile wrapper, timeout, error handling) | M |
| BE-08 | Build `vttParser` (VTT → JSON cue array, tag stripping, deduplication) | M |
| BE-09 | Build `translatorService` (DeepL Free API, batched, 50 cues/chunk) | M |
| BE-10 | Build `cacheService` (read/write JSON files, cache-hit detection) | S |
| BE-11 | Build `importService` (pipeline orchestrator) | M |
| BE-12 | Build scoring engine (`syncScore`, `qualityScore`, `translationScore`) | M |
| BE-13 | CORS middleware (restrict to frontend origin) | S |
| BE-14 | Rate limiting middleware (express-rate-limit) | S |
| BE-15 | Request body size limit (1KB) | S |
| BE-16 | Structured JSON logging (pino) | S |
| BE-17 | Global error handler middleware (no stack traces in prod) | S |
| BE-18 | Environment variable validation (fail-fast on startup) | S |
| BE-19 | Unit tests for `vttParser` | M |
| BE-20 | Unit tests for `urlValidator` | S |
| BE-21 | Unit tests for `translatorService` (mocked DeepL) | M |
| BE-22 | Integration tests for `POST /api/import` (supertest) | M |
| BE-23 | Integration tests for `GET /api/subtitles` (supertest) | S |
| BE-24 | Configure Railway deployment (Dockerfile or nixpacks) | M |
| BE-25 | Ensure yt-dlp is available in production container | M |

**Total backend tasks: 25**

---

### 2.3 Shared / DevOps

| # | Task | Complexity |
|---|---|---|
| DO-01 | Set up monorepo with npm workspaces | S |
| DO-02 | Configure ESLint + Prettier | S |
| DO-03 | Write `.env.example` with all required variables | S |
| DO-04 | Set up GitHub Actions CI pipeline (lint + test on PR) | M |
| DO-05 | Set up Vercel auto-deploy on push to main | S |
| DO-06 | Set up Railway auto-deploy on push to main | S |
| DO-07 | Configure Railway persistent volume for `/cache` | S |
| DO-08 | Configure custom domains (dualsub.app, api.dualsub.app) | S |
| DO-09 | Configure HTTPS (TLS via Vercel + Railway) | S |
| DO-10 | Set up Sentry error tracking (frontend + backend) | S |
| DO-11 | Write README with setup instructions | S |

**Total DevOps tasks: 11**

---

## 3. Out of Scope — MVP

These items are explicitly excluded from the MVP. They are candidates for V2.

### 3.1 User Features (Post-MVP)

| Feature | Why deferred |
|---|---|
| User accounts / authentication | Adds DB + auth complexity; not needed for core use case |
| Saved video list / history | Requires user accounts or localStorage persistence |
| Per-word translation popup | Requires word tokenisation + dictionary API |
| Custom SRT/VTT file upload | Additional file handling + parser complexity |
| Shareable pre-loaded links | Requires URL state management + V2 routing |
| Playlist / video queue | Requires state management overhaul |
| Mobile layout (< 1024px) | CSS responsive work deferred to V2 |
| Offline/PWA mode | Service workers + cache strategy out of MVP scope |
| More than 2 subtitle languages | Architecture supports it, but UI/UX not designed yet |
| Video history analytics | No tracking in MVP |

### 3.2 Technical Features (Post-MVP)

| Feature | Why deferred |
|---|---|
| Redis caching layer | File system cache is sufficient for MVP traffic |
| Job queue for translations (BullMQ) | Synchronous translation is acceptable for MVP volumes |
| Database (SQLite/PostgreSQL) | File system storage is sufficient for MVP |
| CDN for subtitle delivery | Not needed until scale demands it |
| Multi-region backend | Single Railway region is sufficient for MVP |
| A/B testing framework | Not needed until product has users |
| Translation quality fallback to LibreTranslate | DeepL free tier is sufficient for MVP |
| Automatic yt-dlp update mechanism | Manual version pin is acceptable |
| LRU cache eviction | Manual cache management acceptable for MVP |

### 3.3 Infrastructure (Post-MVP)

| Feature | Why deferred |
|---|---|
| Kubernetes / container orchestration | Railway provides sufficient hosting for MVP |
| CI performance metrics (Lighthouse CI gate) | Added in V2 after baseline established |
| Load testing with k6 | Deferred until scale requirements are clearer |
| Automated cache backup | Not needed for MVP (subtitles can be re-imported) |

---

## 4. Complexity Key

| Size | Definition | Estimated Effort |
|---|---|---|
| S (Small) | Straightforward implementation, < 2 hours | 1 story point |
| M (Medium) | Requires design decisions or integration work, 2–6 hours | 3 story points |
| L (Large) | Complex, multi-component, > 6 hours | 5 story points |

---

## 5. Story Point Summary

| Area | S tasks | M tasks | L tasks | Total points |
|---|---|---|---|---|
| Frontend | 16 × 1 | 6 × 3 | 0 | 34 |
| Backend | 14 × 1 | 11 × 3 | 0 | 47 |
| DevOps | 10 × 1 | 1 × 3 | 0 | 13 |
| **Total** | | | | **94** |

At a velocity of ~25 story points per week with one developer, MVP scope is achievable in **4 weeks**.

---

## 6. Dependencies & Risks

| Dependency | Risk | Mitigation |
|---|---|---|
| yt-dlp availability | YouTube may change how subtitles are served, breaking yt-dlp | Pin yt-dlp to a known-working version; monitor yt-dlp release notes |
| DeepL Free API | 500k char/month limit may be hit in testing | Track usage; use dummy data for most tests |
| YouTube IFrame API | API policies may change | No mitigation; this is a fundamental dependency |
| Railway persistent volume | Data lost if volume is not configured correctly | Test volume mounting in staging before production deploy |
| YouTube Terms of Service | App may violate TOS if it stores video content | DualSub never stores video content — only subtitle text |

---

## 7. Definition of Done

A task is considered **Done** when:

1. Code is written and committed to a feature branch
2. Unit tests pass for the changed code
3. PR is reviewed and approved (or self-reviewed with checklist)
4. Merged to `main` without breaking CI
5. No console.error or unhandled promise rejections in local testing
6. Acceptance criteria from the corresponding user story are met
