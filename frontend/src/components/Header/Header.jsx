import React from 'react';
import { useAppContext } from '../../context/AppContext';
import './Header.css';

export default function Header({ onSettingsClick }) {
  const { resetVideo, videoId } = useAppContext();

  return (
    <header className="header">
      <div className="header__inner container">
        <button className="header__logo" onClick={resetVideo} title="DualSub Home">
          <span className="header__icon">🎬</span>
          <span className="header__title">DualSub</span>
          <span className="header__badge">BETA</span>
        </button>

        <div className="header__actions">
          {videoId && (
            <button className="header__btn header__btn--new" onClick={resetVideo}>
              + New Video
            </button>
          )}
          <button
            className="header__btn header__btn--settings"
            onClick={onSettingsClick}
            aria-label="Settings"
          >
            ⚙️
          </button>
        </div>
      </div>
    </header>
  );
}
