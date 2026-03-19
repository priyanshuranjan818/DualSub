# Development Phases
# DualSub — German + English Dual Subtitle YouTube Player

**Document Version:** 1.0
**Total MVP Duration:** 4 Weeks
**Sprint Length:** 1 Week

---

## Phase Overview

```
Week 1: Foundation & Backend Core
Week 2: Frontend Core & Integration
Week 3: Translation, Caching & Polish
Week 4: Testing, Security & Deployment
         └── Production Launch
```

---

## Phase 1 — Foundation & Backend Core (Week 1)

**Goal:** A working backend that can extract, parse, and serve German subtitle cues from a YouTube URL. Verifiable via curl or Postman.

### Deliverables

- Monorepo scaffolded with npm workspaces
- Backend Express server running
- yt-dlp integrated and fetching VTT files
- VTT parser producing clean JSON cue arrays
- `POST /api/import` endpoint functional (DE track only)
- `GET /api/subtitles/:videoId/de` returning cue JSON
- `GET /health` returning OK
- File system cache operational
- URL validation and error handling in place
- Basic unit tests for `vttParser` and `urlValidator`

### Task List

| ID | Task | Owner | Complexity | Done? |
|---|---|---|---|---|
| DO-01 | Set up monorepo with npm workspaces | Dev | S | ☐ |
| DO-02 | Configure ESLint + Prettier | Dev | S | ☐ |
| DO-03 | Write `.env.example` | Dev | S | ☐ |
| BE-01 | Scaffold Node.js + Express project | Dev | S | ☐ |
| BE-05 | Implement `GET /health` | Dev | S | ☐ |
| BE-06 | Build `urlValidator` | Dev | S | ☐ |
| BE-07 | Build `ytdlpService` | Dev | M | ☐ |
| BE-08 | Build `vttParser` | Dev | M | ☐ |
| BE-10 | Build `cacheService` | Dev | S | ☐ |
| BE-11 | Build `importService` (DE only for now) | Dev | M | ☐ |
| BE-02 | Implement `POST /api/import` (DE only) | Dev | M | ☐ |
| BE-03 | Implement `GET /api/subtitles/:id/de` | Dev | S | ☐ |
| BE-13 | CORS middleware | Dev | S | ☐ |
| BE-17 | Global error handler | Dev | S | ☐ |
| BE-18 | Env variable validation | Dev | S | ☐ |
| BE-19 | Unit tests: `vttParser` | Dev | M | ☐ |
| BE-20 | Unit tests: `urlValidator` | Dev | S | ☐ |

### End-of-Phase Verification

```bash
# Should return 200 with German cue array
curl -X POST http://localhost:3001/api/import \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=YOUR_TEST_VIDEO_ID"}'

curl http://localhost:3001/api/subtitles/YOUR_TEST_VIDEO_ID/de
```

---

## Phase 2 — Frontend Core & Integration (Week 2)

**Goal:** A working browser interface where users can paste a YouTube link, import it, see the video playing, and read German subtitles in real time. English subtitles show "(translation pending)" as a placeholder.

### Deliverables

- React + Vite + Tailwind project running
- URL input panel with validation
- YouTube IFrame player embedded and functional
- Subtitle overlay rendering German cues
- SubtitleSyncEngine polling and binary searching
- Player controls (Play/Pause, Font Size)
- Error states displayed for all 5 error types
- Frontend connected to backend API
- `AppContext` holding global state
- Unit tests for sync engine and URL validator

### Task List

| ID | Task | Owner | Complexity | Done? |
|---|---|---|---|---|
| FE-01 | Scaffold React + Vite + Tailwind | Dev | S | ☐ |
| FE-09 | Implement `AppContext` | Dev | S | ☐ |
| FE-02 | Build `URLInputPanel` | Dev | S | ☐ |
| FE-14 | Wire up API calls (import + subtitles) | Dev | S | ☐ |
| FE-03 | Integrate YouTube IFrame API | Dev | M | ☐ |
| FE-05 | Implement `SubtitleSyncEngine` | Dev | M | ☐ |
| FE-06 | Connect sync engine to player | Dev | M | ☐ |
| FE-04 | Build `SubtitleOverlay` (DE + EN placeholder) | Dev | M | ☐ |
| FE-07 | Build `PlayerControls` | Dev | S | ☐ |
| FE-10 | Implement all error state UI | Dev | S | ☐ |
| FE-11 | Implement loading/progress states | Dev | S | ☐ |
| FE-13 | Subtitle overlay CSS | Dev | S | ☐ |
| FE-15 | Unit tests: `SubtitleSyncEngine` | Dev | S | ☐ |
| FE-16 | Unit tests: `validateYouTubeUrl` | Dev | S | ☐ |
| FE-17 | Unit tests: `URLInputPanel` | Dev | S | ☐ |

### End-of-Phase Verification

Manual test in browser:
1. Open `http://localhost:5173`
2. Paste a German YouTube cartoon URL
3. Click Import
4. Video loads in the player
5. German subtitle lines appear and change in sync with audio
6. Paste an invalid URL → error message appears

---

## Phase 3 — Translation, Caching & Polish (Week 3)

**Goal:** Full dual-subtitle experience working end-to-end. English translations appear. Settings modal works. Scoring engine runs on import. User experience is polished with all empty/error states handled.

### Deliverables

