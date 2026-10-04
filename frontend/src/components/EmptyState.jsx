import React from 'react';
import { PackageOpen } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = PackageOpen,
  title = 'No items found',
  description = '',
  actionText = '',
  onAction = null
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-2xl) var(--space-lg)',
        textAlign: 'center',
        backgroundColor: 'var(--nb-white)',
        borderRadius: 'var(--radius-sm)',
        border: '3px dashed var(--nb-black)',
        boxShadow: 'var(--shadow-sm)',
        margin: 'var(--space-md) 0'
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--nb-yellow-light)',
          border: 'var(--border-medium)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--nb-black)',
          marginBottom: 'var(--space-md)'
        }}
      >
        <Icon size={32} strokeWidth={2.5} />
      </div>
      <h3 style={{ fontSize: '1.3rem', fontWeight: '900', marginBottom: '6px', color: 'var(--nb-black)' }}>
        {title}
      </h3>
      {description && (
        <p style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-text-secondary)', maxWidth: '440px', marginBottom: actionText ? 'var(--space-md)' : 0 }}>
          {description}
        </p>
      )}
      {actionText && onAction && (
        <button onClick={onAction} className="btn btn-primary btn-sm">
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
