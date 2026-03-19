import React, { useState } from 'react';
import { useAppContext } from './context/AppContext';
import Header from './components/Header/Header';
import URLInputPanel from './components/URLInputPanel/URLInputPanel';
import VideoSection from './components/VideoSection/VideoSection';
import PlayerControls from './components/PlayerControls/PlayerControls';
import SettingsModal from './components/SettingsModal/SettingsModal';
import './App.css';

export default function App() {
  const { videoId, importStatus } = useAppContext();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="app">
      <Header onSettingsClick={() => setSettingsOpen(true)} />

      <main className="app__main container">
        <URLInputPanel />

        {/* Empty state */}
        {!videoId && importStatus === 'idle' && (
          <div className="empty-state animate-fade-in">
            <div className="empty-state__visual">
              <div className="empty-state__circle">
                <span className="empty-state__emoji">🎬</span>
              </div>
              <div className="empty-state__glow" />
            </div>
            <h2 className="empty-state__title">Watch with Dual Subtitles</h2>
            <p className="empty-state__desc">
              Paste a YouTube link above to watch German cartoons with<br />
              <strong>German subtitles on top</strong> and <strong>English subtitles below</strong>
            </p>
            <div className="empty-state__features">
              <div className="feature-card">
                <span className="feature-card__icon">🇩🇪</span>
                <span className="feature-card__text">German subtitles</span>
              </div>
              <div className="feature-card">
                <span className="feature-card__icon">🇬🇧</span>
                <span className="feature-card__text">English translation</span>
              </div>
              <div className="feature-card">
                <span className="feature-card__icon">⚡</span>
                <span className="feature-card__text">Real-time sync</span>
              </div>
            </div>
          </div>
        )}

        {/* Video + Controls */}
        <VideoSection />
        <PlayerControls />
      </main>

      {/* Footer */}
      <footer className="app__footer">
        <div className="container app__footer-inner">
          <span className="app__footer-brand">DualSub v1.0.0</span>
          <div className="app__footer-links">
            <span className="app__footer-disclaimer">
              Not affiliated with YouTube or Google
            </span>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
