const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Builds the rotating proxy pool from environment variables.
 *
 * Priority:
 *  1. YTDLP_PROXY_LIST — comma-separated list of proxy URLs (supports rotation).
 *     e.g. http://user:pass@1.2.3.4:1000,http://user:pass@5.6.7.8:2000
 *  2. YTDLP_PROXY — single proxy URL (legacy / simple setup).
 *
 * Returns an empty array if neither variable is set (proxy disabled).
 */
const _proxyPool = (() => {
  if (config.YTDLP_PROXY_LIST) {
    return config.YTDLP_PROXY_LIST
      .split(',')
      .map(p => p.trim())
      .filter(p => p.startsWith('http') || p.startsWith('socks'));
  }
  if (config.YTDLP_PROXY) {
    return [config.YTDLP_PROXY.trim()];
  }
  return [];
})();

if (_proxyPool.length > 0) {
  logger.info({ count: _proxyPool.length }, `yt-dlp rotating proxy pool loaded`);
}

/**
 * Randomly picks one proxy from the pool and returns the yt-dlp args for it.
 * Returns [] when no proxies are configured (local dev / proxy disabled).
 */
function proxyArgs() {
  if (_proxyPool.length === 0) return [];
  const proxy = _proxyPool[Math.floor(Math.random() * _proxyPool.length)];
  // Mask credentials in logs (show only host:port)
  const masked = proxy.replace(/\/\/[^@]+@/, '//<credentials>@');
  logger.debug({ proxy: masked }, 'yt-dlp using proxy');
  return ['--proxy', proxy];
}

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
    ...proxyArgs(),
    videoUrl,
  ];

  const cookiesPath = path.join(process.cwd(), 'cookies.txt');
  if (fs.existsSync(cookiesPath)) { args.push('--cookies', cookiesPath); }

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
    const args = [
      '--js-runtimes', 'node',
      '--dump-json',
      '--skip-download',
      '--no-warnings',
      '--ignore-no-formats-error',
      ...proxyArgs(),
      videoUrl,
    ];

    const cookiesPath = path.join(process.cwd(), 'cookies.txt');
    if (fs.existsSync(cookiesPath)) { args.push('--cookies', cookiesPath); }

    execFile(config.YTDLP_PATH, args, {
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
    ...proxyArgs(),
    videoUrl,
  ];

  const cookiesPath = path.join(process.cwd(), 'cookies.txt');
  if (fs.existsSync(cookiesPath)) { args.push('--cookies', cookiesPath); }

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

/**
 * Extracts a direct YouTube CDN stream URL using yt-dlp --get-url.
 * No file is downloaded — just the URL string is returned.
 * The caller can redirect the browser to this URL so the video is fetched
 * directly by the user's browser (not the server), bypassing EC2 embed blocks.
 */
async function getVideoStreamUrl(videoId) {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // Prefer: best mp4 video+audio combined (browser-native playback, no muxing needed)
  // Fallback chain: best single-file mp4 → best overall
  const args = [
    '--js-runtimes', 'node',
    '--get-url',
    '-f', 'best[ext=mp4]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best',
    '--no-warnings',
    '--ignore-no-formats-error',
    ...proxyArgs(),
    videoUrl,
  ];

  const cookiesPath = path.join(process.cwd(), 'cookies.txt');
  if (fs.existsSync(cookiesPath)) { args.push('--cookies', cookiesPath); }

  logger.info({ videoId }, 'Extracting direct stream URL via yt-dlp --get-url');

  return new Promise((resolve, reject) => {
    execFile(config.YTDLP_PATH, args, {
      timeout: config.YTDLP_TIMEOUT_MS,
      maxBuffer: 1024 * 1024 * 2,
    }, (err, stdout, stderr) => {
      if (err) {
        logger.error({ videoId, stderr: stderr?.substring(0, 300) }, 'yt-dlp --get-url failed');
        return reject(new Error(`Could not get stream URL: ${stderr?.substring(0, 200) || err.message}`));
      }

      // stdout may contain multiple URLs (video + audio) separated by newlines.
      // We take the first valid URL (the video stream).
      const urls = stdout.trim().split('\n').map(u => u.trim()).filter(u => u.startsWith('http'));
      if (urls.length === 0) {
        return reject(new Error('yt-dlp returned no stream URL'));
      }

      logger.info({ videoId }, 'Got direct stream URL');
      resolve(urls[0]);
    });
  });
}

module.exports = { fetchSubtitles, fetchVideoInfo, downloadAudio, getVideoStreamUrl };
