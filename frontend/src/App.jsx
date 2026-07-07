import React, { lazy, Suspense, useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import SEO from './components/SEO';
import ThemeLayer from './theme/ThemeLayer';
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
const CredentialsPage = lazy(() => import('./Projects/Synapse_Assessments/CredentialsPage'));
const AssessmentHub = lazy(() => import('./Projects/Synapse_Assessments/AssessmentHub'));
const VeriSphereApp = lazy(() => import('./Projects/Verisphere/VeriSphereApp'));
const ClassroomApp = lazy(() => import('./Projects/Classroom/ClassroomApp'));
const ContactModal = lazy(() => import('./Home/components/ContactModal'));
const AuthModal = lazy(() => import('./components/AuthModal'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));

function App() {
  const [boolContactOpenState, setContactOpen] = useState(false);
  const [boolAuthOpenState, setAuthOpen] = useState(false);
  const [objSettingsState, setSettings] = useState(null);
  const authHook = useAuth();
  const pageContext = usePageContext();

  useEffect(() => {
    fetchSiteSettings().then(setSettings);
  }, []);

  return (
    <div className="app-shell">
      <ThemeLayer />
      <SEO />
      <ScrollToTop />
      <Suspense fallback={<div className="ath-loading-screen" />}>
        <Routes>
          <Route
            path="/"
            element={
              <PageErrorBoundary>
                <Home
                  onOpenContact={() => setContactOpen(true)}
                  onOpenLogin={() => setAuthOpen(true)}
                  authHook={authHook}
                  settings={objSettingsState}
                />
              </PageErrorBoundary>
            }
          />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/credentials" element={<MaintenanceBlock pageName="Credential Assessment System" />} />
          <Route path="/assessment" element={<MaintenanceBlock pageName="Assessment Hub" />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/verisphere/*" element={<VeriSphereApp onOpenLogin={() => setAuthOpen(true)} authHook={authHook} />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/sle/*" element={<MaintenanceBlock pageName="Classroom" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
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
    </div>
  );
}

export default App;
