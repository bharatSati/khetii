import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle = () => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-secondary btn-sm"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontWeight: '900',
        backgroundColor: isDark ? 'var(--nb-yellow)' : 'var(--nb-white)',
        color: isDark ? '#000000' : 'var(--nb-black)',
        border: 'var(--border-medium)',
        boxShadow: 'var(--shadow-sm)',
        padding: '6px 12px'
      }}
      title={isDark ? 'Switch to Light Mode (लाइट मोड)' : 'Switch to Dark Mode (डार्क मोड)'}
      aria-label="Toggle Dark and Light theme"
    >
      {isDark ? (
        <>
          <Sun size={17} strokeWidth={2.5} style={{ color: '#000000' }} />
          <span style={{ fontSize: '0.85rem' }}>Light</span>
        </>
      ) : (
        <>
          <Moon size={17} strokeWidth={2.5} style={{ color: 'var(--nb-black)' }} />
          <span style={{ fontSize: '0.85rem' }}>Dark</span>
        </>
      )}
    </button>
  );
};

export default ThemeToggle;
