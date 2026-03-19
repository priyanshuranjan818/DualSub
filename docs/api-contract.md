# API Contract
# DualSub — German + English Dual Subtitle YouTube Player

**Document Version:** 1.0
**Base URL (production):** `https://api.dualsub.app`
**Base URL (development):** `http://localhost:3001`
**API prefix:** `/api`
**Protocol:** HTTPS (production), HTTP (local development)
**Data format:** JSON (request and response bodies)
**Authentication:** None (public API, rate-limited by IP)

---

## 1. Conventions

### Request Headers

All requests must include:

```
Content-Type: application/json
```

### Response Headers (always present)

```
Content-Type: application/json
X-Request-Id: <uuid>          ← Unique request identifier for tracing
```

### HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | Success |
| 400 | Bad request (client error, e.g. invalid URL format) |
| 404 | Resource not found (e.g. subtitles not yet imported) |
| 413 | Payload too large |
| 422 | Unprocessable entity (e.g. valid URL but no subtitle track) |
| 429 | Too many requests (rate limit exceeded) |
| 500 | Internal server error (e.g. yt-dlp failure) |
| 503 | Service unavailable (e.g. translation provider down) |

### Error Response Shape

All error responses follow this structure:

```json
{
  "error":   "ERROR_CODE",
  "message": "Human-readable explanation.",
  "details": {}
}
```

The `details` field is optional and may contain additional context (e.g. which field failed validation). It is omitted in production to avoid leaking internals.

---

## 2. Endpoints

---

### `GET /health`

Returns the health status of the backend server.

**Authentication:** None

**Rate limit:** None

**Response 200:**

```json
{
  "status":    "ok",
  "uptime":    3600,
  "version":   "1.0.0",
  "cacheSize": "412MB"
}
```

| Field | Type | Description |
|---|---|---|
| `status` | string | Always `"ok"` if reachable |
| `uptime` | number | Server uptime in seconds |
| `version` | string | Backend application version |
| `cacheSize` | string | Human-readable total size of /cache directory |

---

### `POST /api/import`

Accepts a YouTube URL and triggers subtitle extraction and optional translation. Returns video metadata when complete.

**Authentication:** None

**Rate limit:** 10 requests per IP per hour

**Request body:**

```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `url` | string | Yes | Must match YouTube URL pattern; max 200 chars |

**Accepted URL formats:**

```
https://www.youtube.com/watch?v={11-char-id}
https://youtube.com/watch?v={11-char-id}
https://youtu.be/{11-char-id}
https://www.youtube.com/watch?v={11-char-id}&t=30s  (extra params allowed)
```

**Response 200 — Success:**

```json
{
  "videoId":             "dQw4w9WgXcQ",
  "title":               "Peppa Wutz - Folge 1",
  "duration":            360.0,
  "thumbnailUrl":        "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
  "hasDe":               true,
  "hasEn":               true,
  "deSource":            "youtube_auto",
  "enSource":            "translated_deepl",
  "translationRequired": false,
  "cached":              false,
  "ready":               true
}
```

| Field | Type | Description |
|---|---|---|
| `videoId` | string | Extracted YouTube video ID |
| `title` | string | Video title |
| `duration` | number | Duration in seconds |
| `thumbnailUrl` | string | YouTube thumbnail URL |
| `hasDe` | boolean | Whether German subtitle track is available |
| `hasEn` | boolean | Whether English subtitle track is available |
| `deSource` | string enum | Source of German subtitles |
| `enSource` | string enum or null | Source of English subtitles |
| `translationRequired` | boolean | Whether DeepL translation was triggered |
| `cached` | boolean | Whether result was served from cache (no re-processing) |
| `ready` | boolean | Always `true` in success response |

**Source enum values:**

| Value | Meaning |
|---|---|
| `"youtube_manual"` | Manually uploaded track from YouTube |
| `"youtube_auto"` | Auto-generated YouTube caption |
| `"translated_deepl"` | Translated via DeepL |
| `"translated_libretranslate"` | Translated via LibreTranslate |

**Error Responses:**

```json
// 400 — Empty or missing URL
{
  "error":   "MISSING_URL",
  "message": "A YouTube URL is required."
}

// 400 — URL does not match YouTube pattern
{
  "error":   "INVALID_URL",
  "message": "Please enter a valid YouTube URL."
}

// 413 — Request body too large
{
  "error":   "PAYLOAD_TOO_LARGE",
  "message": "Request body exceeds 1KB limit."
}

// 422 — Valid URL but video has no German subtitle track
{
  "error":   "NO_SUBTITLES",
  "message": "This video has no subtitle track. Try another video."
}

// 422 — Video is private, deleted, or region-blocked
{
  "error":   "VIDEO_UNAVAILABLE",
  "message": "This video is private or unavailable."
}

// 500 — yt-dlp process failed
{
  "error":   "EXTRACTION_FAILED",
  "message": "Could not extract subtitles. Please try again."
}

// 503 — Translation provider unavailable
{
  "error":   "TRANSLATION_UNAVAILABLE",
  "message": "Could not translate subtitles. German subtitles are available."
}

