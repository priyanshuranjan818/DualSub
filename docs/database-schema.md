# Database Schema
# DualSub — German + English Dual Subtitle YouTube Player

**Document Version:** 1.0

---

## 1. Storage Strategy

### MVP: File-System Store

DualSub MVP uses a **flat file system** as its data store. There is no relational database. All data is stored as JSON files organised by YouTube video ID.

This approach is justified by:
- No user accounts or relational data needed in MVP
- Simple to deploy (no database server required)
- Fast read performance for small-to-medium subtitle files
- Easy to inspect and debug during development

### V2: SQLite or PostgreSQL Migration Path

When V2 features (user accounts, saved lists, analytics) are added, the file-system store will be migrated to SQLite (single-server) or PostgreSQL (multi-server).

---

## 2. File System Schema (MVP)

### 2.1 Root Cache Directory

```
/cache/                              ← Root cache directory (env: CACHE_DIR)
└── {videoId}/                       ← One folder per imported YouTube video
    ├── meta.json                    ← Video metadata
    ├── subtitles.de.json            ← German subtitle cue array
    ├── subtitles.en.json            ← English subtitle cue array
    └── raw/                         ← Raw VTT files from yt-dlp (optional, for debugging)
        ├── {videoId}.de.vtt
        └── {videoId}.en.vtt
```

**Directory naming rule:** `videoId` must match `^[A-Za-z0-9_-]{11}$`. Any other value is rejected before file I/O.

---

### 2.2 `meta.json` — Video Metadata

**Location:** `/cache/{videoId}/meta.json`

**Schema:**
```json
{
  "videoId":          "string",
  "title":            "string",
  "duration":         "number",
  "thumbnailUrl":     "string | null",
  "importedAt":       "string (ISO 8601)",
  "hasDe":            "boolean",
  "hasEn":            "boolean",
  "deSource":         "string (enum)",
  "enSource":         "string (enum) | null",
  "translationSource":"string (enum) | null",
  "cacheVersion":     "number"
}
```

**Field definitions:**

| Field | Type | Required | Description |
|---|---|---|---|
| `videoId` | string (11 chars) | Yes | YouTube video ID |
| `title` | string | Yes | Video title from YouTube metadata |
| `duration` | number (float) | Yes | Video duration in seconds |
| `thumbnailUrl` | string (URL) | No | YouTube thumbnail image URL |
| `importedAt` | string (ISO 8601) | Yes | Timestamp of first import |
| `hasDe` | boolean | Yes | Whether German subtitle track was found |
| `hasEn` | boolean | Yes | Whether English subtitle track is available |
| `deSource` | enum | Yes | Source of German subtitles |
| `enSource` | enum or null | Yes | Source of English subtitles (null if not available) |
| `translationSource` | enum or null | Yes | Translation provider used (null if native EN used) |
| `cacheVersion` | number | Yes | Schema version for cache invalidation (current: 1) |

**Enum values for `deSource` / `enSource`:**

| Value | Meaning |
|---|---|
| `"youtube_manual"` | Manually uploaded subtitle track from YouTube |
| `"youtube_auto"` | Auto-generated caption track from YouTube |
| `"translated_deepl"` | Machine translated by DeepL API |
| `"translated_libretranslate"` | Machine translated by LibreTranslate |

**Example:**
```json
{
  "videoId": "dQw4w9WgXcQ",
  "title": "Peppa Wutz - Folge 1 - Schotzenloch",
  "duration": 360.0,
  "thumbnailUrl": "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
  "importedAt": "2025-09-12T10:23:00Z",
  "hasDe": true,
  "hasEn": false,
  "deSource": "youtube_auto",
  "enSource": "translated_deepl",
  "translationSource": "translated_deepl",
  "cacheVersion": 1
}
```

---

### 2.3 `subtitles.de.json` — German Subtitle Cues

**Location:** `/cache/{videoId}/subtitles.de.json`

**Schema:**
```json
[
  {
    "index":  "number",
    "start":  "number (float)",
    "end":    "number (float)",
    "text":   "string"
  }
]
```

**Field definitions:**

| Field | Type | Required | Constraints | Description |
|---|---|---|---|---|
| `index` | number (integer) | Yes | ≥ 0, sequential | Position of cue in the array (0-based) |
| `start` | number (float) | Yes | ≥ 0, < `end` | Cue start time in seconds from video start |
| `end` | number (float) | Yes | > `start` | Cue end time in seconds from video start |
| `text` | string | Yes | Non-empty, stripped of VTT tags | Subtitle text to display |

**Constraints:**
- Cues must be sorted ascending by `start` (required for binary search algorithm)
- No two cues may have overlapping time ranges (de-duped during VTT parsing)
- `text` must have all VTT inline tags stripped (e.g., `<c>`, `<00:01.000>`)
- Maximum text length: 500 characters per cue

