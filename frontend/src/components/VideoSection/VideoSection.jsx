import React, { useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useYouTubePlayer } from '../../hooks/useYouTubePlayer';
import { useSubtitleSync } from '../../hooks/useSubtitleSync';
import './VideoSection.css';

export default function VideoSection() {
  const {
    videoId, videoTitle, videoMeta,
    activeDeCue, activeEnCue,
    showDe, showEn, showFlags,
    fontSize, playerRef,
    setPlayerReady, setIsPlaying,
  } = useAppContext();

  const onPlayerReady = useCallback((player) => {
    playerRef.current = player;
    setPlayerReady(true);
  }, [playerRef, setPlayerReady]);

  const onStateChange = useCallback((state) => {
    // YT.PlayerState: PLAYING=1, PAUSED=2, ENDED=0, BUFFERING=3
    setIsPlaying(state === 1);
  }, [setIsPlaying]);

  useYouTubePlayer(videoId, 'yt-player-container', onPlayerReady, onStateChange);
  useSubtitleSync();

  if (!videoId) return null;

  const sizeClass = `subtitle--${fontSize.toLowerCase()}`;

  const getScoreBadge = (score) => {
    if (!score && score !== 0) return null;
    if (score >= 80) return { label: 'Excellent', className: 'score--excellent', icon: '✅' };
    if (score >= 60) return { label: 'Good', className: 'score--good', icon: '🔵' };
    if (score >= 40) return { label: 'Fair', className: 'score--fair', icon: '⚠️' };
    return { label: 'Poor', className: 'score--poor', icon: '❌' };
  };

  const scoreBadge = videoMeta?.scores ? getScoreBadge(videoMeta.scores.overallScore) : null;

  return (
    <div className="video-section animate-fade-in">
      {/* Title bar */}
      <div className="video-section__title-bar">
        <h1 className="video-section__title">{videoTitle}</h1>
        <div className="video-section__meta">
          {videoMeta?.translationRequired && (
            <span className="video-section__badge video-section__badge--translated">
              🤖 Auto-translated
            </span>
          )}
          {scoreBadge && (
            <span className={`video-section__badge ${scoreBadge.className}`}>
              {scoreBadge.icon} {scoreBadge.label}
            </span>
          )}
        </div>
      </div>

      {/* Player + overlay wrapper */}
      <div className="video-section__player-wrap">
        <div className="video-section__player" id="yt-player-container" />

        {/* Subtitle overlay */}
        <div className="subtitle-overlay" data-testid="subtitle-overlay">
          {(showDe && activeDeCue) || (showEn && activeEnCue) ? (
            <div className={`subtitle-box ${sizeClass}`}>
              {showDe && activeDeCue && (
                <div className="subtitle-line subtitle-line--de" data-testid="german-line">
                  <span className="subtitle-paren subtitle-paren--de">(</span>
                  {showFlags && <span className="subtitle-flag">🇩🇪</span>}
                  <span className="subtitle-text">{activeDeCue.text}</span>
                </div>
              )}
              {showEn && activeEnCue && (
                <div className="subtitle-line subtitle-line--en" data-testid="english-line">
                  <span className="subtitle-paren subtitle-paren--en">(</span>
                  {showFlags && <span className="subtitle-flag">🇬🇧</span>}
                  <span className="subtitle-text">{activeEnCue.text}</span>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
