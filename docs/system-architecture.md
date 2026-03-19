# System Architecture
# DualSub — German + English Dual Subtitle YouTube Player

**Document Version:** 1.0

---

## 1. Architecture Overview

DualSub is a two-tier client-server web application. The **React frontend** serves as the presentation and orchestration layer; the **Node.js backend** serves as the data acquisition and processing layer. There is no database server in the MVP — all persistent data is stored as JSON files on disk.

```
┌──────────────────────────────────────────────────────────────────────┐
│                          PUBLIC INTERNET                             │
│                                                                      │
│  ┌──────────────────┐         ┌──────────────────────────────────┐   │
│  │   User Browser   │         │    YouTube CDN / Servers          │   │
│  │  (React SPA)     │         │  (video stream + subtitle data)   │   │
│  └────────┬─────────┘         └──────────────────────────────────┘   │
│           │                              ▲                           │
│           │  HTTPS REST API              │ YouTube IFrame embeds     │
│           ▼                              │ video stream directly     │
│  ┌──────────────────┐                   │                           │
│  │  Vercel Edge CDN │                   │                           │
│  │  (static assets) │                   │                           │
│  └────────┬─────────┘                   │                           │
│           │  API proxy                  │                           │
│           ▼                             │                           │
│  ┌──────────────────────────────────────┴──────────────────────┐    │
│  │                  Railway (Backend Server)                    │    │
│  │                                                              │    │
│  │  ┌────────────────────────────────────────────────────────┐ │    │
│  │  │              Node.js + Express (Port 3001)             │ │    │
│  │  │                                                        │ │    │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │ │    │
│  │  │  │ Import      │  │ Subtitles   │  │  Health      │  │ │    │
│  │  │  │ Router      │  │ Router      │  │  Router      │  │ │    │
│  │  │  └──────┬──────┘  └──────┬──────┘  └──────────────┘  │ │    │
│  │  │         │                │                             │ │    │
│  │  │  ┌──────▼──────────────────────────────────────────┐  │ │    │
│  │  │  │              Service Layer                       │  │ │    │
│  │  │  │  ytdlpService │ vttParser │ translator │ cache   │  │ │    │
│  │  │  └──────┬────────────────────────┬────────────────┘  │ │    │
│  │  │         │                         │                   │ │    │
│  │  │  ┌──────▼──────┐         ┌────────▼──────────┐       │ │    │
│  │  │  │  yt-dlp     │         │  DeepL Free API   │       │ │    │
│  │  │  │  (Python    │         │  (external HTTPS) │       │ │    │
│  │  │  │  subprocess)│         └───────────────────┘       │ │    │
│  │  │  └──────┬──────┘                                     │ │    │
│  │  │         │                                             │ │    │
│  │  │  ┌──────▼──────────────────────────────────────────┐ │ │    │
│  │  │  │        Persistent Volume /cache                  │ │ │    │
│  │  │  │   {videoId}/meta.json                            │ │ │    │
│  │  │  │   {videoId}/subtitles.de.json                    │ │ │    │
│  │  │  │   {videoId}/subtitles.en.json                    │ │ │    │
│  │  │  └─────────────────────────────────────────────────┘ │ │    │
│  │  └────────────────────────────────────────────────────┘  │ │    │
│  └──────────────────────────────────────────────────────────┘ │    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Architecture

### 2.1 Technology

- **Framework:** React 18 with functional components and hooks
- **Build tool:** Vite 5
- **Styling:** Tailwind CSS 3
- **State management:** React `useState` + `useContext` (no Redux for MVP)
- **HTTP client:** Native `fetch` API

### 2.2 Component Architecture

```
App (root)
│
├── <AppContextProvider>        ← Global state store
│     ├── videoId
│     ├── videoTitle
│     ├── deCues / enCues
│     ├── importStatus
│     └── settings (fontSize, showDe, showEn)
│
├── <Header>
│   └── <SettingsButton>
│
├── <URLInputPanel>
│   ├── <URLInput>              ← Controlled input, validates on change
│   ├── <ImportButton>          ← Disabled during loading, triggers import
│   └── <StatusMessage>         ← Error / loading / success messages
│
├── <VideoSection>              ← Only renders when videoId is set
│   ├── <VideoPlayer>           ← YouTube IFrame API wrapper
│   │   └── [YouTube IFrame]
│   └── <SubtitleOverlay>       ← Positioned over video
│       ├── <GermanLine>        ← Conditional on showDe + activeDeCue
│       └── <EnglishLine>       ← Conditional on showEn + activeEnCue
│
├── <PlayerControls>            ← Only renders when playerReady
│   ├── <PlayPauseButton>
│   ├── <FontSizeToggle>        ← S / M / L buttons
│   └── <SubtitleToggle>        ← DE ON/OFF + EN ON/OFF
│
├── <SettingsModal>             ← Conditional render, modal overlay
│
└── <Footer>
    └── Legal links
