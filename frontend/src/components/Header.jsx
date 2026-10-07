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
  ShieldCheck,
  TrendingUp,
  BookOpen,
  MessageSquare
} from 'lucide-react';

export const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isHindi = i18n.language?.startsWith('hi');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

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

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [drawerOpen]);

  // Close drawer and mobile search on route change
  useEffect(() => {
    setDrawerOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  // Keyboard shortcut listener (Escape to close drawer)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        setMobileSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // All 10 Application Navigation Links for the Hamburger Drawer
  const navigationServices = [
    {
      to: '/dashboard',
      icon: LayoutDashboard,
      iconBg: 'var(--nb-yellow-light)',
      title: isHindi ? 'डैशबोर्ड' : 'Dashboard',
      desc: isHindi ? 'खेती अवलोकन व त्वरित कार्य' : 'Farm overview & quick actions'
    },
    {
      to: '/weather',
      icon: CloudSun,
      iconBg: 'var(--nb-orange-light)',
      title: isHindi ? 'खेत मौसम इंटेलिजेंस' : 'Farm Weather Intelligence',
      desc: isHindi ? 'AI दैनिक कार्य योजना व सिंचाई' : 'AI farm plan & spray window'
    },
    {
      to: '/schemes',
      icon: Landmark,
      iconBg: 'var(--nb-blue-light)',
      title: isHindi ? 'सरकारी योजनाएं' : 'Govt Schemes',
      desc: isHindi ? 'सब्सिडी, पात्रता व आवेदन सहायता' : 'Subsidies, grants & voice AI'
    },
    {
      to: '/insurance',
      icon: ShieldCheck,
      iconBg: 'var(--nb-green-light)',
      title: isHindi ? 'फसल बीमा (PMFBY)' : 'PMFBY Crop Insurance',
      desc: isHindi ? 'प्रीमियम दरें व 72 घंटे में दावा' : 'Coverage stages & claims'
    },
    {
      to: '/market',
      icon: TrendingUp,
      iconBg: 'var(--nb-orange-light)',
      title: isHindi ? 'मंडी भाव (Agmarknet)' : 'Live Mandi Prices',
      desc: isHindi ? 'दैनिक थोक व मॉडल भाव' : 'Real-time prices from data.gov.in'
    },
    {
      to: '/marketplace',
      icon: ShoppingBag,
      iconBg: 'var(--nb-purple-light)',
      title: isHindi ? 'किसान हाट (Marketplace)' : 'Farmer Marketplace',
      desc: isHindi ? 'उपज, बीज, खाद व सीधी खरीद-बिक्री' : 'Direct produce, seeds & tools'
    },
    {
      to: '/documents',
      icon: Sparkles,
      iconBg: 'var(--nb-yellow-light)',
      title: isHindi ? 'डिजिटल सेवाएं' : 'Farmer Digital Services',
      desc: isHindi ? 'AI फसल दृष्टि, PDF, स्कैनर, कंप्रेसर' : 'Image AI, PDF, Scanner, Compressor'
    },
    {
      to: '/finance',
      icon: IndianRupee,
      iconBg: 'var(--nb-green-light)',
      title: isHindi ? 'खाता बही (आय-व्यय)' : 'Farmer Finance Ledger',
      desc: isHindi ? 'खेती की लागत व शुद्ध कमाई का हिसाब' : 'Income, seasonal costs & profit'
    },
    {
      to: '/knowledge',
      icon: BookOpen,
      iconBg: 'var(--nb-blue-light)',
      title: isHindi ? 'कृषि ज्ञान केंद्र' : 'Knowledge Hub & KCC',
      desc: isHindi ? '1.7 लाख+ प्रमाणित KCC रिकॉर्ड्स' : 'Verified ICAR & KCC records'
    },
    {
      to: '/samvaad',
      icon: MessageSquare,
      iconBg: 'var(--nb-purple-light)',
      title: isHindi ? 'स्थानीय किसान संवाद' : 'Local Samvaad',
      desc: isHindi ? 'साथी किसानों से सलाह व अनुभव' : 'Farmer community discussions'
    }
  ];

  return (
    <>
      {/* ======================================================== */}
      {/* MAIN TOP FLOATING NAVBAR */}
      {/* ======================================================== */}
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
            {/* 1. LEFT: Brand Emblem + Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
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

                {/* Typography */}
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
                    <span>{isHindi ? 'डिजिटल किसान साथी' : 'Digital Farmer Companion'}</span>
                  </div>
                </div>
              </Link>
            </div>

            {/* 2. CENTER: Global Search Bar */}
            <div
              className="header-search-desktop"
              style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                maxWidth: '480px',
                margin: '0 auto',
                padding: '0 12px'
              }}
            >
              <GlobalSearch />
            </div>

            {/* 3. RIGHT: Cart + Location + Language + Hamburger Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexShrink: 0
              }}
            >
              {/* Mobile Search Toggle */}
              <button
                onClick={() => setMobileSearchOpen(true)}
                className="hamburger-btn header-search-mobile-btn"
                aria-label="Search"
                title="सर्च करें / Search"
              >
                <Search size={18} strokeWidth={2.5} />
              </button>

              {/* Shopping Cart Pill (Visible when cart has items) */}
              {cartCount > 0 && (
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
                    backgroundColor: 'var(--nb-yellow-light)',
                    border: 'var(--border-medium)',
                    boxShadow: 'var(--shadow-sm)',
                    color: 'var(--nb-black)',
                    fontWeight: '900',
                    fontSize: '0.84rem'
                  }}
                  title={isHindi ? 'शॉपिंग कार्ट' : 'Shopping Cart'}
                >
                  <ShoppingCart size={17} strokeWidth={2.5} />
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
                </Link>
              )}

              {/* Quick Language Switcher on Desktop */}
              <div className="header-desktop-actions">
                <LanguageSwitcher />
              </div>

              {/* Quick Theme Switcher on Desktop */}
              <div className="header-desktop-actions">
                <ThemeToggle />
              </div>

              {/* User Avatar badge (if logged in) */}
              {isAuthenticated && (
                <Link
                  to="/profile"
                  style={{
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--nb-canvas-alt)',
                    border: 'var(--border-thin)',
                    color: 'var(--nb-black)'
                  }}
                  className="user-badge-btn"
                >
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--nb-yellow)',
                      border: '1.5px solid #000000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '900',
                      fontSize: '0.82rem'
                    }}
                  >
                    {user?.name ? user.name.charAt(0).toUpperCase() : <User size={13} />}
                  </div>
                  <span style={{ fontWeight: '800', fontSize: '0.84rem' }} className="user-badge-name">
                    {user?.name?.split(' ')[0]}
                  </span>
                </Link>
              )}

              {/* ======================================================== */}
              {/* THE PROMINENT HAMBURGER MENU BUTTON */}
              {/* ======================================================== */}
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="hamburger-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  width: 'auto',
                  height: '42px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--nb-yellow)',
                  border: 'var(--border-medium)',
                  boxShadow: 'var(--shadow-sm)',
                  color: '#000000',
                  fontWeight: '900',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                aria-label="Open Navigation Menu"
                title={isHindi ? 'नेविगेशन मेन्यू खोलें' : 'Open Menu'}
              >
                <Menu size={22} strokeWidth={2.8} />
                <span style={{ fontSize: '0.9rem', fontWeight: '900' }}>
                  {isHindi ? 'मेन्यू' : 'Menu'}
                </span>
              </button>
            </div>
          </>
        )}
      </header>

      {/* ======================================================== */}
      {/* SLIDE-OVER HAMBURGER NAVIGATION DRAWER */}
      {/* ======================================================== */}
      {drawerOpen && (
        <>
          {/* Dark Backdrop Overlay */}
          <div
            className="hamburger-drawer-overlay"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Slide-In Panel */}
          <div className="hamburger-drawer-panel">
            {/* Drawer Header */}
            <div
              style={{
                padding: '18px 20px',
                borderBottom: 'var(--border-thick)',
                backgroundColor: 'var(--nb-yellow-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--nb-green-bright)',
                    border: 'var(--border-medium)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff'
                  }}
                >
                  <Sprout size={20} strokeWidth={2.6} />
                </div>
                <div>
                  <div style={{ fontWeight: '900', fontSize: '1.15rem', color: 'var(--nb-black)', lineHeight: 1 }}>
                    {isHindi ? 'खेती मेन्यू' : 'Khetii Menu'}
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: '800', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    {isHindi ? 'सभी सेवाएं व सेटिंग्स' : 'All Services & Settings'}
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="hamburger-btn"
                style={{
                  width: '38px',
                  height: '38px',
                  backgroundColor: 'var(--nb-white)'
                }}
                aria-label="Close Menu"
              >
                <X size={20} strokeWidth={2.8} />
              </button>
            </div>

            {/* Scrollable Drawer Body */}
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px', flex: 1 }}>
              {/* 1. Account Section */}
              {isAuthenticated ? (
                <div
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--nb-canvas-alt)',
                    border: 'var(--border-medium)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
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
                      <div style={{ fontWeight: '900', fontSize: '1rem', color: 'var(--nb-black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.name || 'साथी किसान'}
                      </div>
                      <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--nb-green)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <ShieldCheck size={14} strokeWidth={2.5} />
                        <span>{user?.district ? `${user.district}, ${user?.state || ''}` : 'प्रमाणित किसान'}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setDrawerOpen(false)}
                    className="btn btn-secondary btn-sm"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textDecoration: 'none',
                      fontWeight: '800',
                      fontSize: '0.84rem'
                    }}
                  >
                    <span>{isHindi ? 'मेरी प्रोफाइल देखें व बदलें' : 'View & Edit Profile'}</span>
                    <ChevronRight size={15} strokeWidth={2.5} />
                  </Link>
                </div>
              ) : (
                <div
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--nb-canvas-alt)',
                    border: 'var(--border-medium)'
                  }}
                >
                  <div style={{ fontWeight: '900', fontSize: '0.92rem', color: 'var(--nb-black)', marginBottom: '8px' }}>
                    {isHindi ? 'किसान खाता' : 'Farmer Account'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <Link
                      to="/login"
                      onClick={() => setDrawerOpen(false)}
                      className="btn btn-secondary btn-sm"
                      style={{ textAlign: 'center' }}
                    >
                      <LogIn size={14} strokeWidth={2.5} />
                      <span>{t('nav.login')}</span>
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setDrawerOpen(false)}
                      className="btn btn-primary btn-sm"
                      style={{ textAlign: 'center' }}
                    >
                      <span>{t('nav.register')}</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* 2. Fast Settings: Language & Theme Controls */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--nb-white)',
                  border: 'var(--border-medium)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: '900', color: 'var(--nb-black)' }}>
                    🌐 {isHindi ? 'भाषा (Language):' : 'Language:'}
                  </span>
                  <LanguageSwitcher />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: 'var(--border-thin)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: '900', color: 'var(--nb-black)' }}>
                    🌓 {isHindi ? 'थीम (Display Mode):' : 'Theme:'}
                  </span>
                  <ThemeToggle />
                </div>
              </div>

              {/* 3. Core Navigation Services List */}
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: '900', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '8px', letterSpacing: '0.5px' }}>
                  {isHindi ? 'सभी कृषि सेवाएं व उपकरण' : 'All Farming Services & Tools'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {navigationServices.map((svc) => {
                    const Icon = svc.icon;
                    const isActive = location.pathname === svc.to;

                    return (
                      <Link
                        key={svc.to}
                        to={svc.to}
                        onClick={() => setDrawerOpen(false)}
                        className={`drawer-nav-item ${isActive ? 'active' : ''}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              backgroundColor: isActive ? 'var(--nb-white)' : svc.iconBg,
                              border: '1.5px solid var(--nb-border-color)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--nb-black)',
                              flexShrink: 0
                            }}
                          >
                            <Icon size={18} strokeWidth={2.5} />
                          </div>

                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: '900', fontSize: '0.92rem', color: 'var(--nb-black)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {svc.title}
                            </div>
                            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {svc.desc}
                            </div>
                          </div>
                        </div>

                        <ChevronRight size={16} strokeWidth={2.5} style={{ color: 'var(--nb-black)', flexShrink: 0 }} />
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* 4. Toll-Free Kisan Helpline Banner */}
              <a
                href="tel:18001801551"
                className="btn btn-secondary btn-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: 'var(--nb-green-light)',
                  border: 'var(--border-medium)',
                  boxShadow: 'var(--shadow-sm)',
                  color: 'var(--nb-black)',
                  fontWeight: '900',
                  padding: '12px',
                  textDecoration: 'none',
                  marginTop: 'auto'
                }}
              >
                <PhoneCall size={18} strokeWidth={2.5} style={{ color: 'var(--nb-green)' }} />
                <span>किसान कॉल सेंटर: 1800-180-1551</span>
              </a>

              {/* 5. Logout Button (if authenticated) */}
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setDrawerOpen(false);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{
                    color: 'var(--nb-red)',
                    fontWeight: '900',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px'
                  }}
                >
                  <LogOut size={16} strokeWidth={2.5} />
                  <span>{t('nav.logout') || 'लॉगआउट करें'}</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Header;
