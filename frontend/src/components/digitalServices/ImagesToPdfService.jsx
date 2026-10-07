import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { jsPDF } from 'jspdf';
import {
  FileText,
  Upload,
  Camera,
  Trash2,
  RotateCw,
  ArrowUp,
  ArrowDown,
  Download,
  CheckCircle2,
  AlertCircle,
  FilePlus,
  RefreshCw,
  Layers,
  Sparkles
} from 'lucide-react';

export const ImagesToPdfService = () => {
  const { t, i18n } = useTranslation();
  const isHindi = i18n.language?.startsWith('hi');

  // List of images: [{ id, file, url, rotation: 0, width, height, name, size }]
  const [images, setImages] = useState([]);
  const [fileName, setFileName] = useState('Khetii_Documents');
  const [pageOrientation, setPageOrientation] = useState('p'); // 'p' = portrait, 'l' = landscape
  const [pageSize, setPageSize] = useState('a4');
  const [marginMm, setMarginMm] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFilesAdded = (filesList) => {
    if (!filesList || filesList.length === 0) return;

    setError('');
    setSuccessMessage('');

    const newItems = [];
    Array.from(filesList).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setError(isHindi ? 'केवल इमेज फाइलें (JPG, PNG, WEBP) समर्थित हैं।' : 'Only image files (JPG, PNG, WEBP) are supported.');
        return;
      }

      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const url = URL.createObjectURL(file);

      newItems.push({
        id,
        file,
        url,
        rotation: 0,
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB'
      });
    });

    setImages((prev) => [...prev, ...newItems]);
  };

  const handleRotate = (id) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, rotation: (img.rotation + 90) % 360 } : img
      )
    );
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveDown = (index) => {
    if (index === images.length - 1) return;
    setImages((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleRemove = (id) => {
    setImages((prev) => {
      const target = prev.find((x) => x.id === id);
      if (target && target.url) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((x) => x.id !== id);
    });
  };

  const handleClearAll = () => {
    images.forEach((img) => {
      if (img.url) URL.revokeObjectURL(img.url);
    });
    setImages([]);
    setSuccessMessage('');
    setError('');
  };

  // Convert an image URL + rotation to an offscreen canvas data URL
  const prepareImageDataUrl = (imageUrl, rotation) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const rot = (rotation % 360 + 360) % 360;

        if (rot === 90 || rot === 270) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        ctx.save();
        if (rot === 90) {
          ctx.translate(canvas.width, 0);
          ctx.rotate((90 * Math.PI) / 180);
        } else if (rot === 180) {
          ctx.translate(canvas.width, canvas.height);
          ctx.rotate((180 * Math.PI) / 180);
        } else if (rot === 270) {
          ctx.translate(0, canvas.height);
          ctx.rotate((270 * Math.PI) / 180);
        }

        ctx.drawImage(img, 0, 0);
        ctx.restore();

        resolve({
          dataUrl: canvas.toDataURL('image/jpeg', 0.92),
          width: canvas.width,
          height: canvas.height
        });
      };
      img.onerror = (err) => reject(err);
      img.src = imageUrl;
    });
  };

  const handleGeneratePdf = async () => {
    if (images.length === 0) {
      setError(isHindi ? 'कृपया कम से कम एक फोटो जोड़ें।' : 'Please add at least one image.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setSuccessMessage('');

    try {
      const doc = new jsPDF({
        orientation: pageOrientation,
        unit: 'mm',
        format: pageSize
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = Number(marginMm);
      const printableWidth = pageWidth - margin * 2;
      const printableHeight = pageHeight - margin * 2;

      for (let i = 0; i < images.length; i++) {
        if (i > 0) {
          doc.addPage(pageSize, pageOrientation);
        }

        const prepared = await prepareImageDataUrl(images[i].url, images[i].rotation);

        // Calculate aspect-ratio scaling inside printable boundaries
        const imgRatio = prepared.width / prepared.height;
        const pageRatio = printableWidth / printableHeight;

        let renderWidth = printableWidth;
        let renderHeight = printableHeight;

        if (imgRatio > pageRatio) {
          // Limited by width
          renderWidth = printableWidth;
          renderHeight = printableWidth / imgRatio;
        } else {
          // Limited by height
          renderHeight = printableHeight;
          renderWidth = printableHeight * imgRatio;
        }

        // Center on the page
        const xOffset = margin + (printableWidth - renderWidth) / 2;
        const yOffset = margin + (printableHeight - renderHeight) / 2;

        doc.addImage(prepared.dataUrl, 'JPEG', xOffset, yOffset, renderWidth, renderHeight, undefined, 'FAST');
      }

      const finalName = (fileName.trim() || 'Khetii_Documents').replace(/\.pdf$/i, '') + '.pdf';
      doc.save(finalName);

      setSuccessMessage(
        isHindi
          ? `🎉 सफलतापूर्वक "${finalName}" तैयार हुआ (${images.length} पेज)!`
          : `🎉 Successfully generated "${finalName}" with ${images.length} page(s)!`
      );
    } catch (err) {
      console.error('PDF Generation error:', err);
      setError(isHindi ? 'PDF बनाने में त्रुटि हुई। कृपया पुनः प्रयास करें।' : 'Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      {/* Service Header Card */}
      <div
        className="card"
        style={{
          backgroundColor: 'var(--nb-blue-light)',
          border: 'var(--border-thick)',
          boxShadow: 'var(--shadow-md)',
          padding: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ maxWidth: '780px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--nb-black)', color: 'var(--nb-white)', padding: '4px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', fontWeight: '900', marginBottom: '8px' }}>
              <Layers size={16} strokeWidth={2.5} style={{ color: 'var(--nb-blue-bright)' }} />
              {isHindi ? 'सेवा 2: फ़ोटो से सिंगल PDF कनवर्टर' : 'Service 2: Images to Single PDF'}
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: '8px' }}>
              {isHindi ? '🖼️ कई फ़ोटो को जोड़कर तुरंत सरकारी PDF बनाएं' : '🖼️ Combine Multiple Photos into One Clean PDF'}
            </h2>
            <p style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--nb-black)', lineHeight: 1.5, margin: 0 }}>
              {isHindi
                ? 'पीएम किसान, फसल बीमा, खसरा-खतौनी, बैंक पासबुक या खाद-बीज बिलों की कई तस्वीरों को एक सुरक्षित PDF में जोड़ें। अपने मोबाइल में तुरंत तैयार करें — बिना किसी सर्वर अपलोड के 100% गोपनीय!'
                : 'Government portals strictly demand single PDF uploads. Select photos, reorder pages, rotate if sideways, and download a lightweight, print-ready PDF in seconds without uploading anywhere.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
            <span className="badge badge-green" style={{ fontSize: '0.85rem' }}>
              🔒 {isHindi ? '100% प्राइवेट (कोई सर्वर अपलोड नहीं)' : '100% Client-Side Private'}
            </span>
            <span className="badge badge-gold" style={{ fontSize: '0.82rem' }}>
              ⚡ {isHindi ? 'तत्काल A4 साइज़ जनरेटर' : 'Instant A4 Generator'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Controls Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-xl)' }}>
        {/* Left Side: Upload & Reorder Card */}
        <div className="card" style={{ border: 'var(--border-thick)', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--nb-black)', margin: 0 }}>
              {isHindi ? '1. फ़ोटो जोड़ें व क्रम तय करें' : '1. Add & Order Photos'}
            </h3>

            {images.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="btn btn-secondary btn-sm"
                style={{ color: 'var(--nb-red)', borderColor: 'var(--nb-black)' }}
              >
                <Trash2 size={14} strokeWidth={2.5} />
                <span>{isHindi ? 'सभी हटाएं' : 'Clear All'}</span>
              </button>
            )}
          </div>

          {/* Hidden Inputs */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFilesAdded(e.target.files)}
            accept="image/*"
            multiple
            style={{ display: 'none' }}
          />
          <input
            type="file"
            ref={cameraInputRef}
            onChange={(e) => handleFilesAdded(e.target.files)}
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
              <FilePlus size={20} strokeWidth={2.5} />
              <span style={{ fontSize: '0.88rem', fontWeight: '900' }}>
                {isHindi ? 'फ़ाइलें चुनें (मल्टीपल)' : 'Upload Images'}
              </span>
            </button>
          </div>

          {/* Empty State or Images List */}
          {images.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '3px dashed var(--nb-black)',
                borderRadius: 'var(--radius-sm)',
                padding: '40px 20px',
                textAlign: 'center',
                backgroundColor: 'var(--nb-canvas-alt)',
                cursor: 'pointer',
                marginBottom: 'var(--space-md)'
              }}
            >
              <FileText size={44} strokeWidth={2} style={{ color: 'var(--nb-black)', margin: '0 auto 10px' }} />
              <p style={{ fontWeight: '900', fontSize: '1rem', color: 'var(--nb-black)', marginBottom: '4px' }}>
                {isHindi ? 'दस्तावेज़ों की तस्वीरें यहां जोड़ें' : 'Click here or drag images to add'}
              </p>
              <p style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-text-secondary)', margin: 0 }}>
                {isHindi ? 'आप एक बार में कई तस्वीरें (खसरा, आधार, रसीद आदि) चुन सकते हैं' : 'Select multiple images at once (Khasra, Aadhaar, receipts)'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: 'var(--space-md)', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
              {images.map((img, index) => (
                <div
                  key={img.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'var(--border-medium)',
                    backgroundColor: 'var(--nb-white)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  {/* Page Number Badge */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--nb-yellow-light)',
                      border: 'var(--border-thin)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '900',
                      fontSize: '0.85rem',
                      flexShrink: 0
                    }}
                  >
                    #{index + 1}
                  </div>

                  {/* Thumbnail with CSS Rotation */}
                  <div
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'var(--border-thin)',
                      overflow: 'hidden',
                      backgroundColor: 'var(--nb-black)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <img
                      src={img.url}
                      alt={img.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: `rotate(${img.rotation}deg)`,
                        transition: 'transform 0.2s ease'
                      }}
                    />
                  </div>

                  {/* Name & Size */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: '800', fontSize: '0.88rem', color: 'var(--nb-black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {img.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-text-secondary)' }}>
                      {img.size} {img.rotation > 0 && `• 🔄 ${img.rotation}°`}
                    </div>
                  </div>

                  {/* Action Controls (Reorder & Rotate & Delete) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      title={isHindi ? 'घुमाएं (90°)' : 'Rotate 90°'}
                      onClick={() => handleRotate(img.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '6px' }}
                    >
                      <RotateCw size={15} strokeWidth={2.5} />
                    </button>

                    <button
                      type="button"
                      title={isHindi ? 'ऊपर करें' : 'Move Up'}
                      disabled={index === 0}
                      onClick={() => handleMoveUp(index)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '6px' }}
                    >
                      <ArrowUp size={15} strokeWidth={2.5} />
                    </button>

                    <button
                      type="button"
                      title={isHindi ? 'नीचे करें' : 'Move Down'}
                      disabled={index === images.length - 1}
                      onClick={() => handleMoveDown(index)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '6px' }}
                    >
                      <ArrowDown size={15} strokeWidth={2.5} />
                    </button>

                    <button
                      type="button"
                      title={isHindi ? 'हटाएं' : 'Remove'}
                      onClick={() => handleRemove(img.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '6px', color: 'var(--nb-red)' }}
                    >
                      <Trash2 size={15} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick status counter */}
          <div style={{ marginTop: 'auto', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', fontWeight: '800', color: 'var(--nb-black)' }}>
            <span>{isHindi ? 'कुल चुनी गई तस्वीरें:' : 'Total Pages:'} {images.length}</span>
            <span>{images.length > 0 && `~ ${images.length} ${isHindi ? 'पेज की PDF बनेगी' : 'page PDF'}`}</span>
          </div>
        </div>

        {/* Right Side: PDF Settings & Generate Card */}
        <div className="card" style={{ border: 'var(--border-thick)', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: 'var(--space-md)' }}>
            {isHindi ? '2. PDF सेटिंग्स व डाउनलोड' : '2. PDF Settings & Download'}
          </h3>

          {/* File Name Input */}
          <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
            <label className="form-label" style={{ fontSize: '0.9rem', fontWeight: '800' }}>
              {isHindi ? 'PDF फ़ाइल का नाम:' : 'PDF File Name:'}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="text"
                className="form-input"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Khetii_Documents"
                style={{ fontWeight: '700' }}
              />
              <span style={{ fontWeight: '900', color: 'var(--nb-black)' }}>.pdf</span>
            </div>
          </div>

          {/* Orientation & Format Options */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: '800' }}>
                {isHindi ? 'पेज लेआउट:' : 'Page Layout:'}
              </label>
              <select
                className="form-select"
                value={pageOrientation}
                onChange={(e) => setPageOrientation(e.target.value)}
                style={{ fontWeight: '700' }}
              >
                <option value="p">{isHindi ? 'सीधा (Portrait A4)' : 'Portrait (A4)'}</option>
                <option value="l">{isHindi ? 'आड़ा (Landscape A4)' : 'Landscape (A4)'}</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: '800' }}>
                {isHindi ? 'मार्जिन (किनारा):' : 'Margins:'}
              </label>
              <select
                className="form-select"
                value={marginMm}
                onChange={(e) => setMarginMm(Number(e.target.value))}
                style={{ fontWeight: '700' }}
              >
                <option value={5}>{isHindi ? 'पतला (5 मिमी)' : 'Narrow (5mm)'}</option>
                <option value={10}>{isHindi ? 'सामान्य (10 मिमी)' : 'Normal (10mm)'}</option>
                <option value={15}>{isHindi ? 'चौड़ा (15 मिमी)' : 'Wide (15mm)'}</option>
              </select>
            </div>
          </div>

          {/* Portal compliance guidelines banner */}
          <div
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--nb-yellow-light)',
              border: 'var(--border-medium)',
              marginBottom: 'var(--space-md)'
            }}
          >
            <div style={{ fontWeight: '900', fontSize: '0.88rem', color: 'var(--nb-black)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} strokeWidth={2.5} style={{ color: 'var(--nb-black)' }} />
              {isHindi ? 'सरकारी पोर्टल हेतु आवश्यक सुझाव:' : 'Govt Portal Ready:'}
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.82rem', fontWeight: '700', color: 'var(--nb-black)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <li>{isHindi ? 'सभी पन्नों को सीधा रखने के लिए 🔄 बटन से घुमा लें।' : 'Rotate sideways photos upright with the 🔄 button.'}</li>
              <li>{isHindi ? 'पहला पन्ना मुख्य दस्तावेज़ (खसरा/आधार) रखें।' : 'Ensure page 1 is your primary document.'}</li>
              <li>{isHindi ? 'यह PDF सीधे CSC, PM-Kisan और बैंक पोर्टलों पर अपलोड हो सकती है।' : 'Ready for direct upload to CSC, PM-Kisan & banking portals.'}</li>
            </ul>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 'var(--space-md)' }}>
              <AlertCircle size={20} strokeWidth={2.5} />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success" style={{ marginBottom: 'var(--space-md)' }}>
              <CheckCircle2 size={20} strokeWidth={2.5} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Generate PDF Button */}
          <button
            type="button"
            onClick={handleGeneratePdf}
            disabled={isGenerating || images.length === 0}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={20} className="spin" />
                <span>{isHindi ? 'PDF तैयार हो रही है...' : 'Generating PDF in browser...'}</span>
              </>
            ) : (
              <>
                <Download size={20} strokeWidth={2.5} />
                <span>
                  {isHindi
                    ? `PDF बनाएं व डाउनलोड करें (${images.length} पेज)`
                    : `Generate & Download PDF (${images.length} Pages)`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImagesToPdfService;
