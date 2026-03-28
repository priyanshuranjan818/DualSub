/**
 * Parses WebVTT content into a JSON cue array.
 * Strips VTT inline tags, deduplicates, sorts by start time,
 * and collapses YouTube's rolling-window auto-caption format.
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

// ─── YouTube Rolling Window Collapse ────────────────────────────────────────

/**
 * Returns true if textA (trimmed) is a strict prefix of textB (trimmed).
 * Used to detect the rolling window pattern where YouTube stores "line1" as
 * one cue and "line1 line2" as the next.
 */
function isPrefixOf(textA, textB) {
  if (!textA || !textB) return false;
  const a = textA.trim();
  const b = textB.trim();
  return b.startsWith(a + ' ') || b === a;
}

/**
 * Returns the number of words that form the longest matching suffix of textA
 * that also appears as the prefix of textB.
 *
 * E.g.: textA = "ich habe eine idee ich bring dich jetzt in den kindergarten"
 *       textB = "in den kindergarten und zwar auf dem schlitten"
 *       → returns 3  ("in den kindergarten")
 */
function findWordOverlapLength(textA, textB) {
  const wordsA = textA.trim().split(/\s+/);
  const wordsB = textB.trim().split(/\s+/);
  // We allow overlap up to (len-1) words so at least one word stays as novel content
  const maxOverlap = Math.min(wordsA.length - 1, wordsB.length);
  for (let len = maxOverlap; len >= 1; len--) {
    const suffixA = wordsA.slice(wordsA.length - len).join(' ');
    const prefixB = wordsB.slice(0, len).join(' ');
    if (suffixA === prefixB) return len;
  }
  return 0;
}

/**
 * Detects and collapses YouTube's auto-generated rolling/karaoke caption format.
 *
 * YouTube auto-captions encode each visible 2-line "frame" as a separate VTT cue:
 *
 *   Cue A [~t0 → t1]:  "line1"            ← first line alone
 *   Cue B [~t1 → t1+0.01]: "line1"        ← 10ms bridge/freeze frame
 *   Cue C [t1 → t2]:   "line1\nline2"     ← combined (line1 scrolls up, line2 appears)
 *   Cue D [~t2 → t2+0.01]: "line2"        ← bridge
 *   Cue E [t2 → t3]:   "line2\nline3"     ← next combined window
 *   ...
 *
 * After the standard dedup pass, B-type bridge cues with identical text are merged
 * into A, but D-type bridges (different text = tail of previous) and A/C/E cues
 * with overlapping text all survive, producing 2–3× as many cues as there are
 * actual speech segments.
 *
 * This function:
 *   1. Removes ultra-short bridge cues (≤ 50 ms)
 *   2. Removes "prefix" cues where the following cue starts with this cue's text
 *   3. Strips the overlapping suffix from each "combined" cue so only novel
 *      content survives
 *   4. Removes music-annotation-only cues ([Musik], [Music], [Applaus], etc.)
 */
function collapseYouTubeRollingCaptions(cues) {
  if (cues.length < 4) return cues;

  // ── Detect rolling format ────────────────────────────────────────────────
  // If >25 % of consecutive pairs are prefix pairs, this is a rolling VTT.
  let prefixPairs = 0;
  for (let i = 0; i < cues.length - 1; i++) {
    if (isPrefixOf(cues[i].text, cues[i + 1].text)) prefixPairs++;
  }
  if (prefixPairs / (cues.length - 1) < 0.25) {
    // Not rolling format — return as-is (handles manually-created VTTs fine)
    return cues;
  }

  // ── Step 1: Remove ultra-short bridge cues (≤ 50 ms) ────────────────────
  const noBridges = cues.filter(c => (c.end - c.start) > 0.05);

  // ── Step 2: Remove "prefix" cues ────────────────────────────────────────
  // If cues[i] is a textual prefix of cues[i+1] (within a 4s window),
  // cues[i] is a redundant partial view — skip it.
  const withoutPrefixes = [];
  for (let i = 0; i < noBridges.length; i++) {
    const curr = noBridges[i];
    const next = noBridges[i + 1];
    if (
      next &&
      isPrefixOf(curr.text, next.text) &&
      (next.start - curr.start) < 4.0
    ) {
      continue; // absorbed into next cue
    }
    withoutPrefixes.push(curr);
  }

  // ── Step 3: Extract novel content ───────────────────────────────────────
  // Each remaining "combined" cue = [overlap_with_prev] + [novel_content].
  // Find the word-level overlap between the suffix of cues[i] and the
  // prefix of cues[i+1], then emit only the non-overlapping unique part.
  const result = [];
  for (let i = 0; i < withoutPrefixes.length; i++) {
    const curr = withoutPrefixes[i];
    const next = withoutPrefixes[i + 1];

    if (!next) {
      result.push(curr);
      continue;
    }

    const overlapLen = findWordOverlapLength(curr.text, next.text);
    if (overlapLen > 0) {
      const words = curr.text.trim().split(/\s+/);
      const uniqueText = words.slice(0, words.length - overlapLen).join(' ').trim();
      if (uniqueText) {
        result.push({ ...curr, text: uniqueText });
      }
      // If uniqueText is empty (entire cue was overlap), drop silently
    } else {
      result.push(curr);
    }
  }

  // ── Step 4: Remove music/sound-only annotation cues ─────────────────────
  // These carry no speech content and clutter language-learning view.
  const ANNOTATION_ONLY = /^\[([^\]]+)\](\s+\[([^\]]+)\])*$/i;
  return result.filter(c => !ANNOTATION_ONLY.test(c.text.trim()));
}

// ─── Core VTT Parser ────────────────────────────────────────────────────────

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

  // Collapse YouTube auto-caption rolling window format (if detected)
  const collapsed = collapseYouTubeRollingCaptions(deduped);

  // Add index field
  return collapsed.map((cue, idx) => ({
    index: idx,
    start: Math.round(cue.start * 1000) / 1000,
    end: Math.round(cue.end * 1000) / 1000,
    text: cue.text,
  }));
}

module.exports = { parseVTT, vttTimeToSeconds, stripVTTTags };
