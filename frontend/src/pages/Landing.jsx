import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  Landmark,
  ShieldCheck,
  TrendingUp,
  ShoppingBag,
  IndianRupee,
  FileScan,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Quote
} from 'lucide-react';
import farmerVideo from '../assets/videos/farmer.mp4';

export const Landing = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.warn('Video autoPlay was deferred:', err);
      });
    }
  }, []);

  const features = [
    {
      icon: Landmark,
      title: t('nav.schemes'),
      description: t('landing.featSchemes'),
      to: '/schemes',
      bg: 'var(--nb-green-light)',
      accent: 'var(--nb-green-bright)'
    },
    {
      icon: TrendingUp,
      title: t('nav.market'),
      description: t('landing.featMarket'),
      to: '/market',
      bg: 'var(--nb-yellow-light)',
      accent: 'var(--nb-yellow)'
    },
    {
      icon: ShieldCheck,
      title: t('nav.insurance'),
      description: t('landing.featInsurance'),
      to: '/insurance',
      bg: 'var(--nb-blue-light)',
      accent: 'var(--nb-blue-bright)'
    },
    {
      icon: ShoppingBag,
      title: t('nav.marketplace'),
      description: t('landing.featMarketplace'),
      to: '/marketplace',
      bg: 'var(--nb-orange-light)',
      accent: 'var(--nb-orange-bright)'
    },
    {
      icon: IndianRupee,
      title: t('nav.finance'),
      description: t('landing.featFinance'),
      to: '/finance',
      bg: 'var(--nb-green-light)',
      accent: 'var(--nb-green-bright)'
    },
    {
      icon: FileScan,
      title: t('nav.documents'),
      description: t('landing.featDocuments'),
      to: '/documents',
      bg: 'var(--nb-purple-light)',
      accent: 'var(--nb-purple)'
    },
    {
      icon: BookOpen,
      title: t('nav.knowledge'),
      description: t('landing.featKnowledge'),
      to: '/knowledge',
      bg: 'var(--nb-yellow-light)',
      accent: 'var(--nb-yellow)'
    }
  ];

  return (
    <div style={{ width: '100%', paddingBottom: 'var(--space-2xl)' }}>
      {/* 1. Full Length & Width Farmer Video Hero Banner (Unboxed, Highly Visible Colored Text) */}
      <section
        className="hero-fullscreen-section"
        style={{
          position: 'relative',
          width: '100%',
          minHeight: 'calc(100vh - var(--header-height))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          backgroundColor: '#050608',
          borderBottom: 'var(--border-thick)'
        }}
      >
        {/* Full Length and Width Background Video */}
        <video
          ref={videoRef}
          src={farmerVideo}
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1,
            filter: 'brightness(0.70) contrast(1.15)'
          }}
          title="Indian Farmer in Field (अन्नदाता)"
        />

        {/* Cinematic Dark Gradient Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            background:
              'linear-gradient(180deg, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.4) 45%, rgba(0, 0, 0, 0.82) 100%)'
          }}
        />

        {/* Content Centered Directly Over Full Video (No White Box) */}
        <div
          style={{
            position: 'relative',
            zIndex: 3,
            maxWidth: '1040px',
            width: '100%',
            margin: '0 auto',
            padding: 'var(--space-2xl) var(--space-lg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}
        >
          {/* Top Live Farmer Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#facc15',
              border: '3px solid #000000',
              boxShadow: '4px 4px 0px #000000',
              padding: '8px 24px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.95rem',
              fontWeight: '900',
              color: '#000000',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: 'var(--space-md)'
            }}
          >
            <span
              className="pulse-dot"
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#dc2626',
                display: 'inline-block'
              }}
            />
            <span>{t('landing.liveStatus')}</span>
            <span style={{ opacity: 0.6 }}>•</span>
            <span>{t('landing.videoBadge')}</span>
          </div>

          {/* Sub-tag Badge in Vivid Green */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#22c55e',
              border: '2.5px solid #000000',
              boxShadow: '3px 3px 0px #000000',
              padding: '6px 20px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.9rem',
              fontWeight: '900',
              color: '#000000',
              textTransform: 'uppercase',
              marginBottom: 'var(--space-lg)'
            }}
          >
            <Sparkles size={16} style={{ color: '#000000' }} />
            <span>{t('landing.badge')}</span>
          </div>

          {/* High-Contrast Bold Headline */}
          <h1
            style={{
              fontSize: 'clamp(2.3rem, 6vw, 4rem)',
              fontWeight: '900',
              lineHeight: 1.15,
              color: '#ffffff',
              letterSpacing: '-1px',
              marginBottom: 'var(--space-lg)',
              textShadow:
                '0 4px 20px rgba(0, 0, 0, 0.98), 0 2px 4px rgba(0, 0, 0, 0.95), 0 0 30px rgba(0, 0, 0, 0.85)',
              maxWidth: '960px'
            }}
          >
            {t('landing.heroTitle')}
          </h1>

          {/* Subtitle in Warm Golden Cream with Strong Shadow */}
          <p
            style={{
              fontSize: 'clamp(1.15rem, 2.5vw, 1.4rem)',
              fontWeight: '700',
              lineHeight: 1.6,
              color: '#fef08a',
              marginBottom: 'var(--space-2xl)',
              maxWidth: '840px',
              textShadow:
                '0 3px 14px rgba(0, 0, 0, 0.98), 0 1px 3px rgba(0, 0, 0, 0.95)'
            }}
          >
            {t('landing.heroDesc')}
          </p>

          {/* Primary Action Buttons */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-md)',
              justifyContent: 'center',
              flexWrap: 'wrap',
              alignItems: 'center',
              marginBottom: 'var(--space-2xl)'
            }}
          >
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="btn btn-primary btn-lg"
                style={{
                  backgroundColor: '#22c55e',
                  color: '#000000',
                  border: '3.5px solid #000000',
                  boxShadow: '6px 6px 0px #000000',
                  fontSize: '1.2rem',
                  padding: '16px 38px',
                  fontWeight: '900'
                }}
              >
                <span>{t('landing.goToDashboard')}</span>
                <ArrowRight size={24} strokeWidth={3} />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="btn btn-primary btn-lg"
                  style={{
                    backgroundColor: '#22c55e',
                    color: '#000000',
                    border: '3.5px solid #000000',
                    boxShadow: '6px 6px 0px #000000',
                    fontSize: '1.2rem',
                    padding: '16px 36px',
                    fontWeight: '900'
                  }}
                >
                  <span>{t('landing.createAccount')}</span>
                  <ArrowRight size={24} strokeWidth={3} />
                </Link>
                <Link
                  to="/login"
                  className="btn btn-gold btn-lg"
                  style={{
                    backgroundColor: '#facc15',
                    color: '#000000',
                    border: '3.5px solid #000000',
                    boxShadow: '6px 6px 0px #000000',
                    fontSize: '1.2rem',
                    padding: '16px 36px',
                    fontWeight: '900'
                  }}
                >
                  <span>{t('landing.login')}</span>
                </Link>
              </>
            )}
          </div>

          {/* High-Visibility Colorful Sticker Chips Directly Over Video */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-md)',
              justifyContent: 'center',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(21, 128, 61, 0.95)',
                color: '#ffffff',
                border: '2.5px solid #000000',
                boxShadow: '3px 3px 0px #000000',
                padding: '8px 18px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.95rem',
                fontWeight: '900'
              }}
            >
              <CheckCircle2 size={20} strokeWidth={3} style={{ color: '#4ade80' }} />
              <span>{t('landing.freeBadge')}</span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(202, 138, 4, 0.95)',
                color: '#ffffff',
                border: '2.5px solid #000000',
                boxShadow: '3px 3px 0px #000000',
                padding: '8px 18px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.95rem',
                fontWeight: '900'
              }}
            >
              <CheckCircle2 size={20} strokeWidth={3} style={{ color: '#fef08a' }} />
              <span>{t('landing.verifiedBadge')}</span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(3, 105, 161, 0.95)',
                color: '#ffffff',
                border: '2.5px solid #000000',
                boxShadow: '3px 3px 0px #000000',
                padding: '8px 18px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.95rem',
                fontWeight: '900'
              }}
            >
              <CheckCircle2 size={20} strokeWidth={3} style={{ color: '#7dd3fc' }} />
              <span>{t('landing.trustBilingual')}</span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#ffffff',
                color: '#000000',
                border: '2.5px solid #000000',
                boxShadow: '3px 3px 0px #000000',
                padding: '8px 18px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.95rem',
                fontWeight: '900'
              }}
            >
              <span>🌾 {t('landing.directProfit')} • {t('landing.zeroMiddlemen')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Centered Body Content */}
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: 'var(--space-2xl) var(--space-lg) 0' }}>
        {/* Farmer Impact Highlights Strip */}
        <section style={{ marginBottom: 'var(--space-2xl)' }}>
          <div className="grid grid-cols-3" style={{ gap: 'var(--space-md)' }}>
            <div
              className="card card-hover"
              style={{
                padding: 'var(--space-lg)',
                backgroundColor: 'var(--nb-white)',
                border: 'var(--border-thick)',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-md)'
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--nb-green-light)',
                  border: 'var(--border-medium)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--nb-black)',
                  flexShrink: 0
                }}
              >
                <IndianRupee size={26} strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ fontSize: '1.45rem', fontWeight: '900', color: 'var(--nb-black)', lineHeight: 1.1 }}>
                  {t('landing.statPmKisan')}
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  {t('landing.statPmKisanLabel')}
                </div>
              </div>
            </div>

            <div
              className="card card-hover"
              style={{
                padding: 'var(--space-lg)',
                backgroundColor: 'var(--nb-white)',
                border: 'var(--border-thick)',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-md)'
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--nb-blue-light)',
                  border: 'var(--border-medium)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--nb-black)',
                  flexShrink: 0
                }}
              >
                <ShieldCheck size={26} strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ fontSize: '1.45rem', fontWeight: '900', color: 'var(--nb-black)', lineHeight: 1.1 }}>
                  {t('landing.statPmfby')}
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  {t('landing.statPmfbyLabel')}
                </div>
              </div>
            </div>

            <div
              className="card card-hover"
              style={{
                padding: 'var(--space-lg)',
                backgroundColor: 'var(--nb-white)',
                border: 'var(--border-thick)',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-md)'
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--nb-yellow-light)',
                  border: 'var(--border-medium)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--nb-black)',
                  flexShrink: 0
                }}
              >
                <TrendingUp size={26} strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ fontSize: '1.45rem', fontWeight: '900', color: 'var(--nb-black)', lineHeight: 1.1 }}>
                  {t('landing.statMandi')}
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  {t('landing.statMandiLabel')}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Voice of the Farmer Story / Testimonial Spotlight */}
        <section style={{ marginBottom: 'var(--space-2xl)' }}>
          <div
            className="card"
            style={{
              backgroundColor: 'var(--nb-canvas-alt)',
              border: 'var(--border-thick)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              padding: 'var(--space-xl)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-xl)',
              flexWrap: 'wrap'
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--nb-yellow)',
                border: 'var(--border-medium)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000000',
                flexShrink: 0
              }}
            >
              <Quote size={30} strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <p
                style={{
                  fontSize: '1.15rem',
                  fontWeight: '800',
                  fontStyle: 'italic',
                  color: 'var(--nb-black)',
                  lineHeight: 1.55,
                  marginBottom: '8px'
                }}
              >
                {t('landing.farmerQuote')}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.92rem',
                    fontWeight: '900',
                    color: 'var(--nb-green)',
                    textTransform: 'uppercase'
                  }}
                >
                  👨‍🌾 {t('landing.farmerQuoteAuthor')}
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-text-muted)' }}>
                  • मुज़फ़्फ़रनगर (उत्तर प्रदेश)
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section style={{ marginBottom: 'var(--space-2xl)' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--nb-black)' }}>
              {t('landing.servicesTitle')}
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontWeight: '700', fontSize: '1.05rem', marginTop: '6px' }}>
              {t('landing.servicesSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-3">
            {features.map((feat, index) => {
              const Icon = feat.icon;
              return (
                <Link
                  key={index}
                  to={feat.to}
                  className="card card-hover"
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-sm)',
                    backgroundColor: feat.bg,
                    border: 'var(--border-thick)',
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  <div
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--nb-white)',
                      border: 'var(--border-medium)',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--nb-black)',
                      marginBottom: '6px'
                    }}
                  >
                    <Icon size={26} strokeWidth={2.5} />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--nb-black)' }}>
                    {feat.title}
                  </h3>
                  <p style={{ fontSize: '0.92rem', fontWeight: '600', color: 'var(--nb-black)', lineHeight: 1.5, flex: 1 }}>
                    {feat.description}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.95rem',
                      fontWeight: '900',
                      color: 'var(--nb-black)',
                      marginTop: 'var(--space-sm)',
                      textTransform: 'uppercase'
                    }}
                  >
                    <span>{t('landing.explore')}</span>
                    <ArrowRight size={16} strokeWidth={2.5} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Trust & Official Data Banner */}
        <section
          style={{
            backgroundColor: 'var(--nb-white)',
            borderRadius: 'var(--radius-sm)',
            border: 'var(--border-thick)',
            boxShadow: 'var(--shadow-lg)',
            padding: 'var(--space-xl)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 'var(--space-lg)'
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '900', marginBottom: '6px', color: 'var(--nb-black)' }}>
              {t('landing.trustTitle')}
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontWeight: '600', fontSize: '0.95rem', maxWidth: '650px' }}>
              {t('landing.trustDesc')}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--nb-green-light)',
                border: 'var(--border-medium)',
                boxShadow: 'var(--shadow-sm)',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: '900',
                color: 'var(--nb-black)'
              }}
            >
              <CheckCircle2 size={20} strokeWidth={2.5} />
              <span>{t('landing.trustFree')}</span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--nb-yellow-light)',
                border: 'var(--border-medium)',
                boxShadow: 'var(--shadow-sm)',
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: '900',
                color: 'var(--nb-black)'
              }}
            >
              <CheckCircle2 size={20} strokeWidth={2.5} />
              <span>{t('landing.trustBilingual')}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Landing;
