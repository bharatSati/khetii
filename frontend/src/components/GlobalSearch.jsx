import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, X, BookOpen, Landmark, ShoppingBag, Loader2 } from 'lucide-react';
import { searchService } from '../services/searchService';

export const GlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ schemes: [], knowledge: [], listings: [] });
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const searchRef = useRef(null);
  const lang = i18n.language?.startsWith('hi') ? 'hi' : 'en';

  useEffect(() => {
    if (!query.trim()) {
      setResults({ schemes: [], knowledge: [], listings: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchService.globalSearch(query.trim());
        setResults(data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (path) => {
    setIsOpen(false);
    setQuery('');
    navigate(path);
  };

  const hasResults = results.schemes.length > 0 || results.knowledge.length > 0 || results.listings.length > 0;

  return (
    <div ref={searchRef} style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'var(--nb-white)',
          border: 'var(--border-medium)',
          borderRadius: 'var(--radius-sm)',
          padding: '6px 14px',
          boxShadow: 'var(--shadow-sm)',
          transition: 'all 0.15s ease'
        }}
      >
        <Search size={18} strokeWidth={2.5} style={{ color: 'var(--nb-black)', marginRight: '8px' }} />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={t('common.search') + ' (योजनाएं, ज्ञान, फसलें)...'}
          style={{
            border: 'none',
            outline: 'none',
            width: '100%',
            background: 'transparent',
            fontSize: '0.92rem',
            fontWeight: '700',
            color: 'var(--nb-black)',
            fontFamily: 'inherit'
          }}
        />
        {loading && <Loader2 size={16} className="spin" style={{ color: 'var(--nb-black)' }} />}
        {query && !loading && (
          <button
            onClick={() => {
              setQuery('');
              setResults({ schemes: [], knowledge: [], listings: [] });
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nb-black)' }}
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {isOpen && query.trim() && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--nb-white)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-xl)',
            border: 'var(--border-thick)',
            maxHeight: '440px',
            overflowY: 'auto',
            zIndex: 1100,
            padding: '12px'
          }}
        >
          {!loading && !hasResults && (
            <div style={{ padding: '16px', textAlign: 'center', fontWeight: '700', color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
              {t('common.noResults')} for "{query}"
            </div>
          )}

          {/* Schemes section */}
          {results.schemes.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  color: 'var(--nb-black)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '8px',
                  padding: '4px 8px',
                  backgroundColor: 'var(--nb-green-light)',
                  border: '1.5px solid #000'
                }}
              >
                <Landmark size={15} strokeWidth={2.5} />
                <span>{t('nav.schemes')}</span>
              </div>
              {results.schemes.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleSelect(`/schemes?id=${s.id}`)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    marginBottom: '4px',
                    border: '1.5px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--nb-yellow-light)';
                    e.currentTarget.style.borderColor = '#000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <div style={{ fontWeight: '800', color: 'var(--nb-black)' }}>
                    {s.name[lang] || s.name.en}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.shortDescription?.[lang] || s.shortDescription?.en}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Knowledge section */}
          {results.knowledge.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  color: 'var(--nb-black)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '8px',
                  padding: '4px 8px',
                  backgroundColor: 'var(--nb-yellow-light)',
                  border: '1.5px solid #000'
                }}
              >
                <BookOpen size={15} strokeWidth={2.5} />
                <span>{t('nav.knowledge')}</span>
              </div>
              {results.knowledge.map((k) => (
                <div
                  key={k.id}
                  onClick={() => handleSelect(`/knowledge?id=${k.id}`)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    marginBottom: '4px',
                    border: '1.5px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--nb-orange-light)';
                    e.currentTarget.style.borderColor = '#000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <div style={{ fontWeight: '800', color: 'var(--nb-black)' }}>
                    {k.title[lang] || k.title.en}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {k.category} • {k.summary?.[lang] || k.summary?.en}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Farmer Listings section */}
          {results.listings.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  color: 'var(--nb-black)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '8px',
                  padding: '4px 8px',
                  backgroundColor: 'var(--nb-blue-light)',
                  border: '1.5px solid #000'
                }}
              >
                <ShoppingBag size={15} strokeWidth={2.5} />
                <span>{t('marketplace.tabFarmer')}</span>
              </div>
              {results.listings.map((l) => (
                <div
                  key={l._id}
                  onClick={() => handleSelect(`/marketplace?tab=farmer&search=${encodeURIComponent(l.title)}`)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    marginBottom: '4px',
                    border: '1.5px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--nb-green-light)';
                    e.currentTarget.style.borderColor = '#000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <div style={{ fontWeight: '800', color: 'var(--nb-black)' }}>
                    {l.title} - <span style={{ backgroundColor: 'var(--nb-yellow)', padding: '1px 5px', border: '1px solid #000' }}>₹{l.price}/{l.unit}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                    📍 {l.location} • {l.category}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