```

### 2.3 Data Flow (Frontend)

```
URL pasted by user
       │
       ▼
URLInputPanel validates → dispatches importVideo(url)
       │
       ▼
AppContext: importStatus = 'loading'
       │
       ▼
fetch POST /api/import → receive { videoId, title, hasDe, hasEn }
       │
       ▼
fetch GET /api/subtitles/:id/de → deCues[]
fetch GET /api/subtitles/:id/en → enCues[]
       │
       ▼
AppContext: deCues, enCues, videoId, importStatus = 'success'
       │
       ▼
VideoPlayer renders YouTube IFrame
SubtitleSyncEngine.start() called
       │
       ▼
Polling setInterval(250ms):
  currentTime = player.getCurrentTime()
  activeDeCue = binarySearch(deCues, currentTime)
  activeEnCue = binarySearch(enCues, currentTime)
       │
       ▼
SubtitleOverlay re-renders with new cues
```

### 2.4 SubtitleSyncEngine

The sync engine is a plain JavaScript class, not a React component. It runs outside the React render cycle to avoid re-render overhead.

```
SubtitleSyncEngine
├── constructor(playerRef, onUpdate)
├── start()      → starts 250ms polling interval
├── stop()       → clears interval (called on unmount / new import)
├── setDeCues()  → updates cue array reference
├── setEnCues()  → updates cue array reference
└── findCue()    → binary search O(log n)
```

---

## 3. Backend Architecture

### 3.1 Technology

- **Runtime:** Node.js 20 LTS
- **Framework:** Express 5
- **Subtitle extraction:** yt-dlp (Python CLI, invoked via `child_process.execFile`)
- **Translation:** DeepL Free API (HTTPS REST)
- **Storage:** File system (JSON files in `/cache`)

### 3.2 Layer Structure

```
Express Application
│
├── Middleware Stack
│   ├── cors()              ← Restrict to ALLOWED_ORIGIN
│   ├── express.json()      ← Parse JSON bodies, max 1KB
│   ├── rateLimit()         ← express-rate-limit
│   └── requestLogger()     ← Structured JSON logging
│
├── Routers
│   ├── /health             ← Health check (no auth)
│   ├── /api/import         ← POST: trigger subtitle extraction
│   └── /api/subtitles      ← GET: serve cached subtitle JSON
│
└── Service Layer
    ├── importService        ← Orchestrates the import pipeline
    ├── ytdlpService         ← Wraps yt-dlp subprocess
    ├── vttParser            ← Parses .vtt to cue array
    ├── translatorService    ← Calls DeepL API in batches
    └── cacheService         ← Read/write JSON files from /cache
```

### 3.3 Import Pipeline (Backend)

```
POST /api/import { url }
        │
        ▼
validateUrl(url) → extract videoId
        │
        ▼
cacheService.exists(videoId)?
   Yes ────────────────────────────────────▶ return cached meta
   No
        │
        ▼
ytdlpService.fetchSubtitles(videoId)
   → yt-dlp writes .de.vtt and .en.vtt to /cache/{videoId}/
        │
        ▼
vttParser.parse(de.vtt) → deCues[]
vttParser.parse(en.vtt) → enCues[] (if file exists)
        │
    No EN file?
        │ Yes
        ▼
translatorService.translateCues(deCues)
   → Batched DeepL API calls (50 cues/batch)
   → Returns enCues[]
        │
        ▼
