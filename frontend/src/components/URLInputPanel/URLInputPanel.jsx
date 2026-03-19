import React, { useState, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useImport } from '../../hooks/useImport';
import { validateYouTubeUrl } from '../../utils/validateYouTubeUrl';
import './URLInputPanel.css';

export default function URLInputPanel() {
  const [url, setUrl] = useState('');
  const { importStatus, errorMessage } = useAppContext();
  const { handleImport } = useImport();
  const isLoading = importStatus === 'loading';

  const onSubmit = useCallback((e) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    handleImport(url.trim());
  }, [url, isLoading, handleImport]);

  const isValidInput = url.trim().length > 0;

  return (
    <div className="url-panel animate-fade-in">
      <div className="url-panel__label">
        <span className="url-panel__label-icon">🔗</span>
        Paste a YouTube link to get started
      </div>

      <form className="url-panel__form" onSubmit={onSubmit}>
        <div className="url-panel__input-wrap">
          <input
            type="url"
            className="url-panel__input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            disabled={isLoading}
            autoFocus
            id="youtube-url-input"
            aria-label="YouTube video URL"
          />
          {url && !isLoading && (
            <button
              type="button"
              className="url-panel__clear"
              onClick={() => setUrl('')}
              aria-label="Clear input"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="submit"
          className="url-panel__btn"
          disabled={!isValidInput || isLoading}
          id="import-button"
        >
          {isLoading ? (
            <>
              <span className="url-panel__spinner" />
              Importing...
            </>
          ) : (
            <>
              <span>▶</span> Import
            </>
          )}
        </button>
      </form>

      {/* Loading state */}
      {importStatus === 'loading' && (
        <div className="url-panel__status url-panel__status--loading animate-slide-down">
          <span className="url-panel__pulse-dot" />
          Fetching subtitles... This may take up to 30 seconds.
        </div>
      )}

      {/* Error state */}
      {importStatus === 'error' && errorMessage && (
        <div className="url-panel__status url-panel__status--error animate-slide-down">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Success state */}
      {importStatus === 'success' && (
        <div className="url-panel__status url-panel__status--success animate-slide-down">
          ✅ Subtitles loaded successfully!
        </div>
      )}
    </div>
  );
}
