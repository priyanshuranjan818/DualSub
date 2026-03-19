# Testing Strategy
# DualSub — German + English Dual Subtitle YouTube Player

**Document Version:** 1.0

---

## 1. Testing Philosophy

DualSub uses a **pragmatic testing pyramid** — more unit tests than integration tests, more integration tests than E2E tests. The goal is high confidence in the most critical paths (subtitle sync accuracy, import pipeline) without over-engineering test infrastructure.

```
                    ┌──────────┐
                    │   E2E    │  ← 2-3 critical user journeys (Playwright)
                    └──────────┘
                  ┌──────────────┐
                  │ Integration  │  ← API routes + service orchestration
                  └──────────────┘
              ┌──────────────────────┐
              │       Unit           │  ← Pure functions, parsers, algorithms
              └──────────────────────┘
```

---

## 2. Test Types & Tools

| Type | Tool | Location | Runs in CI? |
|---|---|---|---|
| Unit (frontend) | Vitest + Testing Library | `frontend/src/**/*.test.jsx` | Yes |
| Unit (backend) | Jest | `backend/tests/unit/*.test.js` | Yes |
| Integration (backend) | Jest + Supertest | `backend/tests/integration/*.test.js` | Yes |
| E2E | Playwright | `frontend/tests/e2e/*.spec.js` | Yes (staging) |
| Manual smoke tests | Checklist | `docs/testing-strategy.md` §8 | Pre-deploy |

---

## 3. Unit Tests — Frontend

### 3.1 `SubtitleSyncEngine` Tests

**File:** `frontend/src/engine/SubtitleSyncEngine.test.js`

These are the most critical frontend tests. The sync engine must correctly find cues by timestamp.

```javascript
// Test: findCue — exact match
test('returns cue when time is within start/end range', () => {
  const cues = [
    { index: 0, start: 1.0, end: 3.0, text: 'Hello' },
    { index: 1, start: 4.0, end: 6.0, text: 'World' }
  ];
  const engine = new SubtitleSyncEngine(null, () => {});
  engine.setDeCues(cues);
  expect(engine.findCue(cues, 2.5)).toEqual(cues[0]);
});

// Test: findCue — between cues returns null
test('returns null when time is between two cues', () => {
  const cues = [
    { index: 0, start: 1.0, end: 3.0, text: 'Hello' },
    { index: 1, start: 4.0, end: 6.0, text: 'World' }
  ];
  const engine = new SubtitleSyncEngine(null, () => {});
  expect(engine.findCue(cues, 3.5)).toBeNull();
});

// Test: findCue — empty array
test('returns null for empty cue array', () => {
  const engine = new SubtitleSyncEngine(null, () => {});
  expect(engine.findCue([], 5.0)).toBeNull();
});

// Test: findCue — exact boundary (start)
test('returns cue when time equals start', () => {
  const cues = [{ index: 0, start: 2.0, end: 5.0, text: 'Boundary' }];
  const engine = new SubtitleSyncEngine(null, () => {});
  expect(engine.findCue(cues, 2.0)).toEqual(cues[0]);
});

// Test: findCue — exact boundary (end)
test('returns cue when time equals end', () => {
  const cues = [{ index: 0, start: 2.0, end: 5.0, text: 'Boundary' }];
  const engine = new SubtitleSyncEngine(null, () => {});
  expect(engine.findCue(cues, 5.0)).toEqual(cues[0]);
});

// Test: findCue — large array (performance)
test('binary search handles 2000 cues correctly', () => {
  const cues = Array.from({ length: 2000 }, (_, i) => ({
    index: i, start: i * 2, end: i * 2 + 1.5, text: `Cue ${i}`
  }));
  const engine = new SubtitleSyncEngine(null, () => {});
  expect(engine.findCue(cues, 999 * 2 + 0.5)).toEqual(cues[999]);
});
```

---

### 3.2 `validateYouTubeUrl` Tests

**File:** `frontend/src/utils/validateYouTubeUrl.test.js`

