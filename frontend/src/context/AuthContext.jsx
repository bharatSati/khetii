import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('kheti_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem('kheti_token') || null);
  const [loading, setLoading] = useState(true);
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const saved = localStorage.getItem('kheti_language');
    if (saved) return saved.startsWith('hi') ? 'hi' : 'en';
    return i18n.language?.startsWith('hi') ? 'hi' : 'en';
  });

  useEffect(() => {
    const handleLangChange = (lng) => {
      const code = lng?.startsWith('hi') ? 'hi' : 'en';
      setCurrentLanguage(code);
      document.documentElement.lang = code;
    };
    i18n.on('languageChanged', handleLangChange);
    return () => {
      i18n.off('languageChanged', handleLangChange);
    };
  }, [i18n]);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('kheti_token');
      if (storedToken) {
        try {
          const userData = await authService.getMe();
          if (userData && (userData._id || userData.id)) {
            setUser(userData);
            localStorage.setItem('kheti_user', JSON.stringify(userData));
            if (userData.language) {
              const langCode = userData.language.startsWith('hi') ? 'hi' : 'en';
              if (langCode !== i18n.language) {
                await i18n.changeLanguage(langCode);
                setCurrentLanguage(langCode);
                localStorage.setItem('kheti_language', langCode);
              }
            }
          }
        } catch (err) {
          console.warn('Session verification notice:', err.message);
          // Only clear credentials if the backend explicitly rejects the session with 401 Unauthorized
          const isUnauthorized = err.status === 401 || err.response?.status === 401 ||
            (err.message && (err.message.includes('expired') || err.message.includes('Authorization required') || err.message.includes('no longer exists')));
          if (isUnauthorized) {
            localStorage.removeItem('kheti_token');
            localStorage.removeItem('kheti_user');
            setToken(null);
            setUser(null);
          }
        }
      } else {
        localStorage.removeItem('kheti_user');
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, [i18n]);

  const login = async (email, password) => {
    const data = await authService.login({ email, password });
    localStorage.setItem('kheti_token', data.token);
    localStorage.setItem('kheti_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    if (data.user.language) {
      const langCode = data.user.language.startsWith('hi') ? 'hi' : 'en';
      await i18n.changeLanguage(langCode);
      setCurrentLanguage(langCode);
      localStorage.setItem('kheti_language', langCode);
    }
    return data.user;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    localStorage.setItem('kheti_token', data.token);
    localStorage.setItem('kheti_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    if (data.user.language) {
      const langCode = data.user.language.startsWith('hi') ? 'hi' : 'en';
      await i18n.changeLanguage(langCode);
      setCurrentLanguage(langCode);
      localStorage.setItem('kheti_language', langCode);
    }
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('kheti_token');
    localStorage.removeItem('kheti_user');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    const data = await authService.updateMe(profileData);
    setUser(data.user);
    localStorage.setItem('kheti_user', JSON.stringify(data.user));
    if (profileData.language) {
      const langCode = profileData.language.startsWith('hi') ? 'hi' : 'en';
      await i18n.changeLanguage(langCode);
      setCurrentLanguage(langCode);
      localStorage.setItem('kheti_language', langCode);
    }
    return data.user;
  };

  const changeLanguage = async (newLang) => {
    const code = newLang.startsWith('hi') ? 'hi' : 'en';
    setCurrentLanguage(code);
    localStorage.setItem('kheti_language', code);
    document.documentElement.lang = code;
    try {
      await i18n.changeLanguage(code);
    } catch (e) {
      console.warn('i18n changeLanguage error:', e);
    }
    if (user) {
      try {
        const updated = await authService.updateMe({ language: code });
        setUser(updated.user);
        localStorage.setItem('kheti_user', JSON.stringify(updated.user));
      } catch (err) {
        console.error('Failed to sync language preference to profile:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateProfile,
        changeLanguage,
        language: currentLanguage
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
