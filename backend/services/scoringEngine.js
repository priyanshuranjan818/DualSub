/**
 * Scoring Engine — computes sync, quality, and translation scores for imported subtitles.
 */

// ── Sync Score ──────────────────────────────────────────────────────────────

function shortCuesPenalty(cues) {
  const shortCues = cues.filter(c => (c.end - c.start) < 0.3);
  return Math.round((shortCues.length / cues.length) * 40);
}

function longGapsPenalty(cues) {
  let longGaps = 0;
  for (let i = 1; i < cues.length; i++) {
    const gap = cues[i].start - cues[i - 1].end;
    if (gap > 30) longGaps++;
  }
  return Math.round((longGaps / Math.max(cues.length - 1, 1)) * 30);
}

function overlapPenalty(cues) {
  let overlaps = 0;
  for (let i = 1; i < cues.length; i++) {
    if (cues[i - 1].end > cues[i].start) overlaps++;
  }
  return Math.round((overlaps / Math.max(cues.length - 1, 1)) * 30);
}

function durationAnomalyPenalty(cues, videoDurationSeconds) {
  if (!videoDurationSeconds || videoDurationSeconds <= 0) return 0;
  const cuesPerMinute = (cues.length / videoDurationSeconds) * 60;
  if (cuesPerMinute < 0.5 || cuesPerMinute > 20) return 20;
  return 0;
}

function computeSyncScore(cues, videoDurationSeconds) {
  if (!cues || cues.length === 0) return 0;
  const penalty = shortCuesPenalty(cues) + longGapsPenalty(cues) +
    overlapPenalty(cues) + durationAnomalyPenalty(cues, videoDurationSeconds);
  return Math.max(0, 100 - penalty);
}

// ── Quality Score ───────────────────────────────────────────────────────────

function emptyTextPenalty(cues) {
  const empty = cues.filter(c => !c.text || c.text.trim().length === 0);
  return Math.round((empty.length / cues.length) * 30);
}

function residualTagPenalty(cues) {
  const withTags = cues.filter(c => /<[^>]+>/.test(c.text));
  return Math.round((withTags.length / cues.length) * 20);
}

function duplicateCuePenalty(cues) {
  let dupes = 0;
  for (let i = 1; i < cues.length; i++) {
    if (cues[i].text.trim() === cues[i - 1].text.trim()) dupes++;
  }
  return Math.round((dupes / cues.length) * 25);
}

function capsLockPenalty(cues) {
  const allCaps = cues.filter(c => c.text === c.text.toUpperCase() && c.text.length > 3);
  return allCaps.length / cues.length > 0.3 ? 15 : 0;
}

function veryShortTextPenalty(cues) {
  const tooShort = cues.filter(c => c.text.trim().length < 3);
  return Math.round((tooShort.length / cues.length) * 10);
}

function computeQualityScore(cues) {
  if (!cues || cues.length === 0) return 0;
  const penalty = emptyTextPenalty(cues) + residualTagPenalty(cues) +
    duplicateCuePenalty(cues) + capsLockPenalty(cues) + veryShortTextPenalty(cues);
  return Math.max(0, 100 - Math.min(penalty, 100));
}

// ── Translation Score ───────────────────────────────────────────────────────

function untranslatedWordsPenalty(enCues) {
  const germanMarkers = /\b(der|die|das|und|ich|ist|ein|eine|nicht)\b/gi;
  const enText = enCues.map(c => c.text).join(' ');
  const matches = (enText.match(germanMarkers) || []).length;
  const ratio = matches / enCues.length;
  return Math.min(Math.round(ratio * 20), 20);
}

function shortTranslationPenalty(enCues, deCues) {
  let shortCount = 0;
  const minPairs = Math.min(enCues.length, deCues.length);
  for (let i = 0; i < minPairs; i++) {
    const deLen = deCues[i].text.length;
    const enLen = enCues[i].text.length;
    if (deLen > 5 && enLen < deLen * 0.4) shortCount++;
  }
  return Math.round((shortCount / Math.max(minPairs, 1)) * 15);
}

function computeTranslationScore(enCues, deCues, enSource) {
  if (!enCues || enCues.length === 0) return 0;

  const baseScores = {
    youtube_manual: 100,
    youtube_auto: 90,
    translated_deepl: 75,
    translated_libretranslate: 60,
  };

  const base = baseScores[enSource] ?? 50;

  if (enSource === 'youtube_manual' || enSource === 'youtube_auto') {
    return base;
  }

  const penalty = untranslatedWordsPenalty(enCues) + shortTranslationPenalty(enCues, deCues);
  return Math.max(0, base - penalty);
}

// ── Overall Score ───────────────────────────────────────────────────────────

function computeOverallScore(syncScore, qualityScore, translationScore) {
  return Math.round(
    syncScore * 0.4 + qualityScore * 0.3 + translationScore * 0.3
  );
}

function computeAllScores(deCues, enCues, videoDuration, enSource) {
  const syncScore = computeSyncScore(deCues, videoDuration);
  const qualityScore = computeQualityScore(deCues);
  const translationScore = computeTranslationScore(enCues, deCues, enSource);
  const overallScore = computeOverallScore(syncScore, qualityScore, translationScore);
  return { syncScore, qualityScore, translationScore, overallScore };
}

module.exports = { computeAllScores, computeSyncScore, computeQualityScore, computeTranslationScore, computeOverallScore };
