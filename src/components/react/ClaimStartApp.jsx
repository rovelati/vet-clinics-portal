import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle, Loader2, MapPin, Phone, Search, Shield, UserCheck } from 'lucide-react';

async function getSupabase() {
  const { supabaseBrowser } = await import('@/lib/supabase-browser');
  return supabaseBrowser;
}

function cleanText(value) {
  return typeof value === 'string' ? value.replace(/"/g, '').trim() : '';
}

function getInitialStep() {
  if (typeof window === 'undefined') return 1;
  const step = Number(new URLSearchParams(window.location.search).get('step') || '1');
  return Number.isFinite(step) && step >= 1 && step <= 4 ? step : 1;
}

function errorMessage(error) {
  const message = (error?.message || '').toLowerCase();
  if (message.includes('already_has_clinic')) return 'Stai gia gestendo una struttura. Ogni utente puo gestire una sola struttura.';
  if (message.includes('clinic_already_claimed')) return 'Questa clinica e gia stata reclamata da un altro utente.';
  if (message.includes('clinic_not_found')) return 'Clinica non trovata. Ricarica la pagina e riprova.';
  if (message.includes('function public.claim_clinic_secure')) return 'Funzione di claim non configurata sul database. Contatta l’amministratore.';
  return error?.message || 'Impossibile completare il claim. Riprova.';
}

function ClinicBox({ clinic }) {
  if (!clinic) return null;
  const city = cleanText(clinic.raw_import?.city);
  const province = cleanText(clinic.raw_import?.province);
  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-gray-900">{clinic.name}</h3>
        <CheckCircle className="h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
      </div>
      {clinic.address && (
        <p className="mt-2 flex items-start gap-2 text-sm text-gray-700">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{clinic.address}{city || province ? `, ${[city, province].filter(Boolean).join(' ')}` : ''}</span>
        </p>
      )}
      {clinic.phone && (
        <p className="mt-1 flex items-center gap-2 text-sm text-gray-700">
          <Phone className="h-4 w-4" aria-hidden="true" />
          {clinic.phone}
        </p>
      )}
    </div>
  );
}

