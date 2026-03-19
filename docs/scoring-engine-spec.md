# Scoring Engine Specification
# DualSub — Subtitle Sync & Quality Scoring Engine

**Document Version:** 1.0

---

## 1. Purpose

This document specifies the **Subtitle Scoring Engine** — the set of algorithms responsible for:

1. **Sync scoring** — measuring how accurately subtitle cues are timed to audio
2. **Quality scoring** — measuring the quality of translation and parsed subtitle text
3. **Import health scoring** — giving each imported video a confidence score that tells the UI how reliable its subtitle data is

These scores are computed server-side during import and stored in `meta.json`. The frontend uses them to display quality indicators to the user.

---

## 2. Scoring Overview

Each imported video receives three scores, all in the range **0–100**:

| Score | Name | What it measures |
|---|---|---|
| `syncScore` | Sync Accuracy Score | How well subtitle timestamps align with audio |
| `qualityScore` | Text Quality Score | Cleanliness and completeness of subtitle text |
| `translationScore` | Translation Quality Score | Confidence in the DE→EN translation quality |

A fourth composite score is derived:

| Score | Name | Formula |
|---|---|---|
| `overallScore` | Overall Health Score | `(syncScore * 0.4) + (qualityScore * 0.3) + (translationScore * 0.3)` |

**Score thresholds:**

| Range | Label | UI indicator |
|---|---|---|
| 80–100 | Excellent | Green badge ✅ |
| 60–79 | Good | Blue badge 🔵 |
| 40–59 | Fair | Yellow badge ⚠️ |
| 0–39 | Poor | Red badge ❌ |

---

## 3. Sync Accuracy Score (`syncScore`)

### 3.1 Purpose

Measures whether subtitle timestamps match the expected duration and spacing of natural speech. This is an **heuristic score** because DualSub does not have access to raw audio — it cannot do forced alignment. Instead it uses statistical properties of the cue timings.

### 3.2 Algorithm

```
syncScore = 100 - penalty

penalty = clamp(
    (shortCuesPenalty + longGapsPenalty + overlapPenalty + durationAnomalyPenalty),
    0, 100
)
```

#### Signal 1: Short Cue Duration Penalty

Cues shorter than 0.3 seconds are unlikely to be intentional — they indicate timestamp parsing errors.

```javascript
function shortCuesPenalty(cues) {
  const shortCues = cues.filter(c => (c.end - c.start) < 0.3);
  const ratio = shortCues.length / cues.length;
  return Math.round(ratio * 40);  // Up to 40 penalty points
}
```

#### Signal 2: Long Gap Penalty

Gaps between cues greater than 30 seconds in a cartoon context suggest missing subtitle data.

```javascript
function longGapsPenalty(cues) {
  let longGaps = 0;
  for (let i = 1; i < cues.length; i++) {
    const gap = cues[i].start - cues[i - 1].end;
    if (gap > 30) longGaps++;
  }
  const ratio = longGaps / Math.max(cues.length - 1, 1);
  return Math.round(ratio * 30);  // Up to 30 penalty points
}
```

#### Signal 3: Cue Overlap Penalty

Overlapping cues (end of cue N > start of cue N+1) indicate a malformed VTT file.

```javascript
function overlapPenalty(cues) {
  let overlaps = 0;
  for (let i = 1; i < cues.length; i++) {
    if (cues[i - 1].end > cues[i].start) overlaps++;
  }
  const ratio = overlaps / Math.max(cues.length - 1, 1);
  return Math.round(ratio * 30);  // Up to 30 penalty points
}
```

#### Signal 4: Cue Density Anomaly

Expected density for a cartoon: 1–6 cues per minute of dialogue. Extreme outliers suggest corrupt data.

```javascript
function durationAnomalyPenalty(cues, videoDurationSeconds) {
  const cuesPerMinute = (cues.length / videoDurationSeconds) * 60;
  if (cuesPerMinute < 0.5 || cuesPerMinute > 20) return 20;
  return 0;
}
```

### 3.3 Sync Score Calculation

```javascript
function computeSyncScore(cues, videoDurationSeconds) {
  if (!cues || cues.length === 0) return 0;

  const penalty =
    shortCuesPenalty(cues) +
    longGapsPenalty(cues) +
    overlapPenalty(cues) +
    durationAnomalyPenalty(cues, videoDurationSeconds);

  return Math.max(0, 100 - penalty);
}
```

---

## 4. Text Quality Score (`qualityScore`)

### 4.1 Purpose

Measures the cleanliness and completeness of the subtitle text content itself — regardless of language.

### 4.2 Algorithm

```
qualityScore = 100 - penalty

penalty = (
    emptyTextPenalty +
    residualTagPenalty +
    duplicateCuePenalty +
    capsLockPenalty +
    veryShortTextPenalty
)
```

#### Signal 1: Empty Text Penalty

Cues with empty or whitespace-only text that weren't filtered.

```javascript
function emptyTextPenalty(cues) {
  const empty = cues.filter(c => !c.text || c.text.trim().length === 0);
  return Math.round((empty.length / cues.length) * 30);
}
```

#### Signal 2: Residual Tag Penalty

VTT inline tags that weren't stripped during parsing (e.g. `<c>`, `</c>`).

```javascript
function residualTagPenalty(cues) {
  const withTags = cues.filter(c => /<[^>]+>/.test(c.text));
  return Math.round((withTags.length / cues.length) * 20);
}
```

#### Signal 3: Duplicate Cue Penalty

Consecutive cues with identical text (common in auto-generated captions that repeat words).

