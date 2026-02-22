import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone, Mail, MapPin, Shield, Settings, ExternalLink, FileText, Info, HelpCircle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const Footer = () => {
  const navigate = useNavigate();
  
  // Handler per link SEO-friendly: usa React Router per UX ma genera link HTML standard per crawler
  const handleSEOLinkClick = (e, href) => {
    // Se è Ctrl/Cmd+click o middle click, lascia il comportamento default (apertura in nuova tab)
    if (e.ctrlKey || e.metaKey || e.button === 1) {
      return;
    }
    // Altrimenti usa React Router per navigazione client-side
    e.preventDefault();
    navigate(href);
  };
  
  const [footerConfig, setFooterConfig] = useState({
    phone: null,
    email: null,
    address: null,
    adminUrl: null,
    privacyUrl: null,
    termsUrl: null,
    aboutUrl: null,
    contactUrl: null,
    copyright: `© ${new Date().getFullYear()} baumicio.it - Tutti i diritti riservati`
  });

  useEffect(() => {
    const loadFooterConfig = async () => {
      try {
        // Carica configurazione dal database (tabella site_settings)
        const { data, error } = await supabase
          .from('site_settings')
          .select('*')
          .eq('key', 'footer')
          .maybeSingle();

        if (!error && data && data.value) {
          setFooterConfig(prev => ({
            ...prev,
            ...data.value
          }));
        }
        // Ignora silenziosamente se la tabella non esiste (migrazione non applicata)
        // Non loggare errori per PGRST205 (tabella non trovata)
      } catch (err) {
        // Ignora silenziosamente tutti gli errori relativi a site_settings
        // La tabella potrebbe non esistere se la migrazione non è stata applicata
      }
    };

    loadFooterConfig();
  }, []);

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Colonna 1: Contatti */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contatti</h3>
            <div className="space-y-3 text-sm">
              <p className="text-gray-300 leading-relaxed">
                baumicio.it raccoglie e organizza dati pubblici sulle cliniche veterinarie italiane per facilitare la ricerca di servizi, prezzi e disponibilità. I titolari possono richiedere aggiornamenti o correzioni scrivendo alla redazione.
              </p>
              <div className="space-y-2">
                <div>
                  <p className="text-white font-medium mb-1">Redazione digitale – Italia</p>
                  <a 
                    href="mailto:info@baumicio.it" 
                    className="text-green-400 hover:text-green-300 transition-colors flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    info@baumicio.it
                  </a>
                </div>
                <div>
                  <a 
                    href="mailto:info@baumicio.it?subject=Richiesta aggiornamento scheda clinica" 
                    className="text-green-400 hover:text-green-300 transition-colors text-sm underline"
                  >
                    Richiedi aggiornamento schede clinica
                  </a>
                </div>
                <p className="text-gray-400 text-xs mt-3">
                  Al momento non è disponibile assistenza telefonica: contattaci via email per collaborazioni e segnalazioni.
                </p>
              </div>
            </div>
          </div>

          {/* Colonna 2: Link Utili */}
          <div>
            <h3 className="text-white font-semibold mb-4">Link Utili</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" onClick={(e) => handleSEOLinkClick(e, '/')} className="hover:text-white transition-colors flex items-center gap-1">
                  Home
                </a>
              </li>
              <li>
                <a href="/veterinari-h24" onClick={(e) => handleSEOLinkClick(e, '/veterinari-h24')} className="hover:text-white transition-colors">
                  Veterinari H24
                </a>
              </li>
              <li>
                <a href="/quanto-costa" onClick={(e) => handleSEOLinkClick(e, '/quanto-costa')} className="hover:text-white transition-colors">
                  Quanto Costa?
                </a>
              </li>
              <li>
                <a href="/integratori" onClick={(e) => handleSEOLinkClick(e, '/integratori')} className="hover:text-white transition-colors">
                  Integratori
                </a>
              </li>
              <li>
                <a href="/blog" onClick={(e) => handleSEOLinkClick(e, '/blog')} className="hover:text-white transition-colors">
                  Blog
                </a>
              </li>
              {footerConfig.aboutUrl && (
                <li>
                  <a 
                    href={footerConfig.aboutUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center gap-1"
                  >
                    <Info className="h-3 w-3" />
                    Chi Siamo
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              )}
              {footerConfig.contactUrl && (
                <li>
                  <a 
                    href={footerConfig.contactUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center gap-1"
                  >
                    <HelpCircle className="h-3 w-3" />
                    Contattaci
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Colonna 3: Link Legali */}
          <div>
            <h3 className="text-white font-semibold mb-4">Link Legali</h3>
            <ul className="space-y-2 text-sm">
              {footerConfig.privacyUrl && (
                <li>
                  <a 
                    href={footerConfig.privacyUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center gap-1"
                  >
                    <Shield className="h-3 w-3" />
                    Privacy Policy
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              )}
              {footerConfig.termsUrl && (
                <li>
                  <a 
                    href={footerConfig.termsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center gap-1"
                  >
                    <FileText className="h-3 w-3" />
                    Termini di Servizio
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              )}
              <li>
                <a 
                  href="/note-legali"
                  onClick={(e) => handleSEOLinkClick(e, '/note-legali')}
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <Shield className="h-3 w-3" />
                  Note Legali
                </a>
              </li>
              <li>
                <a
                  href="/credits"
                  onClick={(e) => handleSEOLinkClick(e, '/credits')}
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <FileText className="h-3 w-3" />
                  Credits
                </a>
              </li>
            </ul>
          </div>

          {/* Colonna 4: Admin (se configurato) */}
          {footerConfig.adminUrl && (
            <div>
              <h3 className="text-white font-semibold mb-4">Amministrazione</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a 
                    href={footerConfig.adminUrl.startsWith('http') ? footerConfig.adminUrl : `https://baumicio.it${footerConfig.adminUrl}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors flex items-center gap-1"
                  >
                    <Settings className="h-4 w-4" />
                    Area Admin
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Copyright e Privacy Policy */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p>© 2026 baumicio.it. Tutti i diritti riservati.</p>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <button 
                onClick={() => {
                  if (typeof window !== 'undefined' && window.__unicapi) {
                    window.__unicapi('openunic');
                  }
                }}
                className="hover:text-white transition-colors text-sm"
              >
                Impostazioni Consenso
              </button>
              {footerConfig.privacyUrl && (
                <a 
                  href={footerConfig.privacyUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <Shield className="h-3 w-3" />
                  Privacy Policy
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <a 
                href="/note-legali"
                onClick={(e) => handleSEOLinkClick(e, '/note-legali')}
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                <Shield className="h-3 w-3" />
                Note Legali
              </a>
              <a
                href="/credits"
                onClick={(e) => handleSEOLinkClick(e, '/credits')}
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                <FileText className="h-3 w-3" />
                Credits
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