```javascript
const validUrls = [
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://youtube.com/watch?v=dQw4w9WgXcQ',
  'https://youtu.be/dQw4w9WgXcQ',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s',
  'https://www.youtube.com/watch?v=abc-def_1234X'  // all valid ID chars
];

const invalidUrls = [
  '',
  'not a url',
  'https://vimeo.com/12345',
  'https://youtube.com/playlist?list=PLXXX',  // not a video
  'https://www.youtube.com/watch?v=TOOSHORT',  // not 11 chars
  'javascript:alert(1)'  // injection attempt
];

test.each(validUrls)('accepts valid URL: %s', (url) => {
  expect(validateYouTubeUrl(url)).toEqual({
    valid: true,
    videoId: expect.stringMatching(/^[A-Za-z0-9_-]{11}$/)
  });
});

test.each(invalidUrls)('rejects invalid URL: %s', (url) => {
  expect(validateYouTubeUrl(url)).toEqual({ valid: false, videoId: null });
});
```

---

### 3.3 `URLInputPanel` Component Tests

**File:** `frontend/src/components/URLInputPanel/URLInputPanel.test.jsx`

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import URLInputPanel from './URLInputPanel';

test('Import button is disabled when input is empty', () => {
  render(<URLInputPanel onImport={vi.fn()} />);
  expect(screen.getByRole('button', { name: /import/i })).toBeDisabled();
});

test('Shows error message for invalid URL', async () => {
  render(<URLInputPanel onImport={vi.fn()} />);
  await userEvent.type(screen.getByRole('textbox'), 'https://vimeo.com/123');
  fireEvent.click(screen.getByRole('button', { name: /import/i }));
  expect(screen.getByText(/valid YouTube URL/i)).toBeInTheDocument();
});

test('Calls onImport with URL when valid URL submitted', async () => {
  const mockImport = vi.fn();
  render(<URLInputPanel onImport={mockImport} />);
  await userEvent.type(screen.getByRole('textbox'), 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  fireEvent.click(screen.getByRole('button', { name: /import/i }));
  expect(mockImport).toHaveBeenCalledWith('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
});

test('Shows loading state after valid import triggered', async () => {
  const mockImport = vi.fn(() => new Promise(() => {})); // never resolves
  render(<URLInputPanel onImport={mockImport} />);
  await userEvent.type(screen.getByRole('textbox'), 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  fireEvent.click(screen.getByRole('button', { name: /import/i }));
  expect(screen.getByText(/loading|fetching/i)).toBeInTheDocument();
});
```

---

## 4. Unit Tests — Backend

### 4.1 `vttParser` Tests

**File:** `backend/tests/unit/vttParser.test.js`

```javascript
const { parseVTT } = require('../../services/vttParser');

const sampleVTT = `WEBVTT

00:00:01.200 --> 00:00:04.500
Hallo! <c>Ich</c> bin Peppa Wutz.

00:00:04.800 --> 00:00:07.100
Das ist mein Bruder Georg.

00:00:07.500 --> 00:00:10.200
Georg liebt Dinosaurier.
`;

test('parses valid VTT into cue array', () => {
  const cues = parseVTT(sampleVTT);
  expect(cues).toHaveLength(3);
  expect(cues[0]).toEqual({ index: 0, start: 1.2, end: 4.5, text: 'Hallo! Ich bin Peppa Wutz.' });
});

test('strips VTT inline tags from text', () => {
  const cues = parseVTT(sampleVTT);
  expect(cues[0].text).not.toContain('<c>');
});

test('returns cues sorted ascending by start time', () => {
  const cues = parseVTT(sampleVTT);
  for (let i = 1; i < cues.length; i++) {
    expect(cues[i].start).toBeGreaterThanOrEqual(cues[i - 1].start);
  }
});

test('filters out empty text cues', () => {
  const vttWithEmpty = sampleVTT + '\n00:00:11.000 --> 00:00:12.000\n   \n';
  const cues = parseVTT(vttWithEmpty);
  expect(cues.every(c => c.text.trim().length > 0)).toBe(true);
});

test('handles HH:MM:SS.mmm timestamp format', () => {
  const vtt = `WEBVTT\n\n01:00:00.000 --> 01:00:03.500\nOne hour in.\n`;
  const cues = parseVTT(vtt);
  expect(cues[0].start).toBe(3600.0);
  expect(cues[0].end).toBe(3603.5);
});

test('returns empty array for empty VTT', () => {
  expect(parseVTT('WEBVTT\n\n')).toEqual([]);
});
```

---

### 4.2 `urlValidator` Tests

**File:** `backend/tests/unit/urlValidator.test.js`

```javascript
const { validateYouTubeUrl, extractVideoId } = require('../../validators/urlValidator');

test('extracts videoId from full YouTube URL', () => {
  const result = validateYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  expect(result.valid).toBe(true);
  expect(result.videoId).toBe('dQw4w9WgXcQ');
});

test('extracts videoId from shortened URL', () => {
  const result = validateYouTubeUrl('https://youtu.be/dQw4w9WgXcQ');
  expect(result.valid).toBe(true);
  expect(result.videoId).toBe('dQw4w9WgXcQ');
});

test('rejects non-YouTube URL', () => {
  const result = validateYouTubeUrl('https://vimeo.com/12345');
  expect(result.valid).toBe(false);
});

test('rejects URL with video ID shorter than 11 chars', () => {
  const result = validateYouTubeUrl('https://youtube.com/watch?v=short');
  expect(result.valid).toBe(false);
});

test('prevents path traversal in video ID', () => {
  const result = validateYouTubeUrl('https://youtube.com/watch?v=../../../etc');
  expect(result.valid).toBe(false);
});
```

---

### 4.3 `translatorService` Tests (Mocked)

**File:** `backend/tests/unit/translatorService.test.js`

```javascript
const { translateCues } = require('../../services/translatorService');
const fetch = require('node-fetch');

jest.mock('node-fetch');

const mockDeCues = [
  { index: 0, start: 1.2, end: 4.5, text: 'Hallo! Ich bin Peppa Wutz.' },
  { index: 1, start: 4.8, end: 7.1, text: 'Das ist mein Bruder Georg.' }
];

test('translates DE cues to EN with correct timestamps preserved', async () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      translations: [
        { text: 'Hello! I am Peppa Pig.' },
        { text: 'That is my brother George.' }
      ]
    })
  });

  const enCues = await translateCues(mockDeCues);
  expect(enCues).toHaveLength(2);
  expect(enCues[0].start).toBe(1.2);
  expect(enCues[0].end).toBe(4.5);
  expect(enCues[0].text).toBe('Hello! I am Peppa Pig.');
});

