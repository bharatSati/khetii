import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { jsPDF } from 'jspdf';
import {
  Scan,
  Camera,
  Upload,
  RotateCw,
  Sliders,
  Download,
  FileText,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  RefreshCw,
  Sun,
  Contrast
} from 'lucide-react';
import { ocrService } from '../../services/ocrService';
import TTSButton from '../TTSButton';
import Loader from '../Loader';

export const DocumentScannerService = () => {
  const { t, i18n } = useTranslation();
  const isHindi = i18n.language?.startsWith('hi');

  const [selectedFile, setSelectedFile] = useState(null);
  const [imageElement, setImageElement] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [activeFilter, setActiveFilter] = useState('autoclean'); // 'original' | 'autoclean' | 'photocopy' | 'grayscale'
  const [contrast, setContrast] = useState(120); // 50 to 200
  const [brightness, setBrightness] = useState(110); // 50 to 180
  const [threshold, setThreshold] = useState(130); // 80 to 200 for B&W photocopy

  // OCR state
  const [ocrLoading, setOcrLoading] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [copied, setCopied] = useState(false);

  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Load image into HTMLImageElement
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(isHindi ? 'कृपया कोई फोटो (JPG, PNG) चुनें।' : 'Please choose an image file (JPG, PNG).');
      return;
    }

    setError('');
    setStatusMessage('');
    setSelectedFile(file);
    setExtractedText('');
    setRotation(0);
    setActiveFilter('autoclean');
    setContrast(120);
    setBrightness(110);
    setThreshold(130);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        setImageElement(img);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Render canvas with selected filter and transformations
  const renderCanvas = useCallback(() => {
    if (!imageElement || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rot = (rotation % 360 + 360) % 360;

    const isVerticalSwap = rot === 90 || rot === 270;
    const destWidth = isVerticalSwap ? imageElement.height : imageElement.width;
    const destHeight = isVerticalSwap ? imageElement.width : imageElement.height;

    // Cap canvas dimensions for smooth 60fps performance while retaining high document sharpness
    const maxDimension = 2000;
    let scale = 1;
    if (destWidth > maxDimension || destHeight > maxDimension) {
      scale = maxDimension / Math.max(destWidth, destHeight);
    }

    canvas.width = Math.round(destWidth * scale);
    canvas.height = Math.round(destHeight * scale);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rot * Math.PI) / 180);

    const drawW = Math.round(imageElement.width * scale);
    const drawH = Math.round(imageElement.height * scale);
    ctx.drawImage(imageElement, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // If original, no pixel manipulation needed
    if (activeFilter === 'original') return;

    // Pixel manipulation for document enhancement
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const len = data.length;

    const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    const brightFactor = brightness - 100;

    for (let i = 0; i < len; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Convert to luminance grayscale
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;

      if (activeFilter === 'photocopy') {
        // High-contrast clean thresholding (Xerox effect)
        // Apply brightness/contrast adjustments to gray first
        let adjusted = contrastFactor * (gray - 128) + 128 + brightFactor;
        const val = adjusted >= threshold ? 255 : 0;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      } else if (activeFilter === 'grayscale') {
        // Smooth grayscale with user brightness & contrast
        let adjusted = contrastFactor * (gray - 128) + 128 + brightFactor;
        adjusted = Math.min(255, Math.max(0, adjusted));
        data[i] = adjusted;
        data[i + 1] = adjusted;
        data[i + 2] = adjusted;
      } else if (activeFilter === 'autoclean') {
        // Intelligent document text boost (suppresses yellow/shadow paper tint, sharpens dark text)
        let boosted = gray > 180 ? 255 : (gray < 90 ? gray * 0.7 : gray);
        let adjusted = contrastFactor * (boosted - 128) + 128 + (brightFactor + 10);
        adjusted = Math.min(255, Math.max(0, adjusted));
        data[i] = adjusted;
        data[i + 1] = adjusted;
        data[i + 2] = adjusted;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [imageElement, rotation, activeFilter, contrast, brightness, threshold]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownloadImage = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `Khetii_Scanned_${Date.now()}.jpg`;
    link.click();
    setStatusMessage(isHindi ? 'साफ दस्तावेज़ छवि सफलतापूर्वक डाउनलोड हुई!' : 'Clean document image downloaded!');
  };

  const handleDownloadPdf = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.90);

    const doc = new jsPDF({
      orientation: canvas.width > canvas.height ? 'l' : 'p',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const printableWidth = pageWidth - margin * 2;
    const printableHeight = pageHeight - margin * 2;

    const imgRatio = canvas.width / canvas.height;
    const pageRatio = printableWidth / printableHeight;

    let renderWidth = printableWidth;
    let renderHeight = printableHeight;

    if (imgRatio > pageRatio) {
      renderWidth = printableWidth;
      renderHeight = printableWidth / imgRatio;
    } else {
      renderHeight = printableHeight;
      renderWidth = printableHeight * imgRatio;
    }

    const xOffset = margin + (printableWidth - renderWidth) / 2;
    const yOffset = margin + (printableHeight - renderHeight) / 2;

    doc.addImage(dataUrl, 'JPEG', xOffset, yOffset, renderWidth, renderHeight);
    doc.save(`Khetii_Scanned_Doc_${Date.now()}.pdf`);
    setStatusMessage(isHindi ? 'साफ A4 PDF सफलतापूर्वक डाउनलोड हुई!' : 'Clean A4 PDF downloaded!');
  };

  const handleProcessOcr = async () => {
    if (!canvasRef.current || !selectedFile) return;

    setOcrLoading(true);
    setError('');
    setStatusMessage('');

    try {
      // Export current canvas as a Blob to send to OCR endpoint
      const canvas = canvasRef.current;
      const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.92));
      const fileToProcess = new File([blob], selectedFile.name, { type: 'image/jpeg' });

      const res = await ocrService.processDocument(fileToProcess, isHindi ? 'hin' : 'eng');
      setExtractedText(res.extractedText || (isHindi ? 'कोई स्पष्ट टेक्स्ट नहीं मिला।' : 'No readable text was detected.'));
      setStatusMessage(isHindi ? 'टेक्स्ट सफलतापूर्वक निकाला गया!' : 'Text successfully extracted!');
    } catch (err) {
      console.error('OCR Error:', err);
      setError(err.message || (isHindi ? 'OCR में त्रुटि हुई।' : 'OCR processing failed.'));
    } finally {
      setOcrLoading(false);
    }
  };

  const handleCopyText = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      {/* Header Banner */}
      <div
        className="card"
        style={{
          backgroundColor: 'var(--nb-purple-light)',
          border: 'var(--border-thick)',
          boxShadow: 'var(--shadow-md)',
          padding: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ maxWidth: '780px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--nb-black)', color: 'var(--nb-white)', padding: '4px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', fontWeight: '900', marginBottom: '8px' }}>
              <Scan size={16} strokeWidth={2.5} style={{ color: 'var(--nb-yellow)' }} />
              {isHindi ? 'सेवा 3: स्मार्ट कृषि दस्तावेज़ स्कैनर' : 'Service 3: Smart Farm Document Scanner'}
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: '8px' }}>
              {isHindi ? '📸 खसरा, खतौनी, रसीद व बिलों को बनाएं एकदम साफ व ज़ेरॉक्स' : '📸 Enhance, Clean & Photocopy Farm Documents'}
            </h2>
            <p style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--nb-black)', lineHeight: 1.5, margin: 0 }}>
              {isHindi
                ? 'खेत में या घर पर फोन से खींची गई धुंधली व छायादार तस्वीरों को सरकारी ज़ेरॉक्स कॉपी जैसा साफ बनाएं। ऑटो-क्लीन, ब्लैक & व्हाइट फोटोकॉपी और कंट्रास्ट फिल्टर से दस्तावेज़ पोर्टल पर तुरंत स्वीकार्य होगा।'
                : 'Mobile photos of land records, KCC passbooks, and bills often have dark shadows and poor contrast. Apply Auto-Clean and B&W Photocopy filters to make them sharp, clean, and ready for official portals.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
            <span className="badge badge-gold" style={{ fontSize: '0.85rem' }}>
              📑 {isHindi ? 'ज़ेरॉक्स B&W फिल्टर' : 'Xerox B&W Mode'}
            </span>
            <span className="badge badge-green" style={{ fontSize: '0.82rem' }}>
              🔒 {isHindi ? 'सुरक्षित ब्राउज़र प्रोसेसिंग' : 'Private On-Device'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--space-xl)' }}>
        {/* Left Column: Image Canvas & Controls */}
        <div className="card" style={{ border: 'var(--border-thick)', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--nb-black)', margin: 0 }}>
              {isHindi ? '1. दस्तावेज़ स्कैन व संपादन' : '1. Document Scan & Edit'}
            </h3>

            {imageElement && (
              <button
                type="button"
                onClick={handleRotate}
                className="btn btn-secondary btn-sm"
                title={isHindi ? 'घुमाएं (90°)' : 'Rotate (90°)'}
              >
                <RotateCw size={16} strokeWidth={2.5} />
                <span>{rotation}°</span>
              </button>
            )}
          </div>

          {/* Hidden Inputs */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileChange}
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
          />

          {/* Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: 'var(--space-md)' }}>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="btn btn-primary"
              style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Camera size={20} strokeWidth={2.5} />
              <span style={{ fontSize: '0.88rem', fontWeight: '900' }}>
                {isHindi ? 'कैमरा से फोटो लें' : 'Take Photo'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary"
              style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Upload size={20} strokeWidth={2.5} />
              <span style={{ fontSize: '0.88rem', fontWeight: '900' }}>
                {isHindi ? 'दस्तावेज़ चुनें' : 'Upload File'}
              </span>
            </button>
          </div>

          {/* Canvas Box */}
          <div
            style={{
              minHeight: '280px',
              backgroundColor: 'var(--nb-canvas-alt)',
              borderRadius: 'var(--radius-sm)',
              border: 'var(--border-medium)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-md)',
              position: 'relative'
            }}
          >
            {imageElement ? (
              <canvas
                ref={canvasRef}
                style={{
                  maxWidth: '100%',
                  maxHeight: '440px',
                  objectFit: 'contain',
                  boxShadow: 'var(--shadow-sm)'
                }}
              />
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ textAlign: 'center', padding: '40px 20px', cursor: 'pointer' }}
              >
                <Scan size={44} strokeWidth={2} style={{ color: 'var(--nb-black)', margin: '0 auto 10px' }} />
                <p style={{ fontWeight: '900', fontSize: '1rem', color: 'var(--nb-black)', marginBottom: '4px' }}>
                  {isHindi ? 'खसरा, खतौनी, आधार या बिल की फोटो अपलोड करें' : 'Upload land record, KCC, or bill photo'}
                </p>
                <p style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-text-secondary)', margin: 0 }}>
                  {isHindi ? 'कैमरा या गैलरी से चुनें' : 'Choose from camera or gallery'}
                </p>
              </div>
            )}
          </div>

          {/* Filter Mode Selector Pills */}
          {imageElement && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: 'var(--space-md)' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: '800' }}>
                  {isHindi ? 'दस्तावेज़ फिल्टर चुनें:' : 'Select Document Filter:'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                  {[
                    { key: 'autoclean', label: isHindi ? '✨ ऑटो साफ (Auto)' : '✨ Auto Clean' },
                    { key: 'photocopy', label: isHindi ? '🖨️ ज़ेरॉक्स B&W' : '🖨️ Photocopy' },
                    { key: 'grayscale', label: isHindi ? '🔘 ग्रेस्केल (Gray)' : '🔘 Grayscale' },
                    { key: 'original', label: isHindi ? '📷 मूल (Original)' : '📷 Original' }
                  ].map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setActiveFilter(f.key)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        padding: '8px',
                        fontSize: '0.82rem',
                        fontWeight: '900',
                        backgroundColor: activeFilter === f.key ? 'var(--nb-yellow-light)' : 'var(--nb-white)',
                        borderColor: 'var(--nb-black)'
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders for fine-tuning */}
              {activeFilter !== 'original' && (
                <div style={{ padding: '12px', backgroundColor: 'var(--nb-canvas-alt)', borderRadius: 'var(--radius-sm)', border: 'var(--border-thin)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: '800' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Contrast size={14} /> {isHindi ? 'कंट्रास्ट / Contrast:' : 'Contrast:'}
                    </span>
                    <span>{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--nb-black)' }}
                  />

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: '800' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sun size={14} /> {isHindi ? 'ब्राइटनेस / Brightness:' : 'Brightness:'}
                    </span>
                    <span>{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="180"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--nb-black)' }}
                  />

                  {activeFilter === 'photocopy' && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: '800' }}>
                        <span>{isHindi ? 'स्याही डार्कनेस / Ink Threshold:' : 'Ink Threshold:'}</span>
                        <span>{threshold}</span>
                      </div>
                      <input
                        type="range"
                        min="80"
                        max="200"
                        value={threshold}
                        onChange={(e) => setThreshold(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--nb-black)' }}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Download Action Buttons */}
          {imageElement && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: 'auto' }}>
              <button
                type="button"
                onClick={handleDownloadImage}
                className="btn btn-secondary"
                style={{ padding: '12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Download size={18} strokeWidth={2.5} />
                <span style={{ fontSize: '0.85rem', fontWeight: '900' }}>
                  {isHindi ? 'छवि डाउनलोड (.JPG)' : 'Save as JPG'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                className="btn btn-primary"
                style={{ padding: '12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <FileCheck size={18} strokeWidth={2.5} />
                <span style={{ fontSize: '0.85rem', fontWeight: '900' }}>
                  {isHindi ? 'A4 PDF डाउनलोड' : 'Save as PDF'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: OCR Text Extraction & Details */}
        <div className="card" style={{ border: 'var(--border-thick)', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--nb-black)', margin: 0 }}>
              {isHindi ? '2. टेक्स्ट पहचान व विवरण (OCR)' : '2. Text Extraction & Data'}
            </h3>

            {extractedText && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <TTSButton
                  text={extractedText}
                  variant="secondary"
                  size="sm"
                  label={isHindi ? 'सुनें' : 'Listen'}
                />
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="btn btn-secondary btn-sm"
                  title="Copy"
                >
                  {copied ? <Check size={15} strokeWidth={2.5} style={{ color: 'var(--nb-green)' }} /> : <Copy size={15} strokeWidth={2.5} />}
                  <span>{copied ? (isHindi ? 'कॉपी हुआ' : 'Copied') : (isHindi ? 'कॉपी' : 'Copy')}</span>
                </button>
              </div>
            )}
          </div>

          <p style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-md)' }}>
            {isHindi
              ? 'यदि आप खसरा नंबर, रकबा, किसान का नाम, दिनांक या बैंक खाता नंबर कॉपी करना चाहते हैं तो "टेक्स्ट निकालें" बटन दबाएं।'
              : 'Extract text, Khasra numbers, land area, amounts, and dates directly from the enhanced document.'}
          </p>

          <button
            type="button"
            onClick={handleProcessOcr}
            disabled={ocrLoading || !imageElement}
            className="btn btn-secondary"
            style={{
              width: '100%',
              marginBottom: 'var(--space-md)',
              backgroundColor: 'var(--nb-yellow-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {ocrLoading ? (
              <>
                <RefreshCw size={18} className="spin" />
                <span>{isHindi ? 'दस्तावेज़ से टेक्स्ट निकाला जा रहा है...' : 'Extracting document text...'}</span>
              </>
            ) : (
              <>
                <FileText size={18} strokeWidth={2.5} />
                <span>{isHindi ? '📋 साफ़ दस्तावेज़ से टेक्स्ट निकालें (OCR)' : '📋 Extract Text via OCR'}</span>
              </>
            )}
          </button>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 'var(--space-md)' }}>
              <AlertCircle size={20} strokeWidth={2.5} />
              <span>{error}</span>
            </div>
          )}

          {statusMessage && (
            <div className="alert alert-success" style={{ marginBottom: 'var(--space-md)' }}>
              <CheckCircle2 size={20} strokeWidth={2.5} />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Textarea or Empty Display */}
          {ocrLoading ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
              <Loader message={isHindi ? 'अक्षरों व अंकों की पहचान की जा रही है...' : 'Extracting text and figures...'} />
            </div>
          ) : !extractedText ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--space-xl)',
                backgroundColor: 'var(--nb-canvas-alt)',
                border: 'var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center'
              }}
            >
              <FileText size={44} strokeWidth={2} style={{ color: 'var(--nb-black)', marginBottom: '10px' }} />
              <p style={{ fontSize: '0.92rem', fontWeight: '800', color: 'var(--nb-black)', marginBottom: '4px' }}>
                {isHindi ? 'टेक्स्ट अभी नहीं निकाला गया है' : 'No Text Extracted Yet'}
              </p>
              <p style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-text-secondary)', margin: 0 }}>
                {isHindi ? 'ऊपर दिए गए "टेक्स्ट निकालें" बटन से कागज़ का टेक्स्ट प्राप्त करें।' : 'Click "Extract Text via OCR" to extract readable text.'}
              </p>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <textarea
                className="form-textarea"
                value={extractedText}
                readOnly
                style={{
                  flex: 1,
                  minHeight: '220px',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  lineHeight: 1.5,
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
    </div>
  );
};

export default DocumentScannerService;
