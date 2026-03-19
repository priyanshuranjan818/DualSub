import React, { useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import './PlayerControls.css';

export default function PlayerControls() {
  const {
    isPlaying, setIsPlaying,
    playerRef, playerReady,
    fontSize, setFontSize,
    showDe, setShowDe,
    showEn, setShowEn,
  } = useAppContext();

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }, [isPlaying, playerRef]);

  const handleDeToggle = useCallback(() => {
    if (!showDe && !showEn) return; // prevent both off
    if (showDe && !showEn) return; // can't turn off last one
    setShowDe(!showDe);
  }, [showDe, showEn, setShowDe]);

  const handleEnToggle = useCallback(() => {
    if (!showDe && !showEn) return;
    if (!showDe && showEn) return;
    setShowEn(!showEn);
  }, [showDe, showEn, setShowEn]);

  if (!playerReady) return null;

  return (
    <div className="controls animate-fade-in">
      <div className="controls__group">
        {/* Play/Pause */}
        <button className="controls__btn controls__btn--play" onClick={togglePlay} id="play-pause-button">
          {isPlaying ? '⏸' : '▶️'}
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>
      </div>

      <div className="controls__group">
        {/* Font size */}
        <span className="controls__label">Font:</span>
        {['S', 'M', 'L'].map((size) => (
          <button
            key={size}
            className={`controls__btn controls__btn--size ${fontSize === size ? 'controls__btn--active' : ''}`}
            onClick={() => setFontSize(size)}
            id={`font-size-${size.toLowerCase()}`}
          >
            {size}
          </button>
        ))}
      </div>

      <div className="controls__group">
        {/* Subtitle toggles */}
        <button
          className={`controls__btn controls__btn--toggle ${showDe ? 'controls__btn--on' : 'controls__btn--off'}`}
          onClick={handleDeToggle}
          id="toggle-de"
        >
          🇩🇪 {showDe ? 'ON' : 'OFF'}
        </button>
        <button
          className={`controls__btn controls__btn--toggle ${showEn ? 'controls__btn--on' : 'controls__btn--off'}`}
          onClick={handleEnToggle}
          id="toggle-en"
        >
          🇬🇧 {showEn ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );
}