cacheService.write(videoId, meta, deCues, enCues)
        │
        ▼
Return 200 { videoId, title, hasDe, hasEn, translationRequired, ready }
```

---

## 4. External Service Dependencies

| Service | Role | Dependency Type | Fallback |
|---|---|---|---|
| YouTube IFrame API | Video playback in browser | Critical | None (no alternative) |
| YouTube caption server | Subtitle data source | Critical | User sees "no subtitles" error |
| yt-dlp | Subtitle extraction tool | Critical | yt-dlp error → HTTP 500 |
| DeepL Free API | DE→EN translation | Optional | Return DE-only, show message |
| LibreTranslate | Translation backup | Optional | Return DE-only |
| Vercel Edge CDN | Frontend static hosting | Critical | Railway can serve frontend as fallback |
| Railway | Backend hosting + persistent disk | Critical | Render.com as alternative |

---

## 5. Security Architecture

### 5.1 Trust Boundaries

```
[User Input]  →  Frontend Validation  →  Backend Validation  →  Services
    ↑                                                               ↑
  Untrusted                                                    Trusted only
                                                            after validation
```

### 5.2 Defence in Depth

| Layer | Control |
|---|---|
| Frontend | URL regex validation before API call |
| Network | HTTPS only, HSTS header |
| API | CORS restricted to frontend origin |
| API | express-rate-limit (10 imports/IP/hour) |
| API | Request body size limit 1KB |
| Process | yt-dlp via execFile (no shell injection) |
| File system | Video ID sanitised to [A-Za-z0-9_-]{11} before file path construction |
| File system | Reject VTT files > 5MB |
| Secrets | Environment variables only, never in code |

---

## 6. Caching Architecture

```
Import Request
      │
      ▼
Does /cache/{videoId}/subtitles.de.json exist?
      │
   YES → Serve from cache (< 2s response)
      │
    NO
      │
      ▼
Run yt-dlp + vttParser + translator
      │
      ▼
Write to /cache/{videoId}/:
  meta.json
  subtitles.de.json
  subtitles.en.json
      │
      ▼
Serve response
```

Cache is **write-once, read-many**. No TTL in MVP. Cache invalidation is manual (delete the video's folder).

For V2: implement LRU eviction when `/cache` exceeds 2GB.

---

## 7. Deployment Architecture

```
Developer → git push origin main
                │
                ▼
         GitHub Actions CI
         ├── npm test (frontend)
         ├── npm test (backend)
         └── npm audit (security check)
                │
          All pass?
         /         \
        NO           YES
        │             │
   Block deploy    ▼     ▼
             Vercel   Railway
             Deploy   Deploy
             (auto)   (auto)
                │         │
                ▼         ▼
         dualsub.app  api.dualsub.app
```

### Production Topology

```
                    [Cloudflare DNS]
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
  dualsub.app                    api.dualsub.app
  [Vercel Edge]                  [Railway Region: US-West]
  React SPA                      Node.js + Python
  (static files)                 Port 3001
  Global CDN                     Persistent Volume: /cache
```

---

## 8. Scalability Design

### MVP (Current)

- Single Railway instance, vertical scaling only
- File-system cache (no shared state needed for single instance)
- DeepL free tier: 500k chars/month

### V2 Scaling Path

```
Single server → Multiple instances:
  Problem: File cache is not shared between instances
  Solution: Migrate cache to object storage (S3 / R2)

Translation bottleneck:
  Problem: DeepL free tier exhausted at high volume
  Solution: Add job queue (BullMQ + Redis), upgrade to DeepL Pro

Frontend performance:
  Problem: Large subtitle JSON payloads
  Solution: Serve from CDN (Cloudflare R2 + cached URLs)
```

---

## 9. Observability Architecture

```
Backend Logs (structured JSON) → Railway Log Viewer
                                       │
                                  Sentry.io
                               (error tracking)
                                       │
                              Future: Grafana Cloud
                              (metrics dashboard)

Health Check: GET /health
├── Response: { status: "ok", uptime: 3600, cacheSize: "412MB" }
├── Polled by Railway every 30s
└── Auto-restart if 3 consecutive failures
```
