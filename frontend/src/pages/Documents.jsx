import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { ocrService } from '../services/ocrService';
import {
  FileScan,
  Upload,
  Copy,
  Download,
  Check,
  AlertCircle,
  FileText,
  History
} from 'lucide-react';
import Loader from '../components/Loader';

export const Documents = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [language, setLanguage] = useState(i18n.language?.startsWith('hi') ? 'hin' : 'eng');

  const [loading, setLoading] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const [history, setHistory] = useState([]);
  const fileInputRef = useRef(null);

  const loadHistory = async () => {
    try {
      const data = await ocrService.getHistory();
      setHistory(data || []);
    } catch (e) {
      console.warn('History fetch:', e.message);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    setLanguage(i18n.language?.startsWith('hi') ? 'hin' : 'eng');
  }, [i18n.language]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5 MB. Please choose a smaller image or PDF.');
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    setError('');
    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleProcessOcr = async () => {
    if (!selectedFile) {
      setError('Please select an image or PDF first.');
      return;
    }

    setLoading(true);
    setError('');
    setExtractedText('');

    try {
      const res = await ocrService.processDocument(selectedFile, language);
      setExtractedText(res.extractedText || 'No readable text was detected.');
      loadHistory();
    } catch (err) {
      setError(err.message || 'OCR extraction failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!extractedText) return;
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kheti_ocr_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const detectNumbersAndDates = (text) => {
    if (!text) return [];
    const regex = /(\b\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}\b)|(₹?\s*\b\d{1,3}(?:,\d{2,3})*(?:\.\d+)?\b)/g;
    const matches = text.match(regex);
    return matches ? Array.from(new Set(matches)).slice(0, 12) : [];
  };

  const detectedHighlights = detectNumbersAndDates(extractedText);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('ocr.title')}</h1>
          <p className="page-subtitle">{t('ocr.subtitle')}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
        {/* Upload & Configuration Card */}
        <div className="card" style={{ border: 'var(--border-thick)', boxShadow: 'var(--shadow-md)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: 'var(--space-md)' }}>
            दस्तावेज़ अपलोड करें / Upload File
          </h2>

          {/* Drag & drop box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '3px dashed var(--nb-black)',
              borderRadius: 'var(--radius-sm)',
              padding: 'var(--space-2xl) var(--space-md)',
              textAlign: 'center',
              backgroundColor: 'var(--nb-yellow-light)',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer',
              marginBottom: 'var(--space-md)',
              transition: 'transform 0.1s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translate(-2px, -2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp,application/pdf"
              style={{ display: 'none' }}
            />

            <Upload size={40} strokeWidth={2.5} style={{ color: 'var(--nb-black)', margin: '0 auto var(--space-sm)' }} />
            <p style={{ fontWeight: '900', fontSize: '1rem', color: 'var(--nb-black)', marginBottom: '4px' }}>
              {selectedFile ? selectedFile.name : t('ocr.uploadPrompt')}
            </p>
            <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--color-text-secondary)' }}>
              समर्थित: JPG, PNG, WEBP, PDF (अधिकतम 5 MB)
            </p>
          </div>

          {/* Language selector */}
          <div className="form-group">
            <label className="form-label">{t('ocr.docLanguage')}</label>
            <select
              className="form-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="hin">हिंदी / Devanagari (hin)</option>
              <option value="eng">English (eng)</option>
            </select>
          </div>

          {error && (
            <div className="alert alert-danger">
              <AlertCircle size={20} strokeWidth={2.5} />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleProcessOcr}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 'var(--space-sm)' }}
            disabled={loading || !selectedFile}
          >
            {loading ? (
              <span>{t('ocr.processing')}</span>
            ) : (
              <>
                <FileScan size={20} strokeWidth={2.5} />
                <span>{t('ocr.processDoc')}</span>
              </>
            )}
          </button>

          <p style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-text-secondary)', marginTop: 'var(--space-sm)', textAlign: 'center' }}>
            {t('ocr.notice')}
          </p>

          {/* Image Preview */}
          {previewUrl && (
            <div style={{ marginTop: 'var(--space-md)' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: '6px', textTransform: 'uppercase' }}>
                पूर्वावलोकन / Preview:
              </div>
              <div style={{ maxHeight: '200px', overflow: 'hidden', borderRadius: 'var(--radius-sm)', border: 'var(--border-medium)', boxShadow: 'var(--shadow-sm)' }}>
                <img src={previewUrl} alt="Preview" style={{ width: '100%', height: 'auto', objectFit: 'contain' }} />
              </div>
            </div>
          )}
        </div>

        {/* Extracted Text Display */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', border: 'var(--border-thick)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--nb-black)' }}>
              {t('ocr.extractedTextTitle')}
            </h2>

            {extractedText && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleCopy} className="btn btn-secondary btn-sm" title="Copy">
                  {copied ? <Check size={16} strokeWidth={2.5} style={{ color: 'var(--nb-green)' }} /> : <Copy size={16} strokeWidth={2.5} />}
                  <span>{copied ? t('common.copied') : t('common.copy')}</span>
                </button>
                <button onClick={handleDownloadTxt} className="btn btn-secondary btn-sm" title="Download as .txt">
                  <Download size={16} strokeWidth={2.5} />
                  <span>.TXT</span>
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <Loader message={t('ocr.processing')} />
          ) : !extractedText ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--space-2xl)',
                color: 'var(--color-text-muted)',
                textAlign: 'center',
                backgroundColor: 'var(--nb-canvas-alt)',
                border: 'var(--border-medium)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <FileText size={44} strokeWidth={2} style={{ marginBottom: '8px', color: 'var(--nb-black)' }} />
              <p style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--nb-black)' }}>
                कोई दस्तावेज़ अपलोड करके OCR करें। निकाला गया टेक्स्ट यहाँ दिखाई देगा।
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {detectedHighlights.length > 0 && (
                <div
                  style={{
                    backgroundColor: 'var(--nb-yellow-light)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: 'var(--space-md)',
                    border: 'var(--border-medium)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase', color: 'var(--nb-black)', marginBottom: '4px' }}>
                    {t('ocr.detectedNumbers')} (सहायक संदर्भ):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {detectedHighlights.map((val, idx) => (
                      <span key={idx} className="badge badge-gold" style={{ fontSize: '0.85rem' }}>
                        {val}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <textarea
                className="form-textarea"
                value={extractedText}
                readOnly
                style={{
                  flex: 1,
                  minHeight: '260px',
                  fontFamily: 'monospace',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  lineHeight: 1.6,
                  backgroundColor: 'var(--nb-canvas-alt)',
                  border: 'var(--border-medium)',
                  boxShadow: 'var(--shadow-sm)',
                  padding: '12px'
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* User's Scan History (MongoDB OcrScan) */}
      {history.length > 0 && (
        <div className="card" style={{ border: 'var(--border-thick)', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
            <History size={22} strokeWidth={2.5} style={{ color: 'var(--nb-black)' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--nb-black)' }}>
              {t('ocr.recentScans')}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
            {history.map((scan) => (
              <div
                key={scan._id}
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--nb-purple-light)',
                  border: 'var(--border-medium)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '900', fontSize: '0.95rem', color: 'var(--nb-black)' }}>
                    📄 {scan.fileName}
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--color-text-secondary)' }}>
                    {new Date(scan.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--nb-black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {scan.extractedText}
                </p>
                <button
                  onClick={() => setExtractedText(scan.extractedText)}
                  className="btn btn-secondary btn-sm"
                  style={{ marginTop: '8px', padding: '4px 10px', fontSize: '0.8rem' }}
                >
                  टेक्स्ट लोड करें / View Text
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
