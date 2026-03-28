import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Video / import state
  const [videoId, setVideoId]       = useState(null);
  const [videoTitle, setVideoTitle] = useState(null);
  const [videoMeta, setVideoMeta]   = useState(null);

  // Subtitle cues  { start, end, text }[]
  const [sourceCues, setSourceCues] = useState([]);
  const [transCues, setTransCues]   = useState([]);

  // Active cue for overlay
  const [activeSourceCue, setActiveSourceCue] = useState(null);
  const [activeTransCue, setActiveTransCue]   = useState(null);

  // Active slice index (transcript sidebar highlight)
  const [activeSliceIdx, setActiveSliceIdx] = useState(-1);

  // Import flow
  const [importStatus, setImportStatus] = useState('idle'); // idle|loading|success|error
  const [errorMessage, setErrorMessage] = useState(null);

  // Player state
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying]     = useState(false);
  const playerRef = useRef(null);

  // Subtitle display settings
  const [showSource, setShowSource] = useState(true);
  const [showTrans, setShowTrans]   = useState(true);
  const [fontSize, setFontSize]     = useState('M'); // S|M|L

  // Source / target language labels (user-configurable from dashboard)
  const [sourceLang, setSourceLang] = useState('de');
  const [transLang, setTransLang]   = useState('en');

  // History (localStorage)
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dualsub_history') || '[]');
    } catch { return []; }
  });

  // Groq API Key (BYOK)
  const [groqApiKey, setGroqApiKey] = useState(() => localStorage.getItem('learnwithhaxx_groq_key') || '');

  const updateGroqApiKey = useCallback((key) => {
    setGroqApiKey(key);
    localStorage.setItem('learnwithhaxx_groq_key', key);
  }, []);

  const addToHistory = useCallback((entry) => {
    setHistory(prev => {
      const updated = [entry, ...prev.filter(h => h.videoId !== entry.videoId)].slice(0, 50);
      localStorage.setItem('dualsub_history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetVideo = useCallback(() => {
    setVideoId(null);
    setVideoTitle(null);
    setVideoMeta(null);
    setSourceCues([]);
    setTransCues([]);
    setActiveSourceCue(null);
    setActiveTransCue(null);
    setActiveSliceIdx(-1);
    setImportStatus('idle');
    setErrorMessage(null);
    setPlayerReady(false);
    setIsPlaying(false);
    playerRef.current = null;
  }, []);

  const [showKeyModal, setShowKeyModal] = useState(() => {
    return !localStorage.getItem('learnwithhaxx_groq_key');
  });

  const seekTo = useCallback((time) => {
    try { playerRef.current?.seekTo(time, true); } catch {}
  }, []);

  const value = {
    videoId, setVideoId,
    videoTitle, setVideoTitle,
    videoMeta, setVideoMeta,
    sourceCues, setSourceCues,
    transCues, setTransCues,
    activeSourceCue, setActiveSourceCue,
    activeTransCue, setActiveTransCue,
    activeSliceIdx, setActiveSliceIdx,
    importStatus, setImportStatus,
    errorMessage, setErrorMessage,
    playerReady, setPlayerReady,
    isPlaying, setIsPlaying,
    playerRef,
    showSource, setShowSource,
    showTrans, setShowTrans,
    fontSize, setFontSize,
    sourceLang, setSourceLang,
    transLang, setTransLang,
    history, addToHistory,
    groqApiKey, updateGroqApiKey,
    showKeyModal, setShowKeyModal,
    resetVideo,
    seekTo,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