- English translation via DeepL integrated
- EN subtitle track fetched if available, translated if not
- `GET /api/subtitles/:id/en` returning cue JSON
- Translation quality badge shown on video title
- Scoring engine (sync + quality + translation scores) operational
- Scores stored in meta.json and exposed via `/api/meta`
- Settings modal (overlay opacity, flag toggle)
- Subtitle toggles (DE on/off, EN on/off) working
- Translation "auto-translated" badge shown in UI
- All test cases from user stories passing manually
- E2E test written for full import → watch flow

### Task List

| ID | Task | Owner | Complexity | Done? |
|---|---|---|---|---|
| BE-09 | Build `translatorService` (DeepL, batched) | Dev | M | ☐ |
| BE-11 | Update `importService` to include translation | Dev | M | ☐ |
| BE-02 | Update `POST /api/import` to include EN handling | Dev | S | ☐ |
| BE-03 | Add `GET /api/subtitles/:id/en` | Dev | S | ☐ |
| BE-04 | Implement `GET /api/meta/:videoId` | Dev | S | ☐ |
| BE-12 | Build scoring engine | Dev | M | ☐ |
| BE-14 | Rate limiting middleware | Dev | S | ☐ |
| BE-15 | Request body size limit | Dev | S | ☐ |
| BE-16 | Structured logging (pino) | Dev | S | ☐ |
| BE-21 | Unit tests: `translatorService` | Dev | M | ☐ |
| FE-04 | Update `SubtitleOverlay` with real EN cues | Dev | S | ☐ |
| FE-08 | Build `SettingsModal` | Dev | S | ☐ |
| FE-12 | Responsive layout for desktop | Dev | S | ☐ |
| FE-18 | E2E test: import + subtitle display (Playwright) | Dev | M | ☐ |

### End-of-Phase Verification

Manual test in browser:
1. Import a German cartoon that has no English track
2. Both DE and EN subtitles appear and sync
3. "Auto-translated" badge appears briefly
4. Toggle EN subtitles off → only DE line shows
5. Change font size to Large → subtitle text gets bigger
6. Import same video again → loads instantly (cache hit)

---

## Phase 4 — Testing, Security & Deployment (Week 4)

**Goal:** Production-ready application deployed to live URLs with security hardened, all tests passing, CI/CD operational, legal pages live, and rollback tested.

### Deliverables

- All unit and integration tests passing in CI
- Sentry error tracking configured
- Security hardening complete (CORS, rate limits, HSTS, CSP)
- Frontend deployed to `https://dualsub.app` (Vercel)
- Backend deployed to `https://api.dualsub.app` (Railway)
- Custom domains and SSL certificates active
- Health check monitored
- Privacy Policy and Terms of Use pages live
- README updated with full setup instructions
- Production launch checklist completed

### Task List

| ID | Task | Owner | Complexity | Done? |
|---|---|---|---|---|
| BE-22 | Integration tests: `POST /api/import` | Dev | M | ☐ |
| BE-23 | Integration tests: `GET /api/subtitles` | Dev | S | ☐ |
| BE-24 | Configure Railway deployment | Dev | M | ☐ |
| BE-25 | Ensure yt-dlp in prod container | Dev | M | ☐ |
| DO-04 | GitHub Actions CI pipeline | Dev | M | ☐ |
| DO-05 | Vercel auto-deploy | Dev | S | ☐ |
| DO-06 | Railway auto-deploy | Dev | S | ☐ |
| DO-07 | Railway persistent volume | Dev | S | ☐ |
| DO-08 | Custom domains | Dev | S | ☐ |
| DO-09 | HTTPS configuration | Dev | S | ☐ |
| DO-10 | Sentry error tracking | Dev | S | ☐ |
| DO-11 | README | Dev | S | ☐ |
| FE-19 | Privacy Policy page | Dev | S | ☐ |
| FE-20 | Terms of Use page | Dev | S | ☐ |
| FE-21 | Vite production build config | Dev | S | ☐ |
| FE-22 | Vercel deployment config | Dev | S | ☐ |
| — | Production launch checklist review | Dev | S | ☐ |
| — | Smoke test on production URLs | Dev | S | ☐ |
| — | Rollback procedure test | Dev | S | ☐ |

### End-of-Phase Verification

Production smoke test:
1. Open `https://dualsub.app` — page loads in < 3s
2. Import a German cartoon URL — works end-to-end
3. Both DE and EN subtitles display correctly
4. Import an invalid URL → error message shown
5. Check `https://api.dualsub.app/health` → `{ "status": "ok" }`
6. Check Sentry dashboard — no unhandled errors
7. Check Lighthouse score ≥ 85

---

## Post-MVP Roadmap (V2 — Planned)

| Feature | Target quarter |
|---|---|
| Mobile responsive layout | Q1 post-launch |
| Saved video list (localStorage) | Q1 post-launch |
| Per-word translation popup | Q2 post-launch |
| Custom SRT/VTT file upload | Q2 post-launch |
| Shareable pre-loaded links | Q2 post-launch |
| User accounts (optional) | Q3 post-launch |
| Redis caching layer | Q3 post-launch |
| Multi-language subtitles (3+) | Q4 post-launch |

---

## Milestone Summary

| Milestone | Target | Criteria |
|---|---|---|
| M1: Backend working | End of Week 1 | curl returns German cue JSON |
| M2: Frontend working | End of Week 2 | Browser shows DE subtitles synced to video |
| M3: Full dual-subtitle | End of Week 3 | Both DE + EN show, translation works, settings work |
| M4: Production launch | End of Week 4 | Live on dualsub.app, all tests passing, Sentry live |