export default function ClaimStartApp() {
  const [step, setStep] = useState(getInitialStep);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [responsibilityAccepted, setResponsibilityAccepted] = useState(false);

  const user = session?.user || null;
  const canGoNext = useMemo(() => {
    if (step === 1) return Boolean(user);
    if (step === 2) return responsibilityAccepted;
    if (step === 3) return Boolean(selectedClinic);
    return true;
  }, [step, user, responsibilityAccepted, selectedClinic]);

  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
  };

  const ensureProfile = async (currentUser) => {
    if (!currentUser?.id) return;
    const supabase = await getSupabase();
    await supabase.from('profiles').upsert({
      id: currentUser.id,
      full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Utente',
      role: 'veterinario',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
  };

  const loadClinic = async (clinicId) => {
    if (!clinicId) return;
    setLoading(true);
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase
        .from('clinics')
        .select('id, name, address, phone, slug, owner_id, raw_import')
        .eq('id', clinicId)
        .maybeSingle();
      if (error) throw error;
      if (data) setSelectedClinic(data);
    } catch (err) {
      showMessage(err?.message || 'Impossibile caricare la clinica selezionata.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const boot = async () => {
      const params = new URLSearchParams(window.location.search);
      const clinicId = params.get('clinic') || localStorage.getItem('claim_clinic_id');
      if (clinicId) {
        localStorage.setItem('claim_clinic_id', clinicId);
        loadClinic(clinicId);
      }

      const supabase = await getSupabase();
      const { data } = await supabase.auth.getSession();
      setSession(data?.session || null);
      if (data?.session?.user) {
        await ensureProfile(data.session.user);
        if (sessionStorage.getItem('claim_from_google') === 'true') {
          sessionStorage.removeItem('claim_from_google');
          setStep(2);
        }
      }
      setAuthLoading(false);

      const { data: listener } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
        setSession(nextSession || null);
        if (nextSession?.user) await ensureProfile(nextSession.user);
      });

      return listener?.subscription;
    };

    let subscription;
    boot().then((sub) => {
      subscription = sub;
    });

    return () => subscription?.unsubscribe?.();
  }, []);

  useEffect(() => {
    const search = async () => {
      const cleaned = searchTerm.trim();
      if (step !== 3 || cleaned.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const supabase = await getSupabase();
        const safeTerm = cleaned.replace(/[%,]/g, ' ');
        const { data, error } = await supabase
          .from('clinics')
          .select('id, name, address, phone, slug, owner_id, raw_import')
          .or(`name.ilike.%${safeTerm}%,address.ilike.%${safeTerm}%,phone.ilike.%${safeTerm}%`)
          .is('owner_id', null)
          .limit(10);
        if (error) throw error;
        setResults(data || []);
      } catch (err) {
        showMessage(err?.message || 'Impossibile cercare le cliniche.', 'error');
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(search, 250);
    return () => clearTimeout(timeout);
  }, [searchTerm, step]);

  const googleLogin = async () => {
    setLoading(true);
    showMessage('');
    sessionStorage.setItem('claim_flow', 'true');
    sessionStorage.setItem('redirect_after_login', '/claim/start?step=2');
    sessionStorage.setItem('oauth_flow', 'claim');

    const callbackUrl = new URL(`${window.location.origin}/auth/callback`);
    callbackUrl.searchParams.set('redirect_to', '/claim/start?step=2');
    callbackUrl.searchParams.set('flow', 'claim');

    const supabase = await getSupabase();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl.toString(),
        skipBrowserRedirect: false,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    setLoading(false);
    if (error) showMessage(error.message || 'Accesso con Google non riuscito.', 'error');
  };

  const nextStep = () => {
    if (!canGoNext) {
      if (step === 1) showMessage('Accedi o registrati per continuare.', 'error');
      if (step === 2) showMessage('Devi accettare la dichiarazione di responsabilita.', 'error');
      if (step === 3) showMessage('Seleziona una struttura per continuare.', 'error');
      return;
    }
    showMessage('');
    setStep((current) => Math.min(4, current + 1));
  };

  const completeClaim = async () => {
    if (!selectedClinic || !user) return;
    setLoading(true);
    showMessage('');

    try {
      const supabase = await getSupabase();
      const { error } = await supabase.rpc('claim_clinic_secure', {
        p_clinic_id: selectedClinic.id,
      });
      if (error) throw error;

      localStorage.removeItem('claim_clinic_id');
      showMessage('Claim completato. La richiesta e stata registrata.', 'success');
      setTimeout(() => {
        window.location.assign('/dashboard/veterinario?claimed=1');
      }, 1200);
    } catch (err) {
      showMessage(errorMessage(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <Loader2 className="h-10 w-10 animate-spin text-green-600" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            {[1, 2, 3, 4].map((number) => (
              <div
                key={number}
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold ${
                  step >= number ? 'border-green-600 bg-green-600 text-white' : 'border-gray-300 bg-white text-gray-400'
                }`}
              >
                {step > number ? <CheckCircle className="h-5 w-5" aria-hidden="true" /> : number}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 text-center text-xs text-gray-500">
            <span>Accesso</span>
            <span>Dichiarazione</span>
            <span>Selezione</span>
            <span>Conferma</span>
          </div>
        </div>

        {message && (
          <div className={`mb-5 rounded-md px-4 py-3 text-sm ${
            messageType === 'error'
              ? 'bg-red-50 text-red-700'
              : messageType === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-blue-50 text-blue-700'
          }`}>
            {message}
          </div>
        )}

        <section className="rounded-lg bg-white p-6 shadow-sm">
          {step === 1 && (
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                <UserCheck className="h-6 w-6 text-green-600" aria-hidden="true" />
                Registrati gratis
              </h1>
              <p className="mt-2 text-gray-600">Accedi o crea un account veterinario per aggiornare la scheda della tua attività.</p>
              {user ? (
                <div className="mt-6 rounded-lg bg-green-50 p-5 text-center">
                  <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-600" aria-hidden="true" />
                  <p className="font-semibold text-gray-900">Accesso effettuato</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <button type="button" onClick={nextStep} className="mt-5 inline-flex rounded-md bg-green-600 px-5 py-2 font-semibold text-white hover:bg-green-700">
                    Continua
                  </button>
                </div>
              ) : (
                <div className="mt-6 grid gap-3">
                  <button
                    type="button"
                    onClick={googleLogin}
                    disabled={loading}
                    className="inline-flex h-12 items-center justify-center rounded-md border border-gray-300 bg-white px-4 font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
                  >
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" /> : null}
                    Continua con Google
                  </button>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <a href="/register?type=veterinario&claim=true" rel="nofollow" className="inline-flex h-11 items-center justify-center rounded-md border border-gray-300 px-4 font-semibold text-gray-800 hover:bg-gray-50">
                      Registrati gratis
                    </a>
                    <a href="/login?redirect=/claim/start" rel="nofollow" className="inline-flex h-11 items-center justify-center rounded-md border border-gray-300 px-4 font-semibold text-gray-800 hover:bg-gray-50">
                      Accedi
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                <Shield className="h-6 w-6 text-green-600" aria-hidden="true" />
                Conferma responsabilita
              </h1>
              <div className="mt-5 rounded-lg bg-gray-50 p-5 text-sm text-gray-700">
                <ul className="list-inside list-disc space-y-2">
                  <li>Sono il titolare legale o un rappresentante autorizzato della struttura.</li>
                  <li>Mi assumo la responsabilita delle informazioni che modifichero sulla scheda.</li>
                  <li>Le informazioni fornite sono accurate, veritiere e conformi alla normativa vigente.</li>
                  <li>Comprendo che ogni account puo gestire al massimo una struttura veterinaria.</li>
                </ul>
              </div>
              <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={responsibilityAccepted}
                  onChange={(event) => setResponsibilityAccepted(event.target.checked)}
                  className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span><strong>Confermo</strong> di aver letto e accettato la dichiarazione.</span>
              </label>
            </div>
          )}

          {step === 3 && (
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                <Search className="h-6 w-6 text-green-600" aria-hidden="true" />
                Scegli la tua struttura
              </h1>
              <p className="mt-2 text-gray-600">Conferma la struttura indicata o cerca per nome, indirizzo o telefono.</p>
              <div className="mt-5">
                <ClinicBox clinic={selectedClinic} />
              </div>
              {!selectedClinic && (
                <div className="mt-5">
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Cerca struttura..."
                    className="h-11 w-full rounded-md border border-gray-300 px-3 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                  />
                  <div className="mt-3 space-y-2">
                    {loading && <p className="text-sm text-gray-500">Ricerca in corso...</p>}
                    {!loading && searchTerm.length >= 2 && results.length === 0 && (
                      <p className="text-sm text-gray-500">Nessuna struttura trovata o gia reclamata.</p>
                    )}
                    {results.map((clinic) => (
                      <button
                        key={clinic.id}
                        type="button"
                        onClick={() => {
                          setSelectedClinic(clinic);
                          localStorage.setItem('claim_clinic_id', clinic.id);
                        }}
                        className="block w-full rounded-md border border-gray-200 p-3 text-left hover:bg-gray-50"
                      >
                        <strong className="text-gray-900">{clinic.name}</strong>
                        {clinic.address && <span className="mt-1 block text-sm text-gray-600">{clinic.address}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                <CheckCircle className="h-6 w-6 text-green-600" aria-hidden="true" />
                Conferma richiesta
              </h1>
              <p className="mt-2 text-gray-600">Verifica la struttura prima di richiedere la gestione della scheda.</p>
              <div className="mt-5">
                <ClinicBox clinic={selectedClinic} />
              </div>
              <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                <div className="flex gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
                  <p>La richiesta sara registrata e collegata al tuo account. Dopo la verifica potrai aggiornare dati, orari, servizi e foto della scheda.</p>
                </div>
              </div>
            </div>
          )}

          {step > 1 && (
            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={() => setStep((current) => Math.max(1, current - 1))}
                className="inline-flex items-center rounded-md border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                Indietro
              </button>
              {step < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canGoNext}
                  className="inline-flex flex-1 items-center justify-center rounded-md bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                >
                  Continua
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={completeClaim}
                  disabled={loading || !selectedClinic}
                  className="inline-flex flex-1 items-center justify-center rounded-md bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                  Richiedi gestione scheda
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
