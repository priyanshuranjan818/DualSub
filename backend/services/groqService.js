const fs = require('fs');
const Groq = require('groq-sdk');
const config = require('../config');
const logger = require('../utils/logger');

const groq = config.GROQ_API_KEY ? new Groq({ apiKey: config.GROQ_API_KEY }) : null;

/**
 * Transcribes an audio file using Groq's Whisper API.
 * Converts Groq's text segments format into our app's Cue array format.
 */
async function transcribeAudio(audioPath, language = 'de', providedApiKey = null) {
  const apiKeyToUse = providedApiKey || config.GROQ_API_KEY;
  
  if (!apiKeyToUse) {
    throw new Error('GROQ_API_KEY is not configured and no user key was provided');
  }

  const groqClient = (providedApiKey && providedApiKey !== config.GROQ_API_KEY)
    ? new Groq({ apiKey: providedApiKey })
    : groq;

  if (!groqClient) {
    throw new Error('Failed to initialize Groq client');
  }

  logger.info({ audioPath, usingCustomKey: !!providedApiKey }, 'Uploading audio to Groq for transcription...');
  
  try {
    const transcription = await groqClient.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: 'whisper-large-v3',
      response_format: 'verbose_json',
      language: language,
    });

    if (!transcription || !transcription.segments || transcription.segments.length === 0) {
      logger.warn('Groq returned an empty transcription or missing segments');
      return [];
    }

    // Map Groq segments to our internal cue format
    // A single Groq segment looks like: { start: 0.1, end: 5.4, text: "Hallo!" }
    const cues = transcription.segments.map((seg, idx) => {
      return {
        index: idx,
        start: Math.round(seg.start * 1000) / 1000,
        end: Math.round(seg.end * 1000) / 1000,
        text: seg.text.trim(),
      };
    });

    logger.info({ parsedCues: cues.length }, 'Groq transcription complete');
    
    return cues;
  } catch (err) {
    logger.error({ error: err.message, stack: err.stack }, 'Groq transcription failed');
    throw err;
  }
}

module.exports = { transcribeAudio };
