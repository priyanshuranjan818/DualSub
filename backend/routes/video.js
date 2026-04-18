const express = require('express');
const router = express.Router();
const { getVideoStreamUrl } = require('../services/ytdlpService');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * GET /api/video/:videoId/stream
 *
 * Returns a 302 redirect to a direct YouTube CDN stream URL obtained via yt-dlp.
 * The browser fetches the video directly from YouTube CDN using the user's own IP,
 * bypassing YouTube's embed restrictions on EC2/datacenter IPs.
 */
router.get('/:videoId/stream', async (req, res, next) => {
  try {
    const { videoId } = req.params;

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      throw new AppError(400, 'INVALID_VIDEO_ID', 'Invalid video ID format');
    }

    logger.info({ videoId }, 'Fetching direct stream URL');
    const streamUrl = await getVideoStreamUrl(videoId);

    // Redirect browser to the direct CDN URL.
    // The browser (user's IP) fetches the video — not the EC2 server.
    res.redirect(302, streamUrl);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
