import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { knowledgeService } from '../services/knowledgeService';
import {
  BookOpen,
  Search,
  Calendar,
  Sprout,
  Droplets,
  Bug,
  Archive,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';

const CATEGORIES = [
  'All',
  'Crop Guides',
  'Soil & Fertiliser',
  'Irrigation & Water',
  'Pest & Disease Management',
  'Post-Harvest & Storage'
];

const CATEGORY_NAMES = {
  'All': { en: 'All Categories', hi: 'सभी श्रेणियां' },
  'Crop Guides': { en: 'Crop Guides', hi: 'फसल उत्पादन' },
  'Soil & Fertiliser': { en: 'Soil & Fertiliser', hi: 'मृदा व उर्वरक' },
  'Irrigation & Water': { en: 'Irrigation & Water', hi: 'सिंचाई व जल प्रबंधन' },
  'Pest & Disease Management': { en: 'Pest & Disease Management', hi: 'कीट एवं रोग नियंत्रण' },
  'Post-Harvest & Storage': { en: 'Post-Harvest & Storage', hi: 'कटाई उपरांत व भंडारण' }
};

export const Knowledge = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const lang = i18n.language?.startsWith('hi') ? 'hi' : 'en';

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const data = await knowledgeService.getArticles({
          search: search || undefined,
          category: selectedCategory !== 'All' ? selectedCategory : undefined
        });
        setArticles(data.articles || []);

        const queryId = searchParams.get('id');
        if (queryId) {
          setExpandedId(queryId);
        } else if (data.articles?.length > 0 && !expandedId) {
          setExpandedId(data.articles[0].id);
        }
      } catch (err) {
        console.error('Failed to load knowledge articles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [search, selectedCategory, searchParams]);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Crop Guides': return <Sprout size={20} strokeWidth={2.5} style={{ color: 'var(--nb-black)' }} />;
      case 'Soil & Fertiliser': return <Calendar size={20} strokeWidth={2.5} style={{ color: 'var(--nb-black)' }} />;
      case 'Irrigation & Water': return <Droplets size={20} strokeWidth={2.5} style={{ color: 'var(--nb-black)' }} />;
      case 'Pest & Disease Management': return <Bug size={20} strokeWidth={2.5} style={{ color: 'var(--nb-black)' }} />;
      case 'Post-Harvest & Storage': return <Archive size={20} strokeWidth={2.5} style={{ color: 'var(--nb-black)' }} />;
      default: return <BookOpen size={20} strokeWidth={2.5} />;
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('knowledge.title')}</h1>
          <p className="page-subtitle">{t('knowledge.subtitle')}</p>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div
        className="card"
        style={{
          marginBottom: 'var(--space-xl)',
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
              placeholder={t('knowledge.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ minWidth: '240px' }}>
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

      {/* Articles Accordion */}
      {loading ? (
        <Loader message={t('common.loading')} />
      ) : articles.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={t('common.noResults')}
          description={lang === 'hi' ? 'कृपया कोई अन्य फसल या विषय खोजें।' : 'Please search with another crop or agronomic topic.'}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {articles.map((article) => {
            const isExpanded = expandedId === article.id;
            return (
              <div
                key={article.id}
                className="card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  border: 'var(--border-thick)',
                  boxShadow: isExpanded ? 'var(--shadow-lg)' : 'var(--shadow-md)',
                  transform: isExpanded ? 'translate(-2px, -2px)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Accordion Header */}
                <div
                  onClick={() => toggleExpand(article.id)}
                  style={{
                    padding: 'var(--space-lg)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    backgroundColor: isExpanded ? 'var(--nb-yellow)' : 'var(--nb-white)',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--nb-white)',
                        border: 'var(--border-medium)',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {getCategoryIcon(article.category)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                        <span className="badge badge-earth" style={{ fontSize: '0.75rem' }}>
                          {article.category}
                        </span>
                        {article.season && (
                          <span className="badge badge-gold" style={{ fontSize: '0.75rem' }}>
                            {article.season}
                          </span>
                        )}
                      </div>
                      <h2 style={{ fontSize: '1.25rem', color: 'var(--nb-black)', fontWeight: '900' }}>
                        {article.title[lang] || article.title.en}
                      </h2>
                    </div>
                  </div>

                  <div style={{ color: 'var(--nb-black)', display: 'flex', alignItems: 'center' }}>
                    {isExpanded ? <ChevronUp size={24} strokeWidth={3} /> : <ChevronDown size={24} strokeWidth={3} />}
                  </div>
                </div>

                {/* Accordion Content */}
                {isExpanded && (
                  <div
                    style={{
                      padding: 'var(--space-lg)',
                      borderTop: 'var(--border-medium)',
                      backgroundColor: 'var(--nb-white)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-lg)'
                    }}
                  >
                    {/* Summary */}
                    <div
                      style={{
                        padding: '14px 18px',
                        backgroundColor: 'var(--nb-canvas-alt)',
                        border: 'var(--border-thin)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        color: 'var(--nb-black)',
                        lineHeight: 1.6
                      }}
                    >
                      {article.summary[lang] || article.summary.en}
                    </div>

                    {/* Sowing Timing & Seed Treatment */}
                    <div className="grid grid-cols-2">
                      {article.idealTiming && (
                        <div style={{ padding: '14px', border: 'var(--border-medium)', boxShadow: 'var(--shadow-sm)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--nb-yellow-light)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '900', color: 'var(--nb-black)', marginBottom: '4px', fontSize: '0.92rem', textTransform: 'uppercase' }}>
                            <Clock size={16} strokeWidth={2.5} />
                            <span>{t('knowledge.sowingTime')}</span>
                          </div>
                          <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--nb-black)', lineHeight: 1.5 }}>
                            {article.idealTiming[lang] || article.idealTiming.en}
                          </p>
                        </div>
                      )}

                      {article.seedRateAndTreatment && (
                        <div style={{ padding: '14px', border: 'var(--border-medium)', boxShadow: 'var(--shadow-sm)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--nb-green-light)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '900', color: 'var(--nb-black)', marginBottom: '4px', fontSize: '0.92rem', textTransform: 'uppercase' }}>
                            <Sprout size={16} strokeWidth={2.5} />
                            <span>बीज दर व बीज शोधन / Seed Rate</span>
                          </div>
                          <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--nb-black)', lineHeight: 1.5 }}>
                            {article.seedRateAndTreatment[lang] || article.seedRateAndTreatment.en}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Fertilizer Dose */}
                    {article.fertilizerDose && (
                      <div style={{ padding: '16px', backgroundColor: 'var(--nb-orange-light)', border: 'var(--border-medium)', boxShadow: 'var(--shadow-sm)', borderRadius: 'var(--radius-sm)' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: '6px', textTransform: 'uppercase' }}>
                          {t('knowledge.fertilizer')}
                        </h3>
                        <p style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--nb-black)', lineHeight: 1.6 }}>
                          {article.fertilizerDose[lang] || article.fertilizerDose.en}
                        </p>
                      </div>
                    )}

                    {/* Critical Irrigation Stages */}
                    {article.criticalIrrigationStages && article.criticalIrrigationStages.length > 0 && (
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: '8px', textTransform: 'uppercase' }}>
                          {t('knowledge.irrigation')} 💧
                        </h3>
                        <div className="table-container">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>अवस्था / Stage</th>
                                <th>समय / Timing</th>
                                <th>महत्व / Key Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {article.criticalIrrigationStages.map((stg, sIdx) => (
                                <tr key={sIdx}>
                                  <td style={{ fontWeight: '900', color: 'var(--nb-black)' }}>
                                    {stg.stage}
                                  </td>
                                  <td style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-text-secondary)' }}>
                                    {stg.daysAfterSowing}
                                  </td>
                                  <td style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--nb-black)' }}>
                                    {stg.importance}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Dos & Don'ts */}
                    {article.dosAndDonts && (
                      <div className="grid grid-cols-2">
                        {/* Dos */}
                        <div style={{ backgroundColor: 'var(--nb-green-light)', border: 'var(--border-medium)', boxShadow: 'var(--shadow-sm)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '900', color: 'var(--nb-black)', marginBottom: '8px', textTransform: 'uppercase' }}>
                            <CheckCircle size={20} strokeWidth={2.5} style={{ color: 'var(--nb-green)' }} />
                            <span>{t('knowledge.dos')}</span>
                          </div>
                          <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', fontWeight: '700', color: 'var(--nb-black)' }}>
                            {article.dosAndDonts.dos.map((item, dIdx) => (
                              <li key={dIdx} style={{ marginBottom: '6px', lineHeight: 1.4 }}>
                                {item[lang] || item.en}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Don'ts */}
                        <div style={{ backgroundColor: 'var(--nb-red-light)', border: 'var(--border-medium)', boxShadow: 'var(--shadow-sm)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '900', color: 'var(--nb-black)', marginBottom: '8px', textTransform: 'uppercase' }}>
                            <XCircle size={20} strokeWidth={2.5} style={{ color: 'var(--nb-red)' }} />
                            <span>{t('knowledge.donts')}</span>
                          </div>
                          <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', fontWeight: '700', color: 'var(--nb-black)' }}>
                            {article.dosAndDonts.donts.map((item, dnIdx) => (
                              <li key={dnIdx} style={{ marginBottom: '6px', lineHeight: 1.4 }}>
                                {item[lang] || item.en}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Knowledge;
