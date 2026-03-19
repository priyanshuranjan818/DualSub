const rateLimit = require('express-rate-limit');
const config = require('../config');
const { ERROR_CODES, ERROR_MESSAGES } = require('@dualsub/shared');

const importLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: ERROR_CODES.RATE_LIMIT_EXCEEDED,
    message: ERROR_MESSAGES[ERROR_CODES.RATE_LIMIT_EXCEEDED],
    details: { retryAfter: Math.ceil(config.RATE_LIMIT_WINDOW_MS / 1000) },
  },
});

const subtitleLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: ERROR_CODES.RATE_LIMIT_EXCEEDED,
    message: ERROR_MESSAGES[ERROR_CODES.RATE_LIMIT_EXCEEDED],
  },
});

module.exports = { importLimiter, subtitleLimiter };
