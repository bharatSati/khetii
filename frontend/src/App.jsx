import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Schemes from './pages/Schemes';
import Insurance from './pages/Insurance';
import Market from './pages/Market';
import Marketplace from './pages/Marketplace';
import Finance from './pages/Finance';
import Documents from './pages/Documents';
import Knowledge from './pages/Knowledge';
import Samvaad from './pages/Samvaad';
import Profile from './pages/Profile';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export const App = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isLandingPage = location.pathname === '/';

  return (
    <div className="app-container" style={{ flexDirection: 'column', minHeight: '100vh' }}>
      <Header />

      <div className={`main-content-layout ${(!isAuthPage && !isLandingPage) ? 'with-sidebar' : ''}`} style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar shown on all service pages */}
        {!isAuthPage && !isLandingPage && <Sidebar />}

        <main className="main-wrapper">
          <div className={isLandingPage ? "landing-page-container" : "page-container"}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/schemes" element={<Schemes />} />
              <Route path="/insurance" element={<Insurance />} />
              <Route path="/market" element={<Market />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/knowledge" element={<Knowledge />} />
              <Route path="/samvaad" element={<Samvaad />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/finance"
                element={
                  <ProtectedRoute>
                    <Finance />
                  </ProtectedRoute>
                }
              />
              <Route path="/documents" element={<Documents />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
};

export default App;
