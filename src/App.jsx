
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HomePage from '@/pages/HomePage';
import VeterinariListingPage from '@/pages/VeterinariListingPage';
import VeterinariH24Page from '@/pages/VeterinariH24Page';
import ServiziPage from '@/pages/ServiziPage';
import IntegratoriPage from '@/pages/IntegratoriPage';
import IntegratoreDetailPage from '@/pages/IntegratoreDetailPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import BlogPage from '@/pages/BlogPage';
import BlogPostPage from '@/pages/BlogPostPage';
import VetDetailPage from '@/pages/VetDetailPage';
import QuantoCostaPage from '@/pages/QuantoCostaPage';
import ClinicheListingPage from '@/pages/ClinicheListingPage';
import ServiceDescriptionPage from '@/pages/ServiceDescriptionPage';
import RichiediPreventivoPage from '@/pages/RichiediPreventivoPage';
import CercaVeterinariPage from '@/pages/CercaVeterinariPage';
import VetDashboardPage from '@/pages/VetDashboardPage';
import AdminConsole from '@/pages/AdminConsole';
import AdminTestPage from '@/pages/AdminTestPage';
import AuthCallbackPage from '@/pages/AuthCallbackPage';
import IntegratoriListPage from '@/pages/admin/IntegratoriListPage';
import IntegratoreEditorPage from '@/pages/admin/IntegratoreEditorPage';
import IntegratoreAIPage from '@/pages/admin/IntegratoreAIPage';
import IntegratoriImportPage from '@/pages/admin/IntegratoriImportPage';
import ClaimInfoPage from '@/pages/ClaimInfoPage';
import ClaimFlowPage from '@/pages/ClaimFlowPage';
import NoteLegaliPage from '@/pages/NoteLegaliPage';
import VantaggiVeterinariPage from '@/pages/VantaggiVeterinariPage';
import QuoteRequestLandingPage from '@/pages/QuoteRequestLandingPage';
import CreditsPage from '@/pages/CreditsPage';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import { PawPrint } from 'lucide-react';

const LoadingSpinner = () => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
    >
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <PawPrint className="h-24 w-24 text-green-600" />
        </motion.div>
        <p className="mt-4 text-xl font-semibold text-gray-700 animate-pulse">Caricamento...</p>
      </div>
    </motion.div>
  </AnimatePresence>
);

// Componente per scroll to top al cambio di route (deve essere dentro Router)
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [pathname]);

  return null;
};

function AppContent() {
  return (
    <>
      <ScrollToTop />
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex flex-col">
        <Navbar />
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* Nuove route SEO-friendly per permalink: /city-province/veterinari */}
          <Route path="/:location/veterinari" element={<CercaVeterinariPage />} />
          {/* Route legacy per retrocompatibilità */}
          <Route path="/cerca-veterinari" element={<CercaVeterinariPage />} />
          <Route path="/cerca-veterinari/:city" element={<CercaVeterinariPage />} />
          <Route path="/veterinari/*" element={<VetDetailPage />} />
          <Route path="/veterinari-h24" element={<VeterinariH24Page />} />
          <Route path="/veterinari-h24/:location" element={<VeterinariH24Page />} />
          <Route path="/servizi" element={<ServiziPage />} />
          <Route path="/quanto-costa" element={<QuantoCostaPage />} />
          <Route path="/quanto-costa/:serviceSlug" element={<ServiceDescriptionPage />} />
          <Route path="/quanto-costa/:location/:prestazione/cliniche" element={<ClinicheListingPage />} />
          <Route path="/quanto-costa/:prestazione/cliniche" element={<ClinicheListingPage />} />
          <Route path="/adminconsole" element={<AdminConsole />} />
          <Route path="/admin-test" element={<AdminTestPage />} />
          <Route path="/admin-test/integratori" element={<IntegratoriListPage />} />
          <Route path="/admin-test/integratori/new" element={<IntegratoreEditorPage />} />
          <Route path="/admin-test/integratori/:id/edit" element={<IntegratoreEditorPage />} />
          <Route path="/admin-test/integratori/generate-ai" element={<IntegratoreAIPage />} />
          <Route path="/admin-test/integratori/import" element={<IntegratoriImportPage />} />
          <Route path="/richiedi-preventivo" element={<RichiediPreventivoPage />} />
          <Route path="/preventivi/:id" element={<QuoteRequestLandingPage />} />
          <Route path="/integratori" element={<IntegratoriPage />} />
          <Route path="/integratori/:slug" element={<IntegratoreDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/dashboard/veterinario" element={<VetDashboardPage />} />
          <Route path="/claim" element={<ClaimInfoPage />} />
          <Route path="/claim/start" element={<ClaimFlowPage />} />
          <Route path="/note-legali" element={<NoteLegaliPage />} />
          <Route path="/credits" element={<CreditsPage />} />
          <Route path="/vantaggi-veterinari" element={<VantaggiVeterinariPage />} />
        </Routes>
        
        <Footer />
        <Toaster />
      </div>
    </>
  );
}

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }
  
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
