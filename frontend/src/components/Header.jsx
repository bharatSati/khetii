import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  ChevronDown,
  ChevronRight,
  Search,
  ShoppingCart,
  CloudSun,
  MapPin,
  LayoutDashboard,
  Landmark,
  ShoppingBag,
  IndianRupee,
  Sparkles,
  PhoneCall,
  ShieldCheck
} from 'lucide-react';

export const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isHindi = i18n.language?.startsWith('hi');

  const [menuOpen, setMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const profileRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Sync cart item count
  const updateCartCount = () => {
    try {
      const saved = localStorage.getItem('kheti_cart');
      if (saved) {
        const items = JSON.parse(saved);
        const total = items.reduce((acc, it) => acc + (it.cartQuantity || 1), 0);
        setCartCount(total);
      } else {
        setCartCount(0);
      }
    } catch (e) {
      setCartCount(0);
    }
  };

  useEffect(() => {
    updateCartCount();
    window.addEventListener('kheti_cart_updated', updateCartCount);
    window.addEventListener('storage', updateCartCount);
    return () => {
      window.removeEventListener('kheti_cart_updated', updateCartCount);
      window.removeEventListener('storage', updateCartCount);
    };
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMenuOpen(false);
    setProfileDropdownOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut (Escape to close, Cmd+K / Ctrl+K focus search)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setProfileDropdownOpen(false);
        setMobileSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="main-floating-header">
      {/* Mobile Full-width Search Bar Mode */}
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
          {/* ======================================================== */}
          {/* 1. LEFT: Brand Emblem + Name + Location Pill */}
          {/* ======================================================== */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
            <Link
              to="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none'
              }}
            >
              {/* Emblem Box */}
              <div
                className="header-logo-box"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--nb-green-bright)',
                  backgroundImage: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  border: 'var(--border-medium)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  flexShrink: 0,
                  transition: 'transform 0.15s ease'
                }}
              >
                <Sprout size={26} strokeWidth={2.6} />
              </div>

              {/* Brand Typography */}
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span
                    className="header-brand-title"
                    style={{
                      fontSize: '1.45rem',
                      fontWeight: '900',
                      color: 'var(--nb-black)',
                      lineHeight: 1,
                      letterSpacing: '-0.5px'
                    }}
                  >
                    खेती
                  </span>
                  <span
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: '900',
                      color: 'var(--nb-black)',
                      letterSpacing: '0.8px',
                      textTransform: 'uppercase',
                      opacity: 0.85
                    }}
                  >
                    KHETII
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.68rem',
                    fontWeight: '800',
                    color: 'var(--color-text-secondary)',
                    marginTop: '2px'
                  }}
                  className="header-brand-tagline"
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--nb-green-bright)',
                      display: 'inline-block'
                    }}
                    className="pulse-dot"
                  />
                  <span>{isHindi ? 'डिजिटल किसान साथी • AI' : 'Digital Farmer Companion'}</span>
                </div>
              </div>
            </Link>

            {/* Quick Location / Weather Pill (Desktop >= 1080px) */}
            <Link
              to="/weather"
              className="header-weather-chip"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--nb-canvas-alt)',
                border: 'var(--border-thin)',
                borderRadius: '20px',
                padding: '4px 10px',
                fontSize: '0.78rem',
                fontWeight: '800',
                color: 'var(--nb-black)',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.15s ease'
              }}
              title={isHindi ? 'मौसम पूर्वानुमान व कृषि सलाह' : 'Live Farm Weather'}
            >
              <CloudSun size={15} strokeWidth={2.5} style={{ color: 'var(--nb-orange)' }} />
              <span>{user?.district || user?.city || (isHindi ? 'मौसम' : 'Weather')}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--nb-green)', fontWeight: '900' }}>• लाइव</span>
            </Link>
          </div>

          {/* ======================================================== */}
          {/* 2. CENTER: Global Search Bar */}
          {/* ======================================================== */}
          <div
            className="header-search-desktop"
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              maxWidth: '520px',
              margin: '0 auto',
              padding: '0 12px'
            }}
          >
            <GlobalSearch />
          </div>

          {/* ======================================================== */}
          {/* 3. RIGHT: Direct Actions (Cart, Lang, Theme, User) */}
          {/* ======================================================== */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexShrink: 0
            }}
          >
            {/* Mobile Search Icon (only on screens <= 768px) */}
            <button
              onClick={() => setMobileSearchOpen(true)}
              className="hamburger-btn header-search-mobile-btn"
              aria-label="Search"
              title="सर्च करें / Search"
            >
              <Search size={18} strokeWidth={2.5} />
            </button>

            {/* Shopping Cart Button (Always visible if items exist, or desktop) */}
            <Link
              to="/marketplace"
              className="header-cart-btn"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 11px',
                borderRadius: '10px',
                backgroundColor: cartCount > 0 ? 'var(--nb-yellow-light)' : 'var(--nb-white)',
                border: 'var(--border-medium)',
                boxShadow: 'var(--shadow-sm)',
                color: 'var(--nb-black)',
                fontWeight: '900',
                fontSize: '0.84rem',
                transition: 'transform 0.1s ease'
              }}
              title={isHindi ? 'शॉपिंग कार्ट' : 'Shopping Cart'}
            >
              <ShoppingCart size={17} strokeWidth={2.5} />
              {cartCount > 0 && (
                <span
                  style={{
                    backgroundColor: 'var(--nb-black)',
                    color: 'var(--nb-yellow)',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '0.74rem',
                    fontWeight: '900'
                  }}
                >
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Desktop Language Switcher (Visible on desktop >= 860px) */}
            <div className="header-desktop-actions">
              <LanguageSwitcher />
            </div>

            {/* Desktop Theme Switcher (Visible on desktop >= 860px) */}
            <div className="header-desktop-actions">
              <ThemeToggle />
            </div>

            {/* Farmer Profile Pill or Login CTA */}
            {isAuthenticated ? (
              <div ref={profileRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen((prev) => !prev)}
                  className="header-profile-pill"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '5px 10px',
                    borderRadius: '10px',
                    backgroundColor: profileDropdownOpen ? 'var(--nb-yellow-light)' : 'var(--nb-white)',
                    border: 'var(--border-medium)',
                    boxShadow: 'var(--shadow-sm)',
                    color: 'var(--nb-black)',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease'
                  }}
                  title={t('nav.profile')}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--nb-yellow)',
                      border: '1.5px solid #000000',
                      color: '#000000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '900',
                      fontSize: '0.88rem',
                      flexShrink: 0
                    }}
                  >
                    {user?.name ? user.name.charAt(0).toUpperCase() : <User size={14} />}
                  </div>

                  <span
                    className="user-badge-name"
                    style={{
                      fontWeight: '900',
                      fontSize: '0.88rem',
                      color: 'var(--nb-black)',
                      maxWidth: '100px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {user?.name?.split(' ')[0] || (isHindi ? 'किसान' : 'Profile')}
                  </span>

                  <ChevronDown
                    size={15}
                    strokeWidth={2.5}
                    style={{
                      transform: profileDropdownOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.15s ease'
                    }}
                  />
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="navbar-dropdown-menu" style={{ width: '280px' }}>
                    {/* User Profile Card Header */}
                    <div
                      style={{
                        paddingBottom: '12px',
                        borderBottom: 'var(--border-medium)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          backgroundColor: 'var(--nb-yellow)',
                          border: 'var(--border-medium)',
                          boxShadow: 'var(--shadow-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '900',
                          fontSize: '1.2rem',
                          color: '#000000',
                          flexShrink: 0
                        }}
                      >
                        {user?.name ? user.name.charAt(0).toUpperCase() : <User size={20} />}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: '900', fontSize: '0.96rem', color: 'var(--nb-black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user?.name || 'साथी किसान'}
                        </div>
                        <div style={{ fontSize: '0.76rem', fontWeight: '800', color: 'var(--nb-green)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                          <ShieldCheck size={13} strokeWidth={2.5} />
                          <span>{user?.district ? `${user.district}, ${user?.state || ''}` : 'प्रमाणित किसान'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick navigation links inside dropdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <Link
                        to="/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="dropdown-nav-item"
                      >
                        <LayoutDashboard size={16} strokeWidth={2.5} />
                        <span>{t('nav.dashboard')}</span>
                      </Link>

                      <Link
                        to="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="dropdown-nav-item"
                      >
                        <UserCheck size={16} strokeWidth={2.5} />
                        <span>{t('nav.profile')}</span>
                      </Link>

                      <Link
                        to="/finance"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="dropdown-nav-item"
                      >
                        <IndianRupee size={16} strokeWidth={2.5} />
                        <span>{t('nav.finance')}</span>
                      </Link>

                      <Link
                        to="/marketplace"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="dropdown-nav-item"
                      >
                        <ShoppingBag size={16} strokeWidth={2.5} />
                        <span>{t('nav.marketplace')}</span>
                      </Link>
                    </div>

                    {/* Logout Button */}
                    <div style={{ paddingTop: '8px', borderTop: 'var(--border-thin)' }}>
                      <button
                        onClick={() => {
                          logout();
                          setProfileDropdownOpen(false);
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
                          color: 'var(--nb-red)',
                          fontWeight: '900',
                          fontSize: '0.86rem'
                        }}
                      >
                        <LogOut size={16} strokeWidth={2.5} />
                        <span>{t('nav.logout') || 'लॉगआउट'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Link
                  to="/login"
                  className="btn btn-secondary btn-sm header-login-btn"
                  style={{
                    padding: '7px 12px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: '900',
                    fontSize: '0.84rem'
                  }}
                >
                  <LogIn size={15} strokeWidth={2.5} />
                  <span>{t('nav.login')}</span>
                </Link>

                <Link
                  to="/register"
                  className="btn btn-primary btn-sm header-register-btn"
                  style={{
                    padding: '7px 12px',
                    borderRadius: '10px',
                    fontWeight: '900',
                    fontSize: '0.84rem'
                  }}
                >
                  <span>{t('nav.register')}</span>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Drawer Trigger (<= 860px) */}
            <div ref={mobileMenuRef} className="header-mobile-menu-box" style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="hamburger-btn"
                aria-label="Toggle navigation drawer"
                aria-expanded={menuOpen}
                style={{
                  backgroundColor: menuOpen ? 'var(--nb-yellow)' : 'var(--nb-white)'
                }}
              >
                {menuOpen ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2.5} />}
              </button>

              {/* Mobile Sliding Drawer */}
              {menuOpen && (
                <div className="navbar-dropdown-menu" style={{ width: '310px' }}>
                  {/* Account Card or Login Prompt */}
                  {isAuthenticated ? (
                    <div style={{ paddingBottom: '12px', borderBottom: 'var(--border-medium)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '8px',
                            backgroundColor: 'var(--nb-yellow)',
                            border: 'var(--border-medium)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '900',
                            fontSize: '1.1rem'
                          }}
                        >
                          {user?.name ? user.name.charAt(0).toUpperCase() : <User size={18} />}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: '900', fontSize: '0.94rem', color: 'var(--nb-black)' }}>
                            {user?.name || 'साथी किसान'}
                          </div>
                          <div style={{ fontSize: '0.74rem', fontWeight: '700', color: 'var(--color-text-secondary)' }}>
                            📍 {user?.district ? `${user.district}, ${user.state || ''}` : (user?.state || 'भारत')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', paddingBottom: '12px', borderBottom: 'var(--border-medium)' }}>
                      <Link
                        to="/login"
                        onClick={() => setMenuOpen(false)}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, textAlign: 'center' }}
                      >
                        {t('nav.login')}
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setMenuOpen(false)}
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, textAlign: 'center' }}
                      >
                        {t('nav.register')}
                      </Link>
                    </div>
                  )}

                  {/* Language & Theme Controls Row */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '10px', borderBottom: 'var(--border-thin)' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--color-text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>
                        🌐 {isHindi ? 'भाषा चुनें' : 'Language'}
                      </div>
                      <LanguageSwitcher />
                    </div>

                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--color-text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>
                        🌓 {isHindi ? 'डार्क / लाइट थीम' : 'Display Mode'}
                      </div>
                      <ThemeToggle />
                    </div>
                  </div>

                  {/* Direct Toll-Free Helpline Link */}
                  <a
                    href="tel:18001801551"
                    className="btn btn-secondary btn-sm"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      backgroundColor: 'var(--nb-green-light)',
                      color: 'var(--nb-black)',
                      fontWeight: '900',
                      textDecoration: 'none'
                    }}
                  >
                    <PhoneCall size={16} strokeWidth={2.5} style={{ color: 'var(--nb-green)' }} />
                    <span>किसान हेल्पलाइन: 1800-180-1551</span>
                  </a>

                  {/* Logout for mobile if authenticated */}
                  {isAuthenticated && (
                    <button
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{
                        color: 'var(--nb-red)',
                        fontWeight: '900',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <LogOut size={15} strokeWidth={2.5} />
                      <span>{t('nav.logout')}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
