import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useYouTubePlayer } from '../hooks/useYouTubePlayer';
import { useSubtitleSync } from '../hooks/useSubtitleSync';
import TranscriptSidebar from '../components/TranscriptSidebar/TranscriptSidebar';
import DisplayProtocols from '../components/DisplayProtocols/DisplayProtocols';
import './PlayerPage.css';

export default function PlayerPage() {
  const navigate = useNavigate();
  const {
    videoId, videoTitle,
    activeSourceCue, activeTransCue,
    showSource, showTrans,
    fontSize,
    playerRef, setPlayerReady, setIsPlaying,
  } = useAppContext();

  // If no video loaded, go back to dashboard
  useEffect(() => {
    if (!videoId) navigate('/', { replace: true });
  }, [videoId, navigate]);

  const onPlayerReady = (player) => {
    playerRef.current = player;
    setPlayerReady(true);
  };

  const onStateChange = (state) => {
    setIsPlaying(state === 1);
  };

  useYouTubePlayer(videoId, 'yt-player-container', onPlayerReady, onStateChange);
  useSubtitleSync();

  if (!videoId) return null;

  const subSizeMap = { S: 'var(--sub-s)', M: 'var(--sub-m)', L: 'var(--sub-l)' };
  const subSize = subSizeMap[fontSize] || 'var(--sub-m)';

  return (
    <div className="player-page">
      {/* ── Top bar ── */}
      <div className="player-topbar">
        <button className="player-topbar__back" onClick={() => navigate('/')}>
          ‹ [ ABORT_STREAM ]
        </button>
        <div className="player-topbar__title">{videoTitle}</div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="player-body">
        {/* LEFT: Video + subtitles */}
        <div className="player-left">
          <div className="player-wrap">
            {/* YouTube embed */}
            <div className="player-embed" id="yt-player-container" />

            {/* Subtitle overlay */}
            {(showSource && activeSourceCue) || (showTrans && activeTransCue) ? (
              <div className="subtitle-overlay">
                {showSource && activeSourceCue && (
                  <div
                    className="subtitle-line subtitle-line--source"
                    style={{ fontSize: subSize }}
                  >
                    {activeSourceCue.text}
                  </div>
                )}
                {showTrans && activeTransCue && (
                  <div
                    className="subtitle-line subtitle-line--trans"
                    style={{ fontSize: `calc(${subSize} * 0.8)` }}
                  >
                    {activeTransCue.text}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* RIGHT: Sidebar */}
        <div className="player-right">
          <DisplayProtocols />
          <TranscriptSidebar />
        </div>
      </div>
    </div>
  );
}
