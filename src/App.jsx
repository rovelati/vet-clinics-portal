
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Navbar from '@/components/Navbar';
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
import RichiediPreventivoPage from '@/pages/RichiediPreventivoPage';
import CercaVeterinariPage from '@/pages/CercaVeterinariPage';
import VetDashboardPage from '@/pages/VetDashboardPage';
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

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }
  
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <Navbar />
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cerca-veterinari" element={<CercaVeterinariPage />} />
          <Route path="/cerca-veterinari/:city" element={<CercaVeterinariPage />} />
          <Route path="/veterinari/*" element={<VetDetailPage />} />
          <Route path="/veterinari-h24" element={<VeterinariH24Page />} />
          <Route path="/servizi" element={<ServiziPage />} />
          <Route path="/quanto-costa" element={<QuantoCostaPage />} />
          <Route path="/quanto-costa/:prestazione/cliniche" element={<ClinicheListingPage />} />
          <Route path="/richiedi-preventivo" element={<RichiediPreventivoPage />} />
          <Route path="/integratori" element={<IntegratoriPage />} />
          <Route path="/integratori/:slug" element={<IntegratoreDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/dashboard/veterinario" element={<VetDashboardPage />} />
        </Routes>
        
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
