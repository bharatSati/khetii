import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { marketService } from '../services/marketService';
import {
  TrendingUp,
  Search,
  Award,
  AlertCircle,
  BarChart2,
  RefreshCw,
  Table as TableIcon,
  Sparkles
} from 'lucide-react';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';

export const Market = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [states, setStates] = useState([]);
  const [commodities, setCommodities] = useState([]);

  // Filter state
  const [selectedState, setSelectedState] = useState(user?.state || 'Uttar Pradesh');
  const [district, setDistrict] = useState(user?.district || '');
  const [selectedCommodity, setSelectedCommodity] = useState(user?.mainCrops?.[0] || 'Wheat');
  const [searchCommodity, setSearchCommodity] = useState('');

  // Results state
  const [data, setData] = useState({ records: [], total: 0, updatedAt: '', source: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('modalPrice_desc');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'comparison'

  useEffect(() => {
    // Load default filters
    marketService.getFilters().then((res) => {
      if (res.states) setStates(res.states);
      if (res.commodities) setCommodities(res.commodities);
    });
  }, []);

  const fetchPrices = async () => {
    setLoading(true);
    setError('');
    try {
      const activeCommodity = searchCommodity.trim() || selectedCommodity;
      const res = await marketService.getMarketPrices({
        state: selectedState || undefined,
        district: district.trim() || undefined,
        commodity: activeCommodity || undefined,
        limit: 100
      });
      setData(res);
    } catch (err) {
      const serverMsg = err.response?.data?.message || err.message || 'Unable to connect to live government mandi portal.';
      setError(serverMsg);
      setData({ records: [], total: 0, updatedAt: '', source: '' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sorting
  const sortedRecords = [...(data.records || [])].sort((a, b) => {
    if (sortBy === 'modalPrice_desc') return b.modalPrice - a.modalPrice;
    if (sortBy === 'modalPrice_asc') return a.modalPrice - b.modalPrice;
    if (sortBy === 'market_asc') return a.market.localeCompare(b.market);
    return 0;
  });

  const highestModalPrice = sortedRecords.length > 0 ? Math.max(...sortedRecords.map((r) => r.modalPrice)) : 0;
  const lowestModalPrice = sortedRecords.length > 0 ? Math.min(...sortedRecords.map((r) => r.modalPrice)) : 0;
  const avgModalPrice = sortedRecords.length > 0 ? Math.round(sortedRecords.reduce((acc, curr) => acc + (curr.modalPrice || 0), 0) / sortedRecords.length) : 0;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('market.title')}</h1>
          <p className="page-subtitle">{t('market.subtitle')}</p>
        </div>
        <button
          onClick={fetchPrices}
          className="btn btn-secondary btn-sm"
          disabled={loading}
        >
          <RefreshCw size={16} strokeWidth={2.5} className={loading ? 'spin' : ''} />
          <span>रिफ्रेश / Refresh</span>
        </button>
      </div>

      {/* Filter Card */}
      <div
        className="card"
        style={{
          marginBottom: 'var(--space-xl)',
          backgroundColor: 'var(--nb-yellow-light)',
          border: 'var(--border-thick)',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('market.state')}</label>
            <select
              className="form-select"
              style={{ backgroundColor: 'var(--nb-white)' }}
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
            >
              <option value="">-- {t('common.all')} --</option>
              {states.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('market.district')}</label>
            <input
              type="text"
              className="form-input"
              style={{ backgroundColor: 'var(--nb-white)' }}
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="e.g. Meerut, Bhopal..."
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('market.commodity')}</label>
            <select
              className="form-select"
              style={{ backgroundColor: 'var(--nb-white)' }}
              value={selectedCommodity}
              onChange={(e) => {
                setSelectedCommodity(e.target.value);
                setSearchCommodity('');
              }}
            >
              {commodities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">{t('market.searchCommodity')}</label>
            <input
              type="text"
              className="form-input"
              style={{ backgroundColor: 'var(--nb-white)' }}
              value={searchCommodity}
              onChange={(e) => setSearchCommodity(e.target.value)}
              placeholder="Custom crop name..."
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-md)' }}>
          <button onClick={fetchPrices} className="btn btn-primary" disabled={loading}>
            <Search size={18} strokeWidth={2.5} />
            <span>{t('market.fetchPrices')}</span>
          </button>
        </div>
      </div>

      {/* Live Government API Service Notice / Issue Banner */}
      {error && (
        <div
          className="alert"
          style={{
            marginBottom: 'var(--space-xl)',
            backgroundColor: 'var(--nb-yellow-light)',
            border: 'var(--border-thick)',
            boxShadow: 'var(--shadow-md)',
            color: 'var(--nb-black)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-md)',
            padding: 'var(--space-lg)'
          }}
        >
          <AlertCircle size={26} strokeWidth={2.5} style={{ color: 'var(--nb-red)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '900', textTransform: 'uppercase', fontSize: '0.98rem', marginBottom: '6px' }}>
              📡 {t('common.serviceNotice') || 'Live Mandi Service Notice (मंडी नेटवर्क सूचना)'}
            </div>
            <p style={{ fontSize: '0.94rem', fontWeight: '700', lineHeight: 1.5, marginBottom: '6px' }}>
              {error}
            </p>
            <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono, monospace)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)', wordBreak: 'break-all' }}>
              🏛️ <strong>Upstream API:</strong> https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span>आधिकारिक पोर्टल: <strong style={{ color: 'var(--nb-black)' }}>data.gov.in / Agmarknet</strong></span>
              <span>•</span>
              <a
                href="https://agmarknet.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 14px', fontSize: '0.85rem', textDecoration: 'none' }}
              >
                🌐 Agmarknet पोर्टल खोलें
              </a>
              <span>•</span>
              <button
                onClick={fetchPrices}
                className="btn btn-secondary btn-sm"
                style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                disabled={loading}
              >
                <RefreshCw size={14} strokeWidth={2.5} className={loading ? 'spin' : ''} />
                <span>पुनः प्रयास करें / Try Again</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <Loader message={t('market.loadingData')} />
      ) : sortedRecords.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title={t('common.noResults')}
          description="चयनित राज्य या फसल के लिए कोई ताज़ा मंडी भाव नहीं मिला। कृपया फ़िल्टर बदलकर पुनः प्रयास करें।"
        />
      ) : (
        <div>
          {/* Quick KPI stats from live structured Agmarknet data */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--space-md)',
              marginBottom: 'var(--space-md)'
            }}
          >
            <div className="card" style={{ padding: '12px 16px', border: 'var(--border-medium)', boxShadow: 'var(--shadow-sm)', backgroundColor: 'var(--nb-white)' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                रिपोर्टिंग मंडियां / Mandis Reporting
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--nb-black)', marginTop: '4px' }}>
                {sortedRecords.length}
              </div>
            </div>

            <div className="card" style={{ padding: '12px 16px', border: 'var(--border-medium)', boxShadow: 'var(--shadow-sm)', backgroundColor: 'var(--nb-green-light)' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--nb-black)', textTransform: 'uppercase' }}>
                सर्वोच्च मॉडल भाव / Highest Modal
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--nb-black)', marginTop: '4px' }}>
                ₹{highestModalPrice} <span style={{ fontSize: '0.82rem', fontWeight: '700' }}>/ क्विंटल</span>
              </div>
            </div>

            <div className="card" style={{ padding: '12px 16px', border: 'var(--border-medium)', boxShadow: 'var(--shadow-sm)', backgroundColor: 'var(--nb-white)' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                औसत मॉडल भाव / Avg Modal
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--nb-black)', marginTop: '4px' }}>
                ₹{avgModalPrice} <span style={{ fontSize: '0.82rem', fontWeight: '700' }}>/ क्विंटल</span>
              </div>
            </div>

            <div className="card" style={{ padding: '12px 16px', border: 'var(--border-medium)', boxShadow: 'var(--shadow-sm)', backgroundColor: 'var(--nb-yellow-light)' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--nb-black)', textTransform: 'uppercase' }}>
                न्यूनतम मॉडल भाव / Lowest Modal
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--nb-black)', marginTop: '4px' }}>
                ₹{lowestModalPrice} <span style={{ fontSize: '0.82rem', fontWeight: '700' }}>/ क्विंटल</span>
              </div>
            </div>
          </div>

          {/* Controls bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 'var(--space-md)',
              marginBottom: 'var(--space-md)'
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewMode('table')}
              >
                <TableIcon size={16} strokeWidth={2.5} />
                <span>तालिका / Table</span>
              </button>
              <button
                className={`btn btn-sm ${viewMode === 'comparison' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setViewMode('comparison')}
              >
                <BarChart2 size={16} strokeWidth={2.5} />
                <span>तुलना / Compare Mandis</span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.88rem', color: 'var(--nb-black)', fontWeight: '900', textTransform: 'uppercase' }}>
                सॉर्ट करें:
              </span>
              <select
                className="form-select"
                style={{ minHeight: '38px', padding: '4px 10px', fontSize: '0.88rem', fontWeight: '800' }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="modalPrice_desc">मॉडल भाव: अधिक से कम (Highest First)</option>
                <option value="modalPrice_asc">मॉडल भाव: कम से अधिक (Lowest First)</option>
                <option value="market_asc">मंडी का नाम (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>मंडी व जिला / Market & District</th>
                    <th>फसल / Commodity</th>
                    <th>किस्म व ग्रेड / Variety & Grade</th>
                    <th>आवक तिथि / Date</th>
                    <th style={{ textAlign: 'right' }}>न्यूनतम / Min</th>
                    <th style={{ textAlign: 'right' }}>अधिकतम / Max</th>
                    <th style={{ textAlign: 'right' }}>मॉडल भाव / Modal (₹/Q)</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRecords.map((r) => {
                    const isBest = r.modalPrice === highestModalPrice && highestModalPrice > 0;
                    return (
                      <tr key={r.id} style={{ backgroundColor: isBest ? 'var(--nb-yellow-light)' : 'transparent' }}>
                        <td>
                          <div style={{ fontWeight: '900', color: 'var(--nb-black)' }}>
                            {r.market}
                          </div>
                          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
                            {r.district}, {r.state}
                          </div>
                        </td>
                        <td style={{ fontWeight: '800' }}>{r.commodity}</td>
                        <td>
                          <div style={{ fontWeight: '700', fontSize: '0.88rem' }}>{r.variety || 'Standard'}</div>
                          {r.grade && (
                            <span className="badge" style={{ fontSize: '0.72rem', padding: '1px 6px', marginTop: '3px', backgroundColor: 'var(--nb-canvas-alt)' }}>
                              ग्रेड: {r.grade}
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.88rem', fontWeight: '600' }}>{r.arrivalDate}</td>
                        <td style={{ textAlign: 'right', fontWeight: '700' }}>₹{r.minPrice}</td>
                        <td style={{ textAlign: 'right', fontWeight: '700' }}>₹{r.maxPrice}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span
                            style={{
                              fontWeight: '900',
                              fontSize: '1.15rem',
                              color: 'var(--nb-black)',
                              backgroundColor: isBest ? 'var(--nb-green-light)' : 'transparent',
                              padding: isBest ? '2px 8px' : '0',
                              border: isBest ? '1.5px solid #000' : 'none'
                            }}
                          >
                            ₹{r.modalPrice}
                          </span>
                          {isBest && (
                            <span
                              className="badge badge-gold"
                              style={{ display: 'inline-flex', marginLeft: '6px', fontSize: '0.72rem' }}
                            >
                              <Award size={12} strokeWidth={2.5} /> {t('market.bestPrice')}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Comparison View (Visual Neo-Brutalist Bar Chart) */}
          {viewMode === 'comparison' && (
            <div className="card" style={{ border: 'var(--border-thick)', boxShadow: 'var(--shadow-md)' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: 'var(--space-md)' }}>
                {t('market.comparisonTitle')}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                {sortedRecords.slice(0, 15).map((r) => {
                  const percentage = highestModalPrice > 0 ? (r.modalPrice / highestModalPrice) * 100 : 0;
                  const isBest = r.modalPrice === highestModalPrice;
                  return (
                    <div key={r.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.92rem' }}>
                        <div>
                          <strong style={{ fontWeight: '900', color: 'var(--nb-black)' }}>{r.market}</strong> ({r.district})
                          {isBest && (
                            <span className="badge badge-gold" style={{ marginLeft: '8px' }}>
                              ★ {t('market.bestPrice')}
                            </span>
                          )}
                        </div>
                        <div style={{ fontWeight: '900', color: 'var(--nb-black)', fontSize: '1.05rem' }}>
                          ₹{r.modalPrice} / क्विंटल
                        </div>
                      </div>
                      <div
                        style={{
                          height: '28px',
                          width: '100%',
                          backgroundColor: 'var(--nb-canvas-alt)',
                          border: 'var(--border-medium)',
                          boxShadow: 'var(--shadow-sm)',
                          borderRadius: 'var(--radius-sm)',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${percentage}%`,
                            backgroundColor: isBest ? 'var(--nb-yellow)' : 'var(--nb-green-bright)',
                            borderRight: 'var(--border-medium)',
                            transition: 'width 0.4s ease'
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Source Attribution (Mandatory) */}
          <div
            style={{
              marginTop: 'var(--space-xl)',
              padding: 'var(--space-md)',
              backgroundColor: 'var(--nb-white)',
              border: 'var(--border-medium)',
              boxShadow: 'var(--shadow-sm)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: '700',
              color: 'var(--nb-black)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px'
            }}
          >
            <div>{t('market.sourceNote')}</div>
            {data.updatedAt && (
              <div>अद्यतन समय / Fetched: {new Date(data.updatedAt).toLocaleString()}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Market;
