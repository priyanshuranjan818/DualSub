/**
 * Build an SRT-format string from cue arrays.
 * If transCues is provided, each block gets two text lines (dual).
 */
function buildSrt(cues, transCues) {
  const lines = [];
  cues.forEach((cue, i) => {
    const start = secondsToSrt(cue.start);
    const end   = secondsToSrt(cue.end);
    lines.push(String(i + 1));
    lines.push(`${start} --> ${end}`);
    lines.push(cue.text);
    if (transCues && transCues[i]) {
      lines.push(transCues[i].text);
    }
    lines.push('');
  });
  return lines.join('\n');
}

function secondsToSrt(s) {
  const h   = Math.floor(s / 3600);
  const m   = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const ms  = Math.round((s - Math.floor(s)) * 1000);
  return [
    String(h).padStart(2, '0'),
    String(m).padStart(2, '0'),
    String(sec).padStart(2, '0'),
  ].join(':') + ',' + String(ms).padStart(3, '0');
}

export function downloadSrt(cues, filename, transCues = null) {
  if (!cues || cues.length === 0) return;
  const content  = buildSrt(cues, transCues);
  const blob     = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url      = URL.createObjectURL(blob);
  const a        = document.createElement('a');
  a.href         = url;
  a.download     = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
