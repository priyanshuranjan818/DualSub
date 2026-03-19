const YOUTUBE_REGEX =
  /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})(?:[&?].*)?$/;

export function validateYouTubeUrl(url) {
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return { valid: false, videoId: null };
  }

  const trimmed = url.trim();
  if (trimmed.length > 200) {
    return { valid: false, videoId: null };
  }

  const match = trimmed.match(YOUTUBE_REGEX);
  if (!match) {
    return { valid: false, videoId: null };
  }

  return { valid: true, videoId: match[1] };
}
