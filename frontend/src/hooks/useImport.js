import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { importVideo as apiImport, fetchSubtitles } from '../services/api';
import { validateYouTubeUrl } from '../utils/validateYouTubeUrl';

export function useImport() {
  const {
    setVideoId, setVideoTitle, setVideoMeta,
    setDeCues, setEnCues,
    setImportStatus, setErrorMessage,
    resetVideo,
  } = useAppContext();

  const handleImport = useCallback(async (url) => {
    // Frontend validation
    const validation = validateYouTubeUrl(url);
    if (!validation.valid) {
      setErrorMessage('Please enter a valid YouTube URL.');
      setImportStatus('error');
      return;
    }

    // Reset state
    resetVideo();
    setImportStatus('loading');
    setErrorMessage(null);

    try {
      // 1. Import video
      const meta = await apiImport(url);
      setVideoId(meta.videoId);
      setVideoTitle(meta.title);
      setVideoMeta(meta);

      // 2. Fetch subtitle cues in parallel
      const [de, en] = await Promise.all([
        fetchSubtitles(meta.videoId, 'de'),
        meta.hasEn ? fetchSubtitles(meta.videoId, 'en') : Promise.resolve([]),
      ]);

      setDeCues(de);
      setEnCues(en);
      setImportStatus('success');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to import video. Please try again.');
      setImportStatus('error');
    }
  }, [setVideoId, setVideoTitle, setVideoMeta, setDeCues, setEnCues, setImportStatus, setErrorMessage, resetVideo]);

  return { handleImport };
}