```javascript
function duplicateCuePenalty(cues) {
  let dupes = 0;
  for (let i = 1; i < cues.length; i++) {
    if (cues[i].text.trim() === cues[i - 1].text.trim()) dupes++;
  }
  return Math.round((dupes / cues.length) * 25);
}
```

#### Signal 4: ALL CAPS Anomaly

More than 30% of cues in ALL CAPS suggests a malformed or stylised track.

```javascript
function capsLockPenalty(cues) {
  const allCaps = cues.filter(c => c.text === c.text.toUpperCase() && c.text.length > 3);
  const ratio = allCaps.length / cues.length;
  return ratio > 0.3 ? 15 : 0;
}
```

#### Signal 5: Very Short Text Penalty

Cues with fewer than 3 characters after stripping (e.g. `"."`, `"-"`) suggest noise.

```javascript
function veryShortTextPenalty(cues) {
  const tooShort = cues.filter(c => c.text.trim().length < 3);
  return Math.round((tooShort.length / cues.length) * 10);
}
```

### 4.3 Quality Score Calculation

```javascript
function computeQualityScore(cues) {
  if (!cues || cues.length === 0) return 0;

  const penalty =
    emptyTextPenalty(cues) +
    residualTagPenalty(cues) +
    duplicateCuePenalty(cues) +
    capsLockPenalty(cues) +
    veryShortTextPenalty(cues);

  return Math.max(0, 100 - Math.min(penalty, 100));
}
```

---

## 5. Translation Quality Score (`translationScore`)

### 5.1 Purpose

Estimates the quality of the English translation. This score applies only when EN cues were generated by machine translation (not a native EN track).

If the English track is a **native YouTube EN track**, `translationScore` is set to **100** automatically.

### 5.2 Algorithm

Machine translation quality is estimated using heuristics since DualSub doesn't run a quality estimation model:

```
translationScore = baseScore - penalty

baseScore:
  - native_youtube_manual:  100
  - native_youtube_auto:     90
  - translated_deepl:        75  (DeepL is high-quality)
  - translated_libretranslate: 60
  - unknown:                 50
```

Penalties applied on top of base score:

#### Signal 1: Untranslated German Words

German words remaining in the EN text (detected by checking for common German articles: "der", "die", "das", "und", "ich", "ist").

```javascript
function untranslatedWordsPenalty(enCues, deCues) {
  const germanMarkers = /\b(der|die|das|und|ich|ist|ein|eine|nicht)\b/gi;
  const enText = enCues.map(c => c.text).join(' ');
  const matches = (enText.match(germanMarkers) || []).length;
  const ratio = matches / enCues.length;
  return Math.min(Math.round(ratio * 20), 20);
}
```

#### Signal 2: Suspiciously Short Translations

EN cue text that is less than 40% of the DE cue text length (indicating incomplete translation).

```javascript
function shortTranslationPenalty(enCues, deCues) {
  let shortCount = 0;
  const minPairs = Math.min(enCues.length, deCues.length);
  for (let i = 0; i < minPairs; i++) {
    const deLen = deCues[i].text.length;
    const enLen = enCues[i].text.length;
    if (deLen > 5 && enLen < deLen * 0.4) shortCount++;
  }
  return Math.round((shortCount / minPairs) * 15);
}
```

### 5.3 Translation Score Calculation

```javascript
function computeTranslationScore(enCues, deCues, enSource) {
  if (!enCues || enCues.length === 0) return 0;

  const baseScores = {
    'youtube_manual':           100,
    'youtube_auto':              90,
    'translated_deepl':          75,
    'translated_libretranslate': 60
  };

  const base = baseScores[enSource] ?? 50;

  if (enSource === 'youtube_manual' || enSource === 'youtube_auto') {
    return base; // No penalty for native tracks
  }

  const penalty =
    untranslatedWordsPenalty(enCues, deCues) +
    shortTranslationPenalty(enCues, deCues);

  return Math.max(0, base - penalty);
}
```

---

## 6. Overall Health Score

```javascript
function computeOverallScore(syncScore, qualityScore, translationScore) {
  return Math.round(
    (syncScore * 0.4) +
    (qualityScore * 0.3) +
    (translationScore * 0.3)
  );
}
```

---

## 7. Stored Output

All scores are written to `meta.json` after import:

```json
{
  "videoId": "dQw4w9WgXcQ",
  "scores": {
    "syncScore":        88,
    "qualityScore":     92,
    "translationScore": 72,
    "overallScore":     84
  }
}
```

---

## 8. Frontend Display Logic

```javascript
function getScoreBadge(score) {
  if (score >= 80) return { label: "Excellent", color: "green",  icon: "✅" };
  if (score >= 60) return { label: "Good",      color: "blue",   icon: "🔵" };
  if (score >= 40) return { label: "Fair",       color: "yellow", icon: "⚠️" };
  return              { label: "Poor",       color: "red",    icon: "❌" };
}
```

The overall score badge is shown as a small pill below the video title after import.

---

## 9. Score Computation Trigger

Scores are computed **once during import** inside `importService.js`, after VTT parsing and translation are complete:

```javascript
// In importService.js
const syncScore        = computeSyncScore(deCues, meta.duration);
const qualityScore     = computeQualityScore(deCues);
const translationScore = computeTranslationScore(enCues, deCues, meta.enSource);
const overallScore     = computeOverallScore(syncScore, qualityScore, translationScore);

meta.scores = { syncScore, qualityScore, translationScore, overallScore };
await cacheService.writeMeta(videoId, meta);
```

Scores are NOT recomputed on subsequent cache hits.
