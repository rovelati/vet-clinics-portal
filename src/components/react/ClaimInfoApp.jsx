import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle, FileText, Loader2, MapPin, Shield, UserCheck } from 'lucide-react';

async function getSupabase() {
  const { supabaseBrowser } = await import('@/lib/supabase-browser');
  return supabaseBrowser;
}

function clinicLocation(clinic) {
  const city = clinic?.raw_import?.city?.replace?.(/"/g, '').trim();
  const province = clinic?.raw_import?.province?.replace?.(/"/g, '').trim();
  if (city && province) return `${city} (${province})`;
  return city || province || '';
}

export default function ClaimInfoApp() {
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadClinic = async () => {
      const params = new URLSearchParams(window.location.search);
      const clinicId = params.get('clinic') || localStorage.getItem('claim_clinic_id');

      if (!clinicId) {
        setLoading(false);
        return;
      }

      localStorage.setItem('claim_clinic_id', clinicId);

      try {
        const supabase = await getSupabase();
        const { data, error: queryError } = await supabase
          .from('clinics')
          .select('id, name, address, phone, slug, owner_id, raw_import')
          .eq('id', clinicId)
          .maybeSingle();

        if (queryError) throw queryError;
        if (!data) {
          setError('Non abbiamo trovato la struttura indicata.');
          return;
        }
        setClinic(data);
      } catch (err) {
        setError(err?.message || 'Impossibile caricare la struttura.');
      } finally {
        setLoading(false);
      }
    };

    loadClinic();
  }, []);

  const startClaim = () => {
    if (clinic?.id) localStorage.setItem('claim_clinic_id', clinic.id);
    window.location.assign('/claim/start');
  };

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-blue-600">
            <Shield className="h-10 w-10 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Vuoi modificare i dati della tua attività?</h1>

          {loading ? (
            <p className="mt-4 inline-flex items-center gap-2 text-lg text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              Caricamento struttura...
            </p>
          ) : clinic ? (
            <div className="mx-auto mt-6 max-w-2xl rounded-lg border border-green-200 bg-green-50 p-5 text-left">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-green-700">Struttura selezionata</p>
              <h2 className="text-2xl font-bold text-gray-900">{clinic.name}</h2>
              {clinic.address && (
                <p className="mt-2 flex items-start gap-2 text-gray-700">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{clinic.address}{clinicLocation(clinic) ? `, ${clinicLocation(clinic)}` : ''}</span>
                </p>
              )}
              {clinic.owner_id && (
                <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Questa struttura risulta gia associata a un account. Se pensi sia un errore, contattaci.
                </p>
              )}
            </div>
          ) : (
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
              Registrati gratis e richiedi la gestione della scheda della tua clinica o ambulatorio su Veterinari.org.
            </p>
          )}

          {error && (
            <div className="mx-auto mt-5 max-w-2xl rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <section className="mb-10 rounded-lg border border-green-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
            <AlertCircle className="h-6 w-6 text-green-600" aria-hidden="true" />
            Cosa potrai aggiornare
          </h2>
          <div className="mt-5 grid gap-4">
            {[
              ['Orari e contatti', 'Telefono, email, sito web e orari aggiornati aiutano i proprietari a contattarti senza errori.'],
              ['Servizi e prestazioni', 'Puoi rendere piu chiari i servizi offerti dalla struttura.'],
              ['Foto e informazioni', 'Una scheda completa aumenta fiducia e richieste qualificate.'],
              ['Verifica della scheda', 'La richiesta viene collegata a un account veterinario e controllata prima della gestione.'],
            ].map(([title, text]) => (
              <div key={title} className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-600">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-5 text-center text-2xl font-bold text-gray-900">Come funziona</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              ['1', UserCheck, 'Registrati gratis', 'Crea il tuo account veterinario o accedi.'],
              ['2', FileText, 'Conferma i dati', 'Accetta la responsabilita sulle modifiche richieste.'],
              ['3', Shield, 'Scegli la struttura', 'Conferma la clinica o l ambulatorio da gestire.'],
              ['4', ArrowRight, 'Aggiorna la scheda', 'Potrai gestire dati, orari, servizi e foto.'],
            ].map(([number, Icon, title, text]) => (
              <div key={title} className="rounded-lg bg-white p-5 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-xl font-bold text-blue-700">
                  {number}
                </div>
                <h3 className="flex items-center justify-center gap-2 font-bold text-gray-900">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg bg-gradient-to-r from-green-500 to-blue-600 p-8 text-center text-white shadow-sm">
          <h2 className="text-2xl font-bold">Aggiorna gratis la tua scheda</h2>
          <p className="mx-auto mt-3 max-w-2xl text-green-50">
            Bastano pochi minuti: registrati, conferma la struttura e richiedi la gestione dei dati pubblicati.
          </p>
          <button
            type="button"
            onClick={startClaim}
            className="mt-6 inline-flex items-center rounded-md bg-white px-5 py-3 font-semibold text-green-700 hover:bg-green-50 disabled:opacity-60"
            disabled={loading || Boolean(clinic?.owner_id)}
          >
            Registrati gratis
            <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
          </button>
        </section>

        <p className="mt-8 text-center text-sm text-gray-500">
          Hai domande? Scrivici a <a href="mailto:info@veterinari.org" className="font-semibold text-green-700 hover:underline">info@veterinari.org</a>
        </p>
      </div>
    </div>
  );
}