**Example:**
```json
[
  { "index": 0, "start": 1.200, "end": 4.500, "text": "Hallo! Ich bin Peppa Wutz." },
  { "index": 1, "start": 4.800, "end": 7.100, "text": "Das ist mein Bruder Georg." },
  { "index": 2, "start": 7.500, "end": 10.200, "text": "Georg liebt Dinosaurier." }
]
```

---

### 2.4 `subtitles.en.json` — English Subtitle Cues

**Location:** `/cache/{videoId}/subtitles.en.json`

**Schema:** Identical to `subtitles.de.json`.

The `start` and `end` values in `subtitles.en.json` will exactly match those in `subtitles.de.json` when the English track is produced by translation (timestamps are preserved from the German cues). When the English track is a native YouTube EN track, timestamps may differ slightly from the DE track.

**Example (translated from DE cues above):**
```json
[
  { "index": 0, "start": 1.200, "end": 4.500, "text": "Hello! I am Peppa Pig." },
  { "index": 1, "start": 4.800, "end": 7.100, "text": "That is my brother George." },
  { "index": 2, "start": 7.500, "end": 10.200, "text": "George loves dinosaurs." }
]
```

---

## 3. File System Indexes

No formal index files exist in the MVP. The existence of `/cache/{videoId}/subtitles.de.json` is used as the cache-hit check.

For V2, a `/cache/index.json` file will list all imported video IDs and their metadata for efficient listing:

```json
{
  "videos": [
    { "videoId": "dQw4w9WgXcQ", "title": "Peppa Wutz - Folge 1", "importedAt": "2025-09-12T10:23:00Z" },
    { "videoId": "abc123xyz89", "title": "Feuerwehrmann Sam - Episode 1", "importedAt": "2025-09-13T08:00:00Z" }
  ]
}
```

---

## 4. V2 Relational Schema (SQLite / PostgreSQL)

When user accounts and saved lists are introduced in V2, the following tables will be required.

### 4.1 `videos` table

```sql
CREATE TABLE videos (
  id              TEXT PRIMARY KEY,          -- YouTube video ID (11 chars)
  title           TEXT NOT NULL,
  duration        REAL NOT NULL,
  thumbnail_url   TEXT,
  imported_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  has_de          BOOLEAN NOT NULL DEFAULT FALSE,
  has_en          BOOLEAN NOT NULL DEFAULT FALSE,
  de_source       TEXT NOT NULL,             -- youtube_manual | youtube_auto
  en_source       TEXT,                      -- youtube_manual | youtube_auto | translated_deepl | null
  cache_version   INTEGER NOT NULL DEFAULT 1
);
```

### 4.2 `subtitle_cues` table

```sql
CREATE TABLE subtitle_cues (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  video_id  TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  lang      TEXT NOT NULL CHECK (lang IN ('de', 'en')),
  idx       INTEGER NOT NULL,               -- 0-based cue index for ordering
  start_ms  INTEGER NOT NULL,               -- Start time in milliseconds (avoids float precision issues)
  end_ms    INTEGER NOT NULL,
  text      TEXT NOT NULL,
  UNIQUE (video_id, lang, idx)
);

CREATE INDEX idx_cues_video_lang ON subtitle_cues(video_id, lang, start_ms);
```

> **Note:** Storing time as milliseconds (integers) avoids floating-point comparison edge cases in SQL queries.

### 4.3 `users` table (V2)

```sql
CREATE TABLE users (
  id           TEXT PRIMARY KEY,             -- UUID v4
  email        TEXT UNIQUE NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  preferences  JSONB                         -- { fontSize, showDe, showEn, ... }
);
```

### 4.4 `saved_videos` table (V2)

```sql
CREATE TABLE saved_videos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id    TEXT NOT NULL REFERENCES videos(id),
  saved_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, video_id)
);
```

---

## 5. Data Validation Rules

| Rule | Where Enforced |
|---|---|
| `videoId` matches `^[A-Za-z0-9_-]{11}$` | Backend `importService` before any file I/O |
| `start` < `end` | `vttParser` during cue parsing |
| Cues sorted by `start` ascending | `vttParser` post-processing sort |
| `text` not empty after tag stripping | `vttParser` filters empty cues |
| `text` ≤ 500 chars | `vttParser` truncates with `...` if exceeded |
| VTT file ≤ 5MB | `ytdlpService` rejects oversized files |
| `cacheVersion` matches current version | `cacheService` re-processes if stale |

---

## 6. Cache Sizing Estimates

| Video type | Avg cue count | DE JSON size | EN JSON size | Total per video |
|---|---|---|---|---|
| 5-minute cartoon episode | ~120 cues | ~15KB | ~15KB | ~35KB |
| 22-minute cartoon episode | ~480 cues | ~55KB | ~55KB | ~120KB |
| 1-hour documentary | ~1,400 cues | ~160KB | ~160KB | ~330KB |

At 1,000 imported videos averaging 100KB each, total cache size ≈ 100MB — well within Railway's 1GB persistent volume.
