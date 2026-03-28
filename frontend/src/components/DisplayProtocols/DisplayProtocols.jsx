import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { downloadSrt } from '../../utils/downloadSrt';
import './DisplayProtocols.css';

const TABS = ['SOURCE', 'TRANSLATION', 'STYLE'];

export default function DisplayProtocols() {
  const {
    showSource, setShowSource,
    showTrans, setShowTrans,
    fontSize, setFontSize,
    sourceCues, transCues,
    videoTitle,
  } = useAppContext();

  const [tab, setTab] = useState('SOURCE');

  return (
    <div className="dp">
      {/* ── Section label ── */}
      <div className="dp__section-label">
        <span className="dp__icon">⬡</span> DISPLAY_PROTOCOLS
      </div>

      {/* ── Tab row ── */}
      <div className="dp__tabs">
        {TABS.map(t => (
          <button
            key={t}
            className={`dp__tab ${tab === t ? 'dp__tab--active' : ''}`}
            onClick={() => setTab(t)}
          >
            <span className="dp__tab-icon">⬡</span> {t}
          </button>
        ))}
      </div>

      {/* ── Tab body ── */}
      <div className="dp__body">
        {tab === 'SOURCE' && (
          <div className="dp__setting-row">
            <span className="dp__setting-label">Source subtitles</span>
            <button
              className={`dp__toggle ${showSource ? 'dp__toggle--on' : ''}`}
              onClick={() => setShowSource(s => !s)}
            >
              <span className="dp__toggle-track">
                <span className="dp__toggle-thumb" />
              </span>
              <span className="dp__toggle-lbl">{showSource ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        )}

        {tab === 'TRANSLATION' && (
          <div className="dp__setting-row">
            <span className="dp__setting-label">Translation subtitles</span>
            <button
              className={`dp__toggle ${showTrans ? 'dp__toggle--on' : ''}`}
              onClick={() => setShowTrans(s => !s)}
            >
              <span className="dp__toggle-track">
                <span className="dp__toggle-thumb" />
              </span>
              <span className="dp__toggle-lbl">{showTrans ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        )}

        {tab === 'STYLE' && (
          <div className="dp__setting-row">
            <span className="dp__setting-label">Font size</span>
            <div className="dp__size-btns">
              {['S', 'M', 'L'].map(s => (
                <button
                  key={s}
                  className={`dp__size-btn ${fontSize === s ? 'dp__size-btn--active' : ''}`}
                  onClick={() => setFontSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Download Subtitles ── */}
      <div className="dp__section-label dp__section-label--download">
        <span className="dp__icon">⬇</span> DOWNLOAD_SUBTITLES
      </div>
      <div className="dp__dl-btns">
        <button
          className="dp__dl-btn"
          onClick={() => downloadSrt(sourceCues, `${videoTitle || 'subtitles'}_original.srt`)}
          disabled={!sourceCues.length}
        >
          [ ORIGINAL ONLY ]
        </button>
        <button
          className="dp__dl-btn"
          onClick={() => downloadSrt(transCues, `${videoTitle || 'subtitles'}_translated.srt`)}
          disabled={!transCues.length}
        >
          [ TRANSLATED ]
        </button>
        <button
          className="dp__dl-btn dp__dl-btn--both"
          onClick={() => downloadSrt(sourceCues, `${videoTitle || 'subtitles'}_dual.srt`, transCues)}
          disabled={!sourceCues.length && !transCues.length}
        >
          [ BOTH LANGUAGES ]
        </button>
      </div>
    </div>
  );
}
