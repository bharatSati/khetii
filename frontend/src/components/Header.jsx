import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import GlobalSearch from './GlobalSearch';
import { User, LogIn, Sprout } from 'lucide-react';

export const Header = () => {
  const { user, isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();

  return (
    <header
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'var(--nb-white)',
        borderBottom: 'var(--border-thick)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-lg)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 1000
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            flexShrink: 0
          }}
        >
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--nb-green-bright)',
              border: 'var(--border-medium)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--nb-black)'
            }}
          >
            <Sprout size={26} strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: '1.45rem', fontWeight: '900', color: 'var(--nb-black)', lineHeight: 1, letterSpacing: '-0.5px' }}>
              {t('common.appName')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--nb-black)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {i18n.language?.startsWith('hi') ? 'कृषि • समृद्धि • विश्वास' : 'Agriculture • Prosperity • Trust'}
            </div>
          </div>
        </Link>
      </div>

      <div style={{ flex: '1', display: 'flex', justifyContent: 'center', padding: '0 16px' }}>
        <GlobalSearch />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <ThemeToggle />
        <LanguageSwitcher />

        {isAuthenticated ? (
          <Link
            to="/profile"
            className="btn btn-secondary btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px'
            }}
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '4px',
                backgroundColor: 'var(--nb-yellow)',
                border: '1.5px solid #000000',
                color: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '900',
                fontSize: '0.85rem'
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : <User size={14} />}
            </div>
            <span style={{ fontWeight: '800', fontSize: '0.9rem' }}>
              {user?.name?.split(' ')[0] || t('nav.profile')}
            </span>
          </Link>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/login" className="btn btn-secondary btn-sm">
              <LogIn size={16} strokeWidth={2.5} />
              <span>{t('nav.login')}</span>
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              <span>{t('nav.register')}</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
