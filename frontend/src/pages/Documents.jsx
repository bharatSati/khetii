import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Layers,
  Scan,
  Minimize2,
  FileText,
  ShieldCheck,
  Zap,
  PhoneCall,
  History,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
import ImageAiService from '../components/digitalServices/ImageAiService';
import ImagesToPdfService from '../components/digitalServices/ImagesToPdfService';
import DocumentScannerService from '../components/digitalServices/DocumentScannerService';
import FileCompressorService from '../components/digitalServices/FileCompressorService';
import { ocrService } from '../services/ocrService';

export const Documents = () => {
  const { t, i18n } = useTranslation();
  const isHindi = i18n.language?.startsWith('hi');
  const [searchParams, setSearchParams] = useSearchParams();

  // Active service tab: 'image-ai' | 'images-to-pdf' | 'smart-scanner' | 'file-compressor'
  const initialService = searchParams.get('service') || 'image-ai';
  const [activeService, setActiveService] = useState(initialService);

  // Scan history preserved from previous OCR interactions
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const serviceParam = searchParams.get('service');
    if (serviceParam && ['image-ai', 'images-to-pdf', 'smart-scanner', 'file-compressor'].includes(serviceParam)) {
      setActiveService(serviceParam);
    }
  }, [searchParams]);

  const handleTabChange = (serviceKey) => {
    setActiveService(serviceKey);
    setSearchParams({ service: serviceKey });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await ocrService.getHistory();
        if (Array.isArray(data)) {
          setHistory(data);
        }
      } catch (err) {
        // Silently catch non-essential history errors
      }
    };
    fetchHistory();
  }, []);

  const serviceTabs = [
    {
      id: 'image-ai',
      badge: 'HERO FEATURE',
      icon: Sparkles,
      title: isHindi ? '🧠 एआई फसल दृष्टि' : '🧠 Image → AI Info',
      subtitle: isHindi ? 'फोटो से फसल, कीट व रोग की पहचान और KCC सलाह' : 'Visual understanding of crops, pests, and verified KCC advice',
      bgColor: 'var(--nb-yellow-light)',
      borderColor: 'var(--nb-black)'
    },
    {
      id: 'images-to-pdf',
      badge: 'POPULAR',
      icon: Layers,
      title: isHindi ? '🖼️ फ़ोटो से PDF' : '🖼️ Images → PDF',
      subtitle: isHindi ? 'सरकारी पोर्टल हेतु कई फ़ोटो जोड़कर 1 A4 PDF बनाएं' : 'Merge multiple photos into a single print-ready PDF',
      bgColor: 'var(--nb-blue-light)',
      borderColor: 'var(--nb-black)'
    },
    {
      id: 'smart-scanner',
      badge: 'ENHANCER',
      icon: Scan,
      title: isHindi ? '📸 दस्तावेज़ स्कैनर' : '📸 Smart Scanner',
      subtitle: isHindi ? 'खसरा, खतौनी, रसीद साफ करें व ज़ेरॉक्स B&W बनाएं' : 'Clean & photocopy land records, KCC papers & bills',
      bgColor: 'var(--nb-purple-light)',
      borderColor: 'var(--nb-black)'
    },
    {
      id: 'file-compressor',
      badge: 'PORTAL READY',
      icon: Minimize2,
      title: isHindi ? '📦 फ़ाइल कंप्रेसर' : '📦 File Compressor',
      subtitle: isHindi ? 'पोर्टल लिमिट (50KB, 100KB, 200KB) हेतु साइज घटाएं' : 'Reduce image size to strict govt portal KB limits',
      bgColor: 'var(--nb-orange-light)',
      borderColor: 'var(--nb-black)'
    }
  ];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="badge badge-green" style={{ fontSize: '0.85rem' }}>
              <Zap size={14} strokeWidth={2.5} />
              {isHindi ? 'डिजिटल भारत • किसान साथी' : 'Digital India • Farmer First'}
            </span>
            <span className="badge badge-gold" style={{ fontSize: '0.82rem' }}>
              <ShieldCheck size={14} strokeWidth={2.5} />
              {isHindi ? '100% मुफ़्त व सुरक्षित' : '100% Free & Secure'}
            </span>
          </div>

          <h1 className="page-title" style={{ fontSize: '2.1rem', fontWeight: '900', color: 'var(--nb-black)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span>🌾 {isHindi ? 'किसान डिजिटल सेवाएं' : 'Farmer Digital Services'}</span>
          </h1>

          <p className="page-subtitle" style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--nb-black)', maxWidth: '820px', marginTop: '6px' }}>
            {isHindi
              ? 'किसानों के लिए 4 सबसे उपयोगी डिजिटल उपकरण — सभी एक ही स्थान पर। फसल जांच, सरकारी PDF, दस्तावेज़ ज़ेरॉक्स स्कैनर और फाइल कंप्रेसर।'
              : 'Useful digital tools for farmers — all in one place. AI vision crop diagnosis, multi-image PDF compiler, document photocopier, and portal file compressor.'}
          </p>
        </div>
      </div>

      {/* 4 Interactive Service Selector Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
        {serviceTabs.map((svc) => {
          const Icon = svc.icon;
          const isActive = activeService === svc.id;

          return (
            <div
              key={svc.id}
              onClick={() => handleTabChange(svc.id)}
              className="card card-hover"
              style={{
                cursor: 'pointer',
                padding: '16px 18px',
                border: isActive ? '3.5px solid var(--nb-black)' : 'var(--border-medium)',
                backgroundColor: isActive ? svc.bgColor : 'var(--nb-white)',
                boxShadow: isActive ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                transform: isActive ? 'translate(-2px, -2px)' : 'none',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isActive ? 'var(--nb-white)' : svc.bgColor,
                      border: 'var(--border-thin)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--nb-black)'
                    }}
                  >
                    <Icon size={22} strokeWidth={2.5} />
                  </div>

                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: '900',
                      padding: '3px 7px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isActive ? 'var(--nb-black)' : 'var(--nb-canvas-alt)',
                      color: isActive ? 'var(--nb-white)' : 'var(--nb-black)',
                      border: 'var(--border-thin)'
                    }}
                  >
                    {svc.badge}
                  </span>
                </div>

                <div style={{ fontWeight: '900', fontSize: '1.05rem', color: 'var(--nb-black)', marginBottom: '4px' }}>
                  {svc.title}
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                  {svc.subtitle}
                </div>
              </div>

              <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: '900', color: 'var(--nb-black)' }}>
                {isActive ? (
                  <span style={{ color: 'var(--nb-black)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={14} strokeWidth={3} /> {isHindi ? 'सक्रिय सेवा' : 'Active Tool'}
                  </span>
                ) : (
                  <span>{isHindi ? 'खोलें →' : 'Open Tool →'}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Service Component Body */}
      <div>
        {activeService === 'image-ai' && <ImageAiService />}
        {activeService === 'images-to-pdf' && <ImagesToPdfService />}
        {activeService === 'smart-scanner' && <DocumentScannerService />}
        {activeService === 'file-compressor' && <FileCompressorService />}
      </div>

      {/* Helpful Government Portal Guidelines Card */}
      <div
        className="card"
        style={{
          backgroundColor: 'var(--nb-canvas-alt)',
          border: 'var(--border-thick)',
          boxShadow: 'var(--shadow-md)',
          padding: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <HelpCircle size={22} strokeWidth={2.5} style={{ color: 'var(--nb-black)' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: '900', color: 'var(--nb-black)', margin: 0 }}>
            {isHindi ? 'सरकारी कृषि पोर्टलों पर दस्तावेज़ अपलोड के 4 सुनहरे नियम' : '4 Golden Rules for Govt Portal Document Submissions'}
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          <div style={{ padding: '12px', backgroundColor: 'var(--nb-white)', borderRadius: 'var(--radius-sm)', border: 'var(--border-thin)' }}>
            <div style={{ fontWeight: '900', fontSize: '0.88rem', color: 'var(--nb-black)', marginBottom: '4px' }}>
              1. {isHindi ? 'सही फाइल साइज़ (KB)' : 'Exact File Size (KB)'}
            </div>
            <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-text-secondary)', margin: 0 }}>
              {isHindi
                ? 'PM-Kisan और CSC पोर्टल पर 100 KB या 200 KB से बड़ी फाइल खारिज हो जाती है। हमारे फाइल कंप्रेसर से पहले साइज़ कम करें।'
                : 'Portals reject uploads over 100 KB or 200 KB. Use our File Compressor to resize in one tap.'}
            </p>
          </div>

          <div style={{ padding: '12px', backgroundColor: 'var(--nb-white)', borderRadius: 'var(--radius-sm)', border: 'var(--border-thin)' }}>
            <div style={{ fontWeight: '900', fontSize: '0.88rem', color: 'var(--nb-black)', marginBottom: '4px' }}>
              2. {isHindi ? 'सिंगल PDF अनिवार्यता' : 'Single PDF Requirement'}
            </div>
            <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-text-secondary)', margin: 0 }}>
              {isHindi
                ? 'यदि आपके पास खसरा के 3 पन्ने हैं, तो उन्हें अलग-अलग फोटो के बजाय "फ़ोटो से PDF" टूल से एक ही PDF में बदलें।'
                : 'Merge multi-page land records or receipts into a single PDF before portal upload.'}
            </p>
          </div>

          <div style={{ padding: '12px', backgroundColor: 'var(--nb-white)', borderRadius: 'var(--radius-sm)', border: 'var(--border-thin)' }}>
            <div style={{ fontWeight: '900', fontSize: '0.88rem', color: 'var(--nb-black)', marginBottom: '4px' }}>
              3. {isHindi ? 'साफ़ व सीधी तस्वीर' : 'Upright & Shadow-Free'}
            </div>
            <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-text-secondary)', margin: 0 }}>
              {isHindi
                ? 'मोबाइल से फोटो लेते समय छाया न पड़ने दें। "स्मार्ट स्कैनर" के ज़ेरॉक्स B&W फिल्टर से लिखावट एकदम साफ दिखती है।'
                : 'Avoid dark shadows. Use the Smart Scanner Xerox B&W mode for readable official documents.'}
            </p>
          </div>

          <div style={{ padding: '12px', backgroundColor: 'var(--nb-white)', borderRadius: 'var(--radius-sm)', border: 'var(--border-thin)' }}>
            <div style={{ fontWeight: '900', fontSize: '0.88rem', color: 'var(--nb-black)', marginBottom: '4px' }}>
              4. {isHindi ? 'मुफ़्त किसान सहायता 1800-180-1551' : 'Free KCC Helpline'}
            </div>
            <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-text-secondary)', margin: 0 }}>
              {isHindi
                ? 'किसी भी योजना या कीट समस्या पर सीधे सरकारी कृषि विशेषज्ञों से बात करने के लिए टोल-फ्री 1800-180-1551 पर कॉल करें।'
                : 'For agricultural or scheme assistance, dial the official toll-free Kisan Call Centre at 1800-180-1551.'}
            </p>
          </div>
        </div>
      </div>

      {/* Scan History (Preserving previous scans if available) */}
      {history.length > 0 && (
        <div className="card" style={{ border: 'var(--border-thick)', boxShadow: 'var(--shadow-md)', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <History size={20} strokeWidth={2.5} style={{ color: 'var(--nb-black)' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: '900', color: 'var(--nb-black)', margin: 0 }}>
              {isHindi ? 'आपके पिछले दस्तावेज़ रिकॉर्ड' : 'Your Previous Document Records'}
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {history.map((scan) => (
              <div
                key={scan._id}
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--nb-canvas-alt)',
                  border: 'var(--border-medium)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '900', fontSize: '0.9rem', color: 'var(--nb-black)' }}>
                    📄 {scan.fileName}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-text-secondary)' }}>
                    {new Date(scan.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--nb-black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
                  {scan.extractedText}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
