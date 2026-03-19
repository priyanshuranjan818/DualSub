import React from 'react';
import { useAppContext } from '../../context/AppContext';
import './SettingsModal.css';

export default function SettingsModal({ isOpen, onClose }) {
  const {
    fontSize, setFontSize,
    showDe, setShowDe,
    showEn, setShowEn,
    showFlags, setShowFlags,
  } = useAppContext();

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal glass animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">⚙️ Settings</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close settings">✕</button>
        </div>

        <div className="modal__body">
          {/* Font Size */}
          <div className="setting">
            <label className="setting__label">Subtitle Font Size</label>
            <div className="setting__options">
              {['S', 'M', 'L'].map((size) => (
                <button
                  key={size}
                  className={`setting__btn ${fontSize === size ? 'setting__btn--active' : ''}`}
                  onClick={() => setFontSize(size)}
                >
                  {size === 'S' ? 'Small' : size === 'M' ? 'Medium' : 'Large'}
                </button>
              ))}
            </div>
          </div>

          {/* German toggle */}
          <div className="setting">
            <label className="setting__label">🇩🇪 German Subtitles</label>
            <button
              className={`setting__toggle ${showDe ? 'setting__toggle--on' : ''}`}
              onClick={() => { if (showDe && !showEn) return; setShowDe(!showDe); }}
            >
              <span className="setting__toggle-track">
                <span className="setting__toggle-thumb" />
              </span>
              {showDe ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* English toggle */}
          <div className="setting">
            <label className="setting__label">🇬🇧 English Subtitles</label>
            <button
              className={`setting__toggle ${showEn ? 'setting__toggle--on' : ''}`}
              onClick={() => { if (!showDe && showEn) return; setShowEn(!showEn); }}
            >
              <span className="setting__toggle-track">
                <span className="setting__toggle-thumb" />
              </span>
              {showEn ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Flags toggle */}
          <div className="setting">
            <label className="setting__label">Show Language Flags</label>
            <button
              className={`setting__toggle ${showFlags ? 'setting__toggle--on' : ''}`}
              onClick={() => setShowFlags(!showFlags)}
            >
              <span className="setting__toggle-track">
                <span className="setting__toggle-thumb" />
              </span>
              {showFlags ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        <div className="modal__footer">
          <button className="modal__done" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
