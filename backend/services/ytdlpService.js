const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Fetches subtitle VTT files for a YouTube video using yt-dlp.
 * Returns paths to the downloaded .vtt files.
 */
async function fetchSubtitles(videoId) {
  const videoDir = path.join(config.CACHE_DIR, videoId);
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }

  const outputTemplate = path.join(videoDir, videoId);
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const args = [
    '--js-runtimes', 'node',
    '--write-auto-subs',
    '--write-subs',
    '--sub-langs', 'de,en',
    '--skip-download',
    '--convert-subs', 'vtt',
    '--ignore-no-formats-error',
    '--output', outputTemplate,
    '--no-overwrites',
    videoUrl,
  ];

  logger.info({ videoId }, 'Running yt-dlp to fetch subtitles');

  return new Promise((resolve, reject) => {
    const proc = execFile(config.YTDLP_PATH, args, {
      timeout: config.YTDLP_TIMEOUT_MS,
      maxBuffer: 1024 * 1024 * 10,
    }, (err, stdout, stderr) => {
      if (err) {
        logger.warn({ videoId, stderr: stderr?.substring(0, 500) }, 'yt-dlp exited with error (may still have written subtitle files)');
      } else {
        logger.info({ videoId, stdout: stdout?.substring(0, 200) }, 'yt-dlp completed');
      }

      // Always check for VTT files — yt-dlp may exit with error code
      // but still successfully write subtitle files (e.g. 429 on video formats)
      let files = [];
      try { files = fs.readdirSync(videoDir); } catch (e) {}
      const deFile = files.find(f => f.includes('.de.') && f.endsWith('.vtt'));
      const enFile = files.find(f => f.includes('.en.') && f.endsWith('.vtt'));

      // Only reject if yt-dlp errored AND no subtitle files were created
      if (err && !deFile && !enFile) {
        return reject(new Error(`yt-dlp failed: ${stderr?.substring(0, 200) || err.message}`));
      }

      resolve({
        deFilePath: deFile ? path.join(videoDir, deFile) : null,
        enFilePath: enFile ? path.join(videoDir, enFile) : null,
        videoDir,
      });
    });
  });
}

/**
 * Fetches video metadata using yt-dlp --dump-json.
 */
async function fetchVideoInfo(videoId) {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return new Promise((resolve, reject) => {
    execFile(config.YTDLP_PATH, [
      '--js-runtimes', 'node',
      '--dump-json',
      '--skip-download',
      '--no-warnings',
      '--ignore-no-formats-error',
      videoUrl,
    ], {
      timeout: config.YTDLP_TIMEOUT_MS,
      maxBuffer: 1024 * 1024 * 10,
    }, (err, stdout, stderr) => {
      if (err) {
        logger.error({ videoId, stderr: stderr?.substring(0, 300) }, 'yt-dlp info fetch failed');

        // Check for common error patterns
        const errStr = stderr?.toLowerCase() || '';
        if (errStr.includes('private video') || errStr.includes('video unavailable') || errStr.includes('video is not available')) {
          return reject(new Error('VIDEO_UNAVAILABLE'));
        }
        return reject(new Error(`yt-dlp info failed: ${err.message}`));
      }

      try {
        const info = JSON.parse(stdout);
        resolve({
          title: info.title || 'Unknown',
          duration: info.duration || 0,
          thumbnailUrl: info.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        });
      } catch (e) {
        resolve({
          title: 'Unknown',
          duration: 0,
          thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        });
      }
    });
  });
}

module.exports = { fetchSubtitles, fetchVideoInfo };
