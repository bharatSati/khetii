import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { schemeService } from '../services/schemeService';
import { Landmark, Search, ExternalLink, ChevronRight, AlertTriangle } from 'lucide-react';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';

const CATEGORIES = [
  'All',
  'Income Support',
  'Crop Insurance',
  'Credit & Finance',
  'Irrigation',
  'Soil & Inputs',
  'Marketing & Trade',
  'Solar Energy & Equipment',
  'Infrastructure',
  'Pension'
];

const CATEGORY_NAMES = {
  'All': { en: 'All Categories', hi: 'सभी श्रेणियां' },
  'Income Support': { en: 'Income Support', hi: 'आय सहायता' },
  'Crop Insurance': { en: 'Crop Insurance', hi: 'फसल बीमा' },
  'Credit & Finance': { en: 'Credit & Finance', hi: 'ऋण व वित्तीय सहायता' },
  'Irrigation': { en: 'Irrigation', hi: 'सिंचाई योजनाएं' },
  'Soil & Inputs': { en: 'Soil & Inputs', hi: 'मृदा स्वास्थ्य व खाद' },
  'Marketing & Trade': { en: 'Marketing & Trade', hi: 'कृषि उपज विपणन' },
  'Solar Energy & Equipment': { en: 'Solar Energy & Equipment', hi: 'सौर ऊर्जा व कृषि यंत्र' },
  'Infrastructure': { en: 'Infrastructure', hi: 'कृषि इंफ्रास्ट्रक्चर' },
  'Pension': { en: 'Pension', hi: 'किसान पेंशन' }
};

