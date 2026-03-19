# MVP Tech Doc — DualSub: Dual Subtitle YouTube Player

## Purpose

This document defines the **minimum viable product** technical implementation for DualSub — a web app that lets users watch German YouTube cartoons with simultaneous German + English subtitles displayed in the browser.

---

## MVP Scope

### In Scope
- Paste a YouTube URL → import video
- Fetch German subtitles (auto-generated or manual) from YouTube
- Translate German subtitles to English (if no EN track exists)
- Play video via YouTube IFrame Player
- Display German subtitle line and English subtitle line synced to video playback
- Basic controls: Play, Pause, font size toggle

### Out of Scope (for MVP)
- User accounts / saved playlists
- Subtitle file upload (SRT/VTT from device)
- Mobile app (web only for MVP)
- More than 2 subtitle languages simultaneously
- Offline playback

---

## Tech Stack

```
Frontend: React 18 + Vite + Tailwind CSS
Backend:  Node.js 20 + Express 5
Captions: yt-dlp (Python 3.11+)
Translation: DeepL Free API (500k chars/month free)
Storage:  File system cache (JSON files per video ID)
```

---

## Repository Structure

```
dualsub/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── URLInput.jsx          ← Paste YouTube link
│   │   │   ├── VideoPlayer.jsx       ← YouTube IFrame embed
│   │   │   ├── SubtitleOverlay.jsx   ← Dual subtitle display
│   │   │   ├── SubtitleSyncEngine.js ← Time-cue matching logic
│   │   │   └── SettingsPanel.jsx     ← Font/color controls
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
│
├── backend/
│   ├── server.js                     ← Express entry point
│   ├── routes/
│   │   ├── import.js                 ← POST /api/import
│   │   └── subtitles.js              ← GET /api/subtitles/:id/:lang
│   ├── services/
│   │   ├── ytdlp.js                  ← Wrapper around yt-dlp CLI
│   │   ├── vttParser.js              ← VTT → JSON cue array
│   │   └── translator.js             ← DeepL translation calls
│   └── cache/                        ← JSON subtitle files stored here
│
├── .env.example
└── README.md
```

---

## API Specification

### POST `/api/import`

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=XXXXXXXXXXX"
}
```

**Response:**
```json
{
  "videoId": "XXXXXXXXXXX",
  "title": "Peppa Wutz - Folge 1",
  "hasDe": true,
  "hasEn": false,
  "translationRequired": true
}
```

**Errors:**
- `400` — Invalid YouTube URL
- `422` — No subtitle track found for this video
- `500` — yt-dlp extraction failed

---

### GET `/api/subtitles/:videoId/:lang`

**Example:** `GET /api/subtitles/XXXXXXXXXXX/de`

**Response:**
```json
[
  { "start": 1.2, "end": 4.5, "text": "Hallo! Ich bin Peppa Wutz." },
  { "start": 4.8, "end": 7.1, "text": "Das ist mein Bruder Georg." }
]
```

- `start` / `end` = seconds (float)
- `text` = subtitle string for that cue

---

## Subtitle Sync Algorithm

```javascript
// Called every 250ms via setInterval while video is playing
function getCurrentCue(cues, currentTime) {
  return cues.find(
    cue => currentTime >= cue.start && currentTime <= cue.end
  ) || null;
}
```

- If no matching cue → subtitle overlay shows nothing (blank)
- German and English cue arrays are synced independently (EN cues translated from DE cues, so timestamps match)

---

## YouTube IFrame Integration

```javascript
// In VideoPlayer.jsx
const player = new YT.Player('player', {
  videoId: videoId,
  events: {
    onReady: (e) => setPlayerReady(true),
    onStateChange: (e) => handleStateChange(e)
  }
});

// Polling current time
useEffect(() => {
  const interval = setInterval(() => {
    if (player && player.getCurrentTime) {
      setCurrentTime(player.getCurrentTime());
    }
  }, 250);
  return () => clearInterval(interval);
}, [player]);
```

> **Note:** YouTube's IFrame API does not allow subtitle track switching via JS — this is why subtitles are rendered as a custom HTML overlay, not using YouTube's built-in CC.

---

## Subtitle Overlay UI

```
┌─────────────────────────────────────────────┐
│                                             │
│          [  YouTube Video Playing  ]        │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  🇩🇪  Hallo! Ich bin Peppa Wutz.      │  │
│  │  🇬🇧  Hello! I am Peppa Pig.          │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

CSS positioning:
- Overlay is `position: absolute; bottom: 60px; width: 100%`
- German line: `font-size: 1.2rem; color: #FFFFFF; text-shadow`
- English line: `font-size: 1.1rem; color: #FFE680; text-shadow`
- Both lines have semi-transparent dark background pill for readability

---

## yt-dlp Subtitle Extraction Command

```bash
yt-dlp \
  --write-auto-subs \
  --sub-langs "de,en" \
  --skip-download \
  --convert-subs vtt \
  --output "cache/%(id)s/%(id)s" \
  "https://www.youtube.com/watch?v=VIDEO_ID"
```

Output files:
- `cache/VIDEO_ID/VIDEO_ID.de.vtt`
- `cache/VIDEO_ID/VIDEO_ID.en.vtt` (if available)

---

## Translation Service (DE → EN)

When no English track is available:

```javascript
// translator.js
async function translateCues(deCues) {
  const texts = deCues.map(c => c.text);
  const response = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: { 'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_KEY}` },
    body: new URLSearchParams({
      text: texts,
      source_lang: 'DE',
      target_lang: 'EN'
    })
  });
  const data = await response.json();
  return deCues.map((cue, i) => ({
    ...cue,
    text: data.translations[i].text
  }));
}
```

---

## Environment Variables

```env
# backend/.env
DEEPL_KEY=your-deepl-api-key-here
PORT=3001
CACHE_DIR=./cache
```

---

## Local Development Setup

```bash
# 1. Install yt-dlp
pip install yt-dlp

# 2. Install backend
cd backend && npm install && npm run dev

# 3. Install frontend
cd frontend && npm install && npm run dev

# Frontend runs on http://localhost:5173
# Backend runs on http://localhost:3001
```

---

## MVP Acceptance Criteria

| # | Criteria | Pass Condition |
|---|---|---|
| 1 | User pastes YouTube URL | Import button fetches video info |
| 2 | Video plays in browser | YouTube IFrame loads and plays |
| 3 | German subtitles shown | DE cues appear synced to video |
| 4 | English subtitles shown | EN cues appear below DE cues |
| 5 | No EN track → translated | Translation fills in EN line |
| 6 | Subtitle timing accurate | Max ±0.5s offset from audio |
| 7 | Works on Chrome/Firefox | Tested on both browsers |