// 429 — Rate limit exceeded
{
  "error":   "RATE_LIMIT_EXCEEDED",
  "message": "Too many requests. Please wait before importing another video.",
  "details": { "retryAfter": 3600 }
}
```

---

### `GET /api/subtitles/:videoId/:lang`

Returns the parsed subtitle cue array for a given video and language.

**URL parameters:**

| Parameter | Type | Required | Validation |
|---|---|---|---|
| `videoId` | string | Yes | Must match `^[A-Za-z0-9_-]{11}$` |
| `lang` | string | Yes | Must be `"de"` or `"en"` |

**Authentication:** None

**Rate limit:** 60 requests per IP per minute

**Examples:**

```
GET /api/subtitles/dQw4w9WgXcQ/de
GET /api/subtitles/dQw4w9WgXcQ/en
```

**Response 200 — Success:**

```json
[
  { "index": 0, "start": 1.200, "end": 4.500, "text": "Hallo! Ich bin Peppa Wutz." },
  { "index": 1, "start": 4.800, "end": 7.100, "text": "Das ist mein Bruder Georg." },
  { "index": 2, "start": 7.500, "end": 10.200, "text": "Georg liebt Dinosaurier." }
]
```

**Response array item fields:**

| Field | Type | Description |
|---|---|---|
| `index` | number (integer) | 0-based cue position (sorted ascending by start) |
| `start` | number (float) | Cue start time in seconds |
| `end` | number (float) | Cue end time in seconds |
| `text` | string | Subtitle display text (VTT tags stripped) |

**Error Responses:**

```json
// 400 — Invalid videoId format
{
  "error":   "INVALID_VIDEO_ID",
  "message": "Invalid video ID format."
}

// 400 — Invalid language code
{
  "error":   "INVALID_LANG",
  "message": "Language must be 'de' or 'en'."
}

// 404 — Video not yet imported / not in cache
{
  "error":   "NOT_FOUND",
  "message": "Subtitles not found. Import the video first."
}

// 404 — Video was imported but has no track for this language
{
  "error":   "LANG_NOT_AVAILABLE",
  "message": "No English subtitle track available for this video."
}
```

---

### `GET /api/meta/:videoId`

Returns the stored metadata for a previously imported video.

**URL parameters:**

| Parameter | Type | Required | Validation |
|---|---|---|---|
| `videoId` | string | Yes | Must match `^[A-Za-z0-9_-]{11}$` |

**Rate limit:** 60 requests per IP per minute

**Response 200:**

```json
{
  "videoId":          "dQw4w9WgXcQ",
  "title":            "Peppa Wutz - Folge 1",
  "duration":         360.0,
  "thumbnailUrl":     "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
  "importedAt":       "2025-09-12T10:23:00Z",
  "hasDe":            true,
  "hasEn":            true,
  "deSource":         "youtube_auto",
  "enSource":         "translated_deepl",
  "cacheVersion":     1
}
```

**Error Responses:**

```json
// 404
{
  "error":   "NOT_FOUND",
  "message": "Video not found. Import it first."
}
```

---

## 3. Rate Limiting Details

| Endpoint | Limit | Window | Response on breach |
|---|---|---|---|
| `POST /api/import` | 10 requests | Per IP per hour | HTTP 429 + Retry-After header |
| `GET /api/subtitles/:id/:lang` | 60 requests | Per IP per minute | HTTP 429 |
| `GET /api/meta/:id` | 60 requests | Per IP per minute | HTTP 429 |
| `GET /health` | Unlimited | — | — |

**Rate limit response headers (always present on rate-limited routes):**

```
X-RateLimit-Limit:     10
X-RateLimit-Remaining: 7
X-RateLimit-Reset:     1726138800
Retry-After:           3541
```

---

## 4. CORS Policy

```
Access-Control-Allow-Origin:  https://dualsub.app (production)
                              http://localhost:5173 (development)
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

Pre-flight OPTIONS requests are handled automatically by the `cors()` middleware.

---

## 5. Versioning

The current API is **v1 (unversioned)**. All endpoints are served under `/api/` without a version prefix.

If breaking changes are needed in V2, endpoints will be versioned as `/api/v2/...` while `/api/v1/...` is maintained for backwards compatibility for a minimum of 3 months.

---

## 6. Frontend Integration Example

```javascript
// Import a video
async function importVideo(url) {
  const res = await fetch('/api/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message);
  }

  return res.json(); // { videoId, title, hasDe, hasEn, ... }
}

// Fetch subtitle cues
async function fetchSubtitles(videoId, lang) {
  const res = await fetch(`/api/subtitles/${videoId}/${lang}`);

  if (res.status === 404) return [];     // No track for this lang
  if (!res.ok) throw new Error('Failed to load subtitles');

  return res.json(); // Cue[]
}

// Usage
const meta = await importVideo('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
const [deCues, enCues] = await Promise.all([
  fetchSubtitles(meta.videoId, 'de'),
  fetchSubtitles(meta.videoId, 'en')
]);
```
