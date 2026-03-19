# Architecture — DualSub: German + English Subtitle Viewer

## Overview

DualSub is a browser-based web application that lets users import YouTube videos (primarily German cartoons) and watch them with **dual subtitles** — German on top, English below — rendered directly in the browser using the YouTube IFrame Player API and auto-generated or fetched subtitle tracks.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Browser (Client)                   │
│                                                         │
│  ┌──────────────┐   ┌────────────────┐  ┌───────────┐  │
│  │  URL Import  │   │  YouTube IFrame│  │  Subtitle │  │
│  │  UI Panel    │──▶│  Player        │  │  Overlay  │  │
│  └──────────────┘   └────────────────┘  └───────────┘  │
│                              │                  ▲       │
│                              │ time events       │       │
│                              ▼                  │       │
│                     ┌────────────────┐          │       │
│                     │ Subtitle Sync  │──────────┘       │
│                     │ Engine (JS)    │                  │
│                     └────────────────┘                  │
└─────────────────────────────────────────────────────────┘
                              │
                    API calls │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                    Backend Server (Node.js)              │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  /api/subtitles?videoId=XXX&lang=de              │   │
│  │  /api/subtitles?videoId=XXX&lang=en              │   │
│  └──────────────────────────────────────────────────┘   │
│                              │                          │
│                    yt-dlp / youtube-caption-scraper      │
│                              │                          │
│                              ▼                          │
│                  ┌────────────────────┐                 │
│                  │  Translation Layer │                 │
│                  │  (DeepL / LibreT.) │                 │
│                  └────────────────────┘                 │
└─────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Frontend (Vanilla JS or React)

| Component | Responsibility |
|---|---|
| `URLInputPanel` | Accepts YouTube link, triggers import |
| `VideoPlayer` | Embeds YouTube IFrame, exposes time events |
| `SubtitleOverlay` | Renders dual-line subtitle display over video |
| `SubtitleSyncEngine` | Polls `currentTime`, finds active cue from parsed SRT/VTT |
| `SettingsPanel` | Font size, color, toggle DE/EN visibility |

### 2. Backend (Node.js + Express)

| Endpoint | Description |
|---|---|
| `POST /api/import` | Accepts YouTube URL, returns video metadata + subtitle availability |
| `GET /api/subtitles/:videoId/:lang` | Returns parsed subtitle JSON (SRT converted to JSON array) |
| `GET /api/translate/:videoId` | Triggers machine translation of DE→EN if EN track missing |

### 3. Subtitle Pipeline

```
YouTube Video URL
      │
      ▼
yt-dlp --write-auto-subs --sub-langs de,en
      │
      ├── de.vtt (German auto-captions)
      └── en.vtt (English auto-captions OR translated)
            │
            ▼
      Parse VTT → JSON Array of cues
      { start, end, textDE, textEN }
            │
            ▼
      Served to frontend via REST API
```

### 4. Translation Fallback

If the YouTube video has no English subtitle track:
- German cues are sent to **DeepL API** (free tier) or **LibreTranslate** (self-hosted, free) for DE→EN translation
- Translated cues are cached in a local JSON/SQLite store

---

## Data Flow

```
User pastes YouTube URL
        │
        ▼
Frontend POSTs to /api/import
        │
        ▼
Backend fetches subtitles with yt-dlp
        │
        ├─ DE track found? → parse & return
        └─ EN track found? → parse & return
               └─ No EN track? → translate DE→EN → return
        │
        ▼
Frontend stores cue arrays in memory
        │
        ▼
YouTube IFrame fires timeupdate events (250ms polling)
        │
        ▼
SubtitleSyncEngine finds current cue by timestamp
        │
        ▼
SubtitleOverlay renders:
  [ German subtitle line ]
  [ English subtitle line ]
```

---

## Technology Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React + Vite | Fast dev, component model |
| Styling | Tailwind CSS | Rapid UI with dark mode |
| Player | YouTube IFrame API | No re-hosting needed |
| Backend | Node.js + Express | Simple REST, yt-dlp integration |
| Subtitle fetch | yt-dlp (Python CLI) | Best YouTube caption support |
| Translation | DeepL Free API or LibreTranslate | DE→EN fallback |
| Storage | Local JSON files / SQLite | No DB overhead for MVP |
| Hosting | Vercel (frontend) + Railway (backend) | Free tier friendly |

---

## Deployment Topology

```
[User Browser]
     │  HTTPS
     ▼
[Vercel — React Frontend]
     │  REST API calls
     ▼
[Railway / Render — Node.js Backend]
     │  spawns subprocess
     ▼
[yt-dlp] — fetches subtitle files from YouTube
     │
     ▼
[DeepL / LibreTranslate] — if EN missing
```

---

## Security Considerations

- Only YouTube URLs are accepted (validated by regex before processing)
- yt-dlp runs in a sandboxed subprocess with no shell injection risk
- No user accounts or personal data stored in MVP
- API rate limiting via `express-rate-limit`

---

## Scalability Path

| Phase | Approach |
|---|---|
| MVP | File-based cue cache, single server |
| V2 | Redis cache for subtitle JSON, queue for translations |
| V3 | CDN for subtitle delivery, multi-language support |
