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
async function importVideo(videoId) {
  // ── 1. Check cache ──────────────────────────────────────────────────────
  if (cacheService.exists(videoId)) {
    const meta = cacheService.readMeta(videoId);
    if (meta) {
      logger.info({ videoId }, 'Serving from cache');
      return { ...meta, cached: true, ready: true };
    }
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

  // ── 3. Fetch subtitle files ─────────────────────────────────────────────
  let subtitlePaths;
  try {
    subtitlePaths = await ytdlpService.fetchSubtitles(videoId);
  } catch (err) {
    throw new AppError(500, ERROR_CODES.EXTRACTION_FAILED, ERROR_MESSAGES[ERROR_CODES.EXTRACTION_FAILED]);
  }

  // ── 4. Parse German subtitles ───────────────────────────────────────────
  let deCues = [];
  let deSource = null;

  if (subtitlePaths.deFilePath && fs.existsSync(subtitlePaths.deFilePath)) {
    const stat = fs.statSync(subtitlePaths.deFilePath);
    if (stat.size > config.MAX_VTT_SIZE_BYTES) {
      throw new AppError(413, ERROR_CODES.PAYLOAD_TOO_LARGE, 'VTT file too large');
    }
    const vttContent = fs.readFileSync(subtitlePaths.deFilePath, 'utf-8');
    deCues = parseVTT(vttContent);
    deSource = subtitlePaths.deFilePath.includes('.auto.') ? SOURCE_TYPES.YOUTUBE_AUTO : SOURCE_TYPES.YOUTUBE_AUTO;
  }

  if (deCues.length === 0) {
    throw new AppError(422, ERROR_CODES.NO_SUBTITLES, ERROR_MESSAGES[ERROR_CODES.NO_SUBTITLES]);
  }

  // ── 5. Parse or translate English subtitles ─────────────────────────────
  let enCues = [];
  let enSource = null;
  let translationRequired = false;

  if (subtitlePaths.enFilePath && fs.existsSync(subtitlePaths.enFilePath)) {
    const stat = fs.statSync(subtitlePaths.enFilePath);
    if (stat.size <= config.MAX_VTT_SIZE_BYTES) {
      const vttContent = fs.readFileSync(subtitlePaths.enFilePath, 'utf-8');
      enCues = parseVTT(vttContent);
      enSource = SOURCE_TYPES.YOUTUBE_AUTO;
    }
  }

  if (enCues.length === 0) {
    // Try DeepL translation
    translationRequired = true;
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
    cacheVersion: 1,
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
