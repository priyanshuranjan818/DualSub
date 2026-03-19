# Production Requirements
# DualSub — German + English Dual Subtitle YouTube Player

**Document Version:** 1.0
**Project:** DualSub
**Status:** Approved for Development

---

## 1. Purpose

This document defines all requirements that must be satisfied before DualSub can be considered production-ready and deployed to a live public environment. It covers functional completeness, performance benchmarks, security hardening, infrastructure readiness, observability, and legal compliance.

---

## 2. Functional Completeness Requirements

All of the following features must be implemented, tested, and verified before production deployment.

### 2.1 Core Features (P0 — Launch Blockers)

| ID | Feature | Acceptance Condition |
|---|---|---|
| PRD-F01 | YouTube URL import | User can paste any valid youtube.com or youtu.be URL and trigger import |
| PRD-F02 | Subtitle extraction | Backend extracts German VTT track via yt-dlp for ≥80% of public YouTube videos |
| PRD-F03 | English translation fallback | When no EN track exists, DeepL translates all DE cues to EN automatically |
| PRD-F04 | Dual subtitle overlay | German cue displays on line 1, English cue on line 2, both synced to video |
| PRD-F05 | Sync accuracy | Subtitle timing offset must be ≤ ±0.5 seconds from audio for 95% of cues |
| PRD-F06 | Video playback | YouTube IFrame player loads, plays, pauses, and seeks correctly |
| PRD-F07 | Subtitle caching | Re-importing the same video ID does not re-trigger yt-dlp or DeepL |
| PRD-F08 | Error messaging | All error states display user-readable messages (not raw stack traces) |
| PRD-F09 | Font size control | Users can toggle between Small, Medium, Large subtitle sizes |
| PRD-F10 | Subtitle toggle | Users can independently show/hide DE and EN subtitle lines |

### 2.2 Nice-to-Have Features (P1 — Post-Launch)

These are NOT launch blockers but are planned for V2:

- Video history / saved list (US-07)
- Per-word translation popup on subtitle click (US-09)
- Custom SRT/VTT file upload (US-10)
- Shareable teacher links (US-11)
- Mobile-responsive layout

---

## 3. Performance Requirements

| Metric | Target | Measurement Method |
|---|---|---|
| End-to-end import time (cached) | < 2 seconds | Frontend timer from click to player ready |
| End-to-end import time (new video, no EN track) | < 30 seconds | Frontend timer, includes translation |
| Subtitle render latency | < 50ms after cue becomes active | Browser DevTools performance trace |
| API response time (subtitles endpoint) | < 500ms p95 | Server-side timing logs |
| Frontend initial page load (Lighthouse) | ≥ 85 Performance score | Lighthouse CI in CI pipeline |
| Time to Interactive (TTI) | < 3 seconds on 4G | Lighthouse CI |
| Translation throughput | ≥ 50 cues/second | Load test with representative VTT file |

---

## 4. Reliability Requirements

| Requirement | Target |
|---|---|
| Import success rate for public YouTube videos | ≥ 80% |
| Service uptime (monthly) | ≥ 99.5% |
| Backend crash recovery | Auto-restart within 30 seconds (Railway health check) |
| DeepL fallback handling | If DeepL fails, return DE-only with graceful UI message |
| yt-dlp version pinning | Must be pinned to a tested version; auto-update disabled in prod |

---

## 5. Security Requirements

### 5.1 Input Validation

- All YouTube URLs must be validated against the regex pattern before backend processing:
  ```
  ^https?://(www\.)?(youtube\.com/watch\?v=|youtu\.be/)[A-Za-z0-9_-]{11}(\&.*)?$
  ```
- Video IDs used in file paths must be sanitized to `[A-Za-z0-9_-]{11}` only to prevent path traversal
- Request body size limit: 1KB max for `/api/import`

### 5.2 Process Security

- yt-dlp must be invoked via `execFile` (not `exec`) with arguments as an array — never string interpolation
- yt-dlp process must run with minimum filesystem permissions (read/write to `/cache` only)
- Maximum VTT file size accepted: 5MB; files exceeding this are rejected with HTTP 413

### 5.3 Network Security

- All production traffic must be served over HTTPS (TLS 1.2+)
- CORS must be restricted to the known frontend origin (`https://dualsub.app`)
- HTTP Strict Transport Security (HSTS) header must be set on backend responses
- Content-Security-Policy header must be set on frontend (allowing YouTube IFrame)

