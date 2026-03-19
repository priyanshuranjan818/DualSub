import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [videoId, setVideoId] = useState(null);
  const [videoTitle, setVideoTitle] = useState(null);
  const [videoMeta, setVideoMeta] = useState(null);
  const [deCues, setDeCues] = useState([]);
  const [enCues, setEnCues] = useState([]);
  const [activeDeCue, setActiveDeCue] = useState(null);
  const [activeEnCue, setActiveEnCue] = useState(null);
  const [importStatus, setImportStatus] = useState('idle'); // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState(null);
  const [fontSize, setFontSize] = useState('M'); // S | M | L
  const [showDe, setShowDe] = useState(true);
  const [showEn, setShowEn] = useState(true);
  const [showFlags, setShowFlags] = useState(true);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef(null);

  const resetVideo = useCallback(() => {
    setVideoId(null);
    setVideoTitle(null);
    setVideoMeta(null);
    setDeCues([]);
    setEnCues([]);
    setActiveDeCue(null);
    setActiveEnCue(null);
    setImportStatus('idle');
    setErrorMessage(null);
    setPlayerReady(false);
    setIsPlaying(false);
    playerRef.current = null;
  }, []);

  const value = {
    videoId, setVideoId,
    videoTitle, setVideoTitle,
    videoMeta, setVideoMeta,
    deCues, setDeCues,
    enCues, setEnCues,
    activeDeCue, setActiveDeCue,
    activeEnCue, setActiveEnCue,
    importStatus, setImportStatus,
    errorMessage, setErrorMessage,
    fontSize, setFontSize,
    showDe, setShowDe,
    showEn, setShowEn,
    showFlags, setShowFlags,
    playerReady, setPlayerReady,
    isPlaying, setIsPlaying,
    playerRef,
    resetVideo,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
