import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout/AppLayout';
import { useAppContext } from '../context/AppContext';
import { useImport } from '../hooks/useImport';
import { validateYouTubeUrl } from '../utils/validateYouTubeUrl';
import './Dashboard.css';

const LANGUAGES = [
  { code: 'de', label: 'German' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ru', label: 'Russian' },
  { code: 'ar', label: 'Arabic' },
  { code: 'en', label: 'English' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { importStatus, errorMessage, sourceLang, setSourceLang, transLang, setTransLang } = useAppContext();
  const { handleImport } = useImport();

  const [url, setUrl] = useState('');
  const isLoading = importStatus === 'loading';

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    const validation = validateYouTubeUrl(url.trim());
    if (!validation.valid) return;
    await handleImport(url.trim(), sourceLang, transLang);
    navigate('/player');
  };

  return (
    <AppLayout>
      <div className="dashboard">
        {/* ── Hero ── */}
        <div className="dashboard__hero">
          <div className="hero-tag">NEURAL_LINK // IMMERSION PLAYER</div>
          <h1 className="hero-title">
            Watch. Understand.<br />
            <span className="hero-title--accent">Absorb Any Language.</span>
          </h1>
          <p className="hero-sub">
            Paste a YouTube link — get instant dual subtitles with an interactive transcript. 100% free.
          </p>
        </div>

        {/* ── Input Card ── */}
        <div className="dash-card animate-fade-in">
          <div className="dash-card__label">
            <span className="mono-tag">NEURAL_LINK //</span> PASTE_VIDEO_URL
          </div>

          <form className="dash-form" onSubmit={onSubmit}>
            <div className="dash-form__url-row">
              <input
                id="youtube-url-input"
                type="url"
                className="dash-input"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={e => setUrl(e.target.value)}
                disabled={isLoading}
                autoFocus
              />
              <button
                type="submit"
                className="dash-btn"
                disabled={!url.trim() || isLoading}
                id="import-button"
              >
                {isLoading ? (
                  <><span className="dash-spinner" /> PROCESSING</>
                ) : (
                  '► INITIALIZE'
                )}
              </button>
            </div>

            {/* Language selectors */}
            <div className="dash-form__lang-row">
              <div className="lang-select-group">
                <label className="lang-label">SOURCE</label>
                <select
                  className="lang-select"
                  value={sourceLang}
                  onChange={e => setSourceLang(e.target.value)}
                  disabled={isLoading}
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div className="lang-arrow">→</div>
              <div className="lang-select-group">
                <label className="lang-label">TRANSLATION</label>
                <select
                  className="lang-select"
                  value={transLang}
                  onChange={e => setTransLang(e.target.value)}
                  disabled={isLoading}
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </form>

          {/* Status messages */}
          {importStatus === 'loading' && (
            <div className="dash-status dash-status--loading animate-slide-down">
              <span className="blink-dot" /> Initializing neural link... fetching subtitles.
            </div>
          )}
          {importStatus === 'error' && errorMessage && (
            <div className="dash-status dash-status--error animate-slide-down">
              ⚠ {errorMessage}
            </div>
          )}
        </div>

        {/* ── Feature Grid ── */}
        <div className="feat-grid animate-fade-in">
          {[
            { icon: '⬡', label: 'DUAL SUBTITLES', desc: 'Source + Translation displayed simultaneously on the video' },
            { icon: '⬡', label: 'INTERACTIVE TRANSCRIPT', desc: 'Click any segment to jump instantly to that point in the video' },
            { icon: '⬡', label: 'SUBTITLE EXPORT', desc: 'Download .srt files in original, translated, or dual format' },
            { icon: '⬡', label: 'HISTORY LIBRARY', desc: 'All your watched videos saved locally — revisit any session' },
          ].map(f => (
            <div className="feat-card" key={f.label}>
              <span className="feat-card__icon">{f.icon}</span>
              <span className="feat-card__label">{f.label}</span>
              <span className="feat-card__desc">{f.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
