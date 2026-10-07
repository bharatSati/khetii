/**
 * Unified Text-to-Speech (TTS) Utility for Khetii Farmers
 * Uses Browser Web Speech API (window.speechSynthesis) with zero latency & zero API cost.
 */

// Global active callback references to sync UI buttons
let activeOnEndCallback = null;
let activeOnStartCallback = null;

export const tts = {
  /**
   * Check if Speech Synthesis is supported in the current browser
   */
  isSupported: () => {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  },

  /**
   * Check if speech is currently active
   */
  isSpeaking: () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    return window.speechSynthesis.speaking;
  },

  /**
   * Stop any currently ongoing speech
   */
  stop: () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (activeOnEndCallback) {
        activeOnEndCallback();
        activeOnEndCallback = null;
      }
      activeOnStartCallback = null;
    }
  },

  /**
   * Clean text for natural speech synthesis:
   * Strips markdown symbols, asterisks, URLs, hashes, and noisy emojis
   */
  cleanTextForSpeech: (text) => {
    if (!text) return '';
    return String(text)
      // Remove URLs
      .replace(/https?:\/\/\S+/gi, '')
      // Remove Markdown bold/italic/strikethrough
      .replace(/[*_~`#]/g, '')
      // Remove bullets / dashes at start of lines
      .replace(/^\s*[-•✔💡⚠️📢📋⚡]\s*/gm, '')
      // Remove standalone common emojis to prevent annoying reading of emoji descriptions
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      // Collapse repeated spaces and newlines into natural pauses
      .replace(/\s+/g, ' ')
      .trim();
  },

  /**
   * Find best voice matching target language (Hindi vs Indian English vs English)
   */
  getBestVoice: (targetLang = 'hi') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    if (voices.length === 0) return null;

    const isHindi = targetLang.startsWith('hi');

    if (isHindi) {
      // 1. Exact hi-IN voice (e.g. Google हिन्दी, Lekha, Rishi, etc.)
      const hiVoice = voices.find((v) => v.lang === 'hi-IN' || v.lang.startsWith('hi'));
      if (hiVoice) return hiVoice;
      // 2. Indian English voice fallback (pronounces Hinglish words naturally)
      const inVoice = voices.find((v) => v.lang === 'en-IN');
      if (inVoice) return inVoice;
    } else {
      // English voice preference: en-IN -> en-US -> en-GB
      const enInVoice = voices.find((v) => v.lang === 'en-IN');
      if (enInVoice) return enInVoice;
      const enVoice = voices.find((v) => v.lang.startsWith('en'));
      if (enVoice) return enVoice;
    }

    return voices[0] || null;
  },

  /**
   * Speak text with automatic language detection, natural rate and voice selection
   */
  speak: (text, options = {}) => {
    if (!tts.isSupported() || !text) return false;

    const {
      lang = 'hi',
      rate = 0.95,
      pitch = 1.0,
      onStart,
      onEnd,
      onError
    } = options;

    // Cancel any previous speech
    tts.stop();

    const cleaned = tts.cleanTextForSpeech(text);
    if (!cleaned) return false;

    // Auto-detect language if text has Devanagari characters
    let speechLang = lang;
    if (/[\u0900-\u097F]/.test(cleaned)) {
      speechLang = 'hi-IN';
    } else if (lang.startsWith('hi')) {
      speechLang = 'hi-IN';
    } else {
      speechLang = 'en-IN';
    }

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = speechLang;
    utterance.rate = rate; // 0.95 is optimal for clarity in rural and farmer settings
    utterance.pitch = pitch;

    // Pick best voice if loaded
    const voice = tts.getBestVoice(speechLang);
    if (voice) {
      utterance.voice = voice;
    }

    activeOnStartCallback = onStart;
    activeOnEndCallback = onEnd;

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      activeOnEndCallback = null;
      activeOnStartCallback = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      activeOnEndCallback = null;
      activeOnStartCallback = null;
      console.warn('[TTS] Speech synthesis notice:', e.error);
      if (onError) onError(e);
      if (onEnd) onEnd();
    };

    // Chrome bug workaround: ensure voices are loaded
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        const v = tts.getBestVoice(speechLang);
        if (v) utterance.voice = v;
        window.speechSynthesis.speak(utterance);
      };
    }

    window.speechSynthesis.speak(utterance);
    return true;
  }
};

export default tts;
