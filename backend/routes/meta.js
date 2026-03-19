const express = require('express');
const router = express.Router();
const { isValidVideoId } = require('../validators/videoIdValidator');
const cacheService = require('../services/cacheService');
const { AppError } = require('../utils/errors');
const { ERROR_CODES, ERROR_MESSAGES } = require('@dualsub/shared');

router.get('/:videoId', (req, res, next) => {
  try {
    const { videoId } = req.params;

    if (!isValidVideoId(videoId)) {
      throw new AppError(400, ERROR_CODES.INVALID_VIDEO_ID, ERROR_MESSAGES[ERROR_CODES.INVALID_VIDEO_ID]);
    }

    const meta = cacheService.readMeta(videoId);
    if (!meta) {
      throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Video not found. Import it first.');
    }

    res.json(meta);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
