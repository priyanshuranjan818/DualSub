const SUPPORTED_LANGS = ['de', 'en'];

const LANG_LABELS = {
  de: 'German',
  en: 'English',
};

const SOURCE_TYPES = {
  YOUTUBE_MANUAL: 'youtube_manual',
  YOUTUBE_AUTO: 'youtube_auto',
  TRANSLATED_DEEPL: 'translated_deepl',
  TRANSLATED_LIBRETRANSLATE: 'translated_libretranslate',
  GROQ_WHISPER: 'groq_whisper',
};

module.exports = { SUPPORTED_LANGS, LANG_LABELS, SOURCE_TYPES };
