const fetch = require('node-fetch');
const config = require('../config');
const logger = require('../utils/logger');

const CHUNK_SIZE = 50;

/**
 * Translates an array of German cues to English.
 * Uses DeepL if configured, otherwise falls back to free Google Translate.
 */
async function translateCues(deCues) {
  if (!deCues || deCues.length === 0) return [];

  // Try DeepL first if configured
  if (config.DEEPL_KEY && config.DEEPL_KEY !== 'your-deepl-api-key-here') {
    logger.info('Using DeepL API for translation');
    return translateWithDeepL(deCues);
  }

  // Fallback to free Google Translate (batched)
  logger.info('DEEPL_KEY not configured — using free Google Translate fallback');
  return translateWithGoogleBatched(deCues);
}

/**
 * DeepL translation (requires API key)
 */
async function translateWithDeepL(deCues) {
  const enCues = [];

  for (let i = 0; i < deCues.length; i += CHUNK_SIZE) {
    const chunk = deCues.slice(i, i + CHUNK_SIZE);
    const texts = chunk.map(c => c.text);

    try {
      const params = new URLSearchParams();
      texts.forEach(t => params.append('text', t));
      params.append('source_lang', 'DE');
      params.append('target_lang', 'EN');

      const response = await fetch('https://api-free.deepl.com/v2/translate', {
        method: 'POST',
        headers: {
          Authorization: `DeepL-Auth-Key ${config.DEEPL_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errBody = await response.text();
        logger.error({ status: response.status, body: errBody?.substring(0, 200) }, 'DeepL API error');
        throw new Error(`DeepL API returned ${response.status}`);
      }

      const data = await response.json();

      chunk.forEach((cue, j) => {
        enCues.push({
          index: i + j,
          start: cue.start,
          end: cue.end,
          text: data.translations[j]?.text || cue.text,
        });
      });

      logger.info({ batch: Math.floor(i / CHUNK_SIZE) + 1, cueCount: chunk.length }, 'DeepL batch translated');
    } catch (err) {
      logger.error({ error: err.message, batchStart: i }, 'DeepL batch failed');
      chunk.forEach((cue, j) => {
        enCues.push({ index: i + j, start: cue.start, end: cue.end, text: cue.text });
      });
    }
  }

  return enCues.map((cue, idx) => ({ ...cue, index: idx }));
}

/**
 * Free Google Translate — batches multiple cues into a single request
 * using a unique separator to split them back after translation.
 */
async function translateWithGoogleBatched(deCues) {
  const BATCH_SIZE = 80; // ~80 cues per request (stays under URL/body limits)
  const SEPARATOR = ' ||| ';
  const enCues = [];

  for (let i = 0; i < deCues.length; i += BATCH_SIZE) {
    const chunk = deCues.slice(i, i + BATCH_SIZE);
    const joinedText = chunk.map(c => c.text).join(SEPARATOR);

    try {
      const encoded = encodeURIComponent(joinedText);
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=de&tl=en&dt=t&q=${encoded}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`Google Translate HTTP ${response.status}`);
      }

      const data = await response.json();

      // Google returns [[["translated text","original text",...],...],...] 
      let fullTranslated = '';
      if (Array.isArray(data) && Array.isArray(data[0])) {
        fullTranslated = data[0].map(segment => segment[0] || '').join('');
      }

      // Split back using separator
      const parts = fullTranslated.split(/\s*\|\|\|\s*/);

      chunk.forEach((cue, j) => {
        enCues.push({
          index: i + j,
          start: cue.start,
          end: cue.end,
          text: (parts[j] || '').trim() || cue.text,
        });
      });

      logger.info({ batch: Math.floor(i / BATCH_SIZE) + 1, cueCount: chunk.length }, 'Google batch translated');
    } catch (err) {
      logger.warn({ error: err.message, batchStart: i }, 'Google Translate batch failed, using original text');
      chunk.forEach((cue, j) => {
        enCues.push({ index: i + j, start: cue.start, end: cue.end, text: cue.text });
      });
    }

    // Small delay between batches to avoid rate limits
    if (i + BATCH_SIZE < deCues.length) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  logger.info({ totalCues: enCues.length }, 'Google Translate completed');
  return enCues.map((cue, idx) => ({ ...cue, index: idx }));
}

module.exports = { translateCues };
