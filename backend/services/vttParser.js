/**
 * Parses WebVTT content into a JSON cue array.
 * Strips VTT inline tags, deduplicates, and sorts by start time.
 */

function vttTimeToSeconds(timeStr) {
  const parts = timeStr.trim().split(':');
  if (parts.length === 3) {
    return (+parts[0]) * 3600 + (+parts[1]) * 60 + parseFloat(parts[2]);
  }
  if (parts.length === 2) {
    return (+parts[0]) * 60 + parseFloat(parts[1]);
  }
  return parseFloat(parts[0]) || 0;
}

function stripVTTTags(text) {
  return text
    .replace(/<[^>]+>/g, '')       // remove all HTML/VTT tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function parseVTT(vttContent) {
  if (!vttContent || typeof vttContent !== 'string') return [];

  const lines = vttContent.split('\n');
  const cues = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Look for timestamp lines: "00:00:01.200 --> 00:00:04.500"
    if (line.includes('-->')) {
      const parts = line.split('-->');
      if (parts.length >= 2) {
        const start = vttTimeToSeconds(parts[0].trim());
        // End timestamp might have position info after it
        const endPart = parts[1].trim().split(/\s/)[0];
        const end = vttTimeToSeconds(endPart);

        // Collect text lines until empty line or next timestamp
        const textLines = [];
        i++;
        while (i < lines.length && lines[i].trim() !== '' && !lines[i].includes('-->')) {
          const stripped = stripVTTTags(lines[i]);
          if (stripped.length > 0) {
            textLines.push(stripped);
          }
          i++;
        }

        const text = textLines.join(' ').trim();

        // Only add if text is non-empty and start < end
        if (text.length > 0 && start < end) {
          // Truncate overly long cues
          const finalText = text.length > 500 ? text.substring(0, 497) + '...' : text;
          cues.push({ start, end, text: finalText });
        }
      } else {
        i++;
      }
    } else {
      i++;
    }
  }

  // Sort by start time
  cues.sort((a, b) => a.start - b.start);

  // Deduplicate consecutive cues with identical text and overlapping times
  const deduped = [];
  for (let j = 0; j < cues.length; j++) {
    const prev = deduped[deduped.length - 1];
    if (prev && prev.text === cues[j].text && cues[j].start <= prev.end + 0.1) {
      // Merge: extend end time
      prev.end = Math.max(prev.end, cues[j].end);
    } else {
      deduped.push({ ...cues[j] });
    }
  }

  // Add index field
  return deduped.map((cue, idx) => ({
    index: idx,
    start: Math.round(cue.start * 1000) / 1000,
    end: Math.round(cue.end * 1000) / 1000,
    text: cue.text,
  }));
}

module.exports = { parseVTT, vttTimeToSeconds, stripVTTTags };