### 5.4 Rate Limiting

- `/api/import`: 10 requests per IP per hour
- `/api/subtitles/:id/:lang`: 60 requests per IP per minute
- Violations return HTTP 429 with `Retry-After` header

### 5.5 Secret Management

- `DEEPL_KEY` must never be committed to version control
- Secrets must be stored in Railway environment variables only
- `.env.example` must contain placeholder values, never real keys

---

## 6. Observability Requirements

### 6.1 Logging

- All import requests must be logged with: timestamp, videoId, IP hash (not raw IP), result (success/error), duration
- All yt-dlp errors must be logged with: stderr output, videoId, timestamp
- All translation requests must be logged with: videoId, cue count, duration, success/fail
- Logs must be structured JSON (compatible with Railway log viewer)

### 6.2 Error Tracking

- Unhandled backend exceptions must be captured and reported (Sentry free tier or Railway built-in)
- Frontend JS errors must be captured (Sentry or equivalent)
- Alert must trigger if import error rate exceeds 50% over a 10-minute window

### 6.3 Health Check

- Backend must expose `GET /health` returning `{ "status": "ok", "uptime": <seconds> }`
- Railway must be configured to poll `/health` every 30 seconds and restart on failure

---

## 7. Infrastructure Requirements

| Component | Production Specification |
|---|---|
| Frontend hosting | Vercel (Hobby or Pro plan) |
| Backend hosting | Railway Starter plan (512MB RAM, shared CPU) |
| Backend persistent storage | Railway Persistent Volume, min 1GB |
| Python runtime | Python 3.11+ with yt-dlp installed |
| Node.js runtime | Node.js 20 LTS |
| Custom domain | `dualsub.app` (frontend), `api.dualsub.app` (backend) |
| SSL certificates | Auto-provisioned via Vercel / Railway |
| CDN | Vercel Edge Network (frontend assets) |

---

## 8. Build & Deployment Requirements

- CI/CD pipeline must run on every push to `main` branch
- All tests must pass before deployment proceeds
- Frontend must be built with `vite build` and output audited for bundle size (< 500KB gzipped)
- Backend must pass `npm audit` with zero high/critical vulnerabilities
- Zero-downtime deployment must be supported (Railway rolling deploys)
- Rollback must be possible within 5 minutes via Railway dashboard

---

## 9. Browser Compatibility Requirements

| Browser | Minimum Version | Required |
|---|---|---|
| Google Chrome | 110+ | Yes |
| Mozilla Firefox | 110+ | Yes |
| Microsoft Edge | 110+ | Yes |
| Safari | 16+ | Nice to have |
| Mobile Chrome/Safari | — | Post-MVP |

---

## 10. Accessibility Requirements

- Subtitle text must have minimum **4.5:1** contrast ratio against overlay background (WCAG AA)
- Import button must be keyboard-accessible (focusable, Enter triggers import)
- Error messages must be announced to screen readers via ARIA live regions
- All interactive controls must have visible focus indicators

---

## 11. Legal & Compliance Requirements

- DualSub does not download, store, or re-serve YouTube video content — it only embeds via the YouTube IFrame API, which is compliant with YouTube's Terms of Service
- Subtitle data fetched by yt-dlp is used only for display purposes and is not redistributed
- No personally identifiable information (PII) is collected, stored, or transmitted
- A Privacy Policy page must be live at `/privacy` before public launch, stating: no user tracking, no cookies, no account data
- A Terms of Use page must be live at `/terms` before public launch
- The app must display a disclaimer that it is not affiliated with YouTube or Google

---

## 12. Production Launch Checklist

- [ ] All P0 features implemented and passing acceptance tests
- [ ] Performance targets met (Lighthouse ≥ 85, import < 30s)
- [ ] Security review completed (input validation, rate limiting, CORS, HTTPS)
- [ ] All secrets stored in environment variables, not in code
- [ ] Health check endpoint live and monitored
- [ ] Error tracking (Sentry or equivalent) configured
- [ ] Custom domain configured with SSL
- [ ] Privacy Policy and Terms of Use pages live
- [ ] YouTube API Terms of Service compliance verified
- [ ] Rollback procedure tested
- [ ] README updated with deployment instructions
