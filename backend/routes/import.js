const express = require('express');
const router = express.Router();
const { validateYouTubeUrl } = require('../validators/urlValidator');
const { importVideo } = require('../services/importService');
const { AppError } = require('../utils/errors');
const { ERROR_CODES, ERROR_MESSAGES } = require('@dualsub/shared');

router.post('/', async (req, res, next) => {
  try {
    const { url } = req.body;

    // Validate URL
    const validation = validateYouTubeUrl(url);
    if (!validation.valid) {
      throw new AppError(400, validation.errorCode, ERROR_MESSAGES[validation.errorCode]);
    }

    const videoId = validation.videoId;

    // Run import pipeline
    const result = await importVideo(videoId);

    res.json({
      videoId: result.videoId,
      title: result.title,
      duration: result.duration,
      thumbnailUrl: result.thumbnailUrl,
      hasDe: result.hasDe,
      hasEn: result.hasEn,
      deSource: result.deSource,
      enSource: result.enSource,
      translationRequired: result.translationRequired,
      cached: result.cached,
      ready: result.ready,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
