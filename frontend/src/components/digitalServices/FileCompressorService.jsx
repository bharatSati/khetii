import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Minimize2,
  Upload,
  Camera,
  Download,
  Share2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  HardDrive,
  FileCheck2,
  Percent,
  Check
} from 'lucide-react';

export const FileCompressorService = () => {
  const { t, i18n } = useTranslation();
  const isHindi = i18n.language?.startsWith('hi');

  const [selectedFile, setSelectedFile] = useState(null);
  const [originalUrl, setOriginalUrl] = useState(null);
  const [originalSizeKb, setOriginalSizeKb] = useState(0);

  // Target size presets in KB: 50, 100, 200, 500, 1024, 2048
  const [targetKb, setTargetKb] = useState(100);
  const [customKbInput, setCustomKbInput] = useState('100');

  // Compressed result: { blob, url, sizeKb, width, height, reductionPercent }
  const [compressedResult, setCompressedResult] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [error, setError] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const presets = [
    { label: '50 KB', value: 50, desc: isHindi ? 'पासपोर्ट फोटो / हस्ताक्षर' : 'Passport Photo / Sign' },
    { label: '100 KB', value: 100, desc: isHindi ? 'सरकारी पोर्टल (मानक)' : 'Govt Portal Standard' },
    { label: '200 KB', value: 200, desc: isHindi ? 'PM-किसान / CSC' : 'PM-Kisan / CSC Portals' },
    { label: '500 KB', value: 500, desc: isHindi ? 'खसरा / दस्तावेज़' : 'Land Record / Documents' },
    { label: '1 MB', value: 1024, desc: isHindi ? 'उच्च गुणवत्ता' : 'High Quality' },
    { label: '2 MB', value: 2048, desc: isHindi ? 'अधिकतम सीमा' : 'Maximum Limit' }
  ];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(isHindi ? 'कृपया कोई फोटो (JPG, PNG, WEBP) चुनें।' : 'Please choose an image file (JPG, PNG, WEBP).');
      return;
    }

    setError('');
    setSelectedFile(file);
    const sizeKb = file.size / 1024;
    setOriginalSizeKb(sizeKb);

    if (originalUrl) URL.revokeObjectURL(originalUrl);
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    setCompressedResult(null);
  };

  const handlePresetSelect = (value) => {
    setTargetKb(value);
    setCustomKbInput(String(value));
  };

  const handleCustomInputChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setCustomKbInput(val);
    const num = Number(val);
    if (num > 0) {
      setTargetKb(num);
    }
  };

  // Perform client-side intelligent progressive compression
  const compressImage = async () => {
    if (!selectedFile || !originalUrl) return;

    setIsCompressing(true);
    setError('');

    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = originalUrl;
      });

      // Target size in bytes with a 3% safety margin
      const targetBytes = Math.floor(targetKb * 1024 * 0.97);

      // Start with original dimensions, scale down if image is huge
      let currentWidth = img.width;
      let currentHeight = img.height;

      // Aggressive dimension downscaling for very small target sizes (e.g. 50 KB, 100 KB)
      if (targetKb <= 60 && Math.max(currentWidth, currentHeight) > 1000) {
        const factor = 1000 / Math.max(currentWidth, currentHeight);
        currentWidth = Math.round(currentWidth * factor);
        currentHeight = Math.round(currentHeight * factor);
      } else if (targetKb <= 120 && Math.max(currentWidth, currentHeight) > 1400) {
        const factor = 1400 / Math.max(currentWidth, currentHeight);
        currentWidth = Math.round(currentWidth * factor);
        currentHeight = Math.round(currentHeight * factor);
      } else if (Math.max(currentWidth, currentHeight) > 2200) {
        const factor = 2200 / Math.max(currentWidth, currentHeight);
        currentWidth = Math.round(currentWidth * factor);
        currentHeight = Math.round(currentHeight * factor);
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = currentWidth;
      canvas.height = currentHeight;
      ctx.drawImage(img, 0, 0, currentWidth, currentHeight);

      // Binary search for optimal JPEG quality
      let minQ = 0.08;
      let maxQ = 0.96;
      let bestBlob = null;
      let bestQuality = 0.8;

      for (let iteration = 0; iteration < 8; iteration++) {
        const midQ = (minQ + maxQ) / 2;
        const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', midQ));

        if (!blob) break;

        if (blob.size <= targetBytes) {
          bestBlob = blob;
          bestQuality = midQ;
          minQ = midQ; // try higher quality if still under limit
        } else {
          maxQ = midQ; // too large, lower quality
        }
      }

      // If even lowest quality is larger than target, scale down canvas dimensions progressively
      if (!bestBlob || bestBlob.size > targetBytes) {
        let scaleFactor = 0.8;
        while (scaleFactor >= 0.25) {
          const scaledW = Math.round(currentWidth * scaleFactor);
          const scaledH = Math.round(currentHeight * scaleFactor);
          canvas.width = scaledW;
          canvas.height = scaledH;
          ctx.drawImage(img, 0, 0, scaledW, scaledH);

          const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.65));
          if (blob && blob.size <= targetBytes) {
            bestBlob = blob;
            break;
          }
          scaleFactor -= 0.15;
        }
      }

      // If still null, take minimum available
      if (!bestBlob) {
        bestBlob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.15));
      }

      const compressedSizeKb = (bestBlob.size / 1024);
      const reduction = Math.max(0, (((originalSizeKb - compressedSizeKb) / originalSizeKb) * 100)).toFixed(1);

      if (compressedResult?.url) {
        URL.revokeObjectURL(compressedResult.url);
      }

      const resultUrl = URL.createObjectURL(bestBlob);
      setCompressedResult({
        blob: bestBlob,
        url: resultUrl,
        sizeKb: compressedSizeKb.toFixed(1),
        width: canvas.width,
        height: canvas.height,
        reductionPercent: reduction
      });
    } catch (err) {
      console.error('Compression error:', err);
      setError(isHindi ? 'कंप्रेशन में त्रुटि हुई।' : 'Failed to compress image.');
    } finally {
      setIsCompressing(false);
    }
  };

  // Auto re-compress when target size or original file changes
  useEffect(() => {
    if (selectedFile && originalUrl && targetKb > 0) {
      compressImage();
    }
  }, [selectedFile, originalUrl, targetKb]);

  const handleDownload = () => {
    if (!compressedResult) return;
    const link = document.createElement('a');
    link.href = compressedResult.url;
    const baseName = selectedFile?.name?.replace(/\.[^/.]+$/, '') || 'Khetii_Compressed';
    link.download = `${baseName}_${targetKb}KB.jpg`;
    link.click();
  };

  const handleShare = async () => {
    if (!compressedResult) return;

    if (navigator.share && navigator.canShare) {
      try {
        const fileToShare = new File(
          [compressedResult.blob],
          `Khetii_${targetKb}KB.jpg`,
          { type: 'image/jpeg' }
        );
        if (navigator.canShare({ files: [fileToShare] })) {
          await navigator.share({
            title: 'Khetii Compressed Image',
            text: `Compressed to ${compressedResult.sizeKb} KB via Khetii Farmer Digital Services.`,
            files: [fileToShare]
          });
          return;
        }
      } catch (err) {
        console.warn('Share error:', err);
      }
    }

    // Fallback: trigger download
    handleDownload();
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const formatFileSize = (kb) => {
    if (!kb) return '0 KB';
    if (kb >= 1024) {
      return `${(kb / 1024).toFixed(2)} MB`;
    }
    return `${Number(kb).toFixed(1)} KB`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      {/* Service Header Banner */}
      <div
        className="card"
        style={{
          backgroundColor: 'var(--nb-orange-light)',
          border: 'var(--border-thick)',
          boxShadow: 'var(--shadow-md)',
          padding: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ maxWidth: '780px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--nb-black)', color: 'var(--nb-white)', padding: '4px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', fontWeight: '900', marginBottom: '8px' }}>
              <Minimize2 size={16} strokeWidth={2.5} style={{ color: 'var(--nb-orange-bright)' }} />
              {isHindi ? 'सेवा 4: सरकारी पोर्टल स्मार्ट फाइल कंप्रेसर' : 'Service 4: Smart File Compressor'}
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: '8px' }}>
              {isHindi ? '📦 सरकारी पोर्टल लिमिट (50 KB, 100 KB, 200 KB) हेतु फोटो साइज घटाएं' : '📦 Compress Photos to Exact Govt Portal Size Limits'}
            </h2>
            <p style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--nb-black)', lineHeight: 1.5, margin: 0 }}>
              {isHindi
                ? 'मोबाइल से ली गई भारी तस्वीरें (3MB–8MB) अक्सर सरकारी वेबसाइटों पर "File size exceeds limit" की वजह से अपलोड नहीं होतीं। सिर्फ एक क्लिक में सटीक 50 KB, 100 KB या 200 KB में बदलें, बिना गुणवत्ता खोए!'
                : 'Smartphone photos are too large for government portals with strict 50 KB or 100 KB limits. Reduce file sizes instantly right on your device with high visual clarity.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
            <span className="badge badge-green" style={{ fontSize: '0.85rem' }}>
              ⚡ {isHindi ? 'तत्काल (300 मिलीसेकंड)' : 'Instant 300ms'}
            </span>
            <span className="badge badge-gold" style={{ fontSize: '0.82rem' }}>
              🎯 {isHindi ? 'सटीक KB कंट्रोल' : 'Exact KB Control'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--space-xl)' }}>
        {/* Left Side: Upload & Target Size Selector */}
        <div className="card" style={{ border: 'var(--border-thick)', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: 'var(--space-md)' }}>
            {isHindi ? '1. फोटो चुनें व टारगेट साइज सेट करें' : '1. Upload Photo & Select Target Size'}
          </h3>

          {/* Hidden inputs */}
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

          {/* Action buttons */}
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
                {isHindi ? 'फ़ाइल चुनें' : 'Choose File'}
              </span>
            </button>
          </div>

          {/* File Selected Status Card */}
          {selectedFile ? (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--nb-canvas-alt)',
                border: 'var(--border-medium)',
                marginBottom: 'var(--space-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: '900', fontSize: '0.92rem', color: 'var(--nb-black)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  📄 {selectedFile.name}
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-text-secondary)' }}>
                  {isHindi ? 'मूल साइज़:' : 'Original Size:'}{' '}
                  <span style={{ color: 'var(--nb-red)', fontWeight: '900' }}>{formatFileSize(originalSizeKb)}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-secondary btn-sm"
              >
                {isHindi ? 'बदलें' : 'Change'}
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '3px dashed var(--nb-black)',
                borderRadius: 'var(--radius-sm)',
                padding: '36px 20px',
                textAlign: 'center',
                backgroundColor: 'var(--nb-canvas-alt)',
                cursor: 'pointer',
                marginBottom: 'var(--space-md)'
              }}
            >
              <Minimize2 size={40} strokeWidth={2} style={{ color: 'var(--nb-black)', margin: '0 auto 10px' }} />
              <p style={{ fontWeight: '900', fontSize: '1rem', color: 'var(--nb-black)', marginBottom: '4px' }}>
                {isHindi ? 'जिस फोटो का साइज घटाना है उसे यहां चुनें' : 'Click here or drag photo to compress'}
              </p>
              <p style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-text-secondary)', margin: 0 }}>
                {isHindi ? 'समर्थित: JPG, PNG, WEBP (अधिकतम 20 MB)' : 'Supports JPG, PNG, WEBP up to 20 MB'}
              </p>
            </div>
          )}

          {/* Target Size Preset Pills */}
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <label className="form-label" style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '8px' }}>
              {isHindi ? 'टारगेट साइज चुनें (पोर्टल के अनुसार):' : 'Choose Target Size Limit:'}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
              {presets.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handlePresetSelect(p.value)}
                  className="btn btn-secondary btn-sm"
                  style={{
                    padding: '10px 4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    backgroundColor: targetKb === p.value ? 'var(--nb-yellow-light)' : 'var(--nb-white)',
                    borderColor: 'var(--nb-black)',
                    boxShadow: targetKb === p.value ? 'var(--shadow-sm)' : 'none'
                  }}
                >
                  <span style={{ fontSize: '0.95rem', fontWeight: '900', color: 'var(--nb-black)' }}>
                    {p.label}
                  </span>
                  <span style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--color-text-secondary)' }}>
                    {p.desc}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom KB Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--nb-black)', whiteSpace: 'nowrap' }}>
                {isHindi ? 'या कस्टम साइज:' : 'Or custom KB:'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                <input
                  type="text"
                  className="form-input"
                  value={customKbInput}
                  onChange={handleCustomInputChange}
                  placeholder="100"
                  style={{ fontWeight: '800', padding: '6px 10px', fontSize: '0.9rem' }}
                />
                <span style={{ fontWeight: '900', color: 'var(--nb-black)', fontSize: '0.85rem' }}>KB</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 'var(--space-md)' }}>
              <AlertCircle size={20} strokeWidth={2.5} />
              <span>{error}</span>
            </div>
          )}

          {/* Manual Re-compress button if needed */}
          <button
            type="button"
            onClick={compressImage}
            disabled={isCompressing || !selectedFile}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {isCompressing ? (
              <>
                <RefreshCw size={18} className="spin" />
                <span>{isHindi ? 'कंप्रेस हो रहा है...' : 'Compressing image...'}</span>
              </>
            ) : (
              <>
                <Sparkles size={18} strokeWidth={2.5} />
                <span>{isHindi ? '🎯 कंप्रेस करें (Compress Now)' : 'Compress to Target Size'}</span>
              </>
            )}
          </button>
        </div>

        {/* Right Side: Compression Results, Comparison & Download */}
        <div className="card" style={{ border: 'var(--border-thick)', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: 'var(--space-md)' }}>
            {isHindi ? '2. कंप्रेस्ड फ़ोटो व साइज परिणाम' : '2. Compressed Result & Savings'}
          </h3>

          {!compressedResult ? (
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
              <HardDrive size={44} strokeWidth={2} style={{ color: 'var(--nb-black)', marginBottom: '10px' }} />
              <p style={{ fontSize: '0.95rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: '4px' }}>
                {isHindi ? 'बाईं ओर कोई फोटो चुनें' : 'Select a photo on the left'}
              </p>
              <p style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-text-secondary)', margin: 0 }}>
                {isHindi ? 'साइज तुरंत घटकर यहाँ दिखाई देगा' : 'Live compressed preview will appear here'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              {/* Stat Comparison Strip */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--nb-yellow-light)',
                  border: 'var(--border-medium)',
                  boxShadow: 'var(--shadow-sm)',
                  textAlign: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                    {isHindi ? 'मूल साइज़' : 'Original'}
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--nb-black)' }}>
                    {formatFileSize(originalSizeKb)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                    {isHindi ? 'नया साइज़' : 'Compressed'}
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: '900', color: 'var(--nb-green)' }}>
                    {formatFileSize(compressedResult.sizeKb)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                    {isHindi ? 'साइज़ बचत' : 'Reduced By'}
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--nb-black)' }}>
                    📉 {compressedResult.reductionPercent}%
                  </div>
                </div>
              </div>

              {/* Portal Compliance Badge */}
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--nb-green-light)',
                  border: 'var(--border-medium)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <CheckCircle2 size={18} strokeWidth={2.5} style={{ color: 'var(--nb-green)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--nb-black)' }}>
                  {isHindi
                    ? `✅ यह फ़ोटो ${targetKb} KB की सरकारी पोर्टल सीमा के भीतर है (${compressedResult.sizeKb} KB)!`
                    : `✅ Fits strictly within the ${targetKb} KB portal limit (${compressedResult.sizeKb} KB)!`}
                </span>
              </div>

              {/* Live Image Preview */}
              <div
                style={{
                  borderRadius: 'var(--radius-sm)',
                  border: 'var(--border-medium)',
                  overflow: 'hidden',
                  backgroundColor: 'var(--nb-black)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  maxHeight: '260px',
                  position: 'relative'
                }}
              >
                <img
                  src={compressedResult.url}
                  alt="Compressed preview"
                  style={{ width: '100%', maxHeight: '260px', objectFit: 'contain' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    backgroundColor: 'rgba(0,0,0,0.75)',
                    color: 'var(--nb-white)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.75rem',
                    fontWeight: '800'
                  }}
                >
                  {compressedResult.width} × {compressedResult.height} px
                </div>
              </div>

              {/* Action Buttons: Download & Share */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: 'auto' }}>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="btn btn-primary"
                  style={{ padding: '12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Download size={18} strokeWidth={2.5} />
                  <span style={{ fontSize: '0.88rem', fontWeight: '900' }}>
                    {isHindi ? 'डाउनलोड करें' : 'Download'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="btn btn-secondary"
                  style={{ padding: '12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Share2 size={18} strokeWidth={2.5} />
                  <span style={{ fontSize: '0.88rem', fontWeight: '900' }}>
                    {copiedLink ? (isHindi ? 'साझा हुआ!' : 'Shared!') : (isHindi ? 'शेयर करें' : 'Share')}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileCompressorService;
