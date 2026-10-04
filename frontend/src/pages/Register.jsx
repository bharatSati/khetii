import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Sprout, UserPlus, AlertCircle, MapPin, Compass, CheckCircle2, RefreshCw, Crosshair, Sparkles } from 'lucide-react';

const INDIAN_STATES = [
  'Uttar Pradesh',
  'Madhya Pradesh',
  'Punjab',
  'Haryana',
  'Rajasthan',
  'Maharashtra',
  'Gujarat',
  'Bihar',
  'West Bengal',
  'Karnataka',
  'Andhra Pradesh',
  'Telangana',
  'Tamil Nadu',
  'Odisha',
  'Uttarakhand',
  'Himachal Pradesh',
  'Delhi'
];

export const Register = () => {
  const { t, i18n } = useTranslation();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    language: i18n.language?.startsWith('hi') ? 'hi' : 'en',
    state: 'Delhi',
    district: 'New Delhi',
    city: 'Delhi',
    latitude: 28.6139,
    longitude: 77.2090,
    locationRecorded: false,
    landSizeAcres: '',
    mainCrops: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tracingLocation, setTracingLocation] = useState(false);
  const [locationStatus, setLocationStatus] = useState('default'); // 'default', 'tracing', 'detected', 'denied'
  const [locationMessage, setLocationMessage] = useState('');

  const handleRecordLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      setLocationMessage(
        i18n.language?.startsWith('hi')
          ? 'ब्राउज़र में जीपीएस सपोर्ट नहीं है। आप नीचे अपना राज्य और जिला मैन्युअली चुन सकते हैं।'
          : 'Geolocation not supported by your browser. Please select State & District manually below.'
      );
      return;
    }

    setTracingLocation(true);
    setLocationStatus('tracing');
    setLocationMessage(
      i18n.language?.startsWith('hi')
        ? '🛰️ आपकी लाइव लोकेशन ट्रेस की जा रही है...'
        : '🛰️ Tracing your live farm location...'
    );

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let detectedCity = '';
        let detectedDistrict = '';
        let detectedState = '';

        try {
          // 1. Try BigDataCloud reverse geocode (fast, accurate for Indian districts without commissioner division confusion)
          try {
            const bdcRes = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            if (bdcRes.ok) {
              const bdcData = await bdcRes.json();
              if (bdcData.principalSubdivision) detectedState = bdcData.principalSubdivision;
              if (bdcData.city || bdcData.locality) detectedCity = bdcData.city || bdcData.locality;

              const adminList = bdcData.localityInfo?.administrative || [];
              const distObj = adminList.find(a => a.adminLevel === 5 || a.adminLevel === 3 || a.name?.toLowerCase().includes('district'));
              if (distObj && distObj.name) {
                detectedDistrict = distObj.name.replace(/ district/i, '').trim();
              }
            }
          } catch (e) {
            console.warn('BigDataCloud geocode warning:', e.message);
          }

          // 2. OpenStreetMap Nominatim with strict priority for district/county over state_district
          if (!detectedDistrict || !detectedState) {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            );
            if (res.ok) {
              const data = await res.json();
              const addr = data.address || {};
              if (!detectedState) detectedState = addr.state || 'Uttar Pradesh';
              if (!detectedDistrict) {
                // In India, addr.district and addr.county are actual districts.
                // addr.state_district is the commissioner division (e.g. 'Agra Division').
                detectedDistrict = addr.district || addr.county || addr.city_district || addr.subdistrict || 
                  (addr.state_district ? addr.state_district.replace(/ division/i, '').trim() : '') || 
                  addr.city || 'Delhi';
              }
              if (!detectedCity) {
                detectedCity = addr.city || addr.town || addr.village || addr.suburb || addr.neighbourhood || detectedDistrict;
              }
            }
          }
        } catch (e) {
          console.warn('Reverse geocoding error:', e.message);
        }

        const finalState = detectedState || formData.state || 'Delhi';
        const finalDistrict = detectedDistrict || formData.district || 'New Delhi';
        const finalCity = detectedCity || finalDistrict;

        setFormData((prev) => ({
          ...prev,
          latitude: Number(latitude.toFixed(4)),
          longitude: Number(longitude.toFixed(4)),
          state: finalState,
          district: finalDistrict,
          city: finalCity,
          locationRecorded: true
        }));

        setTracingLocation(false);
        setLocationStatus('detected');
        setLocationMessage(
          i18n.language?.startsWith('hi')
            ? `✅ लाइव लोकेशन दर्ज हुई: ${finalDistrict}, ${finalState} (${latitude.toFixed(2)}° N, ${longitude.toFixed(2)}° E)`
            : `✅ Live location recorded: ${finalDistrict}, ${finalState} (${latitude.toFixed(2)}° N, ${longitude.toFixed(2)}° E)`
        );
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setTracingLocation(false);
        setLocationStatus('denied');
        setLocationMessage(
          i18n.language?.startsWith('hi')
            ? '⚠️ जीपीएस अनुमति नहीं मिली। कृपया नीचे अपना राज्य और जिला स्वयं चुनें।'
            : '⚠️ GPS permission not granted. Please select your State & District manually below.'
        );
      },
      { timeout: 15000, enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  const handleDistrictBlur = async () => {
    if (formData.district && formData.district.trim().length > 2) {
      try {
        const q = encodeURIComponent(`${formData.district.trim()}, ${formData.state}, India`);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`);
        if (res.ok) {
          const list = await res.json();
          if (list && list.length > 0) {
            const lat = Number(parseFloat(list[0].lat).toFixed(4));
            const lon = Number(parseFloat(list[0].lon).toFixed(4));
            setFormData((prev) => ({
              ...prev,
              latitude: lat,
              longitude: lon,
              locationRecorded: true
            }));
          }
        }
      } catch (err) {
        console.warn('Geocoding district error:', err.message);
      }
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in name, email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register({
        ...formData,
        landSizeAcres: formData.landSizeAcres ? Number(formData.landSizeAcres) : 0,
        mainCrops: formData.mainCrops ? formData.mainCrops.split(',').map((c) => c.trim()) : []
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - var(--header-height) - 100px)',
        padding: 'var(--space-md)'
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '580px',
          width: '100%',
          padding: 'var(--space-2xl) var(--space-xl)',
          border: 'var(--border-thick)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-xl)',
          backgroundColor: 'var(--nb-white)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--nb-yellow)',
              border: 'var(--border-medium)',
              boxShadow: 'var(--shadow-sm)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--nb-black)',
              marginBottom: 'var(--space-sm)'
            }}
          >
            <Sprout size={32} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '900', letterSpacing: '-0.5px' }}>
            {t('auth.registerTitle')}
          </h1>
          <p style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            {i18n.language?.startsWith('hi') ? 'मुफ्त पंजीकरण करें और अपने खेत से जुड़ी सेवाएं पाएं' : 'Free registration for personalized farming services'}
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 'var(--space-md)' }}>
            <AlertCircle size={20} strokeWidth={2.5} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">{t('auth.name')} *</label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
                placeholder="उदा. रमेश कुमार"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('auth.email')} *</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                placeholder="ramesh@gmail.com"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">{t('auth.password')} *</label>
              <input
                type="password"
                name="password"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                placeholder="कम से कम 6 अक्षर"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('auth.preferredLanguage')}</label>
              <select
                name="language"
                className="form-select"
                value={formData.language}
                onChange={handleChange}
              >
                <option value="hi">हिंदी (Hindi)</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          <div
            style={{
              margin: 'var(--space-md) 0',
              padding: 'var(--space-md)',
              backgroundColor: 'var(--nb-canvas-alt)',
              border: 'var(--border-medium)',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <div style={{ fontSize: '0.88rem', fontWeight: '900', color: 'var(--nb-black)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              कृषि विवरण (व्यक्तिगत मंडी भाव और योजनाओं के लिए)
            </div>

            {/* Automatic Location Permission & Geolocation Trace Section */}
            <div
              style={{
                marginBottom: 'var(--space-md)',
                backgroundColor: 'var(--nb-white)',
                border: 'var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                boxShadow: 'var(--shadow-sm)',
                padding: 'var(--space-md)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={18} strokeWidth={2.5} style={{ color: 'var(--nb-black)' }} />
                  <span style={{ fontSize: '0.88rem', fontWeight: '900', textTransform: 'uppercase' }}>
                    {i18n.language?.startsWith('hi') ? 'खेत की लोकेशन (स्वचालित जीपीएस रिकॉर्डिंग)' : 'Farm Location (Auto GPS Record)'}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.76rem',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: formData.locationRecorded ? 'var(--nb-green-light)' : 'var(--nb-yellow-light)',
                    border: '1.5px solid #000'
                  }}
                >
                  {formData.locationRecorded
                    ? (i18n.language?.startsWith('hi') ? '✅ जीपीएस रिकॉर्डेड' : '✅ GPS Recorded')
                    : (i18n.language?.startsWith('hi') ? '📍 डिफ़ॉल्ट: Delhi' : '📍 Default: Delhi')}
                </span>
              </div>

              <p style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '12px', lineHeight: 1.4 }}>
                {i18n.language?.startsWith('hi')
                  ? 'सटीक लाइव मौसम पूर्वानुमान और स्थानीय मंडी भाव के लिए लोकेशन रिकॉर्ड करने की अनुमति दें। (अनुमति न देने पर डिफ़ॉल्ट रूप से दिल्ली सेट रहेगा)'
                  : 'Allow location recording for live hyper-local farm weather and mandi intelligence. (Defaults to Delhi if not allowed)'}
              </p>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleRecordLocation}
                  className="btn btn-secondary btn-sm"
                  style={{
                    backgroundColor: formData.locationRecorded ? 'var(--nb-green-light)' : 'var(--nb-yellow)',
                    border: '2px solid #000',
                    boxShadow: '3px 3px 0px #000',
                    fontWeight: '900',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    cursor: 'pointer'
                  }}
                  disabled={tracingLocation}
                >
                  {tracingLocation ? (
                    <>
                      <RefreshCw size={16} strokeWidth={2.5} className="spin" />
                      <span>{i18n.language?.startsWith('hi') ? 'ट्रेस किया जा रहा है...' : 'Tracing Location...'}</span>
                    </>
                  ) : formData.locationRecorded ? (
                    <>
                      <CheckCircle2 size={16} strokeWidth={2.5} style={{ color: 'var(--nb-green)' }} />
                      <span>{i18n.language?.startsWith('hi') ? 'पुनः रिकॉर्ड करें' : 'Update Location'}</span>
                    </>
                  ) : (
                    <>
                      <Crosshair size={16} strokeWidth={2.5} />
                      <span>{i18n.language?.startsWith('hi') ? '📍 अपनी लोकेशन रिकॉर्ड करने की अनुमति दें' : '📍 Allow Location Recording'}</span>
                    </>
                  )}
                </button>

                <div style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--nb-black)' }}>
                  📍 {formData.district}, {formData.state} <span style={{ opacity: 0.6, fontSize: '0.78rem' }}>({formData.latitude}° N, {formData.longitude}° E)</span>
                </div>
              </div>

              {locationMessage && (
                <div
                  style={{
                    marginTop: '10px',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    color: formData.locationRecorded ? 'var(--nb-green)' : '#92400e'
                  }}
                >
                  {locationMessage}
                </div>
              )}

              {/* Editable Location Fields: State, District, City */}
              <div
                style={{
                  marginTop: 'var(--space-md)',
                  paddingTop: 'var(--space-md)',
                  borderTop: '1px dashed #cbd5e1'
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                  ✏️ {i18n.language?.startsWith('hi') ? 'यदि जीपीएस सही न हो, तो अपना सही राज्य और जिला स्वयं चुनें:' : 'If GPS is inaccurate, select or edit your State & District manually:'}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-md)' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.82rem' }}>
                      राज्य / State *
                    </label>
                    <select
                      name="state"
                      className="form-select"
                      value={formData.state}
                      onChange={handleChange}
                      required
                    >
                      {INDIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.82rem' }}>
                      जिला / District *
                    </label>
                    <input
                      type="text"
                      name="district"
                      className="form-input"
                      value={formData.district}
                      onChange={handleChange}
                      onBlur={handleDistrictBlur}
                      placeholder="उदा. Hathras, Aligarh, Meerut..."
                      required
                    >
                    </input>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '0.82rem' }}>
                      शहर / गांव / City/Village
                    </label>
                    <input
                      type="text"
                      name="city"
                      className="form-input"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="उदा. सासनी, सादाबाद..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">{t('auth.landSize')}</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  name="landSizeAcres"
                  className="form-input"
                  value={formData.landSizeAcres}
                  onChange={handleChange}
                  placeholder="उदा. 3.5"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('auth.mainCrops')}</label>
                <input
                  type="text"
                  name="mainCrops"
                  className="form-input"
                  value={formData.mainCrops}
                  onChange={handleChange}
                  placeholder="उदा. Wheat, Mustard, Paddy"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 'var(--space-sm)' }}
            disabled={loading}
          >
            {loading ? (
              <span>{t('common.loading')}</span>
            ) : (
              <>
                <UserPlus size={20} strokeWidth={2.5} />
                <span>{t('nav.register')}</span>
              </>
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: 'var(--space-xl)',
            textAlign: 'center',
            fontSize: '0.95rem',
            fontWeight: '700',
            paddingTop: 'var(--space-md)',
            borderTop: 'var(--border-thin)'
          }}
        >
          <span>{t('auth.alreadyHaveAccount')} </span>
          <Link to="/login" style={{ color: 'var(--nb-green)', fontWeight: '900' }}>
            {t('auth.loginNow')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
