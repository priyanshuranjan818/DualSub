# System Design — DualSub: Dual Subtitle YouTube Player

---

## 1. System Overview

DualSub is a client-server web application. The **frontend** handles video playback and subtitle rendering; the **backend** handles YouTube subtitle extraction, parsing, and translation. The two communicate via a simple REST API.

```
User Browser
    │
    │  1. Paste YouTube URL
    ▼
React Frontend (Vite)
    │
    │  2. POST /api/import
    ▼
Node.js Backend (Express)
    │
    │  3. yt-dlp fetches .vtt subtitle files
    │  4. Parse VTT → JSON cue array
    │  5. Translate DE → EN if needed (DeepL)
    │  6. Cache result to disk
    ▼
Frontend receives subtitle JSON
    │
    │  7. User plays video (YouTube IFrame)
    │  8. Poll currentTime every 250ms
    │  9. Find matching cue → render overlay
    ▼
Dual subtitle display in browser
```

---

## 2. Database / Storage Design

For MVP, there is **no traditional database**. All data is stored as flat JSON files on the server's file system.

### Cache Directory Structure

```
backend/cache/
├── dQw4w9WgXcQ/
│   ├── meta.json          ← video title, duration, subtitle availability
│   ├── subtitles.de.json  ← array of DE cue objects
│   └── subtitles.en.json  ← array of EN cue objects (translated or native)
├── abc123xyz/
│   ├── meta.json
│   ├── subtitles.de.json
│   └── subtitles.en.json
```

### Cue Object Schema

```json
{
  "start": 4.800,
  "end": 7.100,
  "text": "Das ist mein Bruder Georg."
}
```

### meta.json Schema

```json
{
  "videoId": "dQw4w9WgXcQ",
  "title": "Peppa Wutz - Folge 1",
  "duration": 1427,
  "hasDe": true,
  "hasEn": false,
  "translationSource": "deepl",
  "importedAt": "2025-09-12T10:23:00Z"
}
```

---

## 3. API Design

### Base URL
```
http://localhost:3001/api   (development)
https://api.dualsub.app/api (production)
```

### Endpoints

#### `POST /api/import`

Accepts a YouTube URL. Triggers subtitle extraction + translation. Returns metadata.

**Request body:**
```json
{ "url": "https://www.youtube.com/watch?v=VIDEO_ID" }
```

**Success response (200):**
```json
{
  "videoId": "VIDEO_ID",
  "title": "Peppa Wutz - Folge 1",
  "hasDe": true,
  "hasEn": false,
  "translationRequired": true,
  "ready": true
}
```

**Error responses:**
```json
{ "error": "INVALID_URL", "message": "Not a valid YouTube URL." }
{ "error": "NO_SUBTITLES", "message": "No German subtitle track found." }
{ "error": "TRANSLATION_FAILED", "message": "DeepL translation failed." }
```

---

#### `GET /api/subtitles/:videoId/:lang`

Returns a JSON array of subtitle cues.

**Example:** `GET /api/subtitles/VIDEO_ID/de`

**Success response (200):**
```json
[
  { "start": 1.2, "end": 4.5, "text": "Hallo! Ich bin Peppa Wutz." },
  { "start": 4.8, "end": 7.1, "text": "Das ist mein Bruder Georg." }
]
```

**Error responses:**
```json
{ "error": "NOT_FOUND", "message": "Subtitles not found. Import the video first." }
```

---

## 4. Frontend Component Design

### Component Tree

```
App
├── Header
├── URLInputPanel
│   ├── TextInput (YouTube URL)
│   └── ImportButton
├── VideoSection
│   ├── VideoPlayer (YouTube IFrame)
│   └── SubtitleOverlay
│       ├── GermanLine
│       └── EnglishLine
├── PlayerControls
│   ├── PlayPauseButton
│   ├── FontSizeToggle
│   └── SubtitleToggle (DE / EN on/off)
└── SettingsPanel (modal)
```

### State Model

```javascript
// Global app state (React useState or Zustand)
{
  videoId: null,              // string | null
  videoTitle: null,           // string | null
  playerReady: false,         // boolean
  playerRef: null,            // YouTube player instance ref
  currentTime: 0,             // float (seconds)
  deCues: [],                 // Cue[]
  enCues: [],                 // Cue[]
  activeDeCue: null,          // Cue | null
  activeEnCue: null,          // Cue | null
  showDe: true,               // boolean
  showEn: true,               // boolean
  fontSize: 'M',              // 'S' | 'M' | 'L'
  importStatus: 'idle',       // 'idle' | 'loading' | 'success' | 'error'
  errorMessage: null          // string | null
}
```

---

## 5. Subtitle Sync Engine Design

The sync engine runs a polling loop while the video is playing.

```javascript
class SubtitleSyncEngine {
  constructor(playerRef, deCues, enCues, onUpdate) {
    this.playerRef = playerRef;
    this.deCues = deCues;
    this.enCues = enCues;
    this.onUpdate = onUpdate;
    this.interval = null;
  }

  start() {
    this.interval = setInterval(() => {
      const t = this.playerRef.current?.getCurrentTime?.() ?? 0;
      const deCue = this.findCue(this.deCues, t);
      const enCue = this.findCue(this.enCues, t);
      this.onUpdate(deCue, enCue);
    }, 250);
  }

  stop() {
    clearInterval(this.interval);
  }

  findCue(cues, time) {
    // Binary search for O(log n) performance on large subtitle files
    let lo = 0, hi = cues.length - 1;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (cues[mid].end < time) lo = mid + 1;
      else if (cues[mid].start > time) hi = mid - 1;
      else return cues[mid];
    }
    return null;
  }
}
```

