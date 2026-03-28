const API_BASE = import.meta.env.PROD
  ? ''
  : (import.meta.env.VITE_API_BASE || 'http://localhost:3001');

export async function importVideo(url, sourceLang = 'de', transLang = 'en') {
  const groqKey = localStorage.getItem('learnwithhaxx_groq_key') || '';
  const res = await fetch(`${API_BASE}/api/import`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-Groq-Api-Key': groqKey
    },
    body: JSON.stringify({ url, sourceLang, transLang }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Import failed' }));
    throw new Error(err.message || `Import failed (${res.status})`);
  }
  return res.json();
}

export async function fetchSubtitles(videoId, lang) {
  const res = await fetch(`${API_BASE}/api/subtitles/${videoId}/${lang}`);
  if (res.status === 404) return [];
  if (!res.ok) throw new Error('Failed to load subtitles');
  return res.json();
}

export async function fetchMeta(videoId) {
  const res = await fetch(`${API_BASE}/api/meta/${videoId}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch metadata');
  return res.json();
}
