import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  IndianRupee,
  TrendingUp,
  Landmark,
  FileScan,
  ShieldCheck,
  PlusCircle,
  ArrowRight,
  TrendingDown,
  AlertCircle,
  ExternalLink,
  History,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Droplets,
  Wind,
  MapPin,
  RefreshCw,
  Sparkles,
  MessageSquare,
  BookOpen
} from 'lucide-react';
import { financeService } from '../services/financeService';
import { marketService } from '../services/marketService';
import { schemeService } from '../services/schemeService';
import { ocrService } from '../services/ocrService';
import { weatherService } from '../services/weatherService';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import TTSButton from '../components/TTSButton';

export const Dashboard = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language?.startsWith('hi') ? 'hi' : 'en';

  const [financeSnapshot, setFinanceSnapshot] = useState(null);
  const [marketGlance, setMarketGlance] = useState({ loading: false, records: [], error: '' });
  const [recommendedSchemes, setRecommendedSchemes] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Live agricultural weather state
  const [weatherData, setWeatherData] = useState(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [weatherError, setWeatherError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // 1. Finance summary (real data from MongoDB)
        try {
          const finData = await financeService.getSummary();
          setFinanceSnapshot(finData.thisMonth);
        } catch (e) {
          console.warn('Finance summary fetch:', e.message);
        }

        // 2. Recent transactions
        try {
          const txData = await financeService.getTransactions({ limit: 4 });
          setRecentTransactions(txData.transactions || []);
        } catch (e) {
          console.warn('Recent transactions fetch:', e.message);
        }

        // 3. Recommended schemes
        try {
          const schemesData = await schemeService.getSchemes({ limit: 3 });
          setRecommendedSchemes((schemesData.schemes || []).slice(0, 3));
        } catch (e) {
          console.warn('Schemes fetch:', e.message);
        }

        // 4. Recent OCR scans
        try {
          const scansData = await ocrService.getHistory();
          setRecentScans((scansData || []).slice(0, 3));
        } catch (e) {
          console.warn('Recent scans fetch:', e.message);
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Fetch live market glance for user's configured crops/state
  useEffect(() => {
    if (user?.mainCrops && user.mainCrops.length > 0) {
      setMarketGlance((prev) => ({ ...prev, loading: true, error: '' }));
      const crop = user.mainCrops[0];
      marketService
        .getMarketPrices({
          commodity: crop,
          state: user.state || undefined,
          limit: 4
        })
        .then((res) => {
          setMarketGlance({
            loading: false,
            records: res.records || [],
            error: res.error ? res.message : ''
          });
        })
        .catch((err) => {
          setMarketGlance({
            loading: false,
            records: [],
            error: err.message
          });
        });
    }
  }, [user]);

  // Fetch live agricultural weather for user's recorded location (or default Delhi)
  const fetchWeather = async () => {
    setLoadingWeather(true);
    setWeatherError('');
    try {
      const data = await weatherService.getWeather(user?.latitude, user?.longitude);
      setWeatherData(data);
    } catch (err) {
      console.warn('Weather fetch error:', err.message);
      setWeatherError(lang === 'hi' ? 'मौसम डेटा लोड करने में असमर्थ' : 'Unable to load live weather');
    } finally {
      setLoadingWeather(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [user?.latitude, user?.longitude]);

  const renderWeatherIcon = (type, size = 32) => {
    switch (type) {
      case 'clear':
        return <Sun size={size} strokeWidth={2.5} style={{ color: '#d97706' }} />;
      case 'cloudy':
        return <Cloud size={size} strokeWidth={2.5} style={{ color: '#4b5563' }} />;
      case 'rain':
        return <CloudRain size={size} strokeWidth={2.5} style={{ color: '#2563eb' }} />;
      case 'thunder':
        return <CloudLightning size={size} strokeWidth={2.5} style={{ color: '#7c3aed' }} />;
      default:
        return <Sun size={size} strokeWidth={2.5} style={{ color: '#d97706' }} />;
    }
  };

  if (loading) {
    return <Loader message={t('common.loading')} />;
  }

  const hasAnyTx = recentTransactions.length > 0;
  const hasAnyScans = recentScans.length > 0;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* 1. Greeting Section */}
      <div
        className="card"
        style={{
          backgroundColor: 'var(--nb-yellow-light)',
          border: 'var(--border-thick)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)',
          padding: 'var(--space-lg)',
          marginBottom: 'var(--space-xl)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-md)'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '900', color: 'var(--nb-black)' }}>
            {t('dashboard.greeting')}, {user?.name || 'किसान साथी'}! 🌾
          </h1>
          <p style={{ fontWeight: '700', color: 'var(--color-text-secondary)', marginTop: '4px', fontSize: '0.95rem' }}>
            {(user?.district || user?.city) ? `${user?.district || user?.city}, ` : ''}{user?.state || 'भारत'} {user?.landSizeAcres ? `• ${user.landSizeAcres} एकड़ खेत` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/finance?action=new')}
            className="btn btn-primary"
          >
            <PlusCircle size={18} strokeWidth={2.5} />
            <span>{t('dashboard.actionAddTx')}</span>
          </button>
        </div>
      </div>

      {/* 2. Live Farm Weather Card */}
      <div
        className="card"
        style={{
          border: 'var(--border-thick)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)',
          backgroundColor: 'var(--nb-white)',
          padding: 'var(--space-lg)',
          marginBottom: 'var(--space-xl)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: 'var(--space-md)',
            paddingBottom: '12px',
            borderBottom: 'var(--border-thin)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--nb-black)' }}>
              {t('dashboard.weatherTitle')} 🌦️
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 10px',
                backgroundColor: 'var(--nb-yellow-light)',
                border: '1.5px solid var(--nb-black)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: '800'
              }}
            >
              <MapPin size={14} strokeWidth={2.5} />
              {user?.district || user?.city || 'New Delhi'}, {user?.state || 'Delhi'}
            </span>
            <span
              style={{
                padding: '2px 8px',
                backgroundColor: user?.locationRecorded ? '#dcfce7' : '#f3f4f6',
                color: user?.locationRecorded ? '#166534' : '#4b5563',
                border: '1.5px solid var(--nb-black)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.72rem',
                fontWeight: '800'
              }}
            >
              {user?.locationRecorded ? t('dashboard.gpsVerified') : t('dashboard.defaultLocation')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              to="/weather"
              className="btn btn-primary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                fontSize: '0.82rem',
                textDecoration: 'none'
              }}
            >
              <span>{lang === 'hi' ? 'स्मार्ट वेदर' : 'Farm Intelligence'}</span>
              <ArrowRight size={14} strokeWidth={2.5} />
            </Link>

            <button
              onClick={fetchWeather}
              disabled={loadingWeather}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                fontSize: '0.8rem'
              }}
              title={t('dashboard.refreshWeather')}
            >
              <RefreshCw size={14} strokeWidth={2.5} className={loadingWeather ? 'spin' : ''} />
              <span>{t('dashboard.refreshWeather')}</span>
            </button>
          </div>
        </div>

        {loadingWeather ? (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <Loader message={lang === 'hi' ? 'खेत का मौसम लोड हो रहा है...' : 'Fetching live farm weather...'} size={24} />
          </div>
        ) : weatherError ? (
          <div className="alert alert-info" style={{ margin: 0 }}>
            <AlertCircle size={18} strokeWidth={2.5} />
            <span>{weatherError}</span>
          </div>
        ) : weatherData ? (
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 'var(--space-md)',
                marginBottom: 'var(--space-md)'
              }}
            >
              {/* Main Temp & Condition */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  backgroundColor: 'var(--nb-blue-light)',
                  border: 'var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--nb-white)',
                    border: 'var(--border-medium)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {renderWeatherIcon(weatherData.current?.type, 36)}
                </div>
                <div>
                  <div style={{ fontSize: '2.2rem', fontWeight: '900', lineHeight: 1, color: 'var(--nb-black)' }}>
                    {weatherData.current?.temperature}°C
                  </div>
                  <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--nb-black)', marginTop: '4px' }}>
                    {lang === 'hi' ? weatherData.current?.conditionHi : weatherData.current?.condition}
                  </div>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-text-secondary)' }}>
                    {t('dashboard.weatherFeelsLike')} {weatherData.current?.feelsLike}°C
                  </div>
                </div>
              </div>

              {/* Stats Grid: Humidity, Wind, Rain Risk */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px'
                }}
              >
                {/* Humidity */}
                <div
                  style={{
                    padding: '12px 10px',
                    backgroundColor: 'var(--nb-canvas-alt)',
                    border: 'var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}
                >
                  <Droplets size={22} strokeWidth={2.5} style={{ color: '#0284c7', marginBottom: '4px' }} />
                  <div style={{ fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                    {t('dashboard.humidity')}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--nb-black)', marginTop: '2px' }}>
                    {weatherData.current?.humidity}%
                  </div>
                </div>

                {/* Wind */}
                <div
                  style={{
                    padding: '12px 10px',
                    backgroundColor: 'var(--nb-canvas-alt)',
                    border: 'var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}
                >
                  <Wind size={22} strokeWidth={2.5} style={{ color: '#059669', marginBottom: '4px' }} />
                  <div style={{ fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                    {t('dashboard.windSpeed')}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--nb-black)', marginTop: '2px' }}>
                    {weatherData.current?.windSpeed} <span style={{ fontSize: '0.75rem' }}>km/h</span>
                  </div>
                </div>

                {/* Rain */}
                <div
                  style={{
                    padding: '12px 10px',
                    backgroundColor: 'var(--nb-canvas-alt)',
                    border: 'var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}
                >
                  <CloudRain size={22} strokeWidth={2.5} style={{ color: '#4f46e5', marginBottom: '4px' }} />
                  <div style={{ fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                    {t('dashboard.rainChance')}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--nb-black)', marginTop: '2px' }}>
                    {weatherData.forecast?.[0]?.rainProb !== undefined ? `${weatherData.forecast[0].rainProb}%` : `${weatherData.current?.precipitation} mm`}
                  </div>
                </div>
              </div>
            </div>

            {/* Advisory Alert Banner */}
            <div
              style={{
                backgroundColor: 'var(--nb-yellow-light)',
                border: 'var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-sm)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: 'var(--space-md)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--nb-white)',
                    border: '1.5px solid var(--nb-black)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Sparkles size={18} strokeWidth={2.5} style={{ color: 'var(--nb-black)' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--nb-black)', marginBottom: '2px' }}>
                    {t('dashboard.agriAdvisory')}
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: '700', color: '#1f2937', lineHeight: 1.45 }}>
                    {lang === 'hi' ? weatherData.advisory?.hi : weatherData.advisory?.en}
                  </div>
                </div>
              </div>
              <TTSButton
                text={lang === 'hi' ? weatherData.advisory?.hi : weatherData.advisory?.en}
                variant="icon-only"
                size="sm"
                title={lang === 'hi' ? 'सलाह सुनें' : 'Listen Advisory'}
              />
            </div>

            {/* 3-Day Forecast Strip */}
            {weatherData.forecast && weatherData.forecast.length > 0 && (
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: '900', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                  {t('dashboard.forecast')} 📅
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '10px'
                  }}
                >
                  {weatherData.forecast.map((day, idx) => {
                    const dateObj = new Date(day.date);
                    const dayName = idx === 0 
                      ? (lang === 'hi' ? 'आज' : 'Today') 
                      : idx === 1 
                        ? (lang === 'hi' ? 'कल' : 'Tomorrow') 
                        : dateObj.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'short', month: 'short', day: 'numeric' });

                    return (
                      <div
                        key={day.date}
                        style={{
                          padding: '10px 12px',
                          backgroundColor: 'var(--nb-canvas-alt)',
                          border: 'var(--border-thin)',
                          borderRadius: 'var(--radius-sm)',
                          boxShadow: 'var(--shadow-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {renderWeatherIcon(day.type, 22)}
                          <div>
                            <div style={{ fontWeight: '800', fontSize: '0.85rem', color: 'var(--nb-black)' }}>
                              {dayName}
                            </div>
                            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-muted)' }}>
                              {lang === 'hi' ? day.conditionHi : day.condition}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '900', fontSize: '0.85rem', color: 'var(--nb-black)' }}>
                            {day.tempMax}° / {day.tempMin}°
                          </div>
                          <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#2563eb' }}>
                            ☔ {day.rainProb}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Farm Intelligence Summary Callout */}
            {weatherData.farmIntelligence && (
              <div
                style={{
                  marginTop: 'var(--space-md)',
                  padding: '12px 16px',
                  backgroundColor: 'var(--nb-green-subtle)',
                  border: 'var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--nb-black)' }}>
                      💧 {lang === 'hi' ? 'सिंचाई:' : 'Irrigation:'}
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1.5px solid #000',
                        fontSize: '0.78rem',
                        fontWeight: '800',
                        backgroundColor: weatherData.farmIntelligence.irrigation?.status === 'irrigate_now' ? 'var(--nb-green-light)' : weatherData.farmIntelligence.irrigation?.status === 'skip' ? 'var(--nb-red-light)' : 'var(--nb-yellow-light)'
                      }}
                    >
                      {lang === 'hi' ? weatherData.farmIntelligence.irrigation?.windowHi : weatherData.farmIntelligence.irrigation?.windowEn}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--nb-black)' }}>
                      🌾 {lang === 'hi' ? 'खेत जोखिम:' : 'Farm Risk:'}
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1.5px solid #000',
                        fontSize: '0.78rem',
                        fontWeight: '800',
                        backgroundColor: 'var(--nb-white)'
                      }}
                    >
                      {weatherData.farmIntelligence.riskScore?.overall}/100 ({lang === 'hi' ? weatherData.farmIntelligence.riskScore?.labelHi : weatherData.farmIntelligence.riskScore?.labelEn})
                    </span>
                  </div>
                </div>

                <Link
                  to="/weather"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: '800',
                    fontSize: '0.85rem',
                    color: 'var(--nb-black)',
                    textDecoration: 'underline'
                  }}
                >
                  <span>{lang === 'hi' ? '24 घंटे का क्लॉक व AI सलाहकार खोलें' : 'View 24h Clock & AI Advisor'}</span>
                  <ArrowRight size={15} strokeWidth={2.5} />
                </Link>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* 2. Quick Actions */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '900', marginBottom: 'var(--space-md)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {t('dashboard.quickActions')} ⚡
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
          <Link
            to="/finance?action=new"
            className="card card-hover"
            style={{
              textDecoration: 'none',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'var(--nb-green-light)',
              border: 'var(--border-medium)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--nb-white)',
                border: 'var(--border-medium)',
                boxShadow: 'var(--shadow-sm)',
                color: 'var(--nb-black)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <IndianRupee size={22} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontWeight: '900', fontSize: '0.95rem', color: 'var(--nb-black)' }}>
                {t('dashboard.actionAddTx')}
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--color-text-secondary)' }}>
                आय-व्यय जोड़ें
              </div>
            </div>
          </Link>

          <Link
            to="/samvaad"
            className="card card-hover"
            style={{
              textDecoration: 'none',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'var(--nb-purple-light)',
              border: 'var(--border-medium)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--nb-white)',
                border: 'var(--border-medium)',
                boxShadow: 'var(--shadow-sm)',
                color: 'var(--nb-black)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <MessageSquare size={22} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontWeight: '900', fontSize: '0.95rem', color: 'var(--nb-black)' }}>
                {t('nav.samvaad')} 📡
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--color-text-secondary)' }}>
                5 किमी आसपास चर्चा
              </div>
            </div>
          </Link>

          <Link
            to="/market"
            className="card card-hover"
            style={{
              textDecoration: 'none',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'var(--nb-yellow-light)',
              border: 'var(--border-medium)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--nb-white)',
                border: 'var(--border-medium)',
                boxShadow: 'var(--shadow-sm)',
                color: 'var(--nb-black)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <TrendingUp size={22} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontWeight: '900', fontSize: '0.95rem', color: 'var(--nb-black)' }}>
                {t('dashboard.actionMandi')}
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--color-text-secondary)' }}>
                दैनिक थोक भाव
              </div>
            </div>
          </Link>

          <Link
            to="/schemes"
            className="card card-hover"
            style={{
              textDecoration: 'none',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'var(--nb-blue-light)',
              border: 'var(--border-medium)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--nb-white)',
                border: 'var(--border-medium)',
                boxShadow: 'var(--shadow-sm)',
                color: 'var(--nb-black)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Landmark size={22} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontWeight: '900', fontSize: '0.95rem', color: 'var(--nb-black)' }}>
                {t('dashboard.actionSchemes')}
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--color-text-secondary)' }}>
                अनुदान व लाभ
              </div>
            </div>
          </Link>

          <Link
            to="/documents"
            className="card card-hover"
            style={{
              textDecoration: 'none',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'var(--nb-orange-light)',
              border: 'var(--border-medium)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--nb-white)',
                border: 'var(--border-medium)',
                boxShadow: 'var(--shadow-sm)',
                color: 'var(--nb-black)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Sparkles size={22} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontWeight: '900', fontSize: '0.95rem', color: 'var(--nb-black)' }}>
                {t('dashboard.actionOcr')}
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--color-text-secondary)' }}>
                एआई जांच व टूल्स
              </div>
            </div>
          </Link>

          <Link
            to="/knowledge"
            className="card card-hover"
            style={{
              textDecoration: 'none',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'var(--nb-orange-light)',
              border: 'var(--border-medium)',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--nb-white)',
                border: 'var(--border-medium)',
                boxShadow: 'var(--shadow-sm)',
                color: 'var(--nb-black)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <BookOpen size={22} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontWeight: '900', fontSize: '0.95rem', color: 'var(--nb-black)' }}>
                {lang === 'hi' ? 'KCC कृषि सलाह' : 'KCC Advisory'} 🏛️
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--color-text-secondary)' }}>
                {lang === 'hi' ? '1.7 लाख+ सरकारी समाधान' : '1.7L+ verified advisories'}
              </div>
            </div>
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
        {/* 3. Finance Snapshot */}
        <div className="card" style={{ border: 'var(--border-thick)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--nb-black)' }}>
              {t('dashboard.financeSnapshot')}
            </h2>
            <Link to="/finance" style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--nb-black)' }}>
              खाता बही →
            </Link>
          </div>

          {!hasAnyTx && (!financeSnapshot || (financeSnapshot.income === 0 && financeSnapshot.expense === 0)) ? (
            <EmptyState
              icon={IndianRupee}
              title={t('dashboard.noTransactions')}
              description="अपने बीज, खाद, मजदूरी और फसल बिक्री का हिसाब जोड़कर शुद्ध मुनाफा जानें।"
              actionText={t('dashboard.addFirstTx')}
              onAction={() => navigate('/finance?action=new')}
            />
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: 'var(--space-md)' }}>
                <div
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--nb-green-light)',
                    border: 'var(--border-medium)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', color: 'var(--nb-black)' }}>
                    {t('dashboard.income')}
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: '900', color: 'var(--nb-black)', marginTop: '2px' }}>
                    ₹{financeSnapshot?.income?.toLocaleString('en-IN') || 0}
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--nb-red-light)',
                    border: 'var(--border-medium)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', color: 'var(--nb-black)' }}>
                    {t('dashboard.expense')}
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: '900', color: 'var(--nb-black)', marginTop: '2px' }}>
                    ₹{financeSnapshot?.expense?.toLocaleString('en-IN') || 0}
                  </div>
                </div>

                <div
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--nb-yellow-light)',
                    border: 'var(--border-medium)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: '900', textTransform: 'uppercase', color: 'var(--nb-black)' }}>
                    {t('dashboard.netBalance')}
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: '900', color: 'var(--nb-black)', marginTop: '2px' }}>
                    ₹{financeSnapshot?.net?.toLocaleString('en-IN') || 0}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Market Glance for User's Crops */}
        <div className="card" style={{ border: 'var(--border-thick)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--nb-black)' }}>
              {t('dashboard.marketGlance')}
            </h2>
            <Link to="/market" style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--nb-black)' }}>
              सभी मंडियां →
            </Link>
          </div>

          {(!user?.mainCrops || user.mainCrops.length === 0) ? (
            <div
              style={{
                padding: 'var(--space-lg)',
                backgroundColor: 'var(--nb-yellow-light)',
                borderRadius: 'var(--radius-sm)',
                border: 'var(--border-medium)',
                textAlign: 'center'
              }}
            >
              <p style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--nb-black)', marginBottom: 'var(--space-md)' }}>
                {t('dashboard.noCropsConfigured')}
              </p>
              <Link to="/profile" className="btn btn-gold btn-sm">
                {t('dashboard.goToProfile')}
              </Link>
            </div>
          ) : marketGlance.loading ? (
            <Loader message="Fetching live mandi prices for your crops..." size={24} />
          ) : marketGlance.error ? (
            <div className="alert alert-info">
              <AlertCircle size={18} strokeWidth={2.5} />
              <span style={{ fontSize: '0.88rem' }}>{marketGlance.error}</span>
            </div>
          ) : marketGlance.records.length === 0 ? (
            <p style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-text-muted)', textAlign: 'center', padding: '16px' }}>
              वर्तमान में {user.mainCrops[0]} के लिए लाइव डेटा उपलब्ध नहीं है।
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {marketGlance.records.map((rec) => (
                <div
                  key={rec.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--nb-canvas-alt)',
                    border: 'var(--border-thin)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--nb-black)' }}>
                      {rec.commodity} ({rec.market})
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
                      {rec.district}, {rec.state}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '900', color: 'var(--nb-black)', fontSize: '1.1rem', backgroundColor: 'var(--nb-yellow)', padding: '2px 8px', border: '1.5px solid #000' }}>
                      ₹{rec.modalPrice}/Q
                    </div>
                    <div style={{ fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', marginTop: '2px' }}>मॉडल भाव</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. Recommended Schemes & PMFBY Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
        {/* Schemes for you */}
        <div className="card" style={{ border: 'var(--border-thick)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--nb-black)' }}>
              {t('dashboard.schemesForYou')}
            </h2>
            <Link to="/schemes" style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--nb-black)' }}>
              सभी योजनाएं →
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recommendedSchemes.map((s) => (
              <Link
                key={s.id}
                to={`/schemes?id=${s.id}`}
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--nb-white)',
                  border: 'var(--border-medium)',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.1s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <div style={{ fontWeight: '900', fontSize: '0.98rem', color: 'var(--nb-black)' }}>
                    {s.name[lang] || s.name.en}
                  </div>
                  <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                    {s.category}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  {s.shortDescription?.[lang] || s.shortDescription?.en}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Insurance Card */}
        <div
          className="card"
          style={{
            backgroundColor: 'var(--nb-blue-light)',
            border: 'var(--border-thick)',
            boxShadow: 'var(--shadow-md)',
            color: 'var(--nb-black)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-sm)' }}>
              <ShieldCheck size={26} strokeWidth={2.5} style={{ color: 'var(--nb-black)' }} />
              <h2 style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--nb-black)' }}>
                {t('dashboard.insuranceCardTitle')}
              </h2>
            </div>
            <p style={{ fontSize: '0.95rem', fontWeight: '600', lineHeight: 1.5, marginBottom: 'var(--space-md)' }}>
              {t('dashboard.insuranceCardDesc')}
            </p>

            <div
              style={{
                backgroundColor: 'var(--nb-white)',
                borderRadius: 'var(--radius-sm)',
                border: 'var(--border-medium)',
                boxShadow: 'var(--shadow-sm)',
                padding: '12px',
                fontSize: '0.85rem',
                marginBottom: 'var(--space-md)'
              }}
            >
              <div style={{ fontWeight: '900', textTransform: 'uppercase', color: 'var(--nb-red)', marginBottom: '4px' }}>
                ⚠️ 72 घंटे की अनिवार्य समय-सीमा
              </div>
              <div style={{ fontWeight: '600' }}>
                स्थानीय आपदा या बेमौसम बारिश से नुकसान होने पर 72 घंटे के भीतर टोल-फ्री <strong>14447</strong> पर कॉल करें।
              </div>
            </div>
          </div>

          <Link to="/insurance" className="btn btn-gold btn-sm" style={{ alignSelf: 'flex-start' }}>
            <span>{t('dashboard.readInsuranceGuide')}</span>
            <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
        </div>
      </div>

      {/* 6. Recent Activity */}
      <div className="card" style={{ border: 'var(--border-thick)', boxShadow: 'var(--shadow-md)' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: 'var(--space-md)' }}>
          {t('dashboard.recentActivity')}
        </h2>

        {!hasAnyTx && !hasAnyScans ? (
          <p style={{ color: 'var(--color-text-muted)', fontWeight: '700', fontSize: '0.95rem', textAlign: 'center', padding: '16px' }}>
            {t('dashboard.noRecentActivity')}
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
            {recentTransactions.map((tx) => (
              <div
                key={tx._id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--nb-canvas-alt)',
                  border: 'var(--border-medium)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>{tx.category}</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--color-text-muted)' }}>
                    {new Date(tx.date).toLocaleDateString()} • {tx.description || tx.type}
                  </div>
                </div>
                <div
                  style={{
                    fontWeight: '900',
                    fontSize: '1.05rem',
                    padding: '2px 8px',
                    border: '1.5px solid #000',
                    borderRadius: '4px',
                    backgroundColor: tx.type === 'income' ? 'var(--nb-green-light)' : 'var(--nb-red-light)'
                  }}
                >
                  {tx.type === 'income' ? '+' : '-'}₹{tx.amount}
                </div>
              </div>
            ))}

            {recentScans.map((scan) => (
              <div
                key={scan._id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--nb-purple-light)',
                  border: 'var(--border-medium)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: '800', fontSize: '0.92rem', color: 'var(--nb-black)' }}>
                    📄 {scan.fileName}
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--color-text-muted)' }}>
                    {new Date(scan.createdAt).toLocaleDateString()} • OCR Text Extracted
                  </div>
                </div>
                <Link to="/documents" className="btn btn-secondary btn-sm" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
                  देखें
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
