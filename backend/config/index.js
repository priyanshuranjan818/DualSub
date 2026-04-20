const path = require('path');

const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3001,
  CACHE_DIR: process.env.CACHE_DIR || path.join(__dirname, '..', 'cache'),
  DEEPL_KEY: process.env.DEEPL_KEY || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 3600000,
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 10,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  YTDLP_PATH: process.env.YTDLP_PATH || 'yt-dlp',
  YTDLP_TIMEOUT_MS: parseInt(process.env.YTDLP_TIMEOUT_MS, 10) || 60000,
  // Optional residential proxy to bypass YouTube datacenter IP blocks.
  // Format: http://user:pass@host:port  (or socks5://host:port)
  // Leave empty to disable proxy.
  YTDLP_PROXY: process.env.YTDLP_PROXY || '',
  // Optional comma-separated list of proxies for rotation
  YTDLP_PROXY_LIST: process.env.YTDLP_PROXY_LIST || '',
  MAX_VTT_SIZE_BYTES: parseInt(process.env.MAX_VTT_SIZE_BYTES, 10) || 5242880,
};

// Ensure cache directory exists
const fs = require('fs');
if (!fs.existsSync(config.CACHE_DIR)) {
  fs.mkdirSync(config.CACHE_DIR, { recursive: true });
}

module.exports = config;
