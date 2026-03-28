import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { importVideo as apiImport, fetchSubtitles } from '../services/api';
import { validateYouTubeUrl } from '../utils/validateYouTubeUrl';

export function useImport() {
  const {
    setVideoId, setVideoTitle, setVideoMeta,
    setSourceCues, setTransCues,
    setImportStatus, setErrorMessage,
    resetVideo, addToHistory,
  } = useAppContext();

  const handleImport = useCallback(async (url, sourceLang = 'de', transLang = 'en') => {
    const validation = validateYouTubeUrl(url);
    if (!validation.valid) {
      setErrorMessage('Please enter a valid YouTube URL.');
      setImportStatus('error');
      return;
    }

    resetVideo();
    setImportStatus('loading');
    setErrorMessage(null);

    try {
      // 1. Import video — backend extracts subtitles & metadata
      const meta = await apiImport(url, sourceLang, transLang);
      setVideoId(meta.videoId);
      setVideoTitle(meta.title);
      setVideoMeta(meta);

      // 2. Fetch subtitle cues in parallel
      const [src, trans] = await Promise.all([
        fetchSubtitles(meta.videoId, sourceLang),
        fetchSubtitles(meta.videoId, transLang),
      ]);

      setSourceCues(src || []);
      setTransCues(trans || []);
      setImportStatus('success');

      // 3. Persist to history
      addToHistory({
        videoId: meta.videoId,
        title: meta.title,
        url,
        sourceLang,
        transLang,
        addedAt: new Date().toISOString(),
      });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to import video. Please try again.');
      setImportStatus('error');
    }
  }, [
    setVideoId, setVideoTitle, setVideoMeta,
    setSourceCues, setTransCues,
    setImportStatus, setErrorMessage,
    resetVideo, addToHistory,
  ]);

  return { handleImport };
}
