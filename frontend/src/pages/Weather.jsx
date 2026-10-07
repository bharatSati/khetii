import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Droplets,
  Wind,
  MapPin,
  RefreshCw,
  Sparkles,
  Bot,
  Mic,
  MicOff,
  Send,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Thermometer,
  ShieldAlert,
  HelpCircle,
  Compass,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Eye,
  Info,
  Layers,
  Sprout,
  Wheat,
  Activity
} from 'lucide-react';
import { weatherService } from '../services/weatherService';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';

export const Weather = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('hi') ? 'hi' : 'en';

  // Location & Context State
  const [coords, setCoords] = useState({
    lat: user?.latitude || 28.6139,
    lon: user?.longitude || 77.2090
  });
  const [usingGps, setUsingGps] = useState(false);
  const [selectedCrops, setSelectedCrops] = useState(user?.mainCrops || ['Wheat', 'Mustard']);

  // Weather & Farm Intelligence State
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // AI Briefing & Q&A State
  const [aiBriefing, setAiBriefing] = useState(null);
  const [loadingAiBrief, setLoadingAiBrief] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [askingAi, setAskingAi] = useState(false);
  const [aiAnswer, setAiAnswer] = useState(null);

  // Voice Input State (Web Speech API)
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const recognitionRef = useRef(null);

  // Quick prompt questions
  const quickQuestions = lang === 'hi'
    ? [
        'आज खेत में क्या करना चाहिए?',
        'क्या आज फसल में पानी लगाऊं?',
        'आज कीटनाशक स्प्रे कर सकता हूं?',
        'कल बारिश की क्या संभावना है?',
        'अगले 3 दिनों का कृषि प्लान क्या है?'
      ]
    : [
        'What should I do on the farm today?',
        'Should I irrigate my crops today?',
        'Can I spray pesticides today?',
        'Will it rain tomorrow?',
        'What is the farm plan for the next 3 days?'
      ];

  // Fetch full weather data
  const fetchWeatherData = async (overrideCoords = null) => {
    const targetCoords = overrideCoords || coords;
    setError('');
    try {
      const data = await weatherService.getWeather({
        lat: targetCoords.lat,
        lon: targetCoords.lon,
        crops: selectedCrops,
        landSizeAcres: user?.landSizeAcres || 0,
        city: user?.city || 'Delhi',
        district: user?.district || 'New Delhi',
        state: user?.state || 'Delhi',
        lang
      });
      setWeatherData(data);
    } catch (err) {
      console.error('Weather load error:', err);
      setError(lang === 'hi' ? 'मौसम डेटा लोड करने में त्रुटि आई। पुनः प्रयास करें।' : 'Failed to load farm weather. Please retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch AI structured daily brief on demand / initial load
  const fetchAiBriefing = async () => {
    if (!weatherData) return;
    setLoadingAiBrief(true);
    try {
      const brief = await weatherService.getAiBrief({
        lat: coords.lat,
        lon: coords.lon,
        crops: selectedCrops,
        landSizeAcres: user?.landSizeAcres || 0,
        city: user?.city || 'Delhi',
        district: user?.district || 'New Delhi',
        state: user?.state || 'Delhi',
        lang
      });
      setAiBriefing(brief);
    } catch (err) {
      console.warn('AI brief load warning:', err);
    } finally {
      setLoadingAiBrief(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, [coords.lat, coords.lon, lang]);

  useEffect(() => {
    if (weatherData && !aiBriefing) {
      fetchAiBriefing();
    }
  }, [weatherData]);

  // Handle GPS location request
  const handleUseGps = () => {
    if (!navigator.geolocation) {
      alert(lang === 'hi' ? 'आपके डिवाइस में GPS समर्थित नहीं है।' : 'Geolocation is not supported by your browser.');
      return;
    }
    setRefreshing(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
        setCoords(newCoords);
        setUsingGps(true);
        fetchWeatherData(newCoords);
      },
      (err) => {
        console.warn('GPS error:', err.message);
        setRefreshing(false);
        alert(lang === 'hi' ? 'GPS स्थान प्राप्त नहीं हो सका।' : 'Unable to retrieve your live GPS location.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Handle Ask Khetii AI
  const handleAskAdvisor = async (queryText = null) => {
    const q = (queryText || aiQuery || '').trim();
    if (!q) return;
    setAskingAi(true);
    setAiAnswer(null);
    try {
      const response = await weatherService.askAdvisor({
        query: q,
        lat: coords.lat,
        lon: coords.lon,
        crops: selectedCrops,
        landSizeAcres: user?.landSizeAcres || 0,
        city: user?.city || 'Delhi',
        district: user?.district || 'New Delhi',
        state: user?.state || 'Delhi',
        lang
      });
      setAiAnswer(response);
    } catch (err) {
      console.error('AI question error:', err);
      setAiAnswer({
        answer: lang === 'hi' ? 'उत्तर प्राप्त करने में समस्या आई। कृपया पुनः प्रयास करें।' : 'Failed to query AI advisor. Please try again.',
        priority: 'NORMAL',
        directAction: '',
        why: ''
      });
    } finally {
      setAskingAi(false);
    }
  };

  // Browser Web Speech API setup for voice queries
  const startVoiceRecognition = () => {
    setVoiceError('');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError(t('weather.voiceNotSupported'));
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setAiQuery(transcript);
        setIsListening(false);
        // Automatically ask AI with spoken transcript
        handleAskAdvisor(transcript);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error !== 'no-speech') {
          setVoiceError(lang === 'hi' ? 'आवाज़ पहचानी नहीं जा सकी। पुनः बोलें।' : 'Speech recognition failed. Try again.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error('Speech start error:', e);
      setIsListening(false);
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Weather Icon Helper
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

  // Status badge styling helper
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'irrigate_now':
      case 'optimal':
      case 'favorable':
      case 'good':
      case 'low':
        return { bg: 'var(--nb-green-light)', border: 'var(--nb-black)', color: '#14532d' };
      case 'postpone':
      case 'moderate':
      case 'caution':
        return { bg: 'var(--nb-yellow-light)', border: 'var(--nb-black)', color: '#713f12' };
      case 'skip':
      case 'unsafe':
      case 'avoid':
      case 'high':
      case 'severe':
        return { bg: 'var(--nb-red-light)', border: 'var(--nb-black)', color: '#7f1d1d' };
      default:
        return { bg: 'var(--nb-canvas-alt)', border: 'var(--nb-black)', color: '#1f2937' };
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <Loader message={t('weather.loading')} size={36} />
      </div>
    );
  }

  const intel = weatherData?.farmIntelligence || {};
  const irrigation = intel.irrigation || {};
  const spray = intel.sprayWindow || {};
  const riskScore = intel.riskScore || {};
  const todayPlan = intel.todayPlan || { doNow: [], avoid: [], watch: [] };
  const smartClock = intel.smartFarmClock || [];
  const farmCalendar = intel.farmCalendar || [];
  const cropRisks = intel.cropRisk || [];
  const whyList = intel.whyRecommendations || [];
  const alertsList = intel.alerts || [];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: 'var(--space-2xl)' }}>
      {/* 1. Header Banner & Farm Location Bar */}
      <div
        className="card"
        style={{
          border: 'var(--border-thick)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          backgroundColor: 'var(--nb-yellow-light)',
          padding: 'var(--space-lg)',
          marginBottom: 'var(--space-xl)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px',
                backgroundColor: 'var(--nb-white)',
                border: '1.5px solid #000',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.8rem',
                fontWeight: '900',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '8px'
              }}
            >
              <Sprout size={15} strokeWidth={2.5} style={{ color: 'var(--nb-green)' }} />
              <span>{t('weather.badge')}</span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: '900', lineHeight: 1.15, color: 'var(--nb-black)' }}>
              {t('weather.pageTitle')} 🌾
            </h1>
            <p style={{ fontSize: '0.95rem', fontWeight: '700', color: '#374151', marginTop: '6px', maxWidth: '720px' }}>
              {t('weather.pageSubtitle')}
            </p>
          </div>

          {/* Action buttons: GPS & Refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleUseGps}
              disabled={refreshing}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '0.85rem'
              }}
            >
              <Compass size={16} strokeWidth={2.5} className={usingGps ? 'spin' : ''} />
              <span>{usingGps ? t('weather.gpsActive') : t('weather.useCurrentGps')}</span>
            </button>

            <button
              onClick={() => {
                setRefreshing(true);
                fetchWeatherData();
                fetchAiBriefing();
              }}
              disabled={refreshing}
              className="btn btn-primary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                fontSize: '0.85rem'
              }}
            >
              <RefreshCw size={16} strokeWidth={2.5} className={refreshing ? 'spin' : ''} />
              <span>{t('weather.refresh')}</span>
            </button>
          </div>
        </div>

        {/* Location & Crop metadata pill bar */}
        <div
          style={{
            marginTop: 'var(--space-md)',
            paddingTop: '12px',
            borderTop: '2px dashed var(--nb-black)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--nb-white)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid #000',
                fontSize: '0.82rem',
                fontWeight: '800'
              }}
            >
              <MapPin size={15} strokeWidth={2.5} style={{ color: '#dc2626' }} />
              <span>
                {weatherData?.location?.district || weatherData?.location?.city || user?.district || user?.city || 'Delhi'}, {weatherData?.location?.state || user?.state || 'India'}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                ({coords.lat.toFixed(2)}°N, {coords.lon.toFixed(2)}°E)
              </span>
            </div>

            {/* Configured Crops Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--nb-white)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid #000',
                fontSize: '0.82rem',
                fontWeight: '800'
              }}
            >
              <Wheat size={15} strokeWidth={2.5} style={{ color: '#15803d' }} />
              <span>{t('weather.cropFilter')}:</span>
              <span style={{ color: '#15803d' }}>
                {selectedCrops.length > 0 ? selectedCrops.join(', ') : (lang === 'hi' ? 'सामान्य फसलें' : 'General crops')}
              </span>
            </div>
          </div>

          <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#4b5563' }}>
            🕒 {lang === 'hi' ? 'अपडेट:' : 'Updated:'} {new Date(weatherData?.updatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* 2. Top Metric Cards: Temp, Rain Risk, Farm Risk Score, Irrigation Status */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-xl)'
        }}
      >
        {/* Card A: Current Temperature & Condition */}
        <div
          className="card"
          style={{
            border: 'var(--border-thick)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            backgroundColor: 'var(--nb-blue-light)',
            padding: 'var(--space-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--nb-white)',
              border: 'var(--border-medium)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {renderWeatherIcon(weatherData?.current?.type, 38)}
          </div>
          <div>
            <div style={{ fontSize: '2.4rem', fontWeight: '900', lineHeight: 1, color: 'var(--nb-black)' }}>
              {weatherData?.current?.temperature}°C
            </div>
            <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--nb-black)', marginTop: '4px' }}>
              {lang === 'hi' ? weatherData?.current?.conditionHi : weatherData?.current?.condition}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#4b5563' }}>
              {t('weather.feelsLike')} {weatherData?.current?.feelsLike}°C
            </div>
          </div>
        </div>

        {/* Card B: Rain Risk & Expected Precipitation */}
        <div
          className="card"
          style={{
            border: 'var(--border-thick)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            backgroundColor: 'var(--nb-white)',
            padding: 'var(--space-md)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase', color: '#4b5563' }}>
              {t('weather.rainRisk')} 🌧️
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: '900',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid #000',
                backgroundColor: (weatherData?.forecast?.[0]?.rainProb || 0) >= 50 ? 'var(--nb-red-light)' : 'var(--nb-green-light)'
              }}
            >
              {(weatherData?.forecast?.[0]?.rainProb || 0) >= 50 ? (lang === 'hi' ? 'उच्च संभावना' : 'High Chance') : (lang === 'hi' ? 'कम संभावना' : 'Low Chance')}
            </span>
          </div>
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: '900', lineHeight: 1, color: '#1d4ed8' }}>
              {weatherData?.forecast?.[0]?.rainProb ?? 0}%
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#374151', marginTop: '4px' }}>
              {lang === 'hi' ? 'अनुमानित वर्षा:' : 'Expected Rain:'} <strong>{weatherData?.forecast?.[0]?.rainSum ?? 0} mm</strong>
            </div>
          </div>
        </div>

        {/* Card C: Farm Weather Risk Score (0-100) */}
        <div
          className="card"
          style={{
            border: 'var(--border-thick)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            backgroundColor: 'var(--nb-white)',
            padding: 'var(--space-md)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase', color: '#4b5563' }}>
              {t('weather.farmRiskScore')} 🌾
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: '900',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid #000',
                ...getStatusBadgeStyle(riskScore.level)
              }}
            >
              {lang === 'hi' ? riskScore.labelHi : riskScore.labelEn}
            </span>
          </div>
          <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: '900', lineHeight: 1, color: 'var(--nb-black)' }}>
                {riskScore.overall ?? 15}
              </span>
              <span style={{ fontSize: '1rem', fontWeight: '800', color: '#6b7280' }}>/ 100</span>
            </div>
            <div
              style={{
                marginTop: '6px',
                width: '100%',
                height: '8px',
                backgroundColor: '#e5e7eb',
                borderRadius: 'var(--radius-pill)',
                overflow: 'hidden',
                border: '1.5px solid #000'
              }}
            >
              <div
                style={{
                  width: `${riskScore.overall ?? 15}%`,
                  height: '100%',
                  backgroundColor: riskScore.overall >= 60 ? '#dc2626' : riskScore.overall >= 30 ? '#facc15' : '#22c55e'
                }}
              />
            </div>
          </div>
        </div>

        {/* Card D: Irrigation Status Recommendation */}
        <div
          className="card"
          style={{
            border: 'var(--border-thick)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            backgroundColor: irrigation.status === 'irrigate_now' ? 'var(--nb-green-light)' : irrigation.status === 'skip' ? 'var(--nb-red-light)' : 'var(--nb-yellow-light)',
            padding: 'var(--space-md)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase', color: 'var(--nb-black)' }}>
              {t('weather.irrigationStatus')} 💧
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: '900',
                padding: '2px 8px',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid #000',
                backgroundColor: 'var(--nb-white)'
              }}
            >
              {irrigation.status === 'irrigate_now'
                ? (lang === 'hi' ? '✅ पानी लगाएं' : '✅ Irrigate Now')
                : irrigation.status === 'skip'
                  ? (lang === 'hi' ? '❌ सिंचाई छोड़ें' : '❌ Skip')
                  : (lang === 'hi' ? '⏳ टालें' : '⏳ Postpone')}
            </span>
          </div>
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: '0.98rem', fontWeight: '900', color: 'var(--nb-black)', lineHeight: 1.3 }}>
              {lang === 'hi' ? irrigation.windowHi : irrigation.windowEn}
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#1f2937', marginTop: '4px' }}>
              ET0: {irrigation.metrics?.et0} mm | {lang === 'hi' ? 'मिट्टी नमी' : 'Soil'}: {irrigation.metrics?.soilMoisturePercent}%
            </div>
          </div>
        </div>
      </div>

      {/* 3. 🤖 ASK KHETII AI FARM ADVISOR (Interactive + Voice) */}
      <div
        className="card"
        style={{
          border: 'var(--border-thick)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          backgroundColor: 'var(--nb-white)',
          padding: 'var(--space-lg)',
          marginBottom: 'var(--space-xl)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-md)' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--nb-yellow)',
              border: 'var(--border-medium)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Bot size={24} strokeWidth={2.5} style={{ color: 'var(--nb-black)' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: 'var(--nb-black)' }}>
              {t('weather.aiAdvisorTitle')} 🤖
            </h2>
            <p style={{ fontSize: '0.88rem', fontWeight: '700', color: '#4b5563' }}>
              {t('weather.aiAdvisorDesc')}
            </p>
          </div>
        </div>

        {/* Input box with Voice and Ask buttons */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            flexWrap: 'wrap',
            marginBottom: 'var(--space-sm)'
          }}
        >
          <div style={{ flex: '1 1 320px', position: 'relative' }}>
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskAdvisor()}
              placeholder={t('weather.aiInputPlaceholder')}
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: '0.95rem',
                fontWeight: '700',
                border: 'var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-sm)',
                backgroundColor: 'var(--nb-canvas-alt)',
                outline: 'none'
              }}
            />
          </div>

          {/* Voice Button (Web Speech API) */}
          <button
            onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
            className={`btn ${isListening ? 'btn-danger' : 'btn-secondary'}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '12px 16px',
              fontSize: '0.9rem',
              backgroundColor: isListening ? '#ef4444' : undefined,
              color: isListening ? '#ffffff' : undefined,
              animation: isListening ? 'pulse 1.2s infinite' : 'none'
            }}
            title={t('weather.voiceButton')}
          >
            {isListening ? <MicOff size={18} strokeWidth={2.5} /> : <Mic size={18} strokeWidth={2.5} />}
            <span>{isListening ? t('weather.voiceListening') : t('weather.voiceButton')}</span>
          </button>

          {/* Ask Button */}
          <button
            onClick={() => handleAskAdvisor()}
            disabled={askingAi || !aiQuery.trim()}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '12px 20px',
              fontSize: '0.9rem'
            }}
          >
            <Send size={16} strokeWidth={2.5} />
            <span>{askingAi ? (lang === 'hi' ? 'पूछ रहे हैं...' : 'Thinking...') : t('weather.askButton')}</span>
          </button>
        </div>

        {/* Voice error note if browser lacks permission */}
        {voiceError && (
          <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#dc2626', marginBottom: '8px' }}>
            ⚠️ {voiceError}
          </div>
        )}

        {/* Quick prompt question chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: '900', textTransform: 'uppercase', color: '#6b7280' }}>
            {t('weather.quickQuestions')}:
          </span>
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setAiQuery(q);
                handleAskAdvisor(q);
              }}
              style={{
                backgroundColor: 'var(--nb-canvas)',
                border: '1.5px solid var(--nb-black)',
                borderRadius: 'var(--radius-pill)',
                padding: '4px 10px',
                fontSize: '0.78rem',
                fontWeight: '800',
                cursor: 'pointer',
                transition: 'all 0.1s ease',
                boxShadow: '1px 1px 0px var(--nb-black)'
              }}
            >
              💬 {q}
            </button>
          ))}
        </div>

        {/* AI Answer Display Box */}
        {askingAi && (
          <div style={{ marginTop: 'var(--space-md)', padding: '16px', textAlign: 'center' }}>
            <Loader message={lang === 'hi' ? 'खेती AI आपके खेत के मौसम का विश्लेषण कर रहा है...' : 'Analyzing live farm weather for advice...'} size={24} />
          </div>
        )}

        {aiAnswer && !askingAi && (
          <div
            style={{
              marginTop: 'var(--space-md)',
              padding: '16px',
              backgroundColor: 'var(--nb-yellow-subtle)',
              border: 'var(--border-medium)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={18} strokeWidth={2.5} style={{ color: '#d97706' }} />
                <span style={{ fontWeight: '900', fontSize: '0.9rem', color: 'var(--nb-black)', textTransform: 'uppercase' }}>
                  {lang === 'hi' ? 'खेती AI का त्वरित उत्तर' : 'Khetii AI Response'}
                </span>
              </div>
              {aiAnswer.directAction && (
                <span
                  style={{
                    backgroundColor: 'var(--nb-white)',
                    border: '1.5px solid #000',
                    borderRadius: 'var(--radius-sm)',
                    padding: '2px 8px',
                    fontSize: '0.78rem',
                    fontWeight: '900',
                    color: 'var(--nb-green)'
                  }}
                >
                  ⚡ {aiAnswer.directAction}
                </span>
              )}
            </div>

            <p style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--nb-black)', lineHeight: 1.5 }}>
              {aiAnswer.answer}
            </p>

            {aiAnswer.why && (
              <div style={{ marginTop: '8px', fontSize: '0.85rem', fontWeight: '700', color: '#4b5563' }}>
                <strong>{lang === 'hi' ? 'कारण:' : 'Rationale:'}</strong> {aiAnswer.why}
              </div>
            )}

            {aiAnswer.warning && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '6px 10px',
                  backgroundColor: 'var(--nb-red-light)',
                  border: '1.5px solid #000',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  fontWeight: '800',
                  color: '#991b1b'
                }}
              >
                ⚠️ {aiAnswer.warning}
              </div>
            )}
          </div>
        )}

        {/* Structured Daily AI Briefing Banner */}
        {aiBriefing && (
          <div
            style={{
              marginTop: 'var(--space-md)',
              padding: '14px 16px',
              backgroundColor: 'var(--nb-canvas-alt)',
              border: 'var(--border-thin)',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <div style={{ fontWeight: '900', fontSize: '0.85rem', textTransform: 'uppercase', color: '#1f2937', marginBottom: '4px' }}>
              📢 {aiBriefing.headline}
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#374151', lineHeight: 1.45 }}>
              {aiBriefing.summary}
            </div>
            {aiBriefing.tomorrowPlan && (
              <div style={{ marginTop: '6px', fontSize: '0.82rem', fontWeight: '700', color: '#2563eb' }}>
                📅 <strong>{lang === 'hi' ? 'कल की तैयारी:' : 'Tomorrow:'}</strong> {aiBriefing.tomorrowPlan}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. 🌾 TODAY'S FARM PLAN: DO NOW, AVOID, WATCH */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '900', marginBottom: 'var(--space-md)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {t('weather.todayPlanTitle')} 🌾
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--space-md)'
          }}
        >
          {/* Box 1: DO NOW (✅ तुरंत करें) */}
          <div
            className="card"
            style={{
              border: 'var(--border-thick)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)',
              backgroundColor: '#ecfdf5',
              padding: 'var(--space-md)',
              borderTop: '6px solid #16a34a'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <CheckCircle2 size={22} strokeWidth={2.5} style={{ color: '#16a34a' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#166534' }}>
                {t('weather.doNowTitle')}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {todayPlan.doNow && todayPlan.doNow.length > 0 ? (
                todayPlan.doNow.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: 'var(--nb-white)',
                      border: 'var(--border-thin)',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ fontWeight: '900', fontSize: '0.92rem', color: 'var(--nb-black)' }}>
                      ✅ {lang === 'hi' ? item.titleHi : item.titleEn}
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#4b5563', marginTop: '4px' }}>
                      {lang === 'hi' ? item.descHi : item.descEn}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#4b5563' }}>
                  {t('weather.allGood')}
                </div>
              )}
            </div>
          </div>

          {/* Box 2: AVOID TODAY (❌ आज न करें) */}
          <div
            className="card"
            style={{
              border: 'var(--border-thick)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)',
              backgroundColor: '#fef2f2',
              padding: 'var(--space-md)',
              borderTop: '6px solid #dc2626'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <XCircle size={22} strokeWidth={2.5} style={{ color: '#dc2626' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#991b1b' }}>
                {t('weather.avoidTitle')}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {todayPlan.avoid && todayPlan.avoid.length > 0 ? (
                todayPlan.avoid.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: 'var(--nb-white)',
                      border: 'var(--border-thin)',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ fontWeight: '900', fontSize: '0.92rem', color: '#991b1b' }}>
                      ❌ {lang === 'hi' ? item.titleHi : item.titleEn}
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#4b5563', marginTop: '4px' }}>
                      {lang === 'hi' ? item.descHi : item.descEn}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#4b5563' }}>
                  {t('weather.allGood')}
                </div>
              )}
            </div>
          </div>

          {/* Box 3: WATCH & MONITOR (⚠️ निगरानी रखें) */}
          <div
            className="card"
            style={{
              border: 'var(--border-thick)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)',
              backgroundColor: '#fffbeb',
              padding: 'var(--space-md)',
              borderTop: '6px solid #d97706'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <AlertTriangle size={22} strokeWidth={2.5} style={{ color: '#d97706' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: '#92400e' }}>
                {t('weather.watchTitle')}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {todayPlan.watch && todayPlan.watch.length > 0 ? (
                todayPlan.watch.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: 'var(--nb-white)',
                      border: 'var(--border-thin)',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ fontWeight: '900', fontSize: '0.92rem', color: '#92400e' }}>
                      ⚠️ {lang === 'hi' ? item.titleHi : item.titleEn}
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#4b5563', marginTop: '4px' }}>
                      {lang === 'hi' ? item.descHi : item.descEn}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#4b5563' }}>
                  {t('weather.allGood')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. 🕐 SMART FARM CLOCK (24-Hour Timeline from Hourly Weather) */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--space-md)' }}>
          <Clock size={24} strokeWidth={2.5} style={{ color: 'var(--nb-black)' }} />
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--nb-black)' }}>
              {t('weather.smartClockTitle')} 🕐
            </h2>
            <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#6b7280' }}>
              {t('weather.smartClockSubtitle')}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px'
          }}
        >
          {smartClock.map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: '12px',
                border: 'var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-sm)',
                backgroundColor: item.status === 'optimal' ? 'var(--nb-green-subtle)' : item.status === 'avoid' ? 'var(--nb-red-subtle)' : 'var(--nb-yellow-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span
                    style={{
                      fontWeight: '900',
                      fontSize: '0.9rem',
                      backgroundColor: 'var(--nb-white)',
                      padding: '2px 6px',
                      border: '1.5px solid #000',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    {item.ampmLabel}
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: '800' }}>
                    {item.temp}°C
                  </span>
                </div>
                <div style={{ fontWeight: '900', fontSize: '0.9rem', color: 'var(--nb-black)', marginTop: '4px' }}>
                  {lang === 'hi' ? item.labelHi : item.labelEn}
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#4b5563', marginTop: '4px' }}>
                  {lang === 'hi' ? item.reasonHi : item.reasonEn}
                </div>
              </div>

              <div
                style={{
                  marginTop: '10px',
                  paddingTop: '6px',
                  borderTop: '1px solid rgba(0,0,0,0.15)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.72rem',
                  fontWeight: '800'
                }}
              >
                <span>☔ {item.rainProb}%</span>
                <span>💨 {item.wind} km/h</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. 🌧️ NEXT 24 HOURS HOURLY PROGRESSION */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--space-md)' }}>
          <Activity size={22} strokeWidth={2.5} style={{ color: '#2563eb' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--nb-black)' }}>
            {t('weather.next24HoursTitle')} 📈
          </h2>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            paddingBottom: '8px'
          }}
        >
          {(weatherData?.hourly || []).slice(0, 24).map((h, idx) => {
            const timeObj = new Date(h.time);
            const hourLabel = timeObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={idx}
                style={{
                  minWidth: '110px',
                  flex: '0 0 auto',
                  padding: '12px 10px',
                  backgroundColor: 'var(--nb-canvas-alt)',
                  border: 'var(--border-thin)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-sm)',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#4b5563' }}>
                  {hourLabel}
                </div>
                <div style={{ margin: '6px auto', display: 'flex', justifyContent: 'center' }}>
                  {renderWeatherIcon(h.type, 26)}
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: '900', color: 'var(--nb-black)' }}>
                  {h.temp}°C
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#2563eb', marginTop: '2px' }}>
                  ☔ {h.rainProb}%
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: '700', color: '#059669', marginTop: '2px' }}>
                  💨 {h.windSpeed} km/h
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. 📅 7-DAY FARM CALENDAR */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--space-md)' }}>
          <Calendar size={22} strokeWidth={2.5} style={{ color: 'var(--nb-black)' }} />
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--nb-black)' }}>
              {t('weather.farmCalendarTitle')} 📅
            </h2>
            <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#6b7280' }}>
              {t('weather.farmCalendarSubtitle')}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(weatherData?.forecast || []).map((day, idx) => {
            const dateObj = new Date(day.date);
            const dayName = idx === 0
              ? (lang === 'hi' ? 'आज (Today)' : 'Today')
              : idx === 1
                ? (lang === 'hi' ? 'कल (Tomorrow)' : 'Tomorrow')
                : dateObj.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'long', month: 'short', day: 'numeric' });

            return (
              <div
                key={day.date}
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--nb-canvas-alt)',
                  border: 'var(--border-thin)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  alignItems: 'center'
                }}
              >
                {/* Day name & icon */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {renderWeatherIcon(day.type, 28)}
                  <div>
                    <div style={{ fontWeight: '900', fontSize: '0.95rem', color: 'var(--nb-black)' }}>
                      {dayName}
                    </div>
                    <div style={{ fontSize: '0.78rem', fontWeight: '700', color: '#4b5563' }}>
                      {lang === 'hi' ? day.conditionHi : day.condition}
                    </div>
                  </div>
                </div>

                {/* Temperature & Rain stats */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>
                      {lang === 'hi' ? 'तापमान' : 'Temp'}
                    </div>
                    <div style={{ fontWeight: '900', fontSize: '1rem', color: 'var(--nb-black)' }}>
                      {day.tempMax}° / {day.tempMin}°
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>
                      {lang === 'hi' ? 'वर्षा' : 'Rain'}
                    </div>
                    <div style={{ fontWeight: '900', fontSize: '0.92rem', color: '#2563eb' }}>
                      ☔ {day.rainProb}% ({day.rainSum} mm)
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>
                      {lang === 'hi' ? 'हवा' : 'Wind'}
                    </div>
                    <div style={{ fontWeight: '800', fontSize: '0.85rem', color: '#059669' }}>
                      💨 {day.windSpeed} km/h
                    </div>
                  </div>
                </div>

                {/* Farm Activity Recommendation & Avoid */}
                <div style={{ fontSize: '0.82rem', fontWeight: '700' }}>
                  <div style={{ color: '#166534', marginBottom: '2px' }}>
                    <strong>✅ {lang === 'hi' ? 'सुझाव:' : 'Do:'}</strong> {lang === 'hi' ? day.recommendedHi : day.recommendedEn}
                  </div>
                  <div style={{ color: '#991b1b' }}>
                    <strong>❌ {lang === 'hi' ? 'टालें:' : 'Avoid:'}</strong> {lang === 'hi' ? day.avoidHi : day.avoidEn}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 8. 🌱 CROP WEATHER RISK */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--space-sm)' }}>
          <Wheat size={24} strokeWidth={2.5} style={{ color: '#15803d' }} />
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--nb-black)' }}>
              {t('weather.cropWeatherRiskTitle')} 🌱
            </h2>
          </div>
        </div>

        {/* Disclaimer Note (Strict Requirement) */}
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: '#fffbeb',
            border: '1.5px solid #d97706',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8rem',
            fontWeight: '800',
            color: '#92400e',
            marginBottom: 'var(--space-md)'
          }}
        >
          {t('weather.cropRiskDisclaimer')}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '12px'
          }}
        >
          {cropRisks.map((cr, idx) => (
            <div
              key={idx}
              style={{
                padding: '14px',
                border: 'var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-sm)',
                backgroundColor: cr.riskLevel === 'high' ? 'var(--nb-red-subtle)' : cr.riskLevel === 'moderate' ? 'var(--nb-yellow-subtle)' : 'var(--nb-green-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: '900', fontSize: '1.05rem', color: 'var(--nb-black)' }}>
                    🌾 {lang === 'hi' ? cr.cropHi : cr.crop}
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: '900',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1.5px solid #000',
                      ...getStatusBadgeStyle(cr.riskLevel)
                    }}
                  >
                    {cr.riskLevel === 'high'
                      ? (lang === 'hi' ? 'उच्च संवेदनशीलता' : 'High Sensitivity')
                      : cr.riskLevel === 'moderate'
                        ? (lang === 'hi' ? 'मध्यम जोखिम' : 'Moderate Sensitivity')
                        : (lang === 'hi' ? 'अनुकूल' : 'Low Risk')}
                  </span>
                </div>

                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#1f2937', marginBottom: '6px' }}>
                  <strong>{lang === 'hi' ? 'कारक:' : 'Factor:'}</strong> {lang === 'hi' ? cr.factorHi : cr.factorEn}
                </div>

                <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#374151', lineHeight: 1.4 }}>
                  {lang === 'hi' ? cr.advisoryHi : cr.advisoryEn}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 9. 💧 ADVANCED FARM INSIGHTS (Real Open-Meteo Data) */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--space-md)' }}>
          <Layers size={22} strokeWidth={2.5} style={{ color: 'var(--nb-black)' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--nb-black)' }}>
            {t('weather.advancedInsightsTitle')} 🔬
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px'
          }}
        >
          {/* ET0 */}
          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--nb-canvas-alt)',
              border: 'var(--border-thin)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>
              {t('weather.et0')}
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--nb-black)', marginTop: '4px' }}>
              {weatherData?.current?.et0 ?? 3.8} <span style={{ fontSize: '0.8rem' }}>mm/day</span>
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4b5563', marginTop: '2px' }}>
              {lang === 'hi' ? 'दैनिक फसल जल मांग' : 'Daily crop water loss'}
            </div>
          </div>

          {/* Soil Moisture */}
          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--nb-canvas-alt)',
              border: 'var(--border-thin)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>
              {t('weather.soilMoisture')}
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0284c7', marginTop: '4px' }}>
              {Math.round((weatherData?.current?.soilMoisture ?? 0.22) * 100)}%
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4b5563', marginTop: '2px' }}>
              {lang === 'hi' ? 'जड़ क्षेत्र की नमी' : 'Root zone moisture'}
            </div>
          </div>

          {/* Soil Temp */}
          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--nb-canvas-alt)',
              border: 'var(--border-thin)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>
              {t('weather.soilTemp')}
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#ea580c', marginTop: '4px' }}>
              {weatherData?.current?.soilTemperature ?? 25}°C
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4b5563', marginTop: '2px' }}>
              {lang === 'hi' ? 'सतह मिट्टी का तापमान' : 'Topsoil temperature'}
            </div>
          </div>

          {/* VPD */}
          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--nb-canvas-alt)',
              border: 'var(--border-thin)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>
              {t('weather.vpd')}
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#7c3aed', marginTop: '4px' }}>
              {weatherData?.current?.vpd ?? 1.1} <span style={{ fontSize: '0.8rem' }}>kPa</span>
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4b5563', marginTop: '2px' }}>
              {lang === 'hi' ? 'पत्तियों का वाष्प दबाव' : 'Canopy transpiration pull'}
            </div>
          </div>

          {/* Dew Point */}
          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--nb-canvas-alt)',
              border: 'var(--border-thin)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>
              {t('weather.dewPoint')}
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#059669', marginTop: '4px' }}>
              {weatherData?.current?.dewPoint ?? 18}°C
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4b5563', marginTop: '2px' }}>
              {lang === 'hi' ? 'ओस संघनन बिंदु' : 'Condensation threshold'}
            </div>
          </div>

          {/* Wind Gusts */}
          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--nb-canvas-alt)',
              border: 'var(--border-thin)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#6b7280', textTransform: 'uppercase' }}>
              {t('weather.windGusts')}
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--nb-black)', marginTop: '4px' }}>
              {weatherData?.current?.windGust ?? 15} <span style={{ fontSize: '0.8rem' }}>km/h</span>
            </div>
            <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#4b5563', marginTop: '2px' }}>
              {lang === 'hi' ? `दिशा: ${weatherData?.current?.windDirection || 0}°` : `Direction: ${weatherData?.current?.windDirection || 0}°`}
            </div>
          </div>
        </div>
      </div>

      {/* 10. ⚠️ WEATHER ALERTS (Deterministic Real-time Alerts) */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--space-md)' }}>
          <ShieldAlert size={22} strokeWidth={2.5} style={{ color: '#dc2626' }} />
          <h2 style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--nb-black)' }}>
            {t('weather.weatherAlertsTitle')} ⚠️
          </h2>
        </div>

        {alertsList.length === 0 ? (
          <div
            style={{
              padding: '14px',
              backgroundColor: 'var(--nb-green-subtle)',
              border: 'var(--border-thin)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem',
              fontWeight: '800',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <CheckCircle2 size={18} strokeWidth={2.5} />
            <span>{t('weather.noAlerts')}</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alertsList.map((alert, idx) => (
              <div
                key={idx}
                style={{
                  padding: '14px',
                  backgroundColor: alert.severity === 'danger' ? 'var(--nb-red-subtle)' : alert.severity === 'warning' ? 'var(--nb-yellow-subtle)' : 'var(--nb-green-subtle)',
                  border: 'var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ fontWeight: '900', fontSize: '0.98rem', color: 'var(--nb-black)' }}>
                    {lang === 'hi' ? alert.titleHi : alert.titleEn}
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: '900',
                      padding: '2px 6px',
                      backgroundColor: 'var(--nb-white)',
                      border: '1.5px solid #000',
                      borderRadius: 'var(--radius-sm)'
                    }}
                  >
                    {alert.metrics}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1f2937', lineHeight: 1.4 }}>
                  {lang === 'hi' ? alert.messageHi : alert.messageEn}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 11. 🧠 WHY THIS RECOMMENDATION? (Transparent Data Rationale) */}
      <div
        className="card"
        style={{
          border: 'var(--border-thick)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)',
          backgroundColor: 'var(--nb-white)',
          padding: 'var(--space-lg)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--space-md)' }}>
          <HelpCircle size={22} strokeWidth={2.5} style={{ color: 'var(--nb-black)' }} />
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--nb-black)' }}>
              {t('weather.whyTitle')} 🧠
            </h2>
            <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#6b7280' }}>
              {t('weather.whySubtitle')}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {whyList.map((item, idx) => (
            <div
              key={idx}
              style={{
                padding: '14px',
                backgroundColor: 'var(--nb-canvas-alt)',
                border: 'var(--border-thin)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontWeight: '900', fontSize: '1rem', color: 'var(--nb-black)' }}>
                  📌 {lang === 'hi' ? item.topicHi : item.topicEn}
                </span>
                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: '800',
                    backgroundColor: 'var(--nb-white)',
                    padding: '2px 8px',
                    border: '1.5px solid #000',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  {lang === 'hi' ? item.recommendationHi : item.recommendationEn}
                </span>
              </div>

              {/* Factors Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '8px',
                  marginBottom: '10px'
                }}
              >
                {item.factors.map((f, fIdx) => (
                  <div
                    key={fIdx}
                    style={{
                      padding: '6px 8px',
                      backgroundColor: 'var(--nb-white)',
                      border: '1px solid #000',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: '800'
                    }}
                  >
                    <div style={{ color: '#6b7280' }}>{lang === 'hi' ? f.nameHi : f.nameEn}</div>
                    <div style={{ fontSize: '0.9rem', color: f.impact === 'warning' ? '#dc2626' : '#166534', marginTop: '2px' }}>
                      {f.value}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: '800',
                  color: '#1f2937',
                  borderTop: '1px dashed #d1d5db',
                  paddingTop: '6px'
                }}
              >
                <strong>{lang === 'hi' ? 'निष्कर्ष:' : 'Therefore:'}</strong> {lang === 'hi' ? item.conclusionHi : item.conclusionEn}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Weather;
