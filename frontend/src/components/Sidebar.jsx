import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Landmark,
  ShieldCheck,
  TrendingUp,
  ShoppingBag,
  IndianRupee,
  FileScan,
  BookOpen,
  UserCheck,
  MessageSquare
} from 'lucide-react';

export const Sidebar = () => {
  const { t, i18n } = useTranslation();

  const navItems = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/samvaad', label: t('nav.samvaad'), icon: MessageSquare },
    { to: '/schemes', label: t('nav.schemes'), icon: Landmark },
    { to: '/insurance', label: t('nav.insurance'), icon: ShieldCheck },
    { to: '/market', label: t('nav.market'), icon: TrendingUp },
    { to: '/marketplace', label: t('nav.marketplace'), icon: ShoppingBag },
    { to: '/finance', label: t('nav.finance'), icon: IndianRupee },
    { to: '/documents', label: t('nav.documents'), icon: FileScan },
    { to: '/knowledge', label: t('nav.knowledge'), icon: BookOpen },
    { to: '/profile', label: t('nav.profile'), icon: UserCheck }
  ];

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        backgroundColor: 'var(--nb-canvas-alt)',
        borderRight: 'var(--border-thick)',
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--space-md) var(--space-sm)',
        height: 'calc(100vh - var(--header-height))',
        position: 'fixed',
        top: 'var(--header-height)',
        left: 0,
        bottom: 0,
        zIndex: 800,
        overflowY: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        flexShrink: 0
      }}
      className="desktop-sidebar"
    >
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.94rem',
                fontWeight: '800',
                color: 'var(--nb-black)',
                backgroundColor: isActive ? 'var(--nb-yellow)' : 'transparent',
                border: isActive ? 'var(--border-medium)' : '2px solid transparent',
                boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                textDecoration: 'none',
                transition: 'all 0.1s ease',
                transform: isActive ? 'translate(-2px, -2px)' : 'none'
              })}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={20}
                    strokeWidth={2.5}
                    style={{
                      color: 'var(--nb-black)',
                      flexShrink: 0
                    }}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', padding: 'var(--space-sm)' }}>
        <div
          style={{
            backgroundColor: 'var(--nb-white)',
            border: 'var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-md)',
            padding: '14px',
            fontSize: '0.85rem',
            color: 'var(--nb-black)'
          }}
        >
          <div style={{ fontWeight: '900', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            📞 {t('common.helpline')}
          </div>
          <div style={{ fontWeight: '700' }}>
            {i18n.language?.startsWith('hi') ? 'टोल फ्री: ' : 'Toll-Free: '}<span style={{ backgroundColor: 'var(--nb-green-light)', padding: '2px 6px', border: '1.5px solid #000' }}>1800-180-1551</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
