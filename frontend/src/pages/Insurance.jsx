import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { insuranceService } from '../services/insuranceService';
import {
  ShieldCheck,
  Clock,
  PhoneCall,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Layers,
  AlertCircle
} from 'lucide-react';
import Loader from '../components/Loader';

export const Insurance = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('hi') ? 'hi' : 'en';

  const [guideData, setGuideData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('premiums');

  useEffect(() => {
    const fetchInsuranceData = async () => {
      try {
        const data = await insuranceService.getInsuranceGuide();
        setGuideData(data);
      } catch (err) {
        console.error('Failed to load PMFBY data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsuranceData();
  }, []);

  if (loading) {
    return <Loader message={t('common.loading')} />;
  }

  if (!guideData) {
    return <div className="alert alert-danger">Unable to load PMFBY guide data.</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Hero Header */}
      <div
        style={{
          backgroundColor: 'var(--nb-blue-light)',
          border: 'var(--border-thick)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-xl)',
          color: 'var(--nb-black)',
          padding: 'var(--space-2xl) var(--space-xl)',
          marginBottom: 'var(--space-xl)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              backgroundColor: 'var(--nb-yellow)',
              border: 'var(--border-medium)',
              boxShadow: 'var(--shadow-sm)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ShieldCheck size={28} strokeWidth={2.5} style={{ color: 'var(--nb-black)' }} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--nb-black)', letterSpacing: '-0.5px' }}>
            {guideData.title[lang] || guideData.title.en}
          </h1>
        </div>
        <p style={{ fontSize: '1.05rem', fontWeight: '700', maxWidth: '780px', lineHeight: 1.5, marginTop: '8px' }}>
          {guideData.subtitle[lang] || guideData.subtitle.en}
        </p>

        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap', marginTop: 'var(--space-lg)' }}>
          <a
            href={guideData.officialPortalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            <span>{t('insurance.openPortal')}</span>
            <ExternalLink size={18} strokeWidth={2.5} />
          </a>
          <a
            href={`tel:${guideData.tollFreeNumber}`}
            className="btn btn-gold"
          >
            <PhoneCall size={18} strokeWidth={2.5} />
            <span>{t('insurance.callHelpline')} ({guideData.tollFreeNumber})</span>
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'premiums' ? 'active' : ''}`}
          onClick={() => setActiveTab('premiums')}
        >
          <Layers size={18} strokeWidth={2.5} />
          <span>प्रीमियम दरें / Premium Rates</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'risks' ? 'active' : ''}`}
          onClick={() => setActiveTab('risks')}
        >
          <ShieldCheck size={18} strokeWidth={2.5} />
          <span>कवर होने वाले जोखिम / Covered Risks</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'steps' ? 'active' : ''}`}
          onClick={() => setActiveTab('steps')}
        >
          <CheckCircle2 size={18} strokeWidth={2.5} />
          <span>नामांकन के 5 चरण / How to Enrol</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          <Clock size={18} strokeWidth={2.5} />
          <span>फसल नुकसान टाइमलाइन (72h) / Claim Process</span>
        </button>
      </div>

      {/* Tab 1: Premium Rates */}
      {activeTab === 'premiums' && (
        <div>
          <div className="card" style={{ marginBottom: 'var(--space-xl)', border: 'var(--border-thick)', boxShadow: 'var(--shadow-md)' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: 'var(--space-md)' }}>
              {t('insurance.premiumRatesTitle')}
            </h2>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>सीजन एवं फसलें / Season & Crops</th>
                    <th>मुख्य फसलें / Notified Crops</th>
                    <th style={{ textAlign: 'center' }}>किसान प्रीमियम अंश / Farmer Share</th>
                    <th>सरकारी अंशदान / Govt Subsidy</th>
                  </tr>
                </thead>
                <tbody>
                  {guideData.premiumRates.map((rate, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '900', color: 'var(--nb-black)' }}>
                        {rate.season[lang] || rate.season.en}
                      </td>
                      <td style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                        {rate.examples[lang] || rate.examples.en}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-success" style={{ fontSize: '1rem', padding: '6px 14px' }}>
                          {rate.farmerShare}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
                        {rate.govtShare[lang] || rate.govtShare.en}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Important conditions */}
          <div className="grid grid-cols-3">
            {guideData.importantConditions.map((cond, idx) => (
              <div key={idx} className="card" style={{ border: 'var(--border-thick)', boxShadow: 'var(--shadow-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <AlertCircle size={22} strokeWidth={2.5} style={{ color: 'var(--nb-orange)' }} />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: 'var(--nb-black)' }}>
                    {cond.title[lang] || cond.title.en}
                  </h3>
                </div>
                <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  {cond.detail[lang] || cond.detail.en}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Covered Risks */}
      {activeTab === 'risks' && (
        <div className="grid grid-cols-2">
          {guideData.coveredRisks.map((risk, idx) => (
            <div
              key={idx}
              className="card card-hover"
              style={{
                border: 'var(--border-thick)',
                boxShadow: 'var(--shadow-md)',
                backgroundColor: idx % 2 === 0 ? 'var(--nb-yellow-light)' : 'var(--nb-green-light)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--nb-white)',
                    border: 'var(--border-medium)',
                    boxShadow: 'var(--shadow-sm)',
                    color: 'var(--nb-black)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ShieldCheck size={24} strokeWidth={2.5} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--nb-black)' }}>
                  {risk.stage[lang] || risk.stage.en}
                </h3>
              </div>
              <p style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--nb-black)', lineHeight: 1.6 }}>
                {risk.description[lang] || risk.description.en}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Steps to Enrol */}
      {activeTab === 'steps' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {guideData.stepsToEnrol.map((s) => (
            <div
              key={s.step}
              className="card"
              style={{
                display: 'flex',
                gap: 'var(--space-lg)',
                alignItems: 'flex-start',
                border: 'var(--border-thick)',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--nb-yellow)',
                  border: 'var(--border-medium)',
                  boxShadow: 'var(--shadow-sm)',
                  color: 'var(--nb-black)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '900',
                  fontSize: '1.35rem',
                  flexShrink: 0
                }}
              >
                {s.step}
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: '6px' }}>
                  {s.title[lang] || s.title.en}
                </h3>
                <p style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  {s.description[lang] || s.description.en}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Loss Intimation Timeline */}
      {activeTab === 'timeline' && (
        <div>
          <div
            style={{
              backgroundColor: 'var(--nb-red-light)',
              border: 'var(--border-thick)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-md)',
              padding: 'var(--space-md) var(--space-lg)',
              marginBottom: 'var(--space-xl)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}
          >
            <Clock size={32} strokeWidth={2.5} style={{ color: 'var(--nb-black)', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: '900', fontSize: '1.1rem', textTransform: 'uppercase', color: 'var(--nb-black)' }}>
                आपदा के 72 घंटे के अंदर सूचना देना अनिवार्य है!
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#7f1d1d' }}>
                ओलावृष्टि, बादल फटने या जलभराव से नुकसान होने पर तुरंत टोल-फ्री <strong>14447</strong> पर कॉल करें या 'Crop Insurance' ऐप पर फोटो अपलोड करें।
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {guideData.lossIntimationTimeline.map((item, idx) => (
              <div
                key={idx}
                className="card"
                style={{
                  display: 'flex',
                  gap: 'var(--space-lg)',
                  alignItems: 'center',
                  border: 'var(--border-thick)',
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                <div
                  style={{
                    minWidth: '220px',
                    padding: '10px 14px',
                    backgroundColor: 'var(--nb-yellow)',
                    border: 'var(--border-medium)',
                    boxShadow: 'var(--shadow-sm)',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: '900',
                    fontSize: '0.92rem',
                    color: 'var(--nb-black)',
                    textTransform: 'uppercase'
                  }}
                >
                  {item.timeWindow[lang] || item.timeWindow.en}
                </div>
                <p style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--nb-black)', lineHeight: 1.5 }}>
                  {item.action[lang] || item.action.en}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Insurance;
