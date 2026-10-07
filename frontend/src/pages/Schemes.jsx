import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { schemeService } from '../services/schemeService';
import {
  Landmark,
  Search,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Sparkles,
  Bot,
  Mic,
  MicOff,
  Send,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import TTSButton from '../components/TTSButton';

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

  // Groq AI Scheme Advisor State
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState(null);
  const recognitionRef = useRef(null);

  // Reset AI state when selected scheme changes
  useEffect(() => {
    setAiQuestion('');
    setAiResponse(null);
    setVoiceError(null);
    if (isListening && recognitionRef.current) {
      recognitionRef.current.abort();
      setIsListening(false);
    }
  }, [selectedScheme]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startVoice = () => {
    setVoiceError(null);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError(lang === 'hi' ? 'आपका ब्राउज़र वॉइस इनपुट का समर्थन नहीं करता।' : 'Voice input not supported in this browser.');
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setAiQuestion(transcript);
          handleAskAI(transcript);
        }
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition error:', e.error);
        setIsListening(false);
        if (e.error === 'not-allowed') {
          setVoiceError(lang === 'hi' ? 'माइक्रोफ़ोन अनुमति अस्वीकृत है।' : 'Microphone permission denied.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Voice start error:', err);
      setIsListening(false);
    }
  };

  const stopVoice = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleAskAI = async (queryText) => {
    const q = (queryText !== undefined ? queryText : aiQuestion).trim();
    if (!q || !selectedScheme) return;

    if (isListening) {
      stopVoice();
    }

    setAiLoading(true);
    setVoiceError(null);
    try {
      const data = await schemeService.askSchemeAI({
        schemeId: selectedScheme.id,
        question: q,
        lang,
        schemeData: selectedScheme
      });
      setAiResponse(data);
    } catch (err) {
      console.error('Failed to ask scheme AI:', err);
      setVoiceError(lang === 'hi' ? 'AI से उत्तर प्राप्त करने में समस्या हुई। कृपया पुनः प्रयास करें।' : 'Failed to get AI response. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const quickQuestions = [
    { label: t('schemes.askAiQuickEligible'), query: lang === 'hi' ? 'क्या मैं इस योजना के लिए पात्र हूँ? नियम बताएं।' : 'Am I eligible for this scheme?' },
    { label: t('schemes.askAiQuickDocs'), query: lang === 'hi' ? 'इस योजना के लिए कौन से जरूरी दस्तावेज लगेंगे?' : 'What documents are required for this scheme?' },
    { label: t('schemes.askAiQuickBenefits'), query: lang === 'hi' ? 'इस योजना से किसानों को कितना लाभ या पैसा मिलता है?' : 'What are the exact benefits or subsidy amount provided?' },
    { label: t('schemes.askAiQuickApply'), query: lang === 'hi' ? 'इस योजना में आवेदन करने का पूरा तरीका क्या है?' : 'How do I apply for this scheme step by step?' }
  ];

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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--nb-black)', margin: 0, textTransform: 'uppercase' }}>
                  {t('schemes.benefits')}
                </h3>
                <TTSButton
                  text={selectedScheme.benefits?.[lang] || selectedScheme.benefits?.en}
                  lang={lang}
                  variant="pill"
                  size="sm"
                />
              </div>
              <p style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--nb-black)', lineHeight: 1.5, margin: 0 }}>
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

            {/* Groq AI Scheme Advisor Section */}
            <div
              style={{
                marginTop: 'var(--space-md)',
                backgroundColor: '#f5f3ff',
                border: 'var(--border-thick)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                padding: 'var(--space-md)',
                borderLeft: '6px solid #7c3aed'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: '#7c3aed',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1.5px solid #000'
                    }}
                  >
                    <Bot size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: 'var(--nb-black)', margin: 0 }}>
                      {t('schemes.askAiTitle')}
                    </h3>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      backgroundColor: 'var(--nb-white)',
                      border: '1.5px solid #000',
                      borderRadius: 'var(--radius-sm)',
                      padding: '2px 8px',
                      fontSize: '0.72rem',
                      fontWeight: '900',
                      color: '#6d28d9',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Sparkles size={12} strokeWidth={2.5} />
                    <span>Groq AI + Voice</span>
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-text-secondary)', marginBottom: '12px', lineHeight: 1.4 }}>
                {t('schemes.askAiSubtitle')}
              </p>

              {/* Quick Suggestion Chips */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {quickQuestions.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAiQuestion(chip.query);
                      handleAskAI(chip.query);
                    }}
                    style={{
                      backgroundColor: 'var(--nb-white)',
                      border: '1.5px solid var(--nb-black)',
                      borderRadius: 'var(--radius-pill)',
                      padding: '4px 10px',
                      fontSize: '0.78rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      boxShadow: '1px 1px 0px var(--nb-black)',
                      transition: 'all 0.1s ease'
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Voice + Input + Submit bar */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: '220px', position: 'relative' }}>
                  <input
                    type="text"
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                    placeholder={t('schemes.askAiPlaceholder')}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '0.9rem',
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
                    gap: '5px',
                    padding: '10px 14px',
                    fontSize: '0.88rem',
                    backgroundColor: isListening ? '#ef4444' : undefined,
                    color: isListening ? '#ffffff' : undefined,
                    animation: isListening ? 'pulse 1.2s infinite' : 'none'
                  }}
                  title={t('schemes.askAiVoiceBtn')}
                >
                  {isListening ? <MicOff size={16} strokeWidth={2.5} /> : <Mic size={16} strokeWidth={2.5} />}
                  <span>{isListening ? t('schemes.askAiListening') : t('schemes.askAiVoiceBtn')}</span>
                </button>

                {/* Ask Button */}
                <button
                  type="button"
                  onClick={() => handleAskAI()}
                  disabled={aiLoading || !aiQuestion.trim()}
                  className="btn btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    fontSize: '0.88rem'
                  }}
                >
                  {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} strokeWidth={2.5} />}
                  <span>{aiLoading ? (lang === 'hi' ? 'उत्तर आ रहा है...' : 'Thinking...') : t('schemes.askAiButton')}</span>
                </button>
              </div>

              {/* Voice Error Notice if any */}
              {voiceError && (
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#dc2626', marginTop: '6px' }}>
                  ⚠️ {voiceError}
                </div>
              )}

              {/* AI Answer Box */}
              {aiResponse && (
                <div
                  style={{
                    marginTop: '12px',
                    backgroundColor: 'var(--nb-white)',
                    border: 'var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-sm)',
                    padding: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: '900', color: '#6d28d9', textTransform: 'uppercase' }}>
                        💡 {lang === 'hi' ? 'योजना AI परामर्श' : 'Scheme AI Advisory'}
                      </div>
                      {aiResponse.language && (
                        <span
                          style={{
                            backgroundColor: '#f3e8ff',
                            color: '#6b21a8',
                            border: '1px solid #000',
                            borderRadius: 'var(--radius-sm)',
                            padding: '1px 6px',
                            fontSize: '0.72rem',
                            fontWeight: '800'
                          }}
                        >
                          💬 {aiResponse.language === 'hinglish' ? 'Hinglish' : aiResponse.language === 'hindi' ? 'हिंदी (Hindi)' : 'English'}
                        </span>
                      )}
                    </div>

                    <TTSButton
                      text={[aiResponse.answer, ...(aiResponse.keyPoints || [])]}
                      lang={aiResponse.language === 'hindi' ? 'hi' : 'en'}
                      variant="pill"
                      size="sm"
                    />
                  </div>

                  <p style={{ fontSize: '0.94rem', fontWeight: '800', color: 'var(--nb-black)', lineHeight: 1.5, margin: '0 0 8px 0' }}>
                    {aiResponse.answer}
                  </p>

                  {aiResponse.keyPoints && aiResponse.keyPoints.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: '900', textTransform: 'uppercase', color: '#166534', marginBottom: '4px' }}>
                        📋 {t('schemes.askAiKeyPoints')}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {aiResponse.keyPoints.map((pt, pIdx) => (
                          <div
                            key={pIdx}
                            style={{
                              backgroundColor: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderLeft: '3px solid #16a34a',
                              padding: '6px 10px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.86rem',
                              fontWeight: '700',
                              color: 'var(--nb-black)'
                            }}
                          >
                            {pt}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: '8px', fontSize: '0.72rem', fontWeight: '700', color: '#6b7280', borderTop: '1px dashed #e2e8f0', paddingTop: '4px' }}>
                    ℹ️ {aiResponse.disclaimer}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Schemes;
