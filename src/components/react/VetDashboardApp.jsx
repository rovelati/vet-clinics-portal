import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, ExternalLink, FileText, Loader2, Save, Send } from 'lucide-react';

async function getSupabase() {
  const { supabaseBrowser } = await import('@/lib/supabase-browser');
  return supabaseBrowser;
}

const DEFAULT_HOURS = {
  Lunedi: '',
  Martedi: '',
  Mercoledi: '',
  Giovedi: '',
  Venerdi: '',
  Sabato: '',
  Domenica: '',
};

function sanitizeHtml(html) {
  if (!html) return '';
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

function InputField({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
      <input
        type={type}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
      />
    </label>
  );
}

function TextareaField({ label, value, onChange, rows = 5 }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
      <textarea
        rows={rows}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
      />
    </label>
  );
}

const EMPTY_ARTICLE = { id: null, title: '', excerpt: '', content: '', image_url: '' };

function BlogEditor({ enabled, clinicName }) {
  const [articles, setArticles] = useState([]);
  const [draft, setDraft] = useState(EMPTY_ARTICLE);
  const [loading, setLoading] = useState(enabled);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const load = async () => {
    if (!enabled) return;
    setLoading(true);
    const response = await fetch('/api/veterinary-blog', { credentials: 'same-origin' });
    const payload = await response.json().catch(() => ({}));
    if (response.ok) setArticles(payload.articles || []);
    else setNotice({ type: 'error', text: payload.error || 'Impossibile caricare gli articoli.' });
    setLoading(false);
  };

  useEffect(() => { load(); }, [enabled]);

  const saveArticle = async (action) => {
    setSaving(true);
    setNotice(null);
    const response = await fetch('/api/veterinary-blog', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...draft, action }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setNotice({ type: 'error', text: payload.error || 'Salvataggio non riuscito.' });
    } else {
      setNotice({
        type: 'success',
        text: action === 'submit'
          ? 'Articolo inviato alla redazione. Sara pubblicato solo dopo approvazione admin.'
          : 'Bozza salvata.',
      });
      setDraft(EMPTY_ARTICLE);
      await load();
    }
    setSaving(false);
  };

  const statusLabel = (status) => ({
    draft: 'Bozza', pending: 'In revisione', published: 'Pubblicato', rejected: 'Da correggere',
  }[status] || status);

  if (!enabled) {
    return (
      <section className="rounded-lg border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 text-slate-500" />
          <div>
            <h2 className="font-semibold text-slate-950">Articoli per il blog</h2>
            <p className="mt-1 text-sm text-slate-600">L editor si attiva dopo l approvazione del claim della struttura.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <FileText className="mt-1 h-5 w-5 text-green-700" />
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Proponi un articolo per il blog</h2>
          <p className="mt-1 text-sm text-slate-600">
            L articolo sara firmato da {clinicName} e pubblicato in /blog solo dopo revisione della redazione.
          </p>
        </div>
      </div>

      {notice && (
        <div className={`mt-4 rounded-md border p-3 text-sm ${notice.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800'}`}>
          {notice.text}
        </div>
      )}

      <div className="mt-5 grid gap-4">
        <InputField label="Titolo" value={draft.title} onChange={(value) => setDraft((current) => ({ ...current, title: value }))} />
        <TextareaField label="Sintesi per l anteprima" value={draft.excerpt} onChange={(value) => setDraft((current) => ({ ...current, excerpt: value }))} rows={3} />
        <TextareaField label="Articolo" value={draft.content} onChange={(value) => setDraft((current) => ({ ...current, content: value }))} rows={12} />
        <InputField label="URL immagine (facoltativo)" value={draft.image_url} onChange={(value) => setDraft((current) => ({ ...current, image_url: value }))} />
      </div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button type="button" disabled={saving} onClick={() => saveArticle('save')} className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 px-4 font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60">
          <Save className="mr-2 h-4 w-4" /> Salva bozza
        </button>
        <button type="button" disabled={saving} onClick={() => saveArticle('submit')} className="inline-flex h-11 items-center justify-center rounded-md bg-green-700 px-4 font-semibold text-white hover:bg-green-800 disabled:opacity-60">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />} Invia alla redazione
        </button>
      </div>

      <div className="mt-7 border-t pt-5">
        <h3 className="font-semibold text-slate-950">I tuoi articoli</h3>
        {loading && <p className="mt-3 text-sm text-slate-500">Caricamento...</p>}
        {!loading && !articles.length && <p className="mt-3 text-sm text-slate-500">Nessun articolo creato.</p>}
        <div className="mt-3 grid gap-3">
          {articles.map((article) => (
            <div key={article.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-950">{article.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{statusLabel(article.status)}</p>
                </div>
                {article.status === 'published' && article.slug && (
                  <a href={`/blog/${article.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-green-700" target="_blank" rel="noreferrer">
                    Apri <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                {['draft', 'rejected'].includes(article.status) && (
                  <button type="button" className="text-sm font-semibold text-green-700" onClick={() => setDraft({
                    id: article.id,
                    title: article.title || '',
                    excerpt: article.excerpt || '',
                    content: article.content || '',
                    image_url: article.image_url || '',
                  })}>Modifica</button>
                )}
              </div>
              {article.admin_note && <p className="mt-3 rounded bg-amber-50 p-2 text-sm text-amber-900">Nota redazione: {article.admin_note}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function VetDashboardApp() {
  const [session, setSession] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [claimStatus, setClaimStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const user = session?.user || null;
  const isApproved = claimStatus === 'approved';
  const statusLabel = useMemo(() => {
    if (claimStatus === 'approved') return 'Proprieta verificata';
    if (claimStatus === 'rejected') return 'Claim rifiutato';
    return 'In verifica business owner';
  }, [claimStatus]);

  const setField = (field, value) => {
    setClinic((current) => ({ ...current, [field]: value }));
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      const supabase = await getSupabase();
      const { data: sessionData } = await supabase.auth.getSession();
      const currentSession = sessionData?.session || null;

      if (!mounted) return;
      setSession(currentSession);

      if (!currentSession?.user) {
        window.location.replace(`/login?redirect=${encodeURIComponent('/dashboard/veterinario')}`);
        return;
      }

      if (currentSession.user.user_metadata?.role === 'admin') {
        window.location.replace('/admin-test');
        return;
      }

      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .select('*')
        .eq('owner_id', currentSession.user.id)
        .limit(1)
        .maybeSingle();

      if (clinicError) {
        setMessage({ type: 'error', text: 'Impossibile caricare la scheda collegata al tuo account.' });
        setLoading(false);
        return;
      }

      if (!clinicData) {
        setClinic(null);
        setMessage({ type: 'info', text: 'Nessuna scheda collegata a questo account. Reclama una struttura per gestirla.' });
        setLoading(false);
        return;
      }

      const { data: claimData } = await supabase
        .from('claims')
        .select('status, created_at')
        .eq('user_id', currentSession.user.id)
        .eq('clinic_id', clinicData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setClinic({
        ...clinicData,
        hours: clinicData.hours || { ...DEFAULT_HOURS },
      });
      setClaimStatus(claimData?.status || null);
      if (new URLSearchParams(window.location.search).get('claimed') === '1') {
        setMessage({ type: 'success', text: 'Claim registrato. Puoi verificare e modificare questa scheda; la pubblicazione resta in attesa di approvazione admin.' });
      }
      setLoading(false);
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const save = async () => {
    if (!user || !clinic?.id) return;
    setSaving(true);
    setMessage(null);

    const supabase = await getSupabase();
    const updateData = {
      name: clinic.name || null,
      specialization: clinic.specialization || null,
      address: clinic.address || null,
      phone: clinic.phone || null,
      email: clinic.email || null,
      website: clinic.website || null,
      description: sanitizeHtml(clinic.description || '') || null,
      hours: clinic.hours || null,
      status: isApproved ? clinic.status || 'pubblicata' : 'in_revisione',
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('clinics')
      .update(updateData)
      .eq('id', clinic.id)
      .eq('owner_id', user.id);

    if (error) {
      setMessage({ type: 'error', text: error.message || 'Impossibile salvare le modifiche.' });
    } else {
      setClinic((current) => ({ ...current, ...updateData }));
      setMessage({
        type: 'success',
        text: isApproved
          ? 'Modifiche salvate.'
          : 'Modifiche salvate in revisione. La pubblicazione richiede approvazione admin.',
      });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-10 w-10 animate-spin text-green-700" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-lg border bg-white p-8 text-center shadow-sm">
          <AlertCircle className="mx-auto h-10 w-10 text-amber-600" />
          <h1 className="mt-4 text-2xl font-bold text-slate-950">Nessuna scheda gestibile</h1>
          {message?.text && <p className="mt-2 text-slate-600">{message.text}</p>}
          <a href="/claim/start" className="mt-6 inline-flex rounded-md bg-green-700 px-4 py-2 font-semibold text-white hover:bg-green-800">Reclama una struttura</a>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-950">Dashboard modifica scheda</h1>
            <p className="mt-2 text-slate-600">Account: {user?.email}. Puoi gestire solo questa inserzione.</p>
          </div>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex h-11 items-center justify-center rounded-md bg-green-700 px-4 font-semibold text-white hover:bg-green-800 disabled:opacity-60"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salva modifiche
          </button>
        </div>

        <div className={`rounded-lg border p-4 text-sm ${message?.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : message?.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-blue-200 bg-blue-50 text-blue-900'} ${message ? '' : 'hidden'}`}>
          {message?.text}
        </div>

        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className={`mt-0.5 h-5 w-5 ${isApproved ? 'text-green-700' : 'text-amber-700'}`} />
            <div>
              <p className="font-semibold text-slate-950">{statusLabel}</p>
              <p className="mt-1 text-sm text-slate-700">
                Questa presa di possesso e visibile nella dashboard admin. Prima della pubblicazione la scheda deve essere verificata dal business owner/admin.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Inserzione reclamata</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <InputField label="Nome struttura" value={clinic.name} onChange={(value) => setField('name', value)} />
            <InputField label="Specializzazione" value={clinic.specialization} onChange={(value) => setField('specialization', value)} />
            <InputField label="Telefono" value={clinic.phone} onChange={(value) => setField('phone', value)} />
            <InputField label="Email" value={clinic.email} onChange={(value) => setField('email', value)} />
            <InputField label="Sito web" value={clinic.website} onChange={(value) => setField('website', value)} />
            <InputField label="Indirizzo" value={clinic.address} onChange={(value) => setField('address', value)} />
          </div>
          <div className="mt-4">
            <TextareaField label="Descrizione" value={clinic.description} onChange={(value) => setField('description', value)} rows={7} />
          </div>
        </section>

        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Orari</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {Object.entries(clinic.hours || DEFAULT_HOURS).map(([day, value]) => (
              <InputField
                key={day}
                label={day}
                value={value}
                onChange={(next) => setField('hours', { ...(clinic.hours || DEFAULT_HOURS), [day]: next })}
              />
            ))}
          </div>
        </section>

        <BlogEditor enabled={isApproved} clinicName={clinic.name} />
      </div>
    </div>
  );
}
