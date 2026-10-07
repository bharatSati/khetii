import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  TrendingUp,
  Landmark,
  IndianRupee,
  MoreHorizontal,
  ShieldCheck,
  ShoppingBag,
  FileScan,
  BookOpen,
  UserCheck,
  MessageSquare,
  CloudSun,
  X,
  Sparkles
} from 'lucide-react';

export const MobileNav = () => {
  const { t } = useTranslation();
  const [showMore, setShowMore] = useState(false);

  const primaryItems = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/market', label: t('nav.market'), icon: TrendingUp },
    { to: '/schemes', label: t('nav.schemes'), icon: Landmark },
    { to: '/finance', label: t('nav.finance'), icon: IndianRupee }
  ];

  const moreItems = [
    { to: '/weather', label: t('nav.weather'), icon: CloudSun },
    { to: '/samvaad', label: t('nav.samvaad'), icon: MessageSquare },
    { to: '/marketplace', label: t('nav.marketplace'), icon: ShoppingBag },
    { to: '/insurance', label: t('nav.insurance'), icon: ShieldCheck },
    { to: '/documents', label: t('nav.documents'), icon: Sparkles },
    { to: '/knowledge', label: t('nav.knowledge'), icon: BookOpen },
    { to: '/profile', label: t('nav.profile'), icon: UserCheck }
  ];

  return (
    <>
      {showMore && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
            animation: 'modalBackdropFade 0.25s ease forwards',
            zIndex: 1200,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end'
          }}
          onClick={() => setShowMore(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--color-bg-card)',
              borderTopLeftRadius: 'var(--radius-xl)',
              borderTopRightRadius: 'var(--radius-xl)',
              padding: 'var(--space-lg)',
              maxHeight: '70vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-md)'
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{t('common.moreServices')}</h3>
              <button
                onClick={() => setShowMore(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setShowMore(false)}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isActive ? 'var(--color-primary-subtle)' : 'var(--color-bg-subtle)',
                      color: isActive ? 'var(--color-primary-dark)' : 'var(--color-text-main)',
                      fontWeight: isActive ? '700' : '600',
                      textDecoration: 'none',
                      fontSize: '0.9rem'
                    })}
                  >
                    <Icon size={18} style={{ color: 'var(--color-primary)' }} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 'var(--mobile-nav-height)',
          backgroundColor: 'var(--color-bg-card)',
          borderTop: '1px solid var(--color-border)',
          zIndex: 1000,
          justifyContent: 'space-around',
          alignItems: 'center',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
        }}
        id="mobile-bottom-nav"
      >
        {primaryItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                fontSize: '0.72rem',
                fontWeight: isActive ? '700' : '500',
                gap: '2px',
                flex: 1,
                height: '100%'
              })}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <button
          onClick={() => setShowMore(true)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            fontSize: '0.72rem',
            fontWeight: '500',
            gap: '2px',
            flex: 1,
            height: '100%',
            cursor: 'pointer'
          }}
        >
          <MoreHorizontal size={20} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
};

export default MobileNav;
