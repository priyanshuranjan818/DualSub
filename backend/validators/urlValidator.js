const { ERROR_CODES, ERROR_MESSAGES } = require('@dualsub/shared');

const YOUTUBE_REGEX =
  /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})(?:[&?].*)?$/;

function validateYouTubeUrl(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, videoId: null, errorCode: ERROR_CODES.MISSING_URL };
  }

  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return { valid: false, videoId: null, errorCode: ERROR_CODES.MISSING_URL };
  }

  if (trimmed.length > 200) {
    return { valid: false, videoId: null, errorCode: ERROR_CODES.INVALID_URL };
  }

  const match = trimmed.match(YOUTUBE_REGEX);
  if (!match) {
    return { valid: false, videoId: null, errorCode: ERROR_CODES.INVALID_URL };
  }

  return { valid: true, videoId: match[1], errorCode: null };
}

function extractVideoId(url) {
  const result = validateYouTubeUrl(url);
  return result.videoId;
}

module.exports = { validateYouTubeUrl, extractVideoId };
