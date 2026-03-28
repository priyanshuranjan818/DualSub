/**
 * SubtitleSyncEngine — Polls YouTube player time, binary-searches for active
 * subtitle cue, and reports the active index for transcript sidebar highlighting.
 */
export class SubtitleSyncEngine {
  constructor(onUpdate) {
    this.onUpdate = onUpdate; // (srcCue, transCue, srcIdx) => void
    this.deCues = [];
    this.enCues = [];
    this.interval = null;
    this.getTime = null;
  }

  setDeCues(cues) { this.deCues = cues || []; }
  setEnCues(cues) { this.enCues = cues || []; }
  setTimeGetter(fn) { this.getTime = fn; }

  start() {
    this.stop();
    this.interval = setInterval(() => {
      if (!this.getTime) return;
      const t = this.getTime();
      if (t == null) return;
      const srcIdx  = this.findCueIndex(this.deCues, t);
      const transIdx = this.findCueIndex(this.enCues, t);
      const srcCue  = srcIdx  >= 0 ? this.deCues[srcIdx]  : null;
      const transCue = transIdx >= 0 ? this.enCues[transIdx] : null;
      this.onUpdate(srcCue, transCue, srcIdx);
    }, 200);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /** Binary search — returns index (-1 if not found). */
  findCueIndex(cues, time) {
    if (!cues || cues.length === 0) return -1;
    let lo = 0, hi = cues.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (cues[mid].end < time)        lo = mid + 1;
      else if (cues[mid].start > time) hi = mid - 1;
      else return mid;
    }
    return -1;
  }

  /** Backwards-compat helper used by useSubtitleSync freeze path. */
  findCue(cues, time) {
    const idx = this.findCueIndex(cues, time);
    return idx >= 0 ? cues[idx] : null;
  }
}