export const Schemes = () => {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const lang = i18n.language?.startsWith('hi') ? 'hi' : 'en';

  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedScheme, setSelectedScheme] = useState(null);

  useEffect(() => {
    const fetchSchemes = async () => {
      setLoading(true);
      try {
        const data = await schemeService.getSchemes({
          search: search || undefined,
          category: selectedCategory !== 'All' ? selectedCategory : undefined
        });
        setSchemes(data.schemes || []);

        const queryId = searchParams.get('id');
        if (queryId && data.schemes) {
          const match = data.schemes.find((s) => s.id === queryId);
          if (match) setSelectedScheme(match);
        }
      } catch (err) {
        console.error('Failed to load schemes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchemes();
  }, [search, selectedCategory, searchParams]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('schemes.title')}</h1>
          <p className="page-subtitle">{t('schemes.subtitle')}</p>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div
        className="card"
        style={{
          marginBottom: 'var(--space-xl)',
          padding: 'var(--space-md) var(--space-lg)',
          backgroundColor: 'var(--nb-yellow-light)',
          border: 'var(--border-thick)',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1', minWidth: '260px', position: 'relative' }}>
            <Search
              size={18}
              strokeWidth={2.5}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--nb-black)'
              }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '40px', backgroundColor: 'var(--nb-white)' }}
              placeholder={t('schemes.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ minWidth: '220px' }}>
            <select
              className="form-select"
              style={{ backgroundColor: 'var(--nb-white)' }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_NAMES[cat]?.[lang] || cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Schemes Grid */}
      {loading ? (
        <Loader message={t('common.loading')} />
      ) : schemes.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title={t('common.noResults')}
          description={lang === 'hi' ? 'कृपया कोई अन्य नाम या श्रेणी चुनकर खोजें।' : 'Please search with a different keyword or category.'}
        />
      ) : (
        <div className="grid grid-cols-3">
          {schemes.map((scheme) => (
            <div
              key={scheme.id}
              className="card card-hover"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 'var(--space-md)',
                cursor: 'pointer',
                border: 'var(--border-thick)',
                boxShadow: 'var(--shadow-md)'
              }}
              onClick={() => setSelectedScheme(scheme)}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <span className="badge badge-success">{CATEGORY_NAMES[scheme.category]?.[lang] || scheme.category}</span>
                  <span className="badge badge-earth">{scheme.level === 'Central' ? (lang === 'hi' ? 'केंद्रीय' : 'Central') : (lang === 'hi' ? 'राज्य' : 'State')}</span>
                </div>

                <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: '8px', lineHeight: 1.3 }}>
                  {scheme.name[lang] || scheme.name.en}
                </h2>

                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  {scheme.shortDescription?.[lang] || scheme.shortDescription?.en}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 'var(--space-sm)',
                  borderTop: 'var(--border-thin)',
                  fontSize: '0.9rem',
                  fontWeight: '900',
                  color: 'var(--nb-black)',
                  textTransform: 'uppercase'
                }}
              >
                <span>{t('schemes.viewScheme')}</span>
                <ChevronRight size={20} strokeWidth={3} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Scheme Detail Modal */}
      {selectedScheme && (
        <Modal
          isOpen={!!selectedScheme}
          onClose={() => {
            setSelectedScheme(null);
            if (searchParams.get('id')) {
              searchParams.delete('id');
              setSearchParams(searchParams);
            }
          }}
          title={selectedScheme.name[lang] || selectedScheme.name.en}
          maxWidth="720px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-text-muted)' }}>
                {t('schemes.disclaimer')}
              </div>
              <a
                href={selectedScheme.officialLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
              >
                <span>{t('common.officialWebsite')}</span>
                <ExternalLink size={16} strokeWidth={2.5} />
              </a>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-success">{selectedScheme.category}</span>
              <span className="badge badge-earth">{selectedScheme.level} Scheme</span>
            </div>

            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: '4px', textTransform: 'uppercase' }}>
                योजना का उद्देश्य / Description
              </h3>
              <p style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--nb-black)', lineHeight: 1.6 }}>
                {selectedScheme.description?.[lang] || selectedScheme.description?.en}
              </p>
            </div>

            <div
              style={{
                backgroundColor: 'var(--nb-green-light)',
                border: 'var(--border-medium)',
                boxShadow: 'var(--shadow-sm)',
                padding: '14px',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: '4px', textTransform: 'uppercase' }}>
                {t('schemes.benefits')}
              </h3>
              <p style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--nb-black)', lineHeight: 1.5 }}>
                {selectedScheme.benefits?.[lang] || selectedScheme.benefits?.en}
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: '4px', textTransform: 'uppercase' }}>
                {t('schemes.eligibility')}
              </h3>
              <p style={{ fontSize: '0.92rem', fontWeight: '600', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                {selectedScheme.eligibility?.[lang] || selectedScheme.eligibility?.en}
              </p>
            </div>

            {selectedScheme.documentsRequired && (
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  {t('schemes.documents')}
                </h3>
                <ul style={{ paddingLeft: '20px', fontSize: '0.92rem', fontWeight: '700', color: 'var(--nb-black)' }}>
                  {(selectedScheme.documentsRequired[lang] || selectedScheme.documentsRequired.en || []).map((doc, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>{doc}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: '4px', textTransform: 'uppercase' }}>
                {t('schemes.howToApply')}
              </h3>
              <p style={{ fontSize: '0.92rem', fontWeight: '600', color: 'var(--nb-black)', lineHeight: 1.5 }}>
                {selectedScheme.howToApply?.[lang] || selectedScheme.howToApply?.en}
              </p>
            </div>

            {selectedScheme.notes && (
              <div
                style={{
                  backgroundColor: 'var(--nb-yellow-light)',
                  border: 'var(--border-medium)',
                  boxShadow: 'var(--shadow-sm)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-start'
                }}
              >
                <AlertTriangle size={20} strokeWidth={2.5} style={{ color: 'var(--nb-black)', flexShrink: 0, marginTop: '2px' }} />
                <span style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--nb-black)' }}>
                  {selectedScheme.notes[lang] || selectedScheme.notes.en}
                </span>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Schemes;
