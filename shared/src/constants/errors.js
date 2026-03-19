const ERROR_CODES = {
  MISSING_URL: 'MISSING_URL',
  INVALID_URL: 'INVALID_URL',
  NO_SUBTITLES: 'NO_SUBTITLES',
  VIDEO_UNAVAILABLE: 'VIDEO_UNAVAILABLE',
  EXTRACTION_FAILED: 'EXTRACTION_FAILED',
  TRANSLATION_UNAVAILABLE: 'TRANSLATION_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  INVALID_VIDEO_ID: 'INVALID_VIDEO_ID',
  INVALID_LANG: 'INVALID_LANG',
  NOT_FOUND: 'NOT_FOUND',
  LANG_NOT_AVAILABLE: 'LANG_NOT_AVAILABLE',
};

const ERROR_MESSAGES = {
  [ERROR_CODES.MISSING_URL]: 'A YouTube URL is required.',
  [ERROR_CODES.INVALID_URL]: 'Please enter a valid YouTube URL.',
  [ERROR_CODES.NO_SUBTITLES]: 'This video has no subtitle track. Try another video.',
  [ERROR_CODES.VIDEO_UNAVAILABLE]: 'This video is private or unavailable.',
  [ERROR_CODES.EXTRACTION_FAILED]: 'Could not extract subtitles. Please try again.',
  [ERROR_CODES.TRANSLATION_UNAVAILABLE]: 'Could not translate subtitles. German subtitles are available.',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait before importing another video.',
  [ERROR_CODES.PAYLOAD_TOO_LARGE]: 'Request body exceeds 1KB limit.',
  [ERROR_CODES.INVALID_VIDEO_ID]: 'Invalid video ID format.',
  [ERROR_CODES.INVALID_LANG]: "Language must be 'de' or 'en'.",
  [ERROR_CODES.NOT_FOUND]: 'Subtitles not found. Import the video first.',
  [ERROR_CODES.LANG_NOT_AVAILABLE]: 'No subtitle track available for this language.',
};

module.exports = { ERROR_CODES, ERROR_MESSAGES };