test('throws on DeepL API error', async () => {
  fetch.mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({}) });
  await expect(translateCues(mockDeCues)).rejects.toThrow();
});
```

---

## 5. Integration Tests — Backend

**File:** `backend/tests/integration/import.test.js`

These tests run against a real Express app instance using `supertest`. yt-dlp and DeepL calls are mocked.

```javascript
const request = require('supertest');
const app = require('../../app');
const ytdlpService = require('../../services/ytdlpService');
const translatorService = require('../../services/translatorService');

jest.mock('../../services/ytdlpService');
jest.mock('../../services/translatorService');

const VALID_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

beforeEach(() => {
  ytdlpService.fetchSubtitles.mockResolvedValue({
    deCues: [{ index: 0, start: 1.0, end: 3.0, text: 'Test' }],
    enCues: null
  });
  translatorService.translateCues.mockResolvedValue([
    { index: 0, start: 1.0, end: 3.0, text: 'Test EN' }
  ]);
});

test('POST /api/import returns 200 with valid URL', async () => {
  const res = await request(app)
    .post('/api/import')
    .send({ url: VALID_URL });
  expect(res.status).toBe(200);
  expect(res.body.videoId).toBe('dQw4w9WgXcQ');
  expect(res.body.ready).toBe(true);
});

test('POST /api/import returns 400 with invalid URL', async () => {
  const res = await request(app)
    .post('/api/import')
    .send({ url: 'https://vimeo.com/123' });
  expect(res.status).toBe(400);
  expect(res.body.error).toBe('INVALID_URL');
});

test('POST /api/import returns 400 with missing URL', async () => {
  const res = await request(app).post('/api/import').send({});
  expect(res.status).toBe(400);
});

test('GET /api/subtitles/:id/de returns 404 before import', async () => {
  const res = await request(app).get('/api/subtitles/notimported1/de');
  expect(res.status).toBe(404);
});

test('GET /api/subtitles/:id/de returns cue array after import', async () => {
  await request(app).post('/api/import').send({ url: VALID_URL });
  const res = await request(app).get('/api/subtitles/dQw4w9WgXcQ/de');
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body[0]).toHaveProperty('start');
  expect(res.body[0]).toHaveProperty('end');
  expect(res.body[0]).toHaveProperty('text');
});

