import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import GlobalSearch from './GlobalSearch';
import {
  User,
  LogIn,
  LogOut,
  Sprout,
  Menu,
  X,
  Globe,
  Sun,
  UserCheck,
  ChevronRight,
  Search
} from 'lucide-react';

export const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown and mobile search on route navigation
  useEffect(() => {
    setMenuOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setMobileSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="main-floating-header">
      {/* Mobile Full-width Search Mode */}
      {mobileSearchOpen ? (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <GlobalSearch />
          </div>
          <button
            onClick={() => setMobileSearchOpen(false)}
            className="hamburger-btn"
            style={{ width: '38px', height: '38px' }}
            aria-label="Close search"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>
      ) : (
        <>
          {/* Left: Brand Logo & Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <Link
              to="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none'
              }}
            >
              <div
                className="header-logo-box"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--nb-green-bright)',
                  border: 'var(--border-medium)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--nb-black)',
                  flexShrink: 0
                }}
              >
                <Sprout size={22} strokeWidth={2.5} />
              </div>
              <div>
                <div
                  className="header-brand-title"
                  style={{
                    fontSize: '1.35rem',
                    fontWeight: '900',
                    color: 'var(--nb-black)',
                    lineHeight: 1,
                    letterSpacing: '-0.5px'
                  }}
                >
                  {t('common.appName') || 'खेती'}
                </div>
                <div
                  className="header-brand-tagline"
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--nb-black)',
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    marginTop: '2px'
                  }}
                >
                  {i18n.language?.startsWith('hi') ? 'कृषि • समृद्धि • विश्वास' : 'Agriculture • Prosperity • Trust'}
                </div>
              </div>
            </Link>
          </div>

          {/* Center: Wide Global Search (Desktop & Tablet) */}
          <div
            className="header-search-desktop"
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              maxWidth: '580px',
              margin: '0 auto',
              padding: '0 12px'
            }}
          >
            <GlobalSearch />
          </div>

          {/* Right: Mobile Search Toggle + User Avatar + Hamburger Menu */}
          <div
            ref={menuRef}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0
            }}
          >
            {/* Mobile Search Toggle Button (visible only on mobile <= 768px) */}
            <button
              onClick={() => setMobileSearchOpen(true)}
              className="hamburger-btn header-search-mobile-btn"
              aria-label="Search"
              title="सर्च करें / Search"
            >
              <Search size={18} strokeWidth={2.5} />
            </button>

            {/* Quick User Avatar Badge (when authenticated) */}
            {isAuthenticated ? (
              <Link
                to="/profile"
                className="btn btn-secondary btn-sm user-badge-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '5px 10px',
                  borderRadius: '10px'
                }}
                title={t('nav.profile')}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--nb-yellow)',
                    border: '1.5px solid #000000',
                    color: '#000000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '900',
                    fontSize: '0.8rem'
                  }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : <User size={13} />}
                </div>
                <span className="user-badge-name" style={{ fontWeight: '800', fontSize: '0.88rem' }}>
                  {user?.name?.split(' ')[0] || t('nav.profile')}
                </span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="btn btn-secondary btn-sm header-login-btn"
                style={{
                  padding: '6px 12px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <LogIn size={15} strokeWidth={2.5} />
                <span className="login-btn-text">{t('nav.login')}</span>
              </Link>
            )}

            {/* Hamburger Menu Toggle Button */}
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="hamburger-btn"
              aria-label="Toggle top navbar menu"
              aria-expanded={menuOpen}
              title="मेन्यू (थीम, भाषा, खाता) / Menu"
              style={{
                backgroundColor: menuOpen ? 'var(--nb-yellow)' : 'var(--nb-white)'
              }}
            >
              {menuOpen ? (
                <X size={20} strokeWidth={2.5} />
              ) : (
                <Menu size={20} strokeWidth={2.5} />
              )}
            </button>

            {/* Dropdown Menu Containing Top Navbar Controls */}
            {menuOpen && (
              <div className="navbar-dropdown-menu">
                {/* 1. Account / Profile Header */}
                {isAuthenticated ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      paddingBottom: '12px',
                      borderBottom: 'var(--border-medium)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--nb-yellow)',
                          border: 'var(--border-medium)',
                          boxShadow: 'var(--shadow-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '900',
                          fontSize: '1.1rem',
                          color: '#000000',
                          flexShrink: 0
                        }}
                      >
                        {user?.name ? user.name.charAt(0).toUpperCase() : <User size={18} />}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontWeight: '900',
                            fontSize: '0.94rem',
                            color: 'var(--nb-black)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {user?.name || 'साथी किसान'}
                        </div>
                        <div
                          style={{
                            fontSize: '0.74rem',
                            fontWeight: '700',
                            color: 'var(--color-text-secondary)',
                            marginTop: '2px'
                          }}
                        >
                          📍 {user?.district ? `${user.district}, ${user.state || ''}` : (user?.state || 'भारत')}
                        </div>
                      </div>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: '800',
                        fontSize: '0.85rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserCheck size={16} strokeWidth={2.5} />
                        <span>{t('nav.profile') || 'मेरी प्रोफाइल'}</span>
                      </div>
                      <ChevronRight size={16} strokeWidth={2.5} />
                    </Link>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      paddingBottom: '12px',
                      borderBottom: 'var(--border-medium)'
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: '800',
                        color: 'var(--color-text-secondary)',
                        textTransform: 'uppercase'
                      }}
                    >
                      किसान खाता / Account
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link
                        to="/login"
                        onClick={() => setMenuOpen(false)}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, justifyContent: 'center', padding: '8px 10px', borderRadius: '8px' }}
                      >
                        <LogIn size={15} strokeWidth={2.5} />
                        <span>{t('nav.login')}</span>
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setMenuOpen(false)}
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, justifyContent: 'center', padding: '8px 10px', borderRadius: '8px' }}
                      >
                        <span>{t('nav.register')}</span>
                      </Link>
                    </div>
                  </div>
                )}

                {/* 2. Language Switcher Row */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: '800',
                      color: 'var(--color-text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Globe size={14} strokeWidth={2.5} />
                    <span>भाषा / Language</span>
                  </div>
                  <LanguageSwitcher />
                </div>

                {/* 3. Theme Toggle Row */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: '800',
                      color: 'var(--color-text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Sun size={14} strokeWidth={2.5} />
                    <span>थीम / Display Theme</span>
                  </div>
                  <ThemeToggle />
                </div>

                {/* 4. Logout Button (if authenticated) */}
                {isAuthenticated && (
                  <div style={{ paddingTop: '8px', borderTop: 'var(--border-medium)' }}>
                    <button
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        borderRadius: '8px',
                        color: 'var(--nb-red, #dc2626)',
                        fontWeight: '800',
                        fontSize: '0.86rem'
                      }}
                    >
                      <LogOut size={16} strokeWidth={2.5} />
                      <span>{t('nav.logout') || 'लॉगआउट'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
