import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { tts } from '../utils/tts';

/**
 * Reusable Farmer-Centric Text-to-Speech (TTS) Button
 */
export const TTSButton = ({
  text,
  lang,
  variant = 'secondary', // 'secondary', 'primary', 'pill', 'icon-only', 'badge'
  size = 'sm', // 'sm', 'md'
  label = null,
  stopLabel = null,
  title = null,
  style = {}
}) => {
  const { i18n } = useTranslation();
  const currentLang = lang || (i18n.language?.startsWith('hi') ? 'hi' : 'en');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // If text is empty or TTS not supported in browser, return null
  if (!text || !tts.isSupported()) {
    return null;
  }

  // Combine text if array passed
  const fullText = Array.isArray(text) ? text.filter(Boolean).join('. ') : text;

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (isSpeaking) {
        tts.stop();
      }
    };
  }, [isSpeaking]);

  const handleToggle = (e) => {
    e.stopPropagation();

    if (isSpeaking) {
      tts.stop();
      setIsSpeaking(false);
    } else {
      const started = tts.speak(fullText, {
        lang: currentLang,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false)
      });
      if (started) {
        setIsSpeaking(true);
      }
    }
  };

  const defaultPlayText = currentLang === 'hi' ? 'सुनें' : 'Listen';
  const defaultStopText = currentLang === 'hi' ? 'रोकें' : 'Stop';
  const displayLabel = isSpeaking ? (stopLabel || defaultStopText) : (label || title || defaultPlayText);

  // Icon size
  const iconSize = size === 'sm' ? 15 : 18;

  // Icon-only variant
  if (variant === 'icon-only') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        title={displayLabel}
        aria-label={displayLabel}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size === 'sm' ? '30px' : '36px',
          height: size === 'sm' ? '30px' : '36px',
          borderRadius: 'var(--radius-sm)',
          border: '1.5px solid var(--nb-border-color)',
          backgroundColor: isSpeaking ? 'var(--nb-red-light)' : 'var(--nb-white)',
          color: isSpeaking ? 'var(--nb-red)' : 'var(--nb-black)',
          boxShadow: isSpeaking ? 'none' : '1.5px 1.5px 0px var(--nb-shadow-color)',
          cursor: 'pointer',
          transition: 'all 0.1s ease',
          transform: isSpeaking ? 'scale(0.96)' : 'none',
          ...style
        }}
      >
        {isSpeaking ? (
          <Square size={iconSize} strokeWidth={2.5} style={{ fill: 'var(--nb-red)', color: 'var(--nb-red)' }} />
        ) : (
          <Volume2 size={iconSize} strokeWidth={2.5} />
        )}
      </button>
    );
  }

  // Pill variant
  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={handleToggle}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: size === 'sm' ? '3px 10px' : '6px 14px',
          fontSize: size === 'sm' ? '0.78rem' : '0.86rem',
          fontWeight: '800',
          borderRadius: 'var(--radius-pill)',
          border: '1.5px solid var(--nb-border-color)',
          backgroundColor: isSpeaking ? 'var(--nb-red-light)' : 'var(--nb-white)',
          color: isSpeaking ? 'var(--nb-red)' : 'var(--nb-black)',
          boxShadow: isSpeaking ? 'none' : '1px 1px 0px var(--nb-shadow-color)',
          cursor: 'pointer',
          transition: 'all 0.1s ease',
          ...style
        }}
      >
        {isSpeaking ? (
          <>
            <Square size={iconSize} strokeWidth={2.5} style={{ fill: 'var(--nb-red)', color: 'var(--nb-red)' }} />
            <span>{displayLabel}</span>
          </>
        ) : (
          <>
            <Volume2 size={iconSize} strokeWidth={2.5} />
            <span>{displayLabel}</span>
          </>
        )}
      </button>
    );
  }

  // Standard Button (primary / secondary)
  const isPrimary = variant === 'primary';
  const bgColor = isSpeaking
    ? 'var(--nb-red)'
    : isPrimary
    ? 'var(--nb-yellow)'
    : 'var(--nb-white)';
  const textColor = isSpeaking ? '#ffffff' : (isPrimary ? '#000000' : 'var(--nb-black)');

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="btn"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: size === 'sm' ? '6px 12px' : '8px 16px',
        fontSize: size === 'sm' ? '0.82rem' : '0.9rem',
        fontWeight: '800',
        backgroundColor: bgColor,
        color: textColor,
        border: '1.5px solid var(--nb-border-color)',
        boxShadow: isSpeaking ? 'none' : '2px 2px 0px var(--nb-shadow-color)',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        transition: 'all 0.1s ease',
        ...style
      }}
    >
      {isSpeaking ? (
        <>
          <Square size={iconSize} strokeWidth={2.5} style={{ fill: '#ffffff' }} />
          <span>{displayLabel}</span>
        </>
      ) : (
        <>
          <Volume2 size={iconSize} strokeWidth={2.5} />
          <span>{displayLabel}</span>
        </>
      )}
    </button>
  );
};

export default TTSButton;