test('Rate limit returns 429 after 10 requests', async () => {
  for (let i = 0; i < 10; i++) {
    await request(app).post('/api/import').send({ url: VALID_URL });
  }
  const res = await request(app).post('/api/import').send({ url: VALID_URL });
  expect(res.status).toBe(429);
});
```

---

## 6. E2E Tests — Playwright

**File:** `frontend/tests/e2e/import.spec.js`

These tests run against a live staging environment.

```javascript
const { test, expect } = require('@playwright/test');

const STAGING_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';
const TEST_VIDEO_URL = process.env.E2E_TEST_VIDEO_URL; // set in CI secrets

test('Full import and dual subtitle display flow', async ({ page }) => {
  await page.goto(STAGING_URL);

  // Page loads
  await expect(page).toHaveTitle(/DualSub/);
  await expect(page.getByRole('textbox')).toBeVisible();

  // Paste URL and import
  await page.getByRole('textbox').fill(TEST_VIDEO_URL);
  await page.getByRole('button', { name: /import/i }).click();

  // Loading state
  await expect(page.getByText(/fetching|loading/i)).toBeVisible();

  // Video player appears (within 30 seconds)
  await expect(page.locator('#player iframe')).toBeVisible({ timeout: 30000 });

  // Subtitle overlay exists
  await expect(page.locator('[data-testid="subtitle-overlay"]')).toBeVisible();
});

test('Invalid URL shows error message', async ({ page }) => {
  await page.goto(STAGING_URL);
  await page.getByRole('textbox').fill('https://vimeo.com/12345');
  await page.getByRole('button', { name: /import/i }).click();
  await expect(page.getByText(/valid YouTube URL/i)).toBeVisible();
});

test('Font size toggle changes subtitle size', async ({ page }) => {
  // Pre-condition: video already imported (use fixed test video in staging cache)
  await page.goto(`${STAGING_URL}/watch?v=CACHED_TEST_VIDEO`);
  const overlay = page.locator('[data-testid="german-line"]');
  const initialSize = await overlay.evaluate(el => window.getComputedStyle(el).fontSize);
  await page.getByRole('button', { name: 'L' }).click();
  const newSize = await overlay.evaluate(el => window.getComputedStyle(el).fontSize);
  expect(parseFloat(newSize)).toBeGreaterThan(parseFloat(initialSize));
});
```

---

## 7. Test Coverage Targets

| Area | Target Coverage | Measured by |
|---|---|---|
| `SubtitleSyncEngine` | 100% | Vitest coverage |
| `vttParser` | 100% | Jest coverage |
| `urlValidator` | 100% | Jest coverage |
| `translatorService` | ≥ 90% | Jest coverage |
| `importService` | ≥ 80% | Jest coverage (mocked services) |
| API routes | ≥ 80% line coverage | Supertest integration tests |
| React components | ≥ 70% | Vitest + Testing Library |
| E2E critical paths | 3 key journeys | Playwright |

---

## 8. Manual Smoke Test Checklist

Run before every production deployment:

**Import flow:**
- [ ] Paste valid German cartoon URL → video loads within 30 seconds
- [ ] Paste `https://youtu.be/` short URL → loads correctly
- [ ] Paste invalid URL → error message appears, no crash
- [ ] Paste URL for video with no subtitles → appropriate error shown

**Subtitle display:**
- [ ] German subtitle line appears and changes as video plays
- [ ] English subtitle line appears below German
- [ ] Subtitles disappear between spoken segments
- [ ] After seeking to a new position → subtitles update within 500ms

**Controls:**
- [ ] Play button starts video
- [ ] Pause button pauses video
- [ ] Font S/M/L buttons change subtitle size visibly
- [ ] "German OFF" toggle hides German line
- [ ] "English OFF" toggle hides English line
- [ ] Settings modal opens and closes

**Performance:**
- [ ] Re-import same video → loads in < 2 seconds
- [ ] Lighthouse Performance score ≥ 85

**Error handling:**
- [ ] Kill backend → frontend shows connection error gracefully
- [ ] Check browser console → no unhandled errors or warnings

**Cross-browser:**
- [ ] Chrome 110+: all features working
- [ ] Firefox 110+: all features working
- [ ] Edge 110+: all features working
