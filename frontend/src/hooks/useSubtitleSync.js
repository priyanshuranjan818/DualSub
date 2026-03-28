import { useEffect, useRef } from 'react';
import { SubtitleSyncEngine } from '../engine/SubtitleSyncEngine';
import { useAppContext } from '../context/AppContext';

export function useSubtitleSync() {
  const {
    sourceCues, transCues,
    setActiveSourceCue, setActiveTransCue,
    setActiveSliceIdx,
    isPlaying, playerRef,
  } = useAppContext();

  const engineRef = useRef(null);

  // Create engine once
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new SubtitleSyncEngine((srcCue, transCue, srcIdx) => {
        setActiveSourceCue(srcCue);
        setActiveTransCue(transCue);
        setActiveSliceIdx(srcIdx);
      });
    }
    return () => engineRef.current?.stop();
  }, []);

  // Update cues when they change
  useEffect(() => {
    engineRef.current?.setDeCues(sourceCues);
    engineRef.current?.setEnCues(transCues);
  }, [sourceCues, transCues]);

  // Update time getter when player is ready
  useEffect(() => {
    if (engineRef.current && playerRef.current) {
      engineRef.current.setTimeGetter(() => {
        try { return playerRef.current.getCurrentTime?.() ?? 0; }
        catch { return 0; }
      });
    }
  }, [playerRef.current]);

  // Start / stop based on play state
  useEffect(() => {
    if (!engineRef.current) return;
    if (isPlaying) {
      engineRef.current.start();
    } else {
      engineRef.current.stop();
      // Freeze on current cue when paused
      if (playerRef.current) {
        try {
          const t = playerRef.current.getCurrentTime?.() ?? 0;
          const srcIdx = engineRef.current.findCueIndex(sourceCues, t);
          setActiveSourceCue(srcIdx >= 0 ? sourceCues[srcIdx] : null);
          setActiveTransCue(srcIdx >= 0 && transCues[srcIdx] ? transCues[srcIdx] : engineRef.current.findCue(transCues, t));
          setActiveSliceIdx(srcIdx);
        } catch {}
      }
    }
  }, [isPlaying]);

  return engineRef;
}
