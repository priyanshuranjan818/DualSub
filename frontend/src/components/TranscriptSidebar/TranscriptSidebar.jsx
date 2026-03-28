import React, { useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import './TranscriptSidebar.css';

function padSliceNum(n) {
  return String(n).padStart(3, '0');
}

export default function TranscriptSidebar() {
  const {
    sourceCues,
    transCues,
    activeSliceIdx,
    seekTo,
  } = useAppContext();

  const activeRef = useRef(null);

  // Auto-scroll to active slice
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeSliceIdx]);

  if (!sourceCues.length && !transCues.length) {
    return (
      <div className="transcript transcript--empty">
        <div className="transcript__empty-msg">
          <span className="transcript__empty-icon">◈</span>
          <span>No transcript data.</span>
        </div>
      </div>
    );
  }

  // Merge cues by index (source is primary)
  const maxLen = Math.max(sourceCues.length, transCues.length);
  const slices = Array.from({ length: maxLen }, (_, i) => ({
    index: i,
    source: sourceCues[i] || null,
    trans: transCues[i] || null,
    start: (sourceCues[i] || transCues[i])?.start ?? 0,
  }));

  return (
    <div className="transcript">
      <div className="transcript__list">
        {slices.map((slice) => {
          const isActive = slice.index === activeSliceIdx;
          return (
            <div
              key={slice.index}
              ref={isActive ? activeRef : null}
              className={`slice ${isActive ? 'slice--active' : ''}`}
              onClick={() => seekTo(slice.start)}
            >
              <div className="slice__meta">
                <span className="slice__id">SLICE_{padSliceNum(slice.index + 1)}</span>
                <span className="slice__seek">SEEK ›</span>
              </div>
              {slice.source && (
                <div className="slice__source">{slice.source.text}</div>
              )}
              {slice.trans && (
                <div className="slice__trans">{slice.trans.text}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
