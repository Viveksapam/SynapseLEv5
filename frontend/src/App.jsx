import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import ScrollToTop from './components/ScrollToTop';
import SEO from './components/SEO';
import MaintenanceBlock from './components/MaintenanceBlock';
import { fetchSiteSettings } from './api/coreApi';
import { useAuth } from './hooks/useAuth';
import { usePageContext } from './hooks/usePageContext';
import PageErrorBoundary from './errors/PageErrorBoundary';
import './App.css';
import './Home/Home.css';

const Home = lazy(() => import('./Home/Home'));
const ShopPage = lazy(() => import('./Projects/Merchandise/ShopPage'));
const CheckoutPage = lazy(() => import('./Projects/Merchandise/CheckoutPage'));
const VeriSphereApp = lazy(() => import('./Projects/Verisphere/VeriSphereApp'));
const ContactModal = lazy(() => import('./Home/components/ContactModal'));
const AuthModal = lazy(() => import('./components/AuthModal'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const ActivateAccountPage = lazy(() => import('./pages/ActivateAccountPage'));
const ResetPasswordConfirmPage = lazy(() => import('./pages/ResetPasswordConfirmPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function App() {
  const [boolContactOpenState, setContactOpen] = useState(false);
  const [boolAuthOpenState, setAuthOpen] = useState(false);
  const [objSettingsState, setSettings] = useState(null);
  const authHook = useAuth();
  const pageContext = usePageContext();

  useEffect(() => {
    fetchSiteSettings().then(setSettings);
  }, []);

  useEffect(() => {
    // A successful mount means the current build's chunks loaded fine, so the
    // one-shot stale-chunk reload guard in PageErrorBoundary can reset.
    sessionStorage.removeItem('ath-chunk-reload-attempted');
  }, []);

  useEffect(() => {
    // Applies the site's light/dark theme on first paint for every route, not just Home
    // (TopNavBar owns the toggle UI, but it isn't mounted on pages like /shop, so the
    // initial class application has to happen somewhere that's always mounted).
    const savedMode = localStorage.getItem('ath-dark-mode');
    const isDark = savedMode !== null ? savedMode === 'true' : false;
    if (isDark) {
      document.documentElement.classList.add('ath-dark-mode');
      document.body.classList.remove('old-ui');
    } else {
      document.documentElement.classList.remove('ath-dark-mode');
      document.body.classList.add('old-ui');
    }
  }, []);

  return (
    <div className="app-shell">
      <SEO />
      <ScrollToTop />
      <Analytics />
      <PageErrorBoundary>
        <Suspense fallback={<div className="ath-loading-screen" />}>
          <Routes>
            <Route
              path="/"
              element={
                <Home
                  onOpenContact={() => setContactOpen(true)}
                  onOpenLogin={() => setAuthOpen(true)}
                  authHook={authHook}
                  settings={objSettingsState}
                />
              }
            />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/spotlight" element={<MaintenanceBlock pageName="Media Hub" />} />
            <Route path="/merchandise" element={<MaintenanceBlock pageName="Merchandise" />} />
            <Route path="/credentials" element={<MaintenanceBlock pageName="Credential Assessment System" />} />
            <Route path="/assessment" element={<MaintenanceBlock pageName="Assessment Hub" />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/verisphere/*" element={<VeriSphereApp onOpenLogin={() => setAuthOpen(true)} authHook={authHook} />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route
              path="/activate/:uid/:token"
              element={<ActivateAccountPage authHook={authHook} onOpenLogin={() => setAuthOpen(true)} />}
            />
            <Route
              path="/reset-password/:uid/:token"
              element={<ResetPasswordConfirmPage authHook={authHook} />}
            />
            <Route path="/sle/*" element={<MaintenanceBlock pageName="Classroom" />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>

          {boolContactOpenState && (
            <ContactModal
              isOpen={boolContactOpenState}
              onClose={() => setContactOpen(false)}
              settings={objSettingsState}
            />
          )}

          {boolAuthOpenState && (
            <AuthModal
              onClose={() => setAuthOpen(false)}
              useAuthHook={authHook}
            />
          )}
        </Suspense>
      </PageErrorBoundary>
    </div>
  );
}

export default App;
