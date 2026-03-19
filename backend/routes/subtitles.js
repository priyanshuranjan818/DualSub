const express = require('express');
const router = express.Router();
const { isValidVideoId } = require('../validators/videoIdValidator');
const cacheService = require('../services/cacheService');
const { AppError } = require('../utils/errors');
const { ERROR_CODES, ERROR_MESSAGES, SUPPORTED_LANGS } = require('@dualsub/shared');

router.get('/:videoId/:lang', (req, res, next) => {
  try {
    const { videoId, lang } = req.params;

    // Validate video ID
    if (!isValidVideoId(videoId)) {
      throw new AppError(400, ERROR_CODES.INVALID_VIDEO_ID, ERROR_MESSAGES[ERROR_CODES.INVALID_VIDEO_ID]);
    }

    // Validate language
    if (!SUPPORTED_LANGS.includes(lang)) {
      throw new AppError(400, ERROR_CODES.INVALID_LANG, ERROR_MESSAGES[ERROR_CODES.INVALID_LANG]);
    }

    // Check if video exists in cache
    if (!cacheService.exists(videoId)) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, ERROR_MESSAGES[ERROR_CODES.NOT_FOUND]);
    }

    // Read subtitles
    const cues = cacheService.readSubtitles(videoId, lang);
    if (!cues) {
      throw new AppError(404, ERROR_CODES.LANG_NOT_AVAILABLE,
        `No ${lang === 'en' ? 'English' : 'German'} subtitle track available for this video.`);
    }

    res.json(cues);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
