import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook that manages a native HTML5 <video> element,
 * providing a playerRef interface compatible with the existing
 * SubtitleSyncEngine (which calls playerRef.current.getCurrentTime()).
 *
 * @param {string} videoId       - YouTube video ID
 * @param {string} containerId   - DOM element ID to render the <video> into
 * @param {function} onReady     - called when video metadata is loaded
 * @param {function} onStateChange - called with 1 (playing) or 2 (paused)
 */
export function useVideoPlayer(videoId, containerId, onReady, onStateChange) {
  const videoRef = useRef(null);

  // Build the stream URL — backend will 302-redirect to YouTube CDN
  const getStreamUrl = useCallback((id) => {
    // In production (same-origin), just use /api/...
    // In dev (vite proxy or CORS), this also works via the proxy
    return `/api/video/${id}/stream`;
  }, []);

  useEffect(() => {
    if (!videoId || !containerId) return;

    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear any previous player
    container.innerHTML = '';

    // Create native <video> element
    const video = document.createElement('video');
    video.id = `${containerId}-inner`;
    video.controls = true;
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.display = 'block';
    video.style.background = '#000';
    video.style.borderRadius = '8px';
    video.preload = 'metadata';

    // Point to our backend stream endpoint (302 → YouTube CDN)
    video.src = getStreamUrl(videoId);

    // Expose a YT.Player-compatible interface on the ref
    // so SubtitleSyncEngine and AppContext.seekTo work unchanged.
    videoRef.current = {
      getCurrentTime: () => video.currentTime,
      seekTo: (secs) => { video.currentTime = secs; },
      playVideo: () => video.play(),
      pauseVideo: () => video.pause(),
      destroy: () => {
        video.pause();
        video.src = '';
        container.innerHTML = '';
      },
    };

    // Fire onReady when enough metadata is loaded
    video.addEventListener('loadedmetadata', () => {
      if (onReady) onReady(videoRef.current);
    });

    // Map HTML5 events → YT.PlayerState numbers
    // 1 = PLAYING, 2 = PAUSED
    video.addEventListener('play',  () => { if (onStateChange) onStateChange(1); });
    video.addEventListener('pause', () => { if (onStateChange) onStateChange(2); });
    video.addEventListener('ended', () => { if (onStateChange) onStateChange(0); });

    // Handle stream URL errors with a user-friendly message
    video.addEventListener('error', (e) => {
      const code = video.error?.code;
      console.error('[useVideoPlayer] Video error code:', code, e);
    });

    container.appendChild(video);

    return () => {
      video.pause();
      video.src = '';
      container.innerHTML = '';
      videoRef.current = null;
    };
  }, [videoId, containerId]);

  return { videoRef };
}
