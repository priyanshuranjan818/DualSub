import { useEffect, useRef } from 'react';
import { SubtitleSyncEngine } from '../engine/SubtitleSyncEngine';
import { useAppContext } from '../context/AppContext';

/**
 * Connects the SubtitleSyncEngine to the YouTube player and app state.
 * Starts/stops the engine based on play state.
 */
export function useSubtitleSync() {
  const {
    deCues, enCues,
    setActiveDeCue, setActiveEnCue,
    isPlaying, playerRef,
  } = useAppContext();

  const engineRef = useRef(null);

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new SubtitleSyncEngine((deCue, enCue) => {
        setActiveDeCue(deCue);
        setActiveEnCue(enCue);
      });
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.stop();
      }
    };
  }, []);

  // Update cues when they change
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setDeCues(deCues);
      engineRef.current.setEnCues(enCues);
    }
  }, [deCues, enCues]);

  // Update time getter when player changes
  useEffect(() => {
    if (engineRef.current && playerRef.current) {
      engineRef.current.setTimeGetter(() => {
        try {
          return playerRef.current.getCurrentTime?.() ?? 0;
        } catch {
          return 0;
        }
      });
    }
  }, [playerRef.current]);

  // Start/stop engine based on play state
  useEffect(() => {
    if (!engineRef.current) return;

    if (isPlaying) {
      engineRef.current.start();
    } else {
      engineRef.current.stop();
      // Do one final sync to freeze on current cue
      if (playerRef.current) {
        try {
          const t = playerRef.current.getCurrentTime?.() ?? 0;
          const deCue = engineRef.current.findCue(deCues, t);
          const enCue = engineRef.current.findCue(enCues, t);
          setActiveDeCue(deCue);
          setActiveEnCue(enCue);
        } catch {}
      }
    }
  }, [isPlaying]);

  return engineRef;
}
