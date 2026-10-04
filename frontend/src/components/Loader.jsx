import React from 'react';
import { Loader2 } from 'lucide-react';

export const Loader = ({ message = 'Loading...', size = 36 }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-2xl) var(--space-md)',
        gap: 'var(--space-md)',
        color: 'var(--nb-black)'
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          backgroundColor: 'var(--nb-yellow)',
          border: 'var(--border-medium)',
          boxShadow: 'var(--shadow-md)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Loader2 size={size} strokeWidth={2.5} style={{ animation: 'spin 1s linear infinite', color: 'var(--nb-black)' }} />
      </div>
      <div style={{ fontSize: '1.05rem', fontWeight: '900', color: 'var(--nb-black)', letterSpacing: '0.3px' }}>
        {message}
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Loader;
