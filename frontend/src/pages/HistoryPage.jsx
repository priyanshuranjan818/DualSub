import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout/AppLayout';
import { useAppContext } from '../context/AppContext';
import { useImport } from '../hooks/useImport';
import './HistoryPage.css';

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)    return 'just now';
  if (mins < 60)   return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)    return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const { history } = useAppContext();
  const { handleImport } = useImport();

  const reopen = async (entry) => {
    await handleImport(entry.url, entry.sourceLang, entry.transLang);
    navigate('/player');
  };

  return (
    <AppLayout>
      <div className="history-page">
        <div className="history-page__header">
          <span className="mono-tag">SESSION_ARCHIVE //</span>
          <h1 className="history-page__title">PROJECT HISTORY</h1>
        </div>

        {history.length === 0 ? (
          <div className="history-empty">
            <span className="history-empty__icon">◈</span>
            <p>No sessions archived yet.</p>
            <p className="history-empty__sub">
              Import a YouTube video to populate your library.
            </p>
          </div>
        ) : (
          <div className="history-list">
            {history.map((entry) => (
              <div key={entry.videoId} className="history-card">
                <div className="history-card__main">
                  <div className="history-card__title">{entry.title}</div>
                  <div className="history-card__meta">
                    <span className="history-chip">{entry.sourceLang?.toUpperCase() || 'DE'}</span>
                    <span className="history-arrow">→</span>
                    <span className="history-chip">{entry.transLang?.toUpperCase() || 'EN'}</span>
                    <span className="history-time">{timeAgo(entry.addedAt)}</span>
                  </div>
                </div>
                <button
                  className="history-card__btn"
                  onClick={() => reopen(entry)}
                >
                  ► REOPEN
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
