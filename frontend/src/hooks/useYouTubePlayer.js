import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Custom hook to manage YouTube IFrame Player API lifecycle.
 * Loads the YouTube API script and creates a player instance.
 */
export function useYouTubePlayer(videoId, containerId, onReady, onStateChange) {
  const playerRef = useRef(null);
  const [apiReady, setApiReady] = useState(false);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setApiReady(true);
      return;
    }

    const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (existingScript) {
      window.onYouTubeIframeAPIReady = () => setApiReady(true);
      return;
    }

    window.onYouTubeIframeAPIReady = () => setApiReady(true);

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  // Create player when API is ready and videoId changes
  useEffect(() => {
    if (!apiReady || !videoId || !containerId) return;

    // Destroy existing player
    if (playerRef.current) {
      try { playerRef.current.destroy(); } catch (e) {}
      playerRef.current = null;
    }

    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear container
    container.innerHTML = '';
    const playerDiv = document.createElement('div');
    playerDiv.id = `${containerId}-inner`;
    container.appendChild(playerDiv);

    playerRef.current = new window.YT.Player(`${containerId}-inner`, {
      videoId,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 0,
        modestbranding: 1,
        rel: 0,
        cc_load_policy: 0,
        iv_load_policy: 3,
        disablekb: 0,
      },
      events: {
        onReady: (event) => {
          if (onReady) onReady(event.target);
        },
        onStateChange: (event) => {
          if (onStateChange) onStateChange(event.data);
        },
      },
    });

    return () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (e) {}
        playerRef.current = null;
      }
    };
  }, [apiReady, videoId, containerId]);

  const getPlayer = useCallback(() => playerRef.current, []);

  return { player: playerRef, getPlayer, apiReady };
}
