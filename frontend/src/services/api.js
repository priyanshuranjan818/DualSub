const API_BASE = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_BASE || 'http://localhost:3001'); // In production (when served statically by the backend), use relative paths so it works across any domain/IP

export async function importVideo(url) {
  const res = await fetch(`${API_BASE}/api/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
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
