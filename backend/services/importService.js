const fs = require('fs');
const { AppError } = require('../utils/errors');
const { ERROR_CODES, ERROR_MESSAGES, SOURCE_TYPES } = require('@dualsub/shared');
const cacheService = require('./cacheService');
const ytdlpService = require('./ytdlpService');
const { parseVTT } = require('./vttParser');
const { translateCues } = require('./translatorService');
const { computeAllScores } = require('./scoringEngine');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Main import pipeline — orchestrates subtitle extraction, parsing, translation, scoring, and caching.
 */
async function importVideo(videoId, providedApiKey = null) {
  // ── 1. Check cache ──────────────────────────────────────────────────────
  // cacheVersion 3: Replaced YouTube auto-captions with Groq Whisper transcription.
  const CURRENT_CACHE_VERSION = 3;
  if (cacheService.exists(videoId)) {
    const meta = cacheService.readMeta(videoId);
    if (meta && (meta.cacheVersion || 1) >= CURRENT_CACHE_VERSION) {
      logger.info({ videoId }, 'Serving from cache');
      return { ...meta, cached: true, ready: true };
    }
    logger.info({ videoId, cacheVersion: meta?.cacheVersion }, 'Cache stale — re-processing');
  }

  // ── 2. Fetch video info ─────────────────────────────────────────────────
  let videoInfo;
  try {
    videoInfo = await ytdlpService.fetchVideoInfo(videoId);
  } catch (err) {
    if (err.message === 'VIDEO_UNAVAILABLE') {
      throw new AppError(422, ERROR_CODES.VIDEO_UNAVAILABLE, ERROR_MESSAGES[ERROR_CODES.VIDEO_UNAVAILABLE]);
    }
    throw new AppError(500, ERROR_CODES.EXTRACTION_FAILED, ERROR_MESSAGES[ERROR_CODES.EXTRACTION_FAILED]);
  }

  // ── 3. Download Audio for Transcription ─────────────────────────────────
  let audioPath;
  try {
    audioPath = await ytdlpService.downloadAudio(videoId);
  } catch (err) {
    if (err.message === 'VIDEO_UNAVAILABLE') {
      throw new AppError(422, ERROR_CODES.VIDEO_UNAVAILABLE, ERROR_MESSAGES[ERROR_CODES.VIDEO_UNAVAILABLE]);
    }
    throw new AppError(500, ERROR_CODES.EXTRACTION_FAILED, ERROR_MESSAGES[ERROR_CODES.EXTRACTION_FAILED]);
  }

  // ── 4. Transcribe Audio (Groq Whisper) ──────────────────────────────────
  let deCues = [];
  let deSource = null;

  try {
    const groqService = require('./groqService');
    deCues = await groqService.transcribeAudio(audioPath, 'de', providedApiKey);
    deSource = SOURCE_TYPES.GROQ_WHISPER;
    
    // Clean up audio file to save space
    if (fs.existsSync(audioPath)) {
      fs.unlinkSync(audioPath);
    }
  } catch (err) {
    logger.error({ error: err.message }, 'Groq transcription failed inside importService');
    throw new AppError(500, ERROR_CODES.EXTRACTION_FAILED, 'Audio transcription failed. Ensure GROQ_API_KEY is valid.');
  }

  if (deCues.length === 0) {
    throw new AppError(422, ERROR_CODES.NO_SUBTITLES, ERROR_MESSAGES[ERROR_CODES.NO_SUBTITLES]);
  }

  // ── 5. Translate to English ──────────────────────────────────────────────
  let enCues = [];
  let enSource = null;
  let translationRequired = true; // We always translate from the transcribed audio now
  try {
    const translated = await translateCues(deCues);
    if (translated && translated.length > 0) {
      enCues = translated;
      enSource = SOURCE_TYPES.TRANSLATED_DEEPL;
    }
  } catch (err) {
    logger.warn({ videoId, error: err.message }, 'Translation failed, continuing with DE only');
    enSource = null;
  }

  // ── 6. Compute scores ──────────────────────────────────────────────────
  const scores = computeAllScores(deCues, enCues, videoInfo.duration, enSource);

  // ── 7. Build and save metadata ─────────────────────────────────────────
  const meta = {
    videoId,
    title: videoInfo.title,
    duration: videoInfo.duration,
    thumbnailUrl: videoInfo.thumbnailUrl,
    importedAt: new Date().toISOString(),
    hasDe: deCues.length > 0,
    hasEn: enCues.length > 0,
    deSource,
    enSource,
    translationRequired,
    scores,
    cacheVersion: CURRENT_CACHE_VERSION,
  };

  cacheService.writeMeta(videoId, meta);
  cacheService.writeSubtitles(videoId, 'de', deCues);
  if (enCues.length > 0) {
    cacheService.writeSubtitles(videoId, 'en', enCues);
  }

  logger.info({ videoId, title: meta.title, deCues: deCues.length, enCues: enCues.length }, 'Import complete');

  return { ...meta, cached: false, ready: true };
}

module.exports = { importVideo };
