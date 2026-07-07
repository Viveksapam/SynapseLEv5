import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import WelcomePage from './pages/WelcomePage';
import HomePage from './pages/HomePage';
import CommunityPage from './pages/CommunityPage';
import PostDetailPage from './pages/PostDetailPage';
import PostCommentsPage from './pages/PostCommentsPage';
import ProfilePage from './pages/ProfilePage';
import CommunityGuidelinesPage from './pages/CommunityGuidelinesPage';
import AdminReportsPage from './pages/AdminReportsPage';
import NotificationBell from './components/NotificationBell';
import VeriSphereSidebar from './components/VeriSphereSidebar';
import './styles/VeriSphere.css';
import './styles/VeriSphereLayout.css';
import SEO from '../../components/SEO';

function VeriSphereApp({ onOpenLogin, authHook }) {
  const { boolIsLoggedInState, handleLogout, objUserState } = authHook || { boolIsLoggedInState: false, handleLogout: () => {} };
  const boolIsAdmin = !!(objUserState && (objUserState.is_superuser || objUserState.is_staff));
  const location = useLocation();

  const isWelcomeScreen = location.pathname === '/verisphere' || location.pathname === '/verisphere/' || location.pathname === '/';
  const [isLightMode, setIsLightMode] = useState(!isWelcomeScreen);
  const [boolIsMobileMenuOpenState, setBoolIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const isWelcome = location.pathname === '/verisphere' || location.pathname === '/verisphere/' || location.pathname === '/';
    const isFeed = location.pathname.includes('/feed');
    if (isWelcome) {
      setIsLightMode(false);
    } else if (isFeed) {
      setIsLightMode(true);
    }
    setBoolIsMobileMenuOpen(false);
  }, [location.key]);

  useEffect(() => {
    document.body.classList.add('v2-active');
    if (isLightMode) {
      document.body.classList.add('v2-light-mode');
    } else {
      document.body.classList.remove('v2-light-mode');
    }
    return () => {
      document.body.classList.remove('v2-active');
      document.body.classList.remove('v2-light-mode');
    };
  }, [isLightMode]);

  useEffect(() => {
    const handleOpenLogin = () => { if (onOpenLogin) onOpenLogin(); };
    window.addEventListener('open-login', handleOpenLogin);
    return () => window.removeEventListener('open-login', handleOpenLogin);
  }, [onOpenLogin]);

  return (
    <div className="v2-wrapper">
      <SEO title="VeriSphere" icon="/verisphere.svg" />

      {/* Nav lives outside the keyed scroll container so it never remounts */}
      <nav className="v2-nav">
        <Link to="/verisphere/feed" className="v2-logo" style={{
          textDecoration: 'none', color: 'var(--v2-text-main)',
          fontFamily: "'Inter', sans-serif", fontSize: '1.25rem', letterSpacing: '0.05em',
        }}>
          <span style={{ fontWeight: '600' }}>VERI</span>
          <span style={{ fontWeight: '300', opacity: 0.7 }}>SPHERE</span>
        </Link>
        <div className="v2-nav-links hidden-mobile" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <button
            onClick={() => setIsLightMode(!isLightMode)}
            className="v2-nav-btn secondary"
            style={{ padding: '8px', borderRadius: '50%', minWidth: 'auto', display: 'flex' }}
            title="Toggle Theme"
          >
            {isLightMode ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <NotificationBell boolIsLoggedIn={boolIsLoggedInState} />
          <Link to="/" className="v2-nav-btn secondary">Main Site</Link>
          {boolIsLoggedInState && (
            <Link to="/verisphere/profile" className="v2-nav-btn secondary">Profile</Link>
          )}
          {!boolIsLoggedInState ? (
            <button onClick={onOpenLogin} className="v2-nav-btn secondary" style={{ cursor: 'pointer' }}>Log In</button>
          ) : (
            <button onClick={handleLogout} className="v2-nav-btn secondary" style={{ cursor: 'pointer' }}>Log Out</button>
          )}
        </div>
        <div className="hidden-desktop" style={{ gap: '16px', alignItems: 'center' }}>
          <button
            onClick={() => setIsLightMode(!isLightMode)}
            className="v2-nav-btn secondary"
            style={{ padding: '8px', borderRadius: '50%', minWidth: 'auto', display: 'flex' }}
            title="Toggle Theme"
          >
            {isLightMode ? <Moon size={20} /> : <Sun size={20} />}
          </button>
          <NotificationBell boolIsLoggedIn={boolIsLoggedInState} />
          <button
            className="ath-hamburger-menu"
            onClick={() => setBoolIsMobileMenuOpen(!boolIsMobileMenuOpenState)}
            aria-label="Toggle menu"
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>

      {boolIsMobileMenuOpenState && (
        <div className="v2-mobile-menu" style={{ position: 'fixed', zIndex: 60 }}>
          <Link to="/" className="v2-mobile-menu-link" onClick={() => setBoolIsMobileMenuOpen(false)}>
            Main Site
          </Link>
          {boolIsLoggedInState && (
            <Link to="/verisphere/profile" className="v2-mobile-menu-link" onClick={() => setBoolIsMobileMenuOpen(false)}>
              Profile
            </Link>
          )}
          <div className="ath-mobile-menu-divider"></div>
          {!boolIsLoggedInState ? (
            <button onClick={() => { onOpenLogin(); setBoolIsMobileMenuOpen(false); }} className="v2-mobile-menu-link">
              Log In
            </button>
          ) : (
            <button onClick={() => { handleLogout(); setBoolIsMobileMenuOpen(false); }} className="v2-mobile-menu-link">
              Log Out
            </button>
          )}
        </div>
      )}

      {/* Left navigation sidebar — everywhere except the welcome screen */}
      {!isWelcomeScreen && <VeriSphereSidebar boolIsLoggedIn={boolIsLoggedInState} boolIsAdmin={boolIsAdmin} />}

      {/* key={location.key} — React destroys and recreates this div on every navigation.
          Fresh DOM element = scrollTop always starts at 0. No scroll state bleeds between pages. */}
      <div key={location.key} className={`v2-content-scroll${isWelcomeScreen ? '' : ' vs-with-sidenav'}`}>
        <main className="verisphere-main" style={{ paddingTop: '100px', minHeight: '100%' }}>
          <Routes>
            <Route index element={<WelcomePage />} />
            <Route path="feed" element={<HomePage authHook={authHook} />} />
            <Route path="community/:id" element={<CommunityPage authHook={authHook} />} />
            <Route path="post/:id" element={<PostDetailPage authHook={authHook} />} />
            <Route path="post/:id/comments" element={<PostCommentsPage authHook={authHook} />} />
            <Route path="profile" element={<ProfilePage authHook={authHook} />} />
            <Route path="guidelines" element={<CommunityGuidelinesPage />} />
            <Route path="admin/reports" element={<AdminReportsPage boolIsAdmin={boolIsAdmin} />} />
          </Routes>
        </main>

        <footer className="v2-footer" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="v2-copyright">
            &copy; {new Date().getFullYear()} Synapse Nexus. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Link to="/verisphere/guidelines" className="v2-copyright" style={{ textDecoration: 'none' }}>Community Guidelines</Link>
            <Link to="/terms" className="v2-copyright" style={{ textDecoration: 'none' }}>Terms</Link>
            <Link to="/privacy" className="v2-copyright" style={{ textDecoration: 'none' }}>Privacy</Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default VeriSphereApp;
