const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');

function getVideoDir(videoId) {
  return path.join(config.CACHE_DIR, videoId);
}

function exists(videoId) {
  const deFile = path.join(getVideoDir(videoId), 'subtitles.de.json');
  return fs.existsSync(deFile);
}

function readMeta(videoId) {
  const metaPath = path.join(getVideoDir(videoId), 'meta.json');
  if (!fs.existsSync(metaPath)) return null;
  return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
}

function readSubtitles(videoId, lang) {
  const filePath = path.join(getVideoDir(videoId), `subtitles.${lang}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeMeta(videoId, meta) {
  const dir = getVideoDir(videoId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf-8');
  logger.info({ videoId }, 'Wrote meta.json');
}

function writeSubtitles(videoId, lang, cues) {
  const dir = getVideoDir(videoId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `subtitles.${lang}.json`), JSON.stringify(cues, null, 2), 'utf-8');
  logger.info({ videoId, lang, cueCount: cues.length }, 'Wrote subtitle cache');
}

function getCacheSize() {
  try {
    let totalSize = 0;
    const dirs = fs.readdirSync(config.CACHE_DIR);
    for (const dir of dirs) {
      const dirPath = path.join(config.CACHE_DIR, dir);
      if (fs.statSync(dirPath).isDirectory()) {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
          const filePath = path.join(dirPath, file);
          if (fs.statSync(filePath).isFile()) {
            totalSize += fs.statSync(filePath).size;
          }
        }
      }
    }
    if (totalSize > 1024 * 1024) return `${(totalSize / (1024 * 1024)).toFixed(1)}MB`;
    if (totalSize > 1024) return `${(totalSize / 1024).toFixed(1)}KB`;
    return `${totalSize}B`;
  } catch {
    return '0B';
  }
}

module.exports = { exists, readMeta, readSubtitles, writeMeta, writeSubtitles, getCacheSize, getVideoDir };
