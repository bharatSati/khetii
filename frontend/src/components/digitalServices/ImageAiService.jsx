import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Camera,
  Upload,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Leaf,
  Bug,
  ShieldAlert,
  Info,
  RefreshCw,
  PhoneCall,
  FileCheck2,
  ExternalLink
} from 'lucide-react';
import { digitalServicesService } from '../../services/digitalServicesService';
import TTSButton from '../TTSButton';
import Loader from '../Loader';

export const ImageAiService = () => {
  const { t, i18n } = useTranslation();
  const isHindi = i18n.language?.startsWith('hi');

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [userNotes, setUserNotes] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const samplePresets = isHindi ? [
    { label: '🌿 सरसों पत्ती पर माहू कीट', note: 'सरसों के पत्ते पर माहू (चेपा) कीड़े चिपके हैं' },
    { label: '🍅 टमाटर पत्ती मुड़ना व पीलापन', note: 'टमाटर के पत्ते मुड़ रहे हैं और पीले पड़ रहे हैं' },
    { label: '🌾 धान की पत्तियों पर भूरे धब्बे', note: 'धान की पत्ती पर भूरे रंग के धब्बे दिख रहे हैं' },
    { label: '🥔 आलू पत्ता झुलसा', note: 'आलू के पत्ते सूख कर काले हो रहे हैं' }
  ] : [
    { label: '🌿 Mustard Aphid Infestation', note: 'Small yellowish aphids on mustard leaf underside' },
    { label: '🍅 Tomato Leaf Curling', note: 'Tomato leaves are yellowing and curling upwards' },
    { label: '🌾 Paddy Leaf Blast Spots', note: 'Brown spindle spots visible on paddy leaves' },
    { label: '🥔 Potato Blight Symptoms', note: 'Dark brown patches on potato foliage' }
  ];

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError(isHindi ? 'कृपया केवल छवि (JPG, PNG, WEBP) चुनें।' : 'Please choose an image file (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 12 * 1024 * 1024) {
      setError(isHindi ? 'छवि का साइज़ 12 MB से कम होना चाहिए।' : 'Image size must be less than 12 MB.');
      return;
    }

    setError('');
    setSelectedFile(file);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async () => {
    if (!previewUrl) {
      setError(isHindi ? 'कृपया पहले अपनी फसल, कीट या खेत की फोटो चुनें।' : 'Please upload or capture a farm photo first.');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      const response = await digitalServicesService.analyzeImage({
        imageBase64: previewUrl,
        mimeType: selectedFile?.type || 'image/jpeg',
        language: isHindi ? 'hi' : 'en',
        userNotes: userNotes.trim()
      });

      if (response && response.data) {
        setResult(response.data);
      } else {
        throw new Error('Analysis response was empty');
      }
    } catch (err) {
      console.error('Vision analysis error:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        (isHindi ? 'फोटो विश्लेषण में समस्या आई। कृपया पुनः प्रयास करें।' : 'Failed to analyze photo. Please try again.')
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUserNotes('');
    setResult(null);
    setError('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      {/* Hero Service Banner */}
      <div
        className="card"
        style={{
          backgroundColor: 'var(--nb-yellow-light)',
          border: 'var(--border-thick)',
          boxShadow: 'var(--shadow-md)',
          padding: '24px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ maxWidth: '780px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--nb-black)', color: 'var(--nb-white)', padding: '4px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', fontWeight: '900', marginBottom: '8px' }}>
              <Sparkles size={16} strokeWidth={2.5} style={{ color: 'var(--nb-yellow)' }} />
              {isHindi ? 'मुख्य सेवा 1: कृषि दृष्टि एआई (Hero Vision)' : 'Primary Service 1: Farm Vision AI'}
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: '8px' }}>
              {isHindi ? '🧠 फसल, कीट व रोग की फोटो से सटीक जानकारी' : '🧠 Instant Farm Intelligence from Photos'}
            </h2>
            <p style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--nb-black)', lineHeight: 1.5, margin: 0 }}>
              {isHindi
                ? 'अपने खेत, फसल के पत्ते, कीट, रोग के लक्षण या कृषि उत्पाद की तस्वीर लें। एआई तुरंत दृश्य विश्लेषण करेगा और सरकारी किसान कॉल सेंटर (KCC) के प्रमाणित समाधान दिखाएगा।'
                : 'Upload or take a photo of crops, leaves, pests, disease symptoms, or input packages. Get structured observations, cautious advice, and verified KCC agronomic advisories.'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
            <span className="badge badge-green" style={{ fontSize: '0.85rem' }}>
              🌾 {isHindi ? '100% मुफ़्त व सुरक्षित' : '100% Free & Private'}
            </span>
            <span className="badge badge-gold" style={{ fontSize: '0.82rem' }}>
              🏛️ {isHindi ? 'KCC डेटाबेस समर्थित' : 'Backed by KCC Records'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 'var(--space-xl)' }}>
        {/* Left Column: Upload & Context Card */}
        <div className="card" style={{ border: 'var(--border-thick)', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: 'var(--space-md)' }}>
            {isHindi ? '1. फोटो खींचें या अपलोड करें' : '1. Capture or Select Farm Photo'}
          </h3>

          {/* Hidden Inputs */}
          <input
            type="file"
            ref={galleryInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
          />

          {/* Two Big Action Buttons (Camera & Gallery) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: 'var(--space-md)' }}>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="btn btn-primary"
              style={{ padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textAlign: 'center' }}
            >
              <Camera size={26} strokeWidth={2.5} />
              <span style={{ fontSize: '0.9rem', fontWeight: '900' }}>
                {isHindi ? 'कैमरा से फोटो लें' : 'Take Photo'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="btn btn-secondary"
              style={{ padding: '14px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', textAlign: 'center' }}
            >
              <Upload size={26} strokeWidth={2.5} />
              <span style={{ fontSize: '0.9rem', fontWeight: '900' }}>
                {isHindi ? 'गैलरी से चुनें' : 'Choose File'}
              </span>
            </button>
          </div>

          {/* Image Preview Box */}
          {previewUrl ? (
            <div
              style={{
                borderRadius: 'var(--radius-sm)',
                border: 'var(--border-medium)',
                overflow: 'hidden',
                backgroundColor: 'var(--nb-black)',
                position: 'relative',
                marginBottom: 'var(--space-md)',
                minHeight: '220px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                src={previewUrl}
                alt="Uploaded farm preview"
                style={{ width: '100%', maxHeight: '340px', objectFit: 'contain' }}
              />
              <button
                type="button"
                onClick={handleReset}
                className="btn btn-secondary btn-sm"
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  backgroundColor: 'var(--nb-white)',
                  color: 'var(--nb-red)',
                  borderColor: 'var(--nb-black)'
                }}
              >
                {isHindi ? 'बदलें / Clear' : 'Remove'}
              </button>
            </div>
          ) : (
            <div
              onClick={() => galleryInputRef.current?.click()}
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
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '12px', color: 'var(--nb-black)' }}>
                <Leaf size={32} strokeWidth={2} />
                <Bug size={32} strokeWidth={2} />
                <Camera size={32} strokeWidth={2} />
              </div>
              <p style={{ fontWeight: '900', fontSize: '1rem', color: 'var(--nb-black)', marginBottom: '4px' }}>
                {isHindi ? 'पत्ती, कीट, रोग, खेत या खाद-दवा के पैकेट की फोटो डालें' : 'Upload photos of leaves, pests, diseases, or fertilizer packs'}
              </p>
              <p style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--color-text-secondary)', margin: 0 }}>
                {isHindi ? 'समर्थित: JPG, PNG, WEBP (दिन की अच्छी रोशनी में खींची गई फोटो बेहतर होती है)' : 'Daylight photos provide the most accurate visual assessment'}
              </p>
            </div>
          )}

          {/* Optional Farmer Notes & Symptoms */}
          <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
            <label className="form-label" style={{ fontSize: '0.9rem', fontWeight: '800' }}>
              {isHindi ? 'लक्षण या सवाल लिखें (वैकल्पिक):' : 'Add Farmer Notes / Symptoms (Optional):'}
            </label>
            <input
              type="text"
              className="form-input"
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder={isHindi ? 'उदा. सरसों के पत्ते मुड़ रहे हैं और चिपचिपाहट है...' : 'e.g. Yellowing leaf edges, black spots on stalk...'}
              style={{ fontSize: '0.9rem' }}
            />
          </div>

          {/* Quick preset chips */}
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
              {isHindi ? 'त्वरित संदर्भ उदाहरण:' : 'Quick Presets:'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {samplePresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setUserNotes(preset.note)}
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontSize: '0.78rem',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: userNotes === preset.note ? 'var(--nb-yellow-light)' : 'var(--nb-white)'
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 'var(--space-md)' }}>
              <AlertTriangle size={20} strokeWidth={2.5} />
              <span>{error}</span>
            </div>
          )}

          {/* Analyze CTA */}
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing || !previewUrl}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {analyzing ? (
              <>
                <RefreshCw size={20} className="spin" />
                <span>{isHindi ? 'फोटो का गहन विश्लेषण हो रहा है...' : 'Analyzing farm photo with AI...'}</span>
              </>
            ) : (
              <>
                <Sparkles size={20} strokeWidth={2.5} />
                <span>{isHindi ? 'फोटो से जांच करें (Analyze Image)' : 'Analyze with Farm Vision AI'}</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Structured AI Output & Safety Card */}
        <div className="card" style={{ border: 'var(--border-thick)', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--nb-black)', margin: 0 }}>
              {isHindi ? '2. एआई विश्लेषण व समाधान' : '2. Visual Assessment & Advisory'}
            </h3>

            {result && result.farmerAdviceSummary && (
              <TTSButton
                text={result.farmerAdviceSummary}
                variant="secondary"
                size="sm"
                label={isHindi ? 'सलाह सुनें' : 'Listen'}
              />
            )}
          </div>

          {analyzing ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
              <Loader message={isHindi ? 'पौधे के अंगों, कीट व लक्षणों का विश्लेषण किया जा रहा है...' : 'Analyzing plant morphology, pest presence, and symptoms...'} />
            </div>
          ) : !result ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--space-2xl)',
                backgroundColor: 'var(--nb-canvas-alt)',
                border: 'var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center'
              }}
            >
              <Sparkles size={46} strokeWidth={2} style={{ color: 'var(--nb-black)', marginBottom: '12px' }} />
              <h4 style={{ fontSize: '1.05rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: '6px' }}>
                {isHindi ? 'कोई फोटो विश्लेषित नहीं है' : 'No Photo Analyzed Yet'}
              </h4>
              <p style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--color-text-secondary)', maxWidth: '380px', margin: 0 }}>
                {isHindi
                  ? 'बाईं ओर कैमरा या गैलरी से फोटो चुनें और "फोटो से जांच करें" बटन दबाएं।'
                  : 'Take or choose a photo on the left and click "Analyze with Farm Vision AI" to view structured agronomic guidance.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Type, Crop & Confidence Header */}
              <div
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--nb-yellow-light)',
                  border: 'var(--border-medium)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: '900', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                    {result.imageType || (isHindi ? 'दृश्य प्रकार' : 'Visual Type')}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '900', color: 'var(--nb-black)' }}>
                    {result.crop ? `🌱 ${result.crop}` : (result.title || (isHindi ? 'कृषि दृश्य स्कैन' : 'Farm Scan'))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <span
                    className={`badge ${
                      result.confidence === 'High' ? 'badge-green' : result.confidence === 'Low' ? 'badge-red' : 'badge-gold'
                    }`}
                  >
                    {isHindi ? 'विश्वसनीयता:' : 'Confidence:'} {result.confidence}
                  </span>
                </div>
              </div>

              {/* Farmer Summary Banner */}
              {result.farmerAdviceSummary && (
                <div
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--nb-green-light)',
                    border: 'var(--border-medium)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ fontWeight: '900', fontSize: '0.92rem', color: 'var(--nb-black)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Info size={18} strokeWidth={2.5} style={{ color: 'var(--nb-green)' }} />
                    {isHindi ? 'किसान परामर्श सारांश:' : 'Agronomist Summary:'}
                  </div>
                  <p style={{ fontSize: '0.92rem', fontWeight: '700', color: 'var(--nb-black)', margin: 0, lineHeight: 1.5 }}>
                    {result.farmerAdviceSummary}
                  </p>
                </div>
              )}

              {/* Observations */}
              <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--nb-white)', border: 'var(--border-medium)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🔍 {isHindi ? 'फोटो में क्या दिखाई दिया (What I Observe):' : 'Visual Observations:'}
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {result.observations.map((obs, idx) => (
                    <li key={idx} style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--nb-black)', lineHeight: 1.4 }}>
                      {obs}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Possible Issue */}
              <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--nb-orange-light)', border: 'var(--border-medium)' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '900', textTransform: 'uppercase', color: 'var(--nb-black)', marginBottom: '2px' }}>
                  ⚠️ {isHindi ? 'संभावित समस्या (Possible Issue):' : 'Possible Issue Identified:'}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--nb-black)' }}>
                  {result.possibleIssue}
                </div>
              </div>

              {/* Recommended Actions */}
              <div style={{ padding: '14px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--nb-white)', border: 'var(--border-medium)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📌 {isHindi ? 'आपको क्या करना चाहिए (Recommended Actions):' : 'Recommended Farm Actions:'}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {result.recommendedActions.map((action, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.88rem', fontWeight: '700', color: 'var(--nb-black)' }}>
                      <CheckCircle2 size={16} strokeWidth={2.5} style={{ color: 'var(--nb-green)', marginTop: '2px', flexShrink: 0 }} />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warnings & Safety Protocol */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--nb-red-light)',
                  border: 'var(--border-medium)',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  color: 'var(--nb-black)'
                }}
              >
                <div style={{ fontWeight: '900', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldAlert size={16} strokeWidth={2.5} style={{ color: 'var(--nb-red)' }} />
                  {isHindi ? 'महत्वपूर्ण कृषि सुरक्षा निर्देश:' : 'Crucial Agricultural Safety Notice:'}
                </div>
                {result.warnings.map((warn, idx) => (
                  <div key={idx} style={{ marginBottom: '2px' }}>• {warn}</div>
                ))}
              </div>

              {/* Verified KCC Official Advisories (from Indian Govt Dataset) */}
              {result.kccAdvisories && result.kccAdvisories.length > 0 && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '16px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--nb-purple-light)',
                    border: 'var(--border-thick)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ fontWeight: '900', fontSize: '1rem', color: 'var(--nb-black)' }}>
                      🏛️ {isHindi ? 'सरकारी किसान कॉल सेंटर (KCC) के प्रमाणित उत्तर' : 'Official Kisan Call Centre (KCC) Advisories'}
                    </div>
                    <span className="badge badge-gold" style={{ fontSize: '0.75rem' }}>
                      Govt of India
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {result.kccAdvisories.map((kcc, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: 'var(--nb-white)',
                          padding: '12px',
                          borderRadius: 'var(--radius-sm)',
                          border: 'var(--border-medium)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--color-text-secondary)' }}>
                            ❓ {kcc.question}
                          </div>
                          <TTSButton text={kcc.answer} size="sm" variant="secondary" />
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--nb-black)', lineHeight: 1.4, whiteSpace: 'pre-line' }}>
                          ✅ {kcc.answer}
                        </div>
                        <div style={{ marginTop: '4px', fontSize: '0.74rem', fontWeight: '700', color: 'var(--nb-green)' }}>
                          {kcc.source} • {kcc.crop}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Free Toll-Free Call Centre Help */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  backgroundColor: 'var(--nb-canvas-alt)',
                  borderRadius: 'var(--radius-sm)',
                  border: 'var(--border-medium)',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PhoneCall size={20} strokeWidth={2.5} style={{ color: 'var(--nb-green)' }} />
                  <div>
                    <div style={{ fontWeight: '900', fontSize: '0.88rem', color: 'var(--nb-black)' }}>
                      {isHindi ? 'निःशुल्क किसान कॉल सेंटर सहायता:' : 'Free Kisan Call Centre Helpline:'}
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-text-secondary)' }}>
                      1800-180-1551 (टोल-फ्री, सुबह 6 से रात 10 बजे)
                    </div>
                  </div>
                </div>
                <a
                  href="tel:18001801551"
                  className="btn btn-secondary btn-sm"
                  style={{ textDecoration: 'none' }}
                >
                  {isHindi ? '📞 अभी कॉल करें' : '📞 Call Now'}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageAiService;
