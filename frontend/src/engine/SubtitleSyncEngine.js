/**
 * SubtitleSyncEngine — Plain JS class that polls the YouTube player's current time
 * and uses binary search to find the active subtitle cue. Runs outside React render cycle.
 */
export class SubtitleSyncEngine {
  constructor(onUpdate) {
    this.onUpdate = onUpdate;
    this.deCues = [];
    this.enCues = [];
    this.interval = null;
    this.getTime = null;
  }

  setDeCues(cues) {
    this.deCues = cues || [];
  }

  setEnCues(cues) {
    this.enCues = cues || [];
  }

  setTimeGetter(fn) {
    this.getTime = fn;
  }

  start() {
    this.stop();
    this.interval = setInterval(() => {
      if (!this.getTime) return;
      const t = this.getTime();
      if (t === null || t === undefined) return;
      const deCue = this.findCue(this.deCues, t);
      const enCue = this.findCue(this.enCues, t);
      this.onUpdate(deCue, enCue);
    }, 250);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Binary search for O(log n) performance on large subtitle files.
   * Returns the cue containing the given time, or null if not in any cue range.
   */
  findCue(cues, time) {
    if (!cues || cues.length === 0) return null;

    let lo = 0;
    let hi = cues.length - 1;

    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (cues[mid].end < time) {
        lo = mid + 1;
      } else if (cues[mid].start > time) {
        hi = mid - 1;
      } else {
        return cues[mid];
      }
    }

    return null;
  }
}
