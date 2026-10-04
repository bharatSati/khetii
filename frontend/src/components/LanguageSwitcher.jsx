import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const { language, changeLanguage } = useAuth();

  // Current active language code (always normalized to 'hi' or 'en')
  const activeLang = (language || i18n.language || 'hi').startsWith('hi') ? 'hi' : 'en';

  const setLang = (target) => {
    if (activeLang !== target) {
      changeLanguage(target);
    }
  };

  return (
    <div
      role="group"
      aria-label="Language selection"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: 'var(--nb-white)',
        border: 'var(--border-medium)',
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--shadow-sm)',
        padding: '2px',
        gap: '2px'
      }}
    >
      <button
        type="button"
        onClick={() => setLang('hi')}
        title="हिंदी चुनें (Hindi)"
        aria-pressed={activeLang === 'hi'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '5px 11px',
          fontSize: '0.86rem',
          fontWeight: '900',
          backgroundColor: activeLang === 'hi' ? 'var(--nb-yellow)' : 'transparent',
          color: activeLang === 'hi' ? '#000000' : 'var(--nb-black)',
          border: activeLang === 'hi' ? '1.5px solid var(--nb-border-color)' : '1.5px solid transparent',
          borderRadius: '3px',
          cursor: 'pointer',
          boxShadow: activeLang === 'hi' ? 'var(--shadow-active)' : 'none',
          transition: 'all 0.1s ease',
          lineHeight: 1.2
        }}
      >
        <span style={{ fontSize: '0.9rem' }}>🇮🇳</span>
        <span>हिंदी</span>
      </button>

      <button
        type="button"
        onClick={() => setLang('en')}
        title="Select English"
        aria-pressed={activeLang === 'en'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '5px 11px',
          fontSize: '0.86rem',
          fontWeight: '900',
          backgroundColor: activeLang === 'en' ? 'var(--nb-yellow)' : 'transparent',
          color: activeLang === 'en' ? '#000000' : 'var(--nb-black)',
          border: activeLang === 'en' ? '1.5px solid var(--nb-border-color)' : '1.5px solid transparent',
          borderRadius: '3px',
          cursor: 'pointer',
          boxShadow: activeLang === 'en' ? 'var(--shadow-active)' : 'none',
          transition: 'all 0.1s ease',
          lineHeight: 1.2
        }}
      >
        <span>English</span>
      </button>
    </div>
  );
};

export default LanguageSwitcher;
