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
      let files = [];
      try { files = fs.readdirSync(videoDir); } catch (e) {}
      const deFile = files.find(f => f.includes('.de.') && f.endsWith('.vtt'));
      const enFile = files.find(f => f.includes('.en.') && f.endsWith('.vtt'));

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

/**
 * Downloads the audio track of a YouTube video using yt-dlp.
 * Tries to fetch native m4a stream to keep file size small and avoid ffmpeg.
 */
async function downloadAudio(videoId) {
  const videoDir = path.join(config.CACHE_DIR, videoId);
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }

  const audioPath = path.join(videoDir, `${videoId}.audio.m4a`);
  
  if (fs.existsSync(audioPath)) {
    return audioPath;
  }

  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const args = [
    '--js-runtimes', 'node',
    '-f', 'worstaudio[ext=m4a]/worstaudio',
    '--output', audioPath,
    '--no-overwrites',
    videoUrl,
  ];

  logger.info({ videoId, audioPath }, 'Running yt-dlp to download native audio stream');

  return new Promise((resolve, reject) => {
    execFile(config.YTDLP_PATH, args, {
      timeout: config.YTDLP_TIMEOUT_MS * 3, 
      maxBuffer: 1024 * 1024 * 20,
    }, (err, stdout, stderr) => {
      if (err) {
        logger.error({ videoId, stderr: stderr?.substring(0, 500) }, 'yt-dlp audio download failed');
        // Let it fall through, yt-dlp sometimes exits with error code on playlists/formats
      }

      if (fs.existsSync(audioPath)) {
        logger.info({ videoId, size: fs.statSync(audioPath).size }, 'Audio download complete');
        resolve(audioPath);
      } else {
        // Did it download as webm? (worstaudio fallback might not be m4a)
        let files = [];
        try { files = fs.readdirSync(videoDir); } catch (e) {}
        const fallbackAudio = files.find(f => f.startsWith(`${videoId}.audio.`) && !f.endsWith('.vtt') && !f.endsWith('.json'));
        
        if (fallbackAudio) {
           const finalPath = path.join(videoDir, fallbackAudio);
           logger.info({ videoId, finalPath }, 'Audio downloaded to alternate format successfully');
           resolve(finalPath);
        } else {
          reject(new Error(`yt-dlp failed to create any audio file. Stderr: ${stderr?.substring(0, 200)}`));
        }
      }
    });
  });
}

module.exports = { fetchSubtitles, fetchVideoInfo, downloadAudio };
