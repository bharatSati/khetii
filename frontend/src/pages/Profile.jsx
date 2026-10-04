import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  User,
  LogOut,
  Save,
  Check,
  AlertCircle
} from 'lucide-react';

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
  'Himachal Pradesh'
];

export const Profile = () => {
  const { t, i18n } = useTranslation();
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    language: user?.language || i18n.language || 'hi',
    state: user?.state || '',
    district: user?.district || '',
    landSizeAcres: user?.landSizeAcres || '',
    mainCrops: (user?.mainCrops || []).join(', ')
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      let lat = user?.latitude || 28.6139;
      let lon = user?.longitude || 77.2090;

      // If user changed district or state, geocode them so latitude & longitude match the new district
      if (formData.district && (formData.district !== user?.district || formData.state !== user?.state)) {
        try {
          const q = encodeURIComponent(`${formData.district.trim()}, ${formData.state || ''}, India`);
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1`);
          if (res.ok) {
            const list = await res.json();
            if (list && list.length > 0) {
              lat = Number(parseFloat(list[0].lat).toFixed(4));
              lon = Number(parseFloat(list[0].lon).toFixed(4));
            }
          }
        } catch (e) {
          console.warn('Geocoding error:', e);
        }
      }

      await updateProfile({
        name: formData.name,
        language: formData.language,
        state: formData.state,
        district: formData.district,
        city: formData.district,
        latitude: lat,
        longitude: lon,
        locationRecorded: true,
        landSizeAcres: formData.landSizeAcres ? Number(formData.landSizeAcres) : 0,
        mainCrops: formData.mainCrops ? formData.mainCrops.split(',').map((c) => c.trim()).filter(Boolean) : []
      });
      setSuccessMsg('प्रोफ़ाइल सफलतापूर्वक सुरक्षित कर ली गई है! / Profile updated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('nav.profile')}</h1>
          <p className="page-subtitle">
            {i18n.language?.startsWith('hi') ? 'अपनी किसान प्रोफ़ाइल और प्राथमिकताएं प्रबंधित करें' : 'Manage your farmer profile and preferences'}
          </p>
        </div>
        <button onClick={handleLogout} className="btn btn-danger btn-sm">
          <LogOut size={16} strokeWidth={2.5} />
          <span>{t('nav.logout')}</span>
        </button>
      </div>

      {successMsg && (
        <div className="alert alert-success">
          <Check size={20} strokeWidth={2.5} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="alert alert-danger">
          <AlertCircle size={20} strokeWidth={2.5} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="card" style={{ border: 'var(--border-thick)', boxShadow: 'var(--shadow-lg)' }}>
        {/* User Header Avatar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-lg)',
            paddingBottom: 'var(--space-lg)',
            borderBottom: 'var(--border-medium)',
            marginBottom: 'var(--space-lg)'
          }}
        >
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--nb-yellow)',
              border: 'var(--border-medium)',
              boxShadow: 'var(--shadow-sm)',
              color: 'var(--nb-black)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              fontSize: '1.8rem'
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : <User size={32} />}
          </div>
          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: '900', color: 'var(--nb-black)' }}>
              {user?.name}
            </h2>
            <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-text-secondary)' }}>
              {user?.email}
            </div>
          </div>
        </div>

        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">{t('auth.name')}</label>
              <input
                type="text"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">{t('auth.state')}</label>
              <select
                name="state"
                className="form-select"
                value={formData.state}
                onChange={handleChange}
              >
                <option value="">-- राज्य चुनें --</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t('auth.district')}</label>
              <input
                type="text"
                name="district"
                className="form-input"
                placeholder="उदा. मेरठ, भोपाल"
                value={formData.district}
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)' }}>
            <div className="form-group">
              <label className="form-label">{t('auth.landSize')}</label>
              <input
                type="number"
                step="0.1"
                min="0"
                name="landSizeAcres"
                className="form-input"
                placeholder="उदा. 4.5"
                value={formData.landSizeAcres}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('auth.mainCrops')}</label>
              <input
                type="text"
                name="mainCrops"
                className="form-input"
                placeholder="उदा. Wheat, Mustard, Paddy"
                value={formData.mainCrops}
                onChange={handleChange}
              />
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--color-text-secondary)' }}>
                डैशबोर्ड पर इसी फसल के लाइव मंडी भाव दिखेंगे।
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-xl)' }}>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={saving}
            >
              {saving ? (
                <span>{t('common.loading')}</span>
              ) : (
                <>
                  <Save size={20} strokeWidth={2.5} />
                  <span>{t('common.save')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
