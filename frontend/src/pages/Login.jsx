import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Sprout, LogIn, AlertCircle } from 'lucide-react';

export const Login = () => {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Email or password is incorrect.');
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
          maxWidth: '460px',
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
              backgroundColor: 'var(--nb-green-bright)',
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
            {t('auth.loginTitle')}
          </h1>
          <p style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            {i18n.language?.startsWith('hi') ? 'अपने किसान खाते में प्रवेश करें' : 'Sign in to access your farmer account'}
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 'var(--space-md)' }}>
            <AlertCircle size={20} strokeWidth={2.5} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('auth.email')}</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="kisan@example.com"
              required
              autoFocus
            />
          </div>

          <div className="form-group" style={{ marginBottom: 'var(--space-lg)' }}>
            <label className="form-label">{t('auth.password')}</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? (
              <span>{t('common.loading')}</span>
            ) : (
              <>
                <LogIn size={20} strokeWidth={2.5} />
                <span>{t('nav.login')}</span>
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
          <span>{t('auth.dontHaveAccount')} </span>
          <Link to="/register" style={{ color: 'var(--nb-green)', fontWeight: '900' }}>
            {t('auth.registerNow')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