---

## 6. Backend Service Design

### ytdlp.js — Subtitle Extraction Service

```javascript
const { execFile } = require('child_process');
const path = require('path');

async function fetchSubtitles(videoId, cacheDir) {
  const outputTemplate = path.join(cacheDir, videoId, videoId);
  const args = [
    '--write-auto-subs',
    '--sub-langs', 'de,en',
    '--skip-download',
    '--convert-subs', 'vtt',
    '--output', outputTemplate,
    `https://www.youtube.com/watch?v=${videoId}`
  ];

  return new Promise((resolve, reject) => {
    execFile('yt-dlp', args, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr));
      resolve({ deFile: `${outputTemplate}.de.vtt`, enFile: `${outputTemplate}.en.vtt` });
    });
  });
}
```

### vttParser.js — VTT to JSON Cue Array

```javascript
function parseVTT(vttContent) {
  const lines = vttContent.split('\n');
  const cues = [];
  let i = 0;

  while (i < lines.length) {
    if (lines[i].includes('-->')) {
      const [startStr, endStr] = lines[i].split(' --> ');
      const start = vttTimeToSeconds(startStr.trim());
      const end = vttTimeToSeconds(endStr.trim().split(' ')[0]);
      const textLines = [];
      i++;
      while (i < lines.length && lines[i].trim() !== '') {
        // Strip VTT tags like <c>, <00:01.000>
        textLines.push(lines[i].replace(/<[^>]+>/g, '').trim());
        i++;
      }
      const text = textLines.join(' ').trim();
      if (text) cues.push({ start, end, text });
    }
    i++;
  }
  return cues;
}

function vttTimeToSeconds(timeStr) {
  // Format: HH:MM:SS.mmm or MM:SS.mmm
  const parts = timeStr.split(':');
  const [h, m, s] = parts.length === 3
    ? [+parts[0], +parts[1], +parts[2]]
    : [0, +parts[0], +parts[1]];
  return h * 3600 + m * 60 + s;
}
```

---

## 7. Translation Service Design

```javascript
// translator.js
async function translateCues(deCues, targetLang = 'EN') {
  // Batch translate in chunks of 50 to stay within DeepL limits
  const CHUNK = 50;
  const enCues = [];

  for (let i = 0; i < deCues.length; i += CHUNK) {
    const chunk = deCues.slice(i, i + CHUNK);
    const texts = chunk.map(c => c.text);

    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'text': texts,
        'source_lang': 'DE',
        'target_lang': targetLang
      })
    });

    const data = await response.json();
    chunk.forEach((cue, j) => {
      enCues.push({
        start: cue.start,
        end: cue.end,
        text: data.translations[j].text
      });
    });
  }

  return enCues;
}
```

---

## 8. Caching Strategy

| Cache Key | Location | TTL |
|---|---|---|
| `{videoId}/meta.json` | Disk | Permanent (manual clear) |
| `{videoId}/subtitles.de.json` | Disk | Permanent |
| `{videoId}/subtitles.en.json` | Disk | Permanent |

On import, server checks if `{videoId}/subtitles.de.json` exists → skip yt-dlp + translation if already cached.

```javascript
async function importVideo(videoId) {
  const deCache = path.join(CACHE_DIR, videoId, 'subtitles.de.json');
  if (fs.existsSync(deCache)) {
    return { cached: true, videoId };
  }
  // ... proceed with extraction
}
```

---

## 9. Security Design

| Threat | Mitigation |
|---|---|
| URL injection | Strict regex validation: `^https?://(www\.)?(youtube\.com/watch\?v=|youtu\.be/)[A-Za-z0-9_-]{11}` |
| yt-dlp shell injection | `execFile` (not `exec`) — args passed as array, never shell string |
| Rate abuse | `express-rate-limit`: 10 imports per IP per hour |
| CORS | Restrict to frontend origin only |
| Large file attacks | VTT files > 5MB are rejected |

---

## 10. Deployment Design

### Frontend (Vercel)

```
vercel.json
{
  "rewrites": [{ "source": "/api/(.*)", "destination": "https://api.dualsub.app/api/$1" }]
}
```

### Backend (Railway)

- Node.js service with Python 3 + yt-dlp pre-installed
- Persistent volume mounted at `/cache`
- Environment variables: `DEEPL_KEY`, `PORT`, `CACHE_DIR`, `ALLOWED_ORIGIN`

### Environment Variables

```env
# Production
DEEPL_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx
PORT=3001
CACHE_DIR=/cache
ALLOWED_ORIGIN=https://dualsub.app
```

---

## 11. Known Limitations (MVP)

| Limitation | Impact | Future Fix |
|---|---|---|
| YouTube may block yt-dlp | Import fails for some videos | Rotate user-agents, use cookies |
| Auto-generated captions can be inaccurate | Subtitles may have errors | Prefer manual tracks when available |
| DeepL free tier: 500k chars/month | High usage may hit limit | Upgrade to paid or add LibreTranslate fallback |
| No mobile layout | Only desktop viewable for MVP | Add responsive CSS in V2 |
| Cache grows unbounded | Disk fills over time | Add LRU cache eviction in V2 |
