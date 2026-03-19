const VIDEO_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;

function isValidVideoId(videoId) {
  return typeof videoId === 'string' && VIDEO_ID_REGEX.test(videoId);
}

module.exports = { isValidVideoId };
