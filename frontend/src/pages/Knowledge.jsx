import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { knowledgeService } from '../services/knowledgeService';
import { kccService } from '../services/kccService';
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
  Clock,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Bot,
  ShieldCheck,
  PhoneCall,
  Wheat,
  Layers,
  HelpCircle,
  AlertTriangle,
  Award
} from 'lucide-react';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import TTSButton from '../components/TTSButton';

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
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const lang = i18n.language?.startsWith('hi') ? 'hi' : 'en';

  // Tab State: 'kcc' (Kisan Call Centre Advisory) or 'guides' (Curated Agronomic Articles)
  const initialKccParam = searchParams.get('kccQuery');
  const initialArticleParam = searchParams.get('id');
  const [activeTab, setActiveTab] = useState(initialArticleParam ? 'guides' : 'kcc');

  // Curated Knowledge Guides State
  const [articles, setArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

  // KCC Search State
  const [kccQuery, setKccQuery] = useState(initialKccParam || '');
  const [kccCrop, setKccCrop] = useState('All');
  const [kccCategory, setKccCategory] = useState('All');
  const [kccResults, setKccResults] = useState([]);
  const [kccAiSummary, setKccAiSummary] = useState(null);
  const [kccTotalMatches, setKccTotalMatches] = useState(0);
  const [kccLoading, setKccLoading] = useState(false);
  const [kccSearched, setKccSearched] = useState(false);
  const [kccPopular, setKccPopular] = useState([]);
  const [kccMetadata, setKccMetadata] = useState({ crops: [], categories: [], totalRecords: 0 });

  // Voice Input State (Web Speech API)
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const recognitionRef = useRef(null);

  // Quick farmer problem chips
  const quickProblems = lang === 'hi'
    ? [
        { label: '🍅 टमाटर के पत्ते पीले पड़ रहे हैं', query: 'टमाटर के पत्ते पीले पड़ रहे हैं' },
        { label: '🌾 सरसों में माहू (चेपा) की दवा', query: 'सरसों में माहू चेपा नियंत्रण' },
        { label: '🥔 आलू में पछेती झुलसा का उपचार', query: 'आलू में पछेती झुलसा' },
        { label: '🍆 बैंगन में तना व फल छेदक', query: 'बैंगन में तना व फल छेदक' },
        { label: '🌾 धान में ब्लास्ट रोग व कीट', query: 'धान में ब्लास्ट रोग नियंत्रण' },
        { label: '🐄 दुधारू गाय में दूध वृद्धि व बीमारी', query: 'गाय में दूध उत्पादन व थनैला' }
      ]
    : [
        { label: '🍅 Tomato leaves turning yellow', query: 'My tomato leaves are turning yellow' },
        { label: '🌾 Mustard aphid infestation spray', query: 'Control aphid in mustard crops' },
        { label: '🥔 Potato late blight disease', query: 'Potato late blight control measure' },
        { label: '🍆 Brinjal shoot & fruit borer', query: 'Shoot borer in brinjal' },
        { label: '🌾 Rice blast disease & hispa', query: 'Rice blast disease control measure' },
        { label: '🐄 Cattle milk yield & mastitis', query: 'Cow milk yield improvement and mastitis' }
      ];

  // Load KCC Metadata and Popular Samples on mount
  useEffect(() => {
    kccService.getMetadata()
      .then((data) => setKccMetadata(data))
      .catch((e) => console.warn('KCC meta warning:', e.message));

    kccService.getPopular()
      .then((data) => setKccPopular(data.advisories || []))
      .catch((e) => console.warn('KCC popular warning:', e.message));
  }, []);

  // Pre-fill user crop if available
  useEffect(() => {
    if (user?.mainCrops && user.mainCrops.length > 0 && kccCrop === 'All') {
      // Find matching crop in metadata
      const userCrop = user.mainCrops[0];
      setKccCrop(userCrop);
    }
  }, [user]);

  // Execute initial KCC search if query param provided
  useEffect(() => {
    if (initialKccParam) {
      handleSearchKCC(initialKccParam);
    }
  }, [initialKccParam]);

  // Fetch Curated Knowledge Articles
  useEffect(() => {
    const fetchArticles = async () => {
      setLoadingArticles(true);
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
        setLoadingArticles(false);
      }
    };

    fetchArticles();
  }, [search, selectedCategory, searchParams]);

  // Search KCC Dataset
  const handleSearchKCC = async (queryOverride = null) => {
    const q = (queryOverride !== null ? queryOverride : kccQuery).trim();
    if (!q && kccCrop === 'All' && kccCategory === 'All') return;

    setKccLoading(true);
    setKccSearched(true);
    try {
      const data = await kccService.search({
        query: q,
        crop: kccCrop !== 'All' ? kccCrop : '',
        category: kccCategory !== 'All' ? kccCategory : '',
        limit: 6,
        aiExplain: true,
        lang
      });

      setKccResults(data.results || []);
      setKccAiSummary(data.aiSummary || null);
      setKccTotalMatches(data.totalMatches || 0);
    } catch (err) {
      console.error('KCC search error:', err);
      setKccResults([]);
      setKccAiSummary(null);
      setKccTotalMatches(0);
    } finally {
      setKccLoading(false);
    }
  };

  // Browser Web Speech API for voice search
  const startVoice = () => {
    setVoiceError('');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError(t('knowledge.kccVoiceNotSupported') || 'Voice recognition not supported in this browser.');
      return;
    }

    try {
      if (recognitionRef.current) recognitionRef.current.abort();

      const recognition = new SpeechRecognition();
      recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setKccQuery(transcript);
        setIsListening(false);
        handleSearchKCC(transcript);
      };
      recognition.onerror = (e) => {
        console.warn('Speech error:', e.error);
        setIsListening(false);
        if (e.error !== 'no-speech') {
          setVoiceError(lang === 'hi' ? 'आवाज़ पहचानी नहीं जा सकी। कृपया पुनः बोलें।' : 'Could not hear clearly. Try speaking again.');
        }
      };
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error('Speech recognition start failed:', e);
      setIsListening(false);
    }
  };

  const stopVoice = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
  };

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
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: 'var(--space-2xl)' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-md)' }}>
        <div>
          <h1 className="page-title">{t('knowledge.title')}</h1>
          <p className="page-subtitle">{t('knowledge.subtitle')}</p>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          marginBottom: 'var(--space-lg)',
          borderBottom: 'var(--border-thick)',
          paddingBottom: '12px',
          flexWrap: 'wrap'
        }}
      >
        <button
          onClick={() => setActiveTab('kcc')}
          style={{
            padding: '10px 20px',
            borderRadius: 'var(--radius-sm)',
            border: 'var(--border-medium)',
            fontWeight: '900',
            fontSize: '0.98rem',
            cursor: 'pointer',
            backgroundColor: activeTab === 'kcc' ? 'var(--nb-yellow)' : 'var(--nb-white)',
            color: 'var(--nb-black)',
            boxShadow: activeTab === 'kcc' ? 'var(--shadow-md)' : 'var(--shadow-sm)',
            transform: activeTab === 'kcc' ? 'translate(-2px, -2px)' : 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.1s ease'
          }}
        >
          <span>{t('knowledge.kccTab')}</span>
          {kccMetadata.totalRecords > 0 && (
            <span
              style={{
                backgroundColor: 'var(--nb-green-light)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
                border: '1.5px solid #000',
                fontSize: '0.75rem'
              }}
            >
              1.7L+
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('guides')}
          style={{
            padding: '10px 20px',
            borderRadius: 'var(--radius-sm)',
            border: 'var(--border-medium)',
            fontWeight: '900',
            fontSize: '0.98rem',
            cursor: 'pointer',
            backgroundColor: activeTab === 'guides' ? 'var(--nb-yellow)' : 'var(--nb-white)',
            color: 'var(--nb-black)',
            boxShadow: activeTab === 'guides' ? 'var(--shadow-md)' : 'var(--shadow-sm)',
            transform: activeTab === 'guides' ? 'translate(-2px, -2px)' : 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.1s ease'
          }}
        >
          <span>{t('knowledge.guidesTab')}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: KISAN CALL CENTRE (KCC) EXPERT ADVISORY PROBLEM SOLVER */}
      {/* ========================================================================= */}
      {activeTab === 'kcc' && (
        <div>
          {/* KCC Search Card */}
          <div
            className="card"
            style={{
              marginBottom: 'var(--space-xl)',
              backgroundColor: 'var(--nb-yellow-light)',
              border: 'var(--border-thick)',
              boxShadow: 'var(--shadow-lg)',
              padding: 'var(--space-lg)'
            }}
          >
            {/* Govt badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px',
                backgroundColor: 'var(--nb-white)',
                border: '1.5px solid #000',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.78rem',
                fontWeight: '900',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '10px'
              }}
            >
              <ShieldCheck size={15} strokeWidth={2.5} style={{ color: '#16a34a' }} />
              <span>{t('knowledge.kccBadge')}</span>
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--nb-black)', lineHeight: 1.2 }}>
              {t('knowledge.kccHeading')} 🌾
            </h2>
            <p style={{ fontSize: '0.92rem', fontWeight: '700', color: '#374151', marginTop: '4px', marginBottom: 'var(--space-md)' }}>
              {t('knowledge.kccSubheading')}
            </p>

            {/* Query Input + Voice + Filters + Search Button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 340px', position: 'relative' }}>
                  <Search
                    size={20}
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
                    value={kccQuery}
                    onChange={(e) => setKccQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchKCC()}
                    placeholder={t('knowledge.kccPlaceholder')}
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 44px',
                      fontSize: '0.98rem',
                      fontWeight: '700',
                      border: 'var(--border-medium)',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: 'var(--shadow-sm)',
                      backgroundColor: 'var(--nb-white)',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Voice Input Button */}
                <button
                  type="button"
                  onClick={isListening ? stopVoice : startVoice}
                  className={`btn ${isListening ? 'btn-danger' : 'btn-secondary'}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '12px 16px',
                    fontSize: '0.92rem',
                    backgroundColor: isListening ? '#ef4444' : undefined,
                    color: isListening ? '#ffffff' : undefined,
                    animation: isListening ? 'pulse 1.2s infinite' : 'none'
                  }}
                  title={t('knowledge.kccVoiceBtn')}
                >
                  {isListening ? <MicOff size={18} strokeWidth={2.5} /> : <Mic size={18} strokeWidth={2.5} />}
                  <span>{isListening ? t('knowledge.kccListening') : t('knowledge.kccVoiceBtn')}</span>
                </button>

                {/* Search Button */}
                <button
                  type="button"
                  onClick={() => handleSearchKCC()}
                  disabled={kccLoading}
                  className="btn btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '12px 22px',
                    fontSize: '0.95rem'
                  }}
                >
                  <Send size={16} strokeWidth={2.5} />
                  <span>{kccLoading ? (lang === 'hi' ? 'खोज जारी है...' : 'Searching...') : t('knowledge.kccSearchBtn')}</span>
                </button>
              </div>

              {/* Filters row: Crop & Category */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Crop Filter */}
                <div style={{ minWidth: '180px', flex: '1 1 180px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '900', textTransform: 'uppercase', color: '#1f2937', marginBottom: '3px', display: 'block' }}>
                    🌾 {t('knowledge.kccCropFilter')}
                  </label>
                  <select
                    value={kccCrop}
                    onChange={(e) => {
                      setKccCrop(e.target.value);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: 'var(--border-medium)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--nb-white)',
                      fontWeight: '800',
                      fontSize: '0.88rem'
                    }}
                  >
                    <option value="All">{lang === 'hi' ? 'सभी फसलें (All Crops)' : 'All Crops'}</option>
                    {(kccMetadata.crops || []).map((c) => (
                      <option key={c.name} value={c.name}>
                        {lang === 'hi' ? `${c.hi} (${c.name})` : c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                <div style={{ minWidth: '220px', flex: '1 1 220px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '900', textTransform: 'uppercase', color: '#1f2937', marginBottom: '3px', display: 'block' }}>
                    🏷️ {t('knowledge.kccCategoryFilter')}
                  </label>
                  <select
                    value={kccCategory}
                    onChange={(e) => {
                      setKccCategory(e.target.value);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      border: 'var(--border-medium)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--nb-white)',
                      fontWeight: '800',
                      fontSize: '0.88rem'
                    }}
                  >
                    <option value="All">{lang === 'hi' ? 'सभी श्रेणियां (All Topics)' : 'All Topics'}</option>
                    {(kccMetadata.categories || []).map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {lang === 'hi' ? cat.hi : cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Voice error note if any */}
            {voiceError && (
              <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#dc2626', marginTop: '8px' }}>
                ⚠️ {voiceError}
              </div>
            )}

            {/* Quick Inquiry Chips */}
            <div style={{ marginTop: 'var(--space-md)', paddingTop: '10px', borderTop: '1.5px dashed var(--nb-black)' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: '900', textTransform: 'uppercase', color: '#4b5563', marginBottom: '8px' }}>
                {t('knowledge.kccQuickQueries')}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {quickProblems.map((prob, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setKccQuery(prob.query);
                      handleSearchKCC(prob.query);
                    }}
                    style={{
                      backgroundColor: 'var(--nb-white)',
                      border: '1.5px solid var(--nb-black)',
                      borderRadius: 'var(--radius-pill)',
                      padding: '5px 12px',
                      fontSize: '0.82rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      boxShadow: '1px 1px 0px var(--nb-black)',
                      transition: 'all 0.1s ease'
                    }}
                  >
                    {prob.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search Loading Indicator */}
          {kccLoading && (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <Loader message={lang === 'hi' ? '1.7 लाख+ KCC परामर्शों में समाधान खोजा जा रहा है...' : 'Searching 1.7 Lakh+ Kisan Call Centre advisories...'} size={32} />
            </div>
          )}

          {/* AI Agronomist Synthesis Banner */}
          {kccAiSummary && !kccLoading && (
            <div
              className="card"
              style={{
                marginBottom: 'var(--space-xl)',
                backgroundColor: kccAiSummary.isAvailableInKcc ? 'var(--nb-green-subtle)' : '#fffbeb',
                border: 'var(--border-thick)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                padding: 'var(--space-lg)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={22} strokeWidth={2.5} style={{ color: kccAiSummary.isAvailableInKcc ? '#15803d' : '#d97706' }} />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--nb-black)' }}>
                    {t('knowledge.kccAiSummaryTitle')}
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Language Style Pill */}
                  {kccAiSummary.languageStyle && (
                    <span
                      style={{
                        backgroundColor: 'var(--nb-white)',
                        border: '1.5px solid #000',
                        borderRadius: 'var(--radius-sm)',
                        padding: '2px 8px',
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        color: 'var(--nb-black)'
                      }}
                    >
                      💬 {kccAiSummary.languageStyle === 'hinglish' ? 'Hinglish' : kccAiSummary.languageStyle === 'hindi' ? 'हिंदी (Hindi)' : 'English'}
                    </span>
                  )}

                  {/* Match Accuracy Pill */}
                  <span
                    style={{
                      backgroundColor: kccAiSummary.isAvailableInKcc ? '#ecfdf5' : '#fef2f2',
                      border: '1.5px solid #000',
                      borderRadius: 'var(--radius-sm)',
                      padding: '2px 8px',
                      fontSize: '0.75rem',
                      fontWeight: '900',
                      color: kccAiSummary.isAvailableInKcc ? '#166534' : '#991b1b'
                    }}
                  >
                    {kccAiSummary.matchNote || (kccAiSummary.isAvailableInKcc ? `🎯 KCC Match: ${kccAiSummary.matchAccuracy}%` : `⚠️ KCC Match: ${kccAiSummary.matchAccuracy}%`)}
                  </span>

                  <span
                    style={{
                      backgroundColor: 'var(--nb-white)',
                      border: '1.5px solid #000',
                      borderRadius: 'var(--radius-sm)',
                      padding: '2px 8px',
                      fontSize: '0.75rem',
                      fontWeight: '800',
                      color: '#166534'
                    }}
                  >
                    {kccAiSummary.sourceNote}
                  </span>

                  <TTSButton
                    text={[
                      kccAiSummary.explanation,
                      kccAiSummary.actionSteps && kccAiSummary.actionSteps.length > 0
                        ? `${lang === 'hi' ? 'सलाह के मुख्य कदम' : 'Key Action Steps'}: ${kccAiSummary.actionSteps.join('. ')}`
                        : ''
                    ]}
                    variant="pill"
                    size="sm"
                    label={lang === 'hi' ? 'सलाह सुनें' : 'Listen Advice'}
                  />
                </div>
              </div>

              <p style={{ fontSize: '1.02rem', fontWeight: '800', color: 'var(--nb-black)', lineHeight: 1.5, marginBottom: '12px' }}>
                {kccAiSummary.explanation}
              </p>

              {kccAiSummary.actionSteps && kccAiSummary.actionSteps.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: '900', textTransform: 'uppercase', color: kccAiSummary.isAvailableInKcc ? '#166534' : '#92400e', marginBottom: '6px' }}>
                    📋 {t('knowledge.kccAiActionPlan')}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {kccAiSummary.actionSteps.map((step, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: 'var(--nb-white)',
                          border: '1.5px solid #000',
                          borderRadius: 'var(--radius-sm)',
                          padding: '8px 12px',
                          fontSize: '0.9rem',
                          fontWeight: '800',
                          color: 'var(--nb-black)',
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: '8px'
                        }}
                      >
                        <span style={{ color: kccAiSummary.isAvailableInKcc ? '#15803d' : '#d97706' }}>✔</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* If match is low / not in KCC, prominent Helpline prompt */}
              {!kccAiSummary.isAvailableInKcc && (
                <div
                  style={{
                    marginTop: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 14px',
                    backgroundColor: 'var(--nb-white)',
                    border: '2px solid #000',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-sm)',
                    width: 'fit-content'
                  }}
                >
                  <PhoneCall size={18} strokeWidth={2.5} style={{ color: '#16a34a' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: '900', color: '#166534' }}>
                    {t('knowledge.kccHelplineCall')}: 1800-180-1551
                  </span>
                </div>
              )}

              {/* Disclaimer */}
              <div style={{ marginTop: '12px', fontSize: '0.75rem', fontWeight: '700', color: '#4b5563', borderTop: '1px dashed rgba(0,0,0,0.2)', paddingTop: '6px' }}>
                ⚠️ {kccAiSummary.disclaimer || t('knowledge.kccDisclaimer')}
              </div>
            </div>
          )}

          {/* Search Results List */}
          {kccSearched && !kccLoading && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--nb-black)' }}>
                  {t('knowledge.kccResultsTitle')} ({kccTotalMatches})
                </h3>
              </div>

              {kccResults.length === 0 ? (
                <div
                  className="card"
                  style={{
                    border: 'var(--border-thick)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#fffbeb',
                    padding: 'var(--space-xl)',
                    textAlign: 'center'
                  }}
                >
                  <AlertTriangle size={36} strokeWidth={2.5} style={{ color: '#d97706', margin: '0 auto 12px' }} />
                  <h4 style={{ fontSize: '1.15rem', fontWeight: '900', color: '#92400e', marginBottom: '6px' }}>
                    {t('knowledge.kccNoResultsTitle')}
                  </h4>
                  <p style={{ fontSize: '0.9rem', fontWeight: '700', color: '#78350f', maxWidth: '580px', margin: '0 auto 16px' }}>
                    {t('knowledge.kccNoResultsDesc')}
                  </p>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: 'var(--nb-white)',
                      border: '2px solid #000',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 18px',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <PhoneCall size={18} strokeWidth={2.5} style={{ color: '#16a34a' }} />
                    <span style={{ fontWeight: '900', fontSize: '0.95rem' }}>
                      {t('knowledge.kccHelplineCall')}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {kccResults.map((r, idx) => (
                    <div
                      key={r.id || idx}
                      className="card"
                      style={{
                        border: 'var(--border-thick)',
                        borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-md)',
                        backgroundColor: 'var(--nb-white)',
                        padding: 'var(--space-md)',
                        transition: 'transform 0.1s ease'
                      }}
                    >
                      {/* Card Header: Crop, Category, Relevance */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              backgroundColor: 'var(--nb-yellow-light)',
                              border: '1.5px solid #000',
                              borderRadius: 'var(--radius-sm)',
                              padding: '2px 8px',
                              fontSize: '0.78rem',
                              fontWeight: '900'
                            }}
                          >
                            🌾 {r.crop}
                          </span>
                          <span
                            style={{
                              backgroundColor: 'var(--nb-canvas-alt)',
                              border: '1.5px solid #000',
                              borderRadius: 'var(--radius-sm)',
                              padding: '2px 8px',
                              fontSize: '0.78rem',
                              fontWeight: '800'
                            }}
                          >
                            🏷️ {r.category}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              backgroundColor: '#ecfdf5',
                              color: '#166534',
                              border: '1.5px solid #000',
                              borderRadius: 'var(--radius-sm)',
                              padding: '2px 8px',
                              fontSize: '0.75rem',
                              fontWeight: '900'
                            }}
                          >
                            ⭐ {Math.round(r.relevanceScore * 100)}% {t('knowledge.kccMatchScore')}
                          </span>

                          <TTSButton
                            text={[
                              `${lang === 'hi' ? 'किसान का प्रश्न' : 'Question'}: ${r.question}`,
                              `${lang === 'hi' ? 'केसीसी कृषि परामर्श' : 'KCC Advisory'}: ${r.answer}`
                            ]}
                            variant="icon-only"
                            size="sm"
                            title={lang === 'hi' ? 'उत्तर सुनें' : 'Listen to Answer'}
                          />
                        </div>
                      </div>

                      {/* Question */}
                      <div style={{ marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase', color: '#4b5563' }}>
                          {t('knowledge.kccQuestionLabel')}
                        </span>
                        <div style={{ fontSize: '0.96rem', fontWeight: '800', color: 'var(--nb-black)', marginTop: '2px' }}>
                          "{r.question}"
                        </div>
                      </div>

                      {/* Answer / Advisory */}
                      <div
                        style={{
                          backgroundColor: '#f8fafc',
                          borderLeft: '4px solid #16a34a',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1.5px solid #e2e8f0',
                          borderLeftWidth: '4px'
                        }}
                      >
                        <span style={{ fontSize: '0.78rem', fontWeight: '900', textTransform: 'uppercase', color: '#166534', display: 'block', marginBottom: '2px' }}>
                          💡 {t('knowledge.kccAdvisoryLabel')}
                        </span>
                        <div style={{ fontSize: '0.94rem', fontWeight: '700', color: '#1e293b', lineHeight: 1.45 }}>
                          {r.answer}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Popular Curated Samples (shown before user performs search) */}
          {!kccSearched && !kccLoading && kccPopular.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
                <Award size={20} strokeWidth={2.5} style={{ color: '#d97706' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--nb-black)' }}>
                  {lang === 'hi' ? 'लोकप्रिय किसान कॉल सेंटर समाधान (नमूने)' : 'Popular Verified KCC Advisories'}
                </h3>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: 'var(--space-md)'
                }}
              >
                {kccPopular.slice(0, 6).map((item, idx) => (
                  <div
                    key={idx}
                    className="card"
                    style={{
                      border: 'var(--border-medium)',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: 'var(--shadow-sm)',
                      backgroundColor: 'var(--nb-white)',
                      padding: 'var(--space-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span
                          style={{
                            backgroundColor: 'var(--nb-yellow-light)',
                            border: '1px solid #000',
                            borderRadius: 'var(--radius-sm)',
                            padding: '1px 6px',
                            fontSize: '0.75rem',
                            fontWeight: '800'
                          }}
                        >
                          🌾 {item.crop}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#6b7280' }}>
                            {item.category}
                          </span>
                          <TTSButton
                            text={[
                              `${lang === 'hi' ? 'किसान का प्रश्न' : 'Question'}: ${item.question}`,
                              `${lang === 'hi' ? 'केसीसी कृषि परामर्श' : 'KCC Advisory'}: ${item.answer}`
                            ]}
                            variant="icon-only"
                            size="sm"
                            title={lang === 'hi' ? 'उत्तर सुनें' : 'Listen to Answer'}
                          />
                        </div>
                      </div>

                      <div style={{ fontWeight: '800', fontSize: '0.92rem', color: 'var(--nb-black)', marginBottom: '8px' }}>
                        "{item.question}"
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '8px 10px',
                        backgroundColor: '#f1f5f9',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        color: '#0f172a'
                      }}
                    >
                      <strong style={{ color: '#166534' }}>💡 KCC:</strong> {item.answer}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CURATED CROP GUIDES & AGRONOMIC ARTICLES */}
      {/* ========================================================================= */}
      {activeTab === 'guides' && (
        <div>
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
          {loadingArticles ? (
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
                        padding: 'var(--space-md) var(--space-lg)',
                        backgroundColor: isExpanded ? 'var(--nb-yellow)' : 'var(--nb-white)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 'var(--space-md)',
                        borderBottom: isExpanded ? 'var(--border-thick)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--nb-canvas-alt)',
                            border: '1.5px solid var(--nb-black)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          {getCategoryIcon(article.category)}
                        </div>
                        <div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: '800',
                                padding: '2px 8px',
                                backgroundColor: 'var(--nb-white)',
                                border: '1.5px solid var(--nb-black)',
                                borderRadius: 'var(--radius-sm)'
                              }}
                            >
                              {CATEGORY_NAMES[article.category]?.[lang] || article.category}
                            </span>
                            {article.season && (
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  fontWeight: '800',
                                  padding: '2px 8px',
                                  backgroundColor: 'var(--nb-green-light)',
                                  border: '1.5px solid var(--nb-black)',
                                  borderRadius: 'var(--radius-sm)'
                                }}
                              >
                                {article.season}
                              </span>
                            )}
                          </div>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: '900', margin: 0, color: 'var(--nb-black)' }}>
                            {article.title[lang] || article.title.en}
                          </h3>
                        </div>
                      </div>

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
                        {isExpanded ? <ChevronUp size={18} strokeWidth={2.5} /> : <ChevronDown size={18} strokeWidth={2.5} />}
                      </div>
                    </div>

                    {/* Accordion Content */}
                    {isExpanded && (
                      <div style={{ padding: 'var(--space-lg)', backgroundColor: 'var(--nb-white)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: '8px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '900', textTransform: 'uppercase', color: 'var(--nb-black)' }}>
                            📖 {lang === 'hi' ? 'फसल विवरण एवं निर्देश' : 'Crop Overview & Guide'}
                          </span>
                          <TTSButton
                            text={[
                              article.title[lang] || article.title.en,
                              article.summary[lang] || article.summary.en,
                              (article.sowingTime?.[lang] || article.sowingTime?.en || article.idealTiming?.[lang] || article.idealTiming?.en)
                                ? `${lang === 'hi' ? 'बुवाई का समय' : 'Sowing Time'}: ${article.sowingTime?.[lang] || article.sowingTime?.en || article.idealTiming?.[lang] || article.idealTiming?.en}`
                                : '',
                              (article.fertilizer?.[lang] || article.fertilizer?.en || article.fertilizerDose?.[lang] || article.fertilizerDose?.en)
                                ? `${lang === 'hi' ? 'उर्वरक' : 'Fertilizer'}: ${article.fertilizer?.[lang] || article.fertilizer?.en || article.fertilizerDose?.[lang] || article.fertilizerDose?.en}`
                                : '',
                              (article.irrigation?.[lang] || article.irrigation?.en)
                                ? `${lang === 'hi' ? 'सिंचाई' : 'Irrigation'}: ${article.irrigation?.[lang] || article.irrigation?.en}`
                                : ''
                            ]}
                            variant="pill"
                            size="sm"
                            label={lang === 'hi' ? 'गाइड सुनें' : 'Listen Guide'}
                          />
                        </div>

                        <p style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)', lineHeight: 1.6 }}>
                          {article.summary[lang] || article.summary.en}
                        </p>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: 'var(--space-md)',
                            marginBottom: 'var(--space-lg)'
                          }}
                        >
                          {/* Sowing / Ideal Timing */}
                          {(article.sowingTime || article.idealTiming) && (
                            <div
                              style={{
                                padding: 'var(--space-md)',
                                backgroundColor: 'var(--nb-canvas-alt)',
                                border: 'var(--border-thin)',
                                borderRadius: 'var(--radius-sm)'
                              }}
                            >
                              <div style={{ fontWeight: '900', fontSize: '0.82rem', textTransform: 'uppercase', marginBottom: '4px', color: 'var(--nb-black)' }}>
                                📅 {t('knowledge.sowingTime')}
                              </div>
                              <div style={{ fontSize: '0.92rem', fontWeight: '700' }}>
                                {article.sowingTime?.[lang] || article.sowingTime?.en || article.idealTiming?.[lang] || article.idealTiming?.en}
                              </div>
                            </div>
                          )}

                          {/* Seed Rate & Treatment */}
                          {article.seedRateAndTreatment && (
                            <div
                              style={{
                                padding: 'var(--space-md)',
                                backgroundColor: 'var(--nb-canvas-alt)',
                                border: 'var(--border-thin)',
                                borderRadius: 'var(--radius-sm)'
                              }}
                            >
                              <div style={{ fontWeight: '900', fontSize: '0.82rem', textTransform: 'uppercase', marginBottom: '4px', color: 'var(--nb-black)' }}>
                                🌾 {lang === 'hi' ? 'बीज दर एवं उपचार' : 'Seed Rate & Treatment'}
                              </div>
                              <div style={{ fontSize: '0.92rem', fontWeight: '700' }}>
                                {article.seedRateAndTreatment[lang] || article.seedRateAndTreatment.en}
                              </div>
                            </div>
                          )}

                          {/* Fertilizer Recommendations */}
                          {(article.fertilizer || article.fertilizerDose) && (
                            <div
                              style={{
                                padding: 'var(--space-md)',
                                backgroundColor: 'var(--nb-canvas-alt)',
                                border: 'var(--border-thin)',
                                borderRadius: 'var(--radius-sm)'
                              }}
                            >
                              <div style={{ fontWeight: '900', fontSize: '0.82rem', textTransform: 'uppercase', marginBottom: '4px', color: 'var(--nb-black)' }}>
                                🧪 {t('knowledge.fertilizer')}
                              </div>
                              <div style={{ fontSize: '0.92rem', fontWeight: '700' }}>
                                {article.fertilizer?.[lang] || article.fertilizer?.en || article.fertilizerDose?.[lang] || article.fertilizerDose?.en}
                              </div>
                            </div>
                          )}

                          {/* Irrigation Stages */}
                          {(article.irrigation || article.criticalIrrigationStages) && (
                            <div
                              style={{
                                padding: 'var(--space-md)',
                                backgroundColor: 'var(--nb-canvas-alt)',
                                border: 'var(--border-thin)',
                                borderRadius: 'var(--radius-sm)'
                              }}
                            >
                              <div style={{ fontWeight: '900', fontSize: '0.82rem', textTransform: 'uppercase', marginBottom: '4px', color: 'var(--nb-black)' }}>
                                💧 {t('knowledge.irrigation')}
                              </div>
                              {Array.isArray(article.criticalIrrigationStages) ? (
                                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.88rem', fontWeight: '700' }}>
                                  {article.criticalIrrigationStages.slice(0, 3).map((stg, sIdx) => (
                                    <li key={sIdx} style={{ marginBottom: '2px' }}>
                                      <strong>{stg.stage}</strong> ({stg.daysAfterSowing}): {stg.importance}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <div style={{ fontSize: '0.92rem', fontWeight: '700' }}>
                                  {article.irrigation?.[lang] || article.irrigation?.en}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Best Practices Do's & Don'ts */}
                        {(() => {
                          const dosList = article.dos || article.dosAndDonts?.dos || [];
                          const dontsList = article.donts || article.dosAndDonts?.donts || [];
                          if (dosList.length === 0 && dontsList.length === 0) return null;

                          return (
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                gap: 'var(--space-md)'
                              }}
                            >
                              {/* Do's */}
                              {dosList.length > 0 && (
                                <div
                                  style={{
                                    padding: 'var(--space-md)',
                                    backgroundColor: '#f0fdf4',
                                    border: 'var(--border-thin)',
                                    borderRadius: 'var(--radius-sm)',
                                    borderTop: '4px solid #16a34a'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '900', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '8px', color: '#166534' }}>
                                    <CheckCircle size={16} strokeWidth={2.5} />
                                    <span>{t('knowledge.dos')}</span>
                                  </div>
                                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.88rem', fontWeight: '600', color: '#1f2937' }}>
                                    {dosList.map((item, i) => (
                                      <li key={i} style={{ marginBottom: '4px' }}>
                                        {typeof item === 'string' ? item : (item[lang] || item.en)}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Don'ts */}
                              {dontsList.length > 0 && (
                                <div
                                  style={{
                                    padding: 'var(--space-md)',
                                    backgroundColor: '#fef2f2',
                                    border: 'var(--border-thin)',
                                    borderRadius: 'var(--radius-sm)',
                                    borderTop: '4px solid #dc2626'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '900', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '8px', color: '#991b1b' }}>
                                    <XCircle size={16} strokeWidth={2.5} />
                                    <span>{t('knowledge.donts')}</span>
                                  </div>
                                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.88rem', fontWeight: '600', color: '#1f2937' }}>
                                    {dontsList.map((item, i) => (
                                      <li key={i} style={{ marginBottom: '4px' }}>
                                        {typeof item === 'string' ? item : (item[lang] || item.en)}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Knowledge;
