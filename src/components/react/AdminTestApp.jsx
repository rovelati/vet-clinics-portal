import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileSpreadsheet,
  Globe,
  ImagePlus,
  ListTree,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Sparkles,
  Stethoscope,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';

async function getSupabase() {
  const { supabaseBrowser } = await import('@/lib/supabase-browser');
  return supabaseBrowser;
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className={`fixed bottom-5 right-5 z-50 max-w-md rounded-lg border px-4 py-3 shadow-lg ${
      toast.variant === 'destructive' ? 'border-red-200 bg-red-50 text-red-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'
    }`}>
      <div className="flex gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{toast.title}</p>
          {toast.description && <p className="mt-1 text-sm opacity-80">{toast.description}</p>}
        </div>
        <button type="button" className="ml-auto" onClick={onClose} aria-label="Chiudi notifica">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

const navItems = [
  { id: 'stats', label: 'Statistiche', description: 'Panoramica database', icon: BarChart3 },
  { id: 'users', label: 'Utenti', description: 'Ruoli e profili', icon: Users },
  { id: 'claims', label: 'Claim', description: 'Richieste cliniche', icon: CheckCircle2 },
  { id: 'blog', label: 'Blog', description: 'Revisione articoli', icon: MessageSquare },
  { id: 'quotes', label: 'Preventivi', description: 'Richieste inviate', icon: Mail },
  { id: 'marketing', label: 'Email', description: 'Invii e CTR', icon: BarChart3 },
  { id: 'clinics', label: 'Cliniche', description: 'Schede e arricchimenti', icon: Stethoscope },
  { id: 'taxonomy', label: 'Tassonomia', description: 'Servizi e prezzi', icon: ListTree },
  { id: 'cms', label: 'CMS', description: 'Integratori', icon: FileSpreadsheet },
];

const roleOptions = [
  { value: 'user', label: 'Utente' },
  { value: 'editor', label: 'Editor' },
  { value: 'admin', label: 'Admin' },
];

const Button = ({ children, variant = 'default', size = 'md', className = '', ...props }) => {
  const variants = {
    default: 'bg-slate-900 text-white hover:bg-slate-800 border-slate-900',
    outline: 'bg-white text-slate-800 hover:bg-slate-50 border-slate-300',
    ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 border-transparent',
    danger: 'bg-red-600 text-white hover:bg-red-700 border-red-600',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600',
  };
  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3 py-2 text-sm',
  };
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-md border font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const Input = (props) => (
  <input
    {...props}
    className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-700 ${props.className || ''}`}
  />
);

const Textarea = (props) => (
  <textarea
    {...props}
    className={`min-h-[86px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-700 ${props.className || ''}`}
  />
);

const Select = ({ value, onChange, children, className = '' }) => (
  <select
    value={value || ''}
    onChange={(event) => onChange?.(event.target.value)}
    className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-700 ${className}`}
  >
    {children}
  </select>
);

const Card = ({ children, className = '' }) => (
  <div className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>
);

const CardHeader = ({ title, description, action }) => (
  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
    <div>
      <h3 className="font-semibold text-slate-950">{title}</h3>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
    {action}
  </div>
);

const Field = ({ label, children, className = '' }) => (
  <label className={`block space-y-1 ${className}`}>
    <span className="text-xs font-semibold uppercase text-slate-500">{label}</span>
    {children}
  </label>
);

function normalizeError(error) {
  if (!error) return 'Errore sconosciuto';
  if (Array.isArray(error)) return error.join('\n');
  return error.message || String(error);
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((item) => item.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((item) => item.trim());
    const at = (...names) => {
      const idx = headers.findIndex((header) => names.includes(header));
      return idx === -1 ? '' : values[idx];
    };
    return {
      name: at('name', 'nome'),
      category: at('category', 'categoria'),
      description: at('description', 'descrizione') || null,
      allow_price: ['true', '1', 'si', 'sì'].includes(at('allow_price', 'abilita_prezzo').toLowerCase()),
      average_price: at('average_price', 'prezzo_medio') ? Number(at('average_price', 'prezzo_medio')) : null,
    };
  }).filter((row) => row.name && row.category);
}

export default function AdminTestApp() {
  const [active, setActive] = useState('stats');
  const [token, setToken] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [boot, setBoot] = useState(null);
  const [bootError, setBootError] = useState(null);
  const [bootLoading, setBootLoading] = useState(true);

  const notify = useCallback((payload) => {
    setToast(payload);
    window.clearTimeout(window.__adminToastTimer);
    window.__adminToastTimer = window.setTimeout(() => setToast(null), 4500);
  }, []);

  const api = useCallback(async (action, payload = {}) => {
    const response = await fetch('/api/admin-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ action, ...payload }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) {
      throw new Error(data.error || `Richiesta fallita (${response.status})`);
    }
    return data;
  }, [token]);

  useEffect(() => {
    let mounted = true;
    getSupabase().then(async (supabase) => {
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setToken(data?.session?.access_token || null);
        setSessionLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const bootstrap = useCallback(async () => {
    if (sessionLoading) return;
    setBootLoading(true);
    setBootError(null);
    try {
      const data = await api('bootstrap');
      setBoot(data);
    } catch (error) {
      setBootError(normalizeError(error));
    } finally {
      setBootLoading(false);
    }
  }, [api, sessionLoading]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  if (sessionLoading || bootLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-10 w-10 animate-spin text-slate-600" />
      </div>
    );
  }

  if (bootError) {
    return (
      <AdminShell active={active} setActive={setActive}>
        <Card>
          <div className="p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
            <h1 className="mt-4 text-2xl font-semibold">Admin test non disponibile</h1>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600 whitespace-pre-line">{bootError}</p>
            <div className="mt-5 flex justify-center gap-2">
              <Button onClick={bootstrap}><RefreshCcw className="h-4 w-4" /> Riprova</Button>
              <a href="/login" className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800">Login</a>
            </div>
          </div>
        </Card>
      </AdminShell>
    );
  }

  return (
    <>
      <AdminShell active={active} setActive={setActive} profile={boot?.profile} allowUnauth={boot?.allowUnauth}>
        {active === 'stats' && <StatsSection initial={boot?.stats} api={api} notify={notify} />}
        {active === 'users' && <UsersSection api={api} notify={notify} />}
        {active === 'claims' && <ClaimsSection api={api} notify={notify} />}
        {active === 'blog' && <BlogReviewSection api={api} notify={notify} />}
        {active === 'quotes' && <QuotesSection api={api} notify={notify} />}
        {active === 'marketing' && <MarketingEmailSection api={api} notify={notify} />}
        {active === 'clinics' && <ClinicsSection api={api} token={token} notify={notify} taxonomy={boot?.taxonomy || []} />}
        {active === 'taxonomy' && <TaxonomySection api={api} notify={notify} initial={boot?.taxonomy || []} />}
        {active === 'cms' && <CmsSection />}
      </AdminShell>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}

function AdminShell({ children, active, setActive, profile, allowUnauth }) {
  return (
    <div className="bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 md:px-6">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Console amministrativa test</p>
            <h1 className="text-xl font-semibold text-slate-950">veterinari.org</h1>
          </div>
          <div className="ml-auto rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
            {allowUnauth ? 'Test senza autenticazione' : `Admin: ${profile?.full_name || profile?.id || 'sessione verificata'}`}
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl flex-col md:flex-row">
        <aside className="border-b bg-white p-3 md:min-h-[calc(100vh-150px)] md:w-72 md:border-b-0 md:border-r">
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(item.id)}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${
                  active === item.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 hover:bg-slate-100'
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span>
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className={`block text-xs ${active === item.id ? 'text-slate-200' : 'text-slate-500'}`}>{item.description}</span>
                </span>
              </button>
            ))}
          </div>
        </aside>
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

function StatsSection({ initial, api, notify }) {
  const [stats, setStats] = useState(initial);
  const [loading, setLoading] = useState(false);
  const pctClinics = (value) => stats?.total ? `${((value / stats.total) * 100).toFixed(1)}%` : '0.0%';
  const pctUsers = (value) => stats?.registeredUsers ? `${((value / stats.registeredUsers) * 100).toFixed(1)}%` : '0.0%';

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await api('stats');
      setStats(data.stats);
      notify({ title: 'Statistiche aggiornate' });
    } catch (error) {
      notify({ variant: 'destructive', title: 'Errore statistiche', description: normalizeError(error) });
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    ['Totale cliniche', stats?.total, null, Stethoscope],
    ['Utenti registrati', stats?.registeredUsers, null, Users],
    ['Pet Lover registrati', stats?.registeredPetLovers, pctUsers(stats?.registeredPetLovers || 0), Users],
    ['Veterinari registrati', stats?.registeredVeterinarians, pctUsers(stats?.registeredVeterinarians || 0), Stethoscope],
    ['Admin registrati', stats?.registeredAdmins, pctUsers(stats?.registeredAdmins || 0), CheckCircle2],
    ['Account login locali', stats?.localAuthUsers, null, Users],
    ['Schede reclamate', stats?.claimedClinics, pctClinics(stats?.claimedClinics || 0), CheckCircle2],
    ['Claim approvati', stats?.approvedClaims, null, CheckCircle2],
    ['Richieste preventivo', stats?.quoteRequests, null, Mail],
    ['Preventivi inviati', stats?.quoteRequestsSent, stats?.quoteRequests ? `${(((stats?.quoteRequestsSent || 0) / stats.quoteRequests) * 100).toFixed(1)}%` : '0.0%', Mail],
    ['Con GMB', stats?.withGmb, pctClinics(stats?.withGmb || 0), MapPin],
    ['Con recensioni', stats?.withReviews, pctClinics(stats?.withReviews || 0), MessageSquare],
    ['Con DeepSeek', stats?.withDeepSeek, pctClinics(stats?.withDeepSeek || 0), Brain],
    ['Con sito', stats?.withWebsite, pctClinics(stats?.withWebsite || 0), Globe],
    ['Con email', stats?.withEmail, pctClinics(stats?.withEmail || 0), Mail],
    ['Sito spiderato', stats?.withWebsiteSpidered, pctClinics(stats?.withWebsiteSpidered || 0), Globe],
    ['Con coordinate', stats?.withCoordinates, pctClinics(stats?.withCoordinates || 0), MapPin],
    ['Con servizi', stats?.withServices, pctClinics(stats?.withServices || 0), ListTree],
    ['Con rating', stats?.withRating, pctClinics(stats?.withRating || 0), CheckCircle2],
    ['Con orari', stats?.withHours, pctClinics(stats?.withHours || 0), Clock],
    ['Senza orari', stats?.withoutHours, pctClinics(stats?.withoutHours || 0), AlertTriangle],
    ['Match FNOVI certi', stats?.fnoviExactMatches, pctClinics(stats?.fnoviExactMatches || 0), CheckCircle2],
    ['Schede collegate FNOVI', stats?.fnoviMatchedClinics, pctClinics(stats?.fnoviMatchedClinics || 0), Stethoscope],
    ['Codici FNOVI unici', stats?.fnoviUniqueMatches, null, CheckCircle2],
    ['Email raccolte da FNOVI', stats?.fnoviCollectedEmails, null, Mail],
    ['Cliniche con servizi FNOVI', stats?.fnoviClinicsWithServices, pctClinics(stats?.fnoviClinicsWithServices || 0), ListTree],
    ['Servizi FNOVI mappati', stats?.fnoviMappedServices, null, ListTree],
    ['Servizi FNOVI da mappare', stats?.fnoviUnmappedServices, null, AlertTriangle],
    ['Cliniche con inferenze FNOVI', stats?.fnoviSemanticClinics, pctClinics(stats?.fnoviSemanticClinics || 0), Brain],
    ['Suggerimenti semantici FNOVI', stats?.fnoviSemanticSuggestions, null, Sparkles],
  ];

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Statistiche Database</h2>
          <p className="text-sm text-slate-500">Registrazioni, schede veterinarie, claim e completezza arricchimenti.</p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading}>
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Aggiorna
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([title, value, percent, Icon]) => (
          <Card key={title} className="p-5">
            <div className="flex items-start justify-between">
              <Icon className="h-6 w-6 text-emerald-700" />
              {percent && <span className="text-sm font-semibold text-slate-500">{percent}</span>}
            </div>
            <p className="mt-4 text-3xl font-bold">{Number(value || 0).toLocaleString('it-IT')}</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{title}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}

function UsersSection({ api, notify }) {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows((await api('users.list')).rows || []);
    } catch (error) {
      notify({ variant: 'destructive', title: 'Errore utenti', description: normalizeError(error) });
    } finally {
      setLoading(false);
    }
  }, [api, notify]);

  useEffect(() => { load(); }, [load]);

  const filtered = rows.filter((row) => {
    const haystack = `${row.full_name || ''} ${row.email || ''} ${row.role || ''} ${row.id || ''}`.toLowerCase();
    return haystack.includes(filter.toLowerCase());
  });

  const updateRole = async (row, role) => {
    try {
      await api('users.role', { id: row.id, role });
      setRows((prev) => prev.map((item) => item.id === row.id ? { ...item, role } : item));
      notify({ title: 'Ruolo aggiornato', description: row.full_name || row.id });
    } catch (error) {
      notify({ variant: 'destructive', title: 'Errore aggiornando ruolo', description: normalizeError(error) });
    }
  };

  const deleteUser = async (row) => {
    if (row.role === 'admin') {
      notify({ variant: 'destructive', title: 'Azione bloccata', description: 'Gli admin non si cancellano da questa schermata.' });
      return;
    }
    const label = row.full_name || row.id;
    const confirmText = window.prompt(`Cancella definitivamente la registrazione di ${label}?\\n\\nVerranno rimossi account, profilo, claim e dati Pet Lover collegati. Per confermare scrivi CANCELLA.`);
    if (confirmText !== 'CANCELLA') return;

    try {
      await api('users.delete', { id: row.id });
      setRows((prev) => prev.filter((item) => item.id !== row.id));
      notify({ title: 'Registrazione cancellata', description: `${label} puo registrarsi di nuovo.` });
    } catch (error) {
      notify({ variant: 'destructive', title: 'Errore cancellazione', description: normalizeError(error) });
    }
  };

  return (
    <section className="space-y-4">
      <Toolbar title="Utenti" description="Gestione profili e ruoli applicativi." loading={loading} onRefresh={load}>
        <Input placeholder="Cerca nome, ruolo o ID" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </Toolbar>
      <DataTable headers={['Nome', 'ID', 'Ruolo', 'Aggiornato', 'Azioni']}>
        {filtered.map((row) => (
          <tr key={row.id} className="border-t">
            <td className="px-4 py-3">
              <p className="font-medium">{row.full_name || row.email || '-'}</p>
              {row.email && <p className="text-xs text-slate-500">{row.email}</p>}
              {(!row.has_profile || !row.has_local_auth || !row.has_auth_user) && (
                <p className="mt-1 text-xs text-amber-700">
                  Registrazione parziale
                </p>
              )}
            </td>
            <td className="px-4 py-3 text-xs text-slate-500">{row.id}</td>
            <td className="px-4 py-3">
              <Select value={row.role || 'user'} onChange={(role) => updateRole(row, role)} className="max-w-40">
                {roleOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </Select>
            </td>
            <td className="px-4 py-3 text-xs text-slate-500">{row.updated_at ? new Date(row.updated_at).toLocaleString('it-IT') : '-'}</td>
            <td className="px-4 py-3">
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => deleteUser(row)}
                disabled={row.role === 'admin'}
                title={row.role === 'admin' ? 'Gli admin non si cancellano da qui' : 'Cancella registrazione'}
              >
                <Trash2 className="h-4 w-4" /> Cancella
              </Button>
            </td>
          </tr>
        ))}
      </DataTable>
    </section>
  );
}

function ClaimsSection({ api, notify }) {
  const [rows, setRows] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows((await api('claims.list')).rows || []);
    } catch (error) {
      notify({ variant: 'destructive', title: 'Errore claim', description: normalizeError(error) });
    } finally {
      setLoading(false);
    }
  }, [api, notify]);

  useEffect(() => { load(); }, [load]);

  const update = async (claim, status) => {
    try {
      const result = await api('claims.update', { claim_id: claim.id, clinic_id: claim.clinic_id, status });
      notify({
        title: status === 'approved' ? 'Claim approvato' : 'Claim aggiornato',
        description: result.notification?.success === false
          ? `Aggiornato, ma email non inviata: ${result.notification.error}`
          : claim.clinics?.name || claim.user_email || claim.user_id,
      });
      await load();
    } catch (error) {
      notify({ variant: 'destructive', title: 'Errore aggiornando claim', description: normalizeError(error) });
    }
  };

  const visibleRows = rows.filter((row) => statusFilter === 'all' || row.status === statusFilter);

  return (
    <section className="space-y-4">
      <Toolbar title="Claim Cliniche" description="Accessi, prese di possesso e verifica business owner." loading={loading} onRefresh={load}>
        <Select value={statusFilter} onChange={setStatusFilter} className="max-w-48">
          <option value="all">Tutti gli stati</option>
          <option value="pending">In verifica</option>
          <option value="approved">Approvati</option>
          <option value="rejected">Rifiutati</option>
        </Select>
      </Toolbar>
      <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        Ogni riga indica una presa di possesso: l'account puo gestire solo quella scheda. La pubblicazione resta bloccata finche il business owner/admin non approva il claim.
      </Card>
      <DataTable headers={['Utente', 'Clinica', 'Stato', 'Nota admin', 'Data', 'Azioni']}>
        {visibleRows.map((claim) => (
          <tr key={claim.id} className="border-t">
            <td className="px-4 py-3">
              <p className="font-medium">{claim.profiles?.full_name || 'Utente'}</p>
              <p className="text-xs text-slate-500">{claim.user_email || claim.user_id}</p>
            </td>
            <td className="px-4 py-3">
              {claim.clinics?.slug ? (
                <div>
                  <p className="font-medium">{claim.clinics.name}</p>
                  <a className="mt-1 inline-flex items-center gap-1 text-xs text-blue-700 hover:underline" href={`/veterinari/${claim.clinics.slug}`} target="_blank" rel="noreferrer">
                    {claim.status === 'approved' ? 'Apri scheda online' : 'Apri scheda in attesa di revisione'} <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ) : 'Clinica non trovata'}
            </td>
            <td className="px-4 py-3"><Badge>{claim.status}</Badge></td>
            <td className="px-4 py-3 text-xs text-slate-600">
              <p>Presa di possesso registrata per questo account.</p>
              <p className="mt-1">
                {claim.status === 'approved'
                  ? 'Verifica business owner completata: scheda pubblicabile.'
                  : claim.status === 'rejected'
                    ? 'Verifica rifiutata: accesso da controllare.'
                    : 'In attesa di verifica business owner prima della pubblicazione.'}
              </p>
              {claim.admin_notified_at && <p className="mt-1 text-emerald-700">Admin avvisato via email.</p>}
              {claim.owner_notified_at && <p className="mt-1 text-emerald-700">Claimant avvisato via email.</p>}
              {claim.admin_notification_error && <p className="mt-1 text-red-700">Errore email admin: {claim.admin_notification_error}</p>}
              {claim.owner_notification_error && <p className="mt-1 text-red-700">Errore email claimant: {claim.owner_notification_error}</p>}
            </td>
            <td className="px-4 py-3 text-xs text-slate-500">{claim.created_at ? new Date(claim.created_at).toLocaleString('it-IT') : '-'}</td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                <Button size="sm" variant="success" disabled={claim.status === 'approved'} onClick={() => update(claim, 'approved')}><CheckCircle2 className="h-4 w-4" /> Approva</Button>
                <Button size="sm" variant="outline" disabled={claim.status === 'rejected'} onClick={() => update(claim, 'rejected')}>Rifiuta</Button>
              </div>
            </td>
          </tr>
        ))}
        {!visibleRows.length && <EmptyRow cols={6} text="Nessun claim trovato." />}
      </DataTable>
    </section>
  );
}

function BlogReviewSection({ api, notify }) {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows((await api('blog.list')).rows || []);
    } catch (error) {
      notify({ variant: 'destructive', title: 'Errore articoli blog', description: normalizeError(error) });
    } finally {
      setLoading(false);
    }
  }, [api, notify]);

  useEffect(() => { load(); }, [load]);

  const review = async (article, nextStatus) => {
    try {
      await api('blog.review', {
        id: article.id,
        status: nextStatus,
        admin_note: notes[article.id] ?? article.admin_note ?? '',
      });
      notify({
        title: nextStatus === 'published' ? 'Articolo pubblicato' : nextStatus === 'rejected' ? 'Modifiche richieste' : 'Articolo rimesso in revisione',
        description: article.title,
      });
      await load();
    } catch (error) {
      notify({ variant: 'destructive', title: 'Revisione non riuscita', description: normalizeError(error) });
    }
  };

  const visibleRows = rows.filter((row) => status === 'all' || row.status === status);
  const statusLabel = (value) => ({ draft: 'Bozza', pending: 'In revisione', published: 'Pubblicato', rejected: 'Da correggere' }[value] || value);

  return (
    <section className="space-y-4">
      <Toolbar title="Revisione Blog" description="Gli articoli non sono pubblici finche un admin non li approva." loading={loading} onRefresh={load}>
        <Select value={status} onChange={setStatus} className="max-w-48">
          <option value="pending">In revisione</option>
          <option value="rejected">Da correggere</option>
          <option value="published">Pubblicati</option>
          <option value="draft">Bozze</option>
          <option value="all">Tutti</option>
        </Select>
      </Toolbar>

      <div className="grid gap-4">
        {visibleRows.map((article) => (
          <Card key={article.id} className="overflow-hidden">
            <div className="border-b p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-emerald-700">{article.clinic_name}</p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-950">{article.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {article.author_name || article.author_email || 'Veterinario'} · {statusLabel(article.status)} · {article.submitted_at ? new Date(article.submitted_at).toLocaleString('it-IT') : 'non inviato'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {article.clinic_slug && <a href={`/veterinari/${article.clinic_slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700">Scheda <ExternalLink className="h-4 w-4" /></a>}
                  {article.status === 'published' && article.slug && <a href={`/blog/${article.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">Articolo <ExternalLink className="h-4 w-4" /></a>}
                </div>
              </div>
              {article.excerpt && <p className="mt-4 text-sm font-medium text-slate-700">{article.excerpt}</p>}
              <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-700">{article.content}</div>
              {article.image_url && <a href={article.image_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">Controlla immagine <ExternalLink className="h-4 w-4" /></a>}
            </div>
            <div className="grid gap-3 bg-slate-50 p-5 md:grid-cols-[1fr_auto] md:items-end">
              <label>
                <span className="mb-1 block text-sm font-semibold text-slate-700">Nota editoriale</span>
                <Textarea value={notes[article.id] ?? article.admin_note ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [article.id]: event.target.value }))} placeholder="Obbligatoria quando richiedi modifiche" />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => review(article, 'rejected')}>Richiedi modifiche</Button>
                <Button variant="success" onClick={() => review(article, 'published')}><CheckCircle2 className="h-4 w-4" /> Pubblica</Button>
              </div>
            </div>
          </Card>
        ))}
        {!visibleRows.length && <Card className="p-8 text-center text-sm text-slate-500">Nessun articolo in questo stato.</Card>}
      </div>
    </section>
  );
}

function QuotesSection({ api, notify }) {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('quotes.list', { search, status, limit: 100 });
      setRows(data.rows || []);
    } catch (error) {
      notify({ variant: 'destructive', title: 'Errore preventivi', description: normalizeError(error) });
    } finally {
      setLoading(false);
    }
  }, [api, notify, search, status]);

  useEffect(() => { load(); }, []);

  const submitSearch = (event) => {
    event?.preventDefault();
    load();
  };

  const statusOptions = useMemo(() => {
    const values = Array.from(new Set(rows.map((row) => row.status).filter(Boolean)));
    return ['all', 'sent', 'received', 'received_email_warning', ...values.filter((value) => !['sent', 'received', 'received_email_warning'].includes(value))];
  }, [rows]);

  const totals = rows.reduce((acc, row) => {
    acc.requests += 1;
    acc.emails += Number(row.email_count || 0);
    acc.clinics += Number(row.clinic_count || 0);
    if (row.status === 'sent') acc.sent += 1;
    return acc;
  }, { requests: 0, emails: 0, clinics: 0, sent: 0 });

  return (
    <section className="space-y-4">
      <Toolbar title="Richieste preventivo" description="Elenco richieste inviate dalle landing Quanto Costa e dalle schede." loading={loading} onRefresh={load}>
        <form className="flex flex-wrap items-center gap-2" onSubmit={submitSearch}>
          <Input className="w-72" placeholder="Cerca prestazione, localita, email..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={status} onChange={setStatus} className="w-56">
            {statusOptions.map((item) => (
              <option key={item} value={item}>{item === 'all' ? 'Tutti gli stati' : item}</option>
            ))}
          </Select>
          <Button type="submit" disabled={loading}><Search className="h-4 w-4" /> Cerca</Button>
        </form>
      </Toolbar>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <p className="text-2xl font-bold">{totals.requests.toLocaleString('it-IT')}</p>
          <p className="text-sm font-semibold text-slate-600">Richieste caricate</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold">{totals.sent.toLocaleString('it-IT')}</p>
          <p className="text-sm font-semibold text-slate-600">Con stato inviato</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold">{totals.clinics.toLocaleString('it-IT')}</p>
          <p className="text-sm font-semibold text-slate-600">Cliniche coinvolte</p>
        </Card>
        <Card className="p-4">
          <p className="text-2xl font-bold">{totals.emails.toLocaleString('it-IT')}</p>
          <p className="text-sm font-semibold text-slate-600">Email destinatarie</p>
        </Card>
      </div>

      <DataTable headers={['Richiesta', 'Invii', 'Richiedente', 'Stato', 'Data', 'Dettagli']}>
        {rows.map((row) => {
          const isOpen = expanded === row.id;
          const clinics = Array.isArray(row.clinics) ? row.clinics : [];
          return (
            <React.Fragment key={row.id}>
              <tr className="border-t align-top">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-950">{row.service_name || row.service_slug}</p>
                  <p className="text-xs text-slate-500">{row.location_label || 'Localita non indicata'}</p>
                  {row.metadata?.page && (
                    <a className="mt-1 inline-flex items-center gap-1 text-xs text-blue-700 hover:underline" href={row.metadata.page} target="_blank" rel="noreferrer">
                      Pagina origine <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{Number(row.email_count || 0)} email</p>
                  <p className="text-xs text-slate-500">{Number(row.clinic_count || 0)} cliniche</p>
                  {!!row.clinic_emails?.length && <p className="mt-1 max-w-xs truncate text-xs text-slate-500">{row.clinic_emails.join(', ')}</p>}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{row.requester_email || '-'}</p>
                  <p className="text-xs text-slate-500">{row.requester_name || 'Nome non indicato'}{row.requester_phone ? ` · ${row.requester_phone}` : ''}</p>
                  {row.user_email && <p className="mt-1 text-xs text-emerald-700">Utente: {row.user_full_name || row.user_email}</p>}
                </td>
                <td className="px-4 py-3">
                  <Badge>{row.status}</Badge>
                  <p className="mt-1 text-xs text-slate-500">Cliniche: {row.clinic_email_status || '-'}</p>
                  {row.admin_email_status && <p className="text-xs text-slate-500">Admin: {row.admin_email_status}</p>}
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {row.created_at ? new Date(row.created_at).toLocaleString('it-IT') : '-'}
                  {row.updated_at && <p className="mt-1">Agg. {new Date(row.updated_at).toLocaleString('it-IT')}</p>}
                </td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="outline" onClick={() => setExpanded(isOpen ? null : row.id)}>
                    {isOpen ? 'Chiudi' : 'Apri'}
                  </Button>
                </td>
              </tr>
              {isOpen && (
                <tr className="border-t bg-slate-50">
                  <td className="px-4 py-4" colSpan={6}>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Messaggio</p>
                        <div className="whitespace-pre-wrap rounded-md border bg-white p-3 text-sm leading-6 text-slate-700">{row.message || '-'}</div>
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Cliniche destinatarie</p>
                        <div className="space-y-2">
                          {clinics.length ? clinics.map((clinic) => (
                            <div key={clinic.id} className="rounded-md border bg-white p-3 text-sm">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <p className="font-semibold">{clinic.name || clinic.id}</p>
                                  <p className="text-xs text-slate-500">{clinic.email || 'Email non indicata'}{clinic.city ? ` · ${clinic.city}` : ''}{clinic.province ? ` (${clinic.province})` : ''}</p>
                                </div>
                                {clinic.slug && (
                                  <a className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline" href={`/veterinari/${clinic.slug}`} target="_blank" rel="noreferrer">
                                    Scheda <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          )) : <p className="rounded-md border bg-white p-3 text-sm text-slate-500">Nessuna clinica associata trovata.</p>}
                        </div>
                        {row.email_errors && Object.keys(row.email_errors || {}).length > 0 && (
                          <pre className="mt-3 max-h-48 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-slate-100">{JSON.stringify(row.email_errors, null, 2)}</pre>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
        {!rows.length && <EmptyRow cols={6} text="Nessuna richiesta preventivo trovata." />}
      </DataTable>
    </section>
  );
}

function MarketingEmailSection({ api, notify }) {
  const [report, setReport] = useState({ summary: {}, daily: [], queues: [], targets: [], rows: [] });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [days, setDays] = useState('30');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('marketing.report', { search, status, days: Number(days), limit: 120 });
      setReport({
        summary: data.summary || {},
        daily: data.daily || [],
        queues: data.queues || [],
        targets: data.targets || [],
        rows: data.rows || [],
      });
    } catch (error) {
      notify({ variant: 'destructive', title: 'Errore report email', description: normalizeError(error) });
    } finally {
      setLoading(false);
    }
  }, [api, notify, search, status, days]);

  useEffect(() => { load(); }, []);

  const submitSearch = (event) => {
    event?.preventDefault();
    load();
  };

  const summary = report.summary || {};
  const pct = (value) => `${(Number(value || 0) * 100).toFixed(1)}%`;
  const rate = (num, den) => Number(den || 0) ? `${((Number(num || 0) / Number(den || 0)) * 100).toFixed(1)}%` : '0.0%';
  const formatDate = (value) => value ? new Date(value).toLocaleString('it-IT') : '-';
  const targetLabel = (target) => ({
    profile: 'Scheda pubblica',
    claim: 'Claim / area veterinari',
    benefits: 'Vantaggi veterinari',
    non_specificato: 'Click non specificato',
  }[target] || target || '-');
  const queueLabel = (queue) => ({
    direct_contact: 'Contatto diretto',
    quote_reminder: 'Reminder preventivo',
    non_classificata: 'Non classificata',
  }[queue] || queue || '-');

  const cards = [
    ['Invii creati', summary.total, `${summary.pending || 0} pending`, Mail],
    ['Email inviate', summary.sent, `${summary.failed || 0} fallite`, CheckCircle2],
    ['CTR click', pct(summary.ctr), `${summary.clicked || 0} click`, BarChart3],
    ['Registrazioni', summary.registered, rate(summary.registered, summary.sent), Users],
    ['Claim attribuiti', summary.claimed, rate(summary.claimed, summary.sent), Stethoscope],
  ];

  return (
    <section className="space-y-4">
      <Toolbar title="Report invii email" description="Performance delle email ai veterinari: invio, click, registrazione e claim attribuiti." loading={loading} onRefresh={load}>
        <form className="flex flex-wrap items-center gap-2" onSubmit={submitSearch}>
          <Select value={days} onChange={setDays} className="w-36">
            <option value="7">Ultimi 7 giorni</option>
            <option value="30">Ultimi 30 giorni</option>
            <option value="90">Ultimi 90 giorni</option>
            <option value="365">Ultimo anno</option>
          </Select>
          <Select value={status} onChange={setStatus} className="w-40">
            <option value="all">Tutti gli stati</option>
            <option value="sent">Inviate</option>
            <option value="pending">Pending</option>
            <option value="failed">Fallite</option>
          </Select>
          <Input className="w-72" placeholder="Cerca clinica, città, email..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button type="submit" disabled={loading}><Search className="h-4 w-4" /> Cerca</Button>
        </form>
      </Toolbar>

      <Card className="border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
        Le aperture email non sono tracciate in modo affidabile. Qui misuriamo CTR sui link, registrazioni e claim generati dai token delle email.
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(([title, value, detail, Icon]) => (
          <Card key={title} className="p-4">
            <div className="flex items-start justify-between">
              <Icon className="h-5 w-5 text-slate-700" />
              <span className="text-xs font-semibold text-slate-500">{detail}</span>
            </div>
            <p className="mt-3 text-2xl font-bold">{typeof value === 'number' ? Number(value || 0).toLocaleString('it-IT') : value || '0'}</p>
            <p className="text-sm font-semibold text-slate-600">{title}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Performance per tipo invio" description="Direct contact prima, reminder preventivo separati." />
          <DataTable headers={['Tipo', 'Creati', 'Inviati', 'Click', 'CTR', 'Registrazioni', 'Claim']}>
            {report.queues.map((row) => (
              <tr key={row.queue_type} className="border-t">
                <td className="px-4 py-3 font-semibold">{queueLabel(row.queue_type)}</td>
                <td className="px-4 py-3">{Number(row.total || 0).toLocaleString('it-IT')}</td>
                <td className="px-4 py-3">{Number(row.sent || 0).toLocaleString('it-IT')}</td>
                <td className="px-4 py-3">{Number(row.clicked || 0).toLocaleString('it-IT')}</td>
                <td className="px-4 py-3">{rate(row.clicked, row.sent)}</td>
                <td className="px-4 py-3">{Number(row.registered || 0).toLocaleString('it-IT')}</td>
                <td className="px-4 py-3">{Number(row.claimed || 0).toLocaleString('it-IT')}</td>
              </tr>
            ))}
            {!report.queues.length && <EmptyRow cols={7} text="Nessun dato nel periodo." />}
          </DataTable>
        </Card>

        <Card>
          <CardHeader title="Click per destinazione" description="Quale call to action viene usata dopo l'apertura." />
          <DataTable headers={['Destinazione', 'Click']}>
            {report.targets.map((row) => (
              <tr key={row.target} className="border-t">
                <td className="px-4 py-3 font-semibold">{targetLabel(row.target)}</td>
                <td className="px-4 py-3">{Number(row.clicks || 0).toLocaleString('it-IT')}</td>
              </tr>
            ))}
            {!report.targets.length && <EmptyRow cols={2} text="Nessun click registrato." />}
          </DataTable>
        </Card>
      </div>

      <Card>
        <CardHeader title="Andamento giornaliero" description={`Ultimi ${days} giorni, ordinati dal più recente.`} />
        <DataTable headers={['Giorno', 'Creati', 'Inviati', 'Fallite', 'Click', 'CTR', 'Registrazioni', 'Claim']}>
          {report.daily.map((row) => (
            <tr key={row.day} className="border-t">
              <td className="px-4 py-3 font-semibold">{row.day ? new Date(row.day).toLocaleDateString('it-IT') : '-'}</td>
              <td className="px-4 py-3">{Number(row.total || 0).toLocaleString('it-IT')}</td>
              <td className="px-4 py-3">{Number(row.sent || 0).toLocaleString('it-IT')}</td>
              <td className="px-4 py-3">{Number(row.failed || 0).toLocaleString('it-IT')}</td>
              <td className="px-4 py-3">{Number(row.clicked || 0).toLocaleString('it-IT')}</td>
              <td className="px-4 py-3">{rate(row.clicked, row.sent)}</td>
              <td className="px-4 py-3">{Number(row.registered || 0).toLocaleString('it-IT')}</td>
              <td className="px-4 py-3">{Number(row.claimed || 0).toLocaleString('it-IT')}</td>
            </tr>
          ))}
          {!report.daily.length && <EmptyRow cols={8} text="Nessun invio nel periodo." />}
        </DataTable>
      </Card>

      <DataTable headers={['Clinica', 'Email', 'Tipo', 'Stato', 'Click', 'Conversione', 'Data', 'Dettagli']}>
        {report.rows.map((row) => {
          const isOpen = expanded === row.id;
          return (
            <React.Fragment key={row.id}>
              <tr className="border-t align-top">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-950">{row.clinic_name}</p>
                  <p className="text-xs text-slate-500">{row.clinic_city || '-'}{row.clinic_province ? ` (${row.clinic_province})` : ''}</p>
                  {row.clinic_slug && (
                    <a className="mt-1 inline-flex items-center gap-1 text-xs text-blue-700 hover:underline" href={`/veterinari/${row.clinic_slug}`} target="_blank" rel="noreferrer">
                      Scheda <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{row.recipient_email}</p>
                  <p className="mt-1 max-w-xs truncate text-xs text-slate-500">{row.subject}</p>
                </td>
                <td className="px-4 py-3"><Badge>{queueLabel(row.lead_summary?.queue_type)}</Badge></td>
                <td className="px-4 py-3">
                  <Badge>{row.status}</Badge>
                  {row.error && <p className="mt-1 max-w-xs text-xs text-red-700">{row.error}</p>}
                </td>
                <td className="px-4 py-3">
                  <p className={row.clicked_at ? 'font-semibold text-emerald-700' : 'text-slate-500'}>{row.clicked_at ? 'Sì' : 'No'}</p>
                  {row.last_click_target && <p className="text-xs text-slate-500">{targetLabel(row.last_click_target)}</p>}
                </td>
                <td className="px-4 py-3 text-xs">
                  <p className={row.registered_at ? 'font-semibold text-emerald-700' : 'text-slate-500'}>Registrazione: {row.registered_at ? 'sì' : 'no'}</p>
                  <p className={row.claimed_at ? 'font-semibold text-emerald-700' : 'text-slate-500'}>Claim: {row.claimed_at ? 'sì' : 'no'}</p>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  <p>Creato {formatDate(row.created_at)}</p>
                  {row.sent_at && <p>Inviato {formatDate(row.sent_at)}</p>}
                  {row.clicked_at && <p>Click {formatDate(row.clicked_at)}</p>}
                </td>
                <td className="px-4 py-3">
                  <Button size="sm" variant="outline" onClick={() => setExpanded(isOpen ? null : row.id)}>
                    {isOpen ? 'Chiudi' : 'Apri'}
                  </Button>
                </td>
              </tr>
              {isOpen && (
                <tr className="border-t bg-slate-50">
                  <td className="px-4 py-4" colSpan={8}>
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Segnali che hanno generato l'email</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {[
                            ['Click telefono', row.lead_summary?.phone_clicks],
                            ['Click percorso', row.lead_summary?.direction_clicks],
                            ['Click email', row.lead_summary?.email_clicks],
                            ['Richieste preventivo', row.lead_summary?.quote_requests],
                            ['Richieste contatto', row.lead_summary?.contact_requests],
                            ['Score', row.lead_summary?.engagement_score],
                          ].map(([label, value]) => (
                            <div key={label} className="rounded-md border bg-white p-3">
                              <p className="text-lg font-bold">{Number(value || 0).toLocaleString('it-IT')}</p>
                              <p className="text-xs font-semibold text-slate-500">{label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Metadati</p>
                        <pre className="max-h-72 overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-100">{JSON.stringify(row.lead_summary || {}, null, 2)}</pre>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
        {!report.rows.length && <EmptyRow cols={8} text="Nessun invio email trovato." />}
      </DataTable>
    </section>
  );
}

function ClinicsSection({ api, token, notify, taxonomy }) {
  const [servicesTax, setServicesTax] = useState(taxonomy);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [slug, setSlug] = useState('');
  const [clinic, setClinic] = useState(null);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [view, setView] = useState('dati');
  const [loading, setLoading] = useState(false);
  const [enrichResult, setEnrichResult] = useState(null);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      setResults((await api('clinics.search', { query })).rows || []);
    } catch (error) {
      notify({ variant: 'destructive', title: 'Errore ricerca cliniche', description: normalizeError(error) });
    } finally {
      setLoading(false);
    }
  };

  const load = async (nextSlug = slug) => {
    if (!nextSlug) return;
    setLoading(true);
    try {
      const data = await api('clinics.load', { slug: nextSlug });
      setClinic(data.clinic);
      setSlug(data.clinic.slug || nextSlug);
      setServices((data.services || []).map((item) => ({
        service_id: item.service_id,
        service_name: item.service_name,
        service_category: item.service_category,
        price: item.price || '',
        animal_type: item.animal_type || 'cane',
      })));
      setReviews((data.reviews || []).map((item) => ({
        review_id: item.review_id,
        rating: item.star_rating || item.rating || '',
        text: item.comment || item.text || '',
        author_name: item.reviewer_name || item.author_name || 'Anonimo',
        profile_photo_url: item.reviewer_photo || item.profile_photo_url || '',
        time: item.created_at_g || item.time || '',
        source: item.source || 'google',
      })));
      notify({ title: 'Clinica caricata', description: data.clinic.name });
    } catch (error) {
      notify({ variant: 'destructive', title: 'Errore caricando clinica', description: normalizeError(error) });
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!clinic?.id) return;
    setLoading(true);
    try {
      await api('clinics.save', { clinic, services });
      notify({ title: 'Clinica salvata' });
      await load(clinic.slug);
    } catch (error) {
      notify({ variant: 'destructive', title: 'Errore salvataggio clinica', description: normalizeError(error) });
    } finally {
      setLoading(false);
    }
  };

  const saveReviews = async () => {
    if (!clinic?.id) return;
    setLoading(true);
    try {
      await api('reviews.save', { clinic_id: clinic.id, reviews });
      notify({ title: 'Recensioni salvate' });
      await load(clinic.slug);
    } catch (error) {
      notify({ variant: 'destructive', title: 'Errore recensioni', description: normalizeError(error) });
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file) => {
    if (!file || !clinic?.id) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append('clinic_id', clinic.id);
      form.append('image', file);
      const response = await fetch('/api/admin-test-gallery', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const data = await response.json();
      if (!response.ok || data.success === false) throw new Error(data.error || 'Upload fallito');
      setClinic((prev) => ({ ...prev, gallery_images: data.gallery_images || [] }));
      notify({ title: 'Immagine caricata' });
    } catch (error) {
      notify({ variant: 'destructive', title: 'Upload fallito', description: normalizeError(error) });
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (imageUrl) => {
    try {
      const data = await api('gallery.delete', { clinic_id: clinic.id, image_url: imageUrl });
      setClinic((prev) => ({ ...prev, gallery_images: data.gallery_images || [] }));
      notify({ title: 'Immagine rimossa' });
    } catch (error) {
      notify({ variant: 'destructive', title: 'Eliminazione immagine fallita', description: normalizeError(error) });
    }
  };

  const runEnrich = async (kind, options = {}) => {
    if (!clinic?.id) return;
    setLoading(true);
    setEnrichResult(null);
    try {
      const data = await api('enrich', {
        kind,
        clinic_id: clinic.id,
        source_url: clinic.source_url,
        ...options,
      });
      setEnrichResult(data);
      if (data.success) {
        notify({ title: 'Arricchimento completato', description: kind });
        await load(clinic.slug);
      } else {
        notify({ variant: 'destructive', title: 'Arricchimento non riuscito', description: normalizeError(data.error) });
      }
    } catch (error) {
      notify({ variant: 'destructive', title: 'Errore arricchimento', description: normalizeError(error) });
    } finally {
      setLoading(false);
    }
  };

  const loadTaxonomy = async () => {
    try {
      setServicesTax((await api('taxonomy.list')).rows || []);
    } catch {
      // non blocca la clinica
    }
  };

  useEffect(() => { loadTaxonomy(); }, []);

  return (
    <section className="space-y-4">
      <Toolbar title="Cliniche" description="Ricerca, modifica schede, servizi, orari, recensioni, gallery e arricchimenti." loading={loading} />

      <Card>
        <CardHeader title="Ricerca cliniche" />
        <div className="space-y-3 p-5">
          <div className="flex flex-col gap-2 md:flex-row">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} placeholder="Cerca per nome, slug, città o indirizzo" />
            <Button onClick={search} disabled={loading || !query.trim()}><Search className="h-4 w-4" /> Cerca</Button>
          </div>
          {!!results.length && (
            <div className="max-h-72 overflow-auto rounded-md border">
              {results.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  className="flex w-full items-center justify-between gap-3 border-b px-3 py-2 text-left hover:bg-slate-50"
                  onClick={() => {
                    setResults([]);
                    setQuery('');
                    load(row.slug);
                  }}
                >
                  <span>
                    <span className="block font-semibold">{row.name}</span>
                    <span className="block text-xs text-slate-500">{row.address || row.city || row.slug}</span>
                  </span>
                  <span className="text-xs text-blue-700">Carica</span>
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-2 md:flex-row">
            <Input className="md:max-w-sm" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Oppure inserisci slug clinica" />
            <Button onClick={() => load()} disabled={loading || !slug}>Carica per slug</Button>
          </div>
        </div>
      </Card>

      {clinic ? (
        <>
          <div className="flex flex-wrap gap-2">
            {['dati', 'orari', 'servizi', 'recensioni', 'gallery', 'arricchimenti'].map((item) => (
              <Button key={item} variant={view === item ? 'default' : 'outline'} onClick={() => setView(item)}>{item}</Button>
            ))}
          </div>
          {view === 'dati' && <ClinicData clinic={clinic} setClinic={setClinic} save={save} loading={loading} />}
          {view === 'orari' && <HoursEditor clinic={clinic} setClinic={setClinic} save={save} loading={loading} />}
          {view === 'servizi' && <ServicesEditor services={services} setServices={setServices} taxonomy={servicesTax} clinic={clinic} />}
          {view === 'recensioni' && <ReviewsEditor reviews={reviews} setReviews={setReviews} save={saveReviews} loading={loading} />}
          {view === 'gallery' && <GalleryEditor clinic={clinic} uploadImage={uploadImage} deleteImage={deleteImage} loading={loading} />}
          {view === 'arricchimenti' && <EnrichmentPanel clinic={clinic} runEnrich={runEnrich} result={enrichResult} loading={loading} />}
        </>
      ) : (
        <Card className="p-6 text-sm text-slate-500">Nessuna clinica caricata.</Card>
      )}
    </section>
  );
}

function ClinicData({ clinic, setClinic, save, loading }) {
  const set = (key, value) => setClinic((prev) => ({ ...prev, [key]: value }));
  return (
    <Card>
      <CardHeader title="Dati clinica" action={<Button onClick={save} disabled={loading}><Save className="h-4 w-4" /> Salva</Button>} />
      <div className="grid gap-4 p-5 md:grid-cols-2">
        <Field label="Nome"><Input value={clinic.name || ''} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Slug"><Input value={clinic.slug || ''} onChange={(e) => set('slug', e.target.value)} /></Field>
        <Field label="Telefono"><Input value={clinic.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Field>
        <Field label="Email"><Input value={clinic.email || ''} onChange={(e) => set('email', e.target.value)} /></Field>
        <Field label="Sito web"><Input value={clinic.website || ''} onChange={(e) => set('website', e.target.value)} /></Field>
        <Field label="Status"><Input value={clinic.status || ''} onChange={(e) => set('status', e.target.value)} /></Field>
        <Field label="Indirizzo" className="md:col-span-2"><Textarea value={clinic.address || ''} onChange={(e) => set('address', e.target.value)} /></Field>
        <Field label="Città"><Input value={clinic.city || ''} onChange={(e) => set('city', e.target.value)} /></Field>
        <Field label="Provincia"><Input value={clinic.province || ''} onChange={(e) => set('province', e.target.value)} /></Field>
        <Field label="Regione"><Input value={clinic.region || ''} onChange={(e) => set('region', e.target.value)} /></Field>
        <Field label="CAP"><Input value={clinic.cap || ''} onChange={(e) => set('cap', e.target.value)} /></Field>
        <Field label="Lat"><Input value={clinic.lat || ''} onChange={(e) => set('lat', e.target.value ? Number(e.target.value) : null)} /></Field>
        <Field label="Lng"><Input value={clinic.lng || ''} onChange={(e) => set('lng', e.target.value ? Number(e.target.value) : null)} /></Field>
        <Field label="Place ID"><Input value={clinic.place_id || ''} onChange={(e) => set('place_id', e.target.value)} /></Field>
        <Field label="Rating medio"><Input value={clinic.rating_avg_cached || ''} onChange={(e) => set('rating_avg_cached', e.target.value ? Number(e.target.value) : null)} /></Field>
        <Field label="Numero recensioni"><Input value={clinic.rating_count_cached || ''} onChange={(e) => set('rating_count_cached', e.target.value ? Number(e.target.value) : null)} /></Field>
        <Field label="Source URL PagineGialle" className="md:col-span-2">
          <Input value={clinic.source_url || ''} onChange={(e) => set('source_url', e.target.value)} placeholder="https://www.paginegialle.it/..." />
        </Field>
      </div>
    </Card>
  );
}

function HoursEditor({ clinic, setClinic, save, loading }) {
  const days = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  const hours = clinic.hours && typeof clinic.hours === 'object' ? clinic.hours : {};
  const setDay = (day, value) => {
    setClinic((prev) => ({
      ...prev,
      hours: { ...(prev.hours || {}), [day]: value.split(',').map((slot) => slot.trim()).filter(Boolean) },
    }));
  };
  return (
    <Card>
      <CardHeader title="Orari di apertura" action={<Button onClick={save} disabled={loading}><Save className="h-4 w-4" /> Salva orari</Button>} />
      <div className="space-y-3 p-5">
        {days.map((day) => (
          <div key={day} className="grid gap-2 md:grid-cols-[140px_1fr] md:items-center">
            <span className="text-sm font-semibold">{day}</span>
            <Input value={Array.isArray(hours[day]) ? hours[day].join(', ') : ''} onChange={(e) => setDay(day, e.target.value)} placeholder="09:00-12:00, 15:00-19:00" />
          </div>
        ))}
        <div className="flex flex-wrap gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => setClinic((prev) => ({ ...prev, hours: Object.fromEntries(days.map((day) => [day, ['09:00-12:00', '15:00-19:00']])) }))}><Plus className="h-4 w-4" /> Template standard</Button>
          <Button variant="outline" onClick={() => setClinic((prev) => ({ ...prev, hours: Object.fromEntries(days.map((day) => [day, ['00:00-00:00']])) }))}><Clock className="h-4 w-4" /> Imposta H24</Button>
        </div>
      </div>
    </Card>
  );
}

function serviceSuggestionsFromClinic(clinic) {
  const payload = clinic?.deepupdate_payload || {};
  const blocks = [
    payload.gmb_review_service_suggestions || {},
    payload.fnovi_semantic_service_suggestions || {},
  ];
  const suggestions = new Map();
  blocks.flatMap((block) => Array.isArray(block.items) ? block.items : []).forEach((item) => {
    if (!item?.service_id) return;
    const current = suggestions.get(item.service_id);
    if (!current || Number(item.confidence || 0) > Number(current.confidence || 0)) {
      suggestions.set(item.service_id, item);
    }
  });
  return Array.from(suggestions.values()).sort((a, b) => Number(b.confidence || 0) - Number(a.confidence || 0));
}

function ServicesEditor({ services, setServices, taxonomy, clinic }) {
  const suggestions = serviceSuggestionsFromClinic(clinic)
    .filter((item) => item?.service_id && !services.some((srv) => srv.service_id === item.service_id));
  const approveSuggestion = (suggestion) => {
    setServices((prev) => [
      ...prev,
      {
        service_id: suggestion.service_id,
        service_name: suggestion.service_name,
        service_category: suggestion.service_category,
        price: '',
        animal_type: 'cane',
        source: suggestion.source === 'fnovi_semantic_ai' ? 'fnovi_confirmed' : 'gmb_review',
      },
    ]);
  };
  return (
    <Card>
      <CardHeader
        title="Servizi proposti"
        action={<Button variant="outline" onClick={() => setServices((prev) => [...prev, { service_id: '', price: '', animal_type: 'cane' }])}><Plus className="h-4 w-4" /> Aggiungi</Button>}
      />
      <div className="space-y-3 p-5">
        {!!suggestions.length && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
            <h3 className="font-semibold text-emerald-950">Servizi suggeriti dalle fonti</h3>
            <p className="mt-1 text-sm text-emerald-800">Le inferenze FNOVI sono gia attive sul sito come servizi affini, non come prestazioni dichiarate. Confermale solo quando la struttura dichiara esplicitamente di offrirle.</p>
            <div className="mt-3 space-y-2">
              {suggestions.map((suggestion) => {
                const isFnoviAffine = suggestion.source === 'fnovi_semantic_ai' && suggestion.status === 'auto_approved_affine';
                return (
                <div key={suggestion.service_id} className="rounded-md border border-emerald-200 bg-white p-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{suggestion.service_name}</p>
                      <p className="text-xs text-slate-500">{suggestion.service_category || 'Servizio'} · {suggestion.source === 'fnovi_semantic_ai' ? 'inferenza FNOVI' : 'recensioni GMB'} · confidenza {Math.round(Number(suggestion.confidence || 0) * 100)}%</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {isFnoviAffine && <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">Attivo come affine</span>}
                      <Button variant="success" size="sm" onClick={() => approveSuggestion(suggestion)}><CheckCircle2 className="h-4 w-4" /> {isFnoviAffine ? 'Conferma come dichiarato' : 'Approva'}</Button>
                    </div>
                  </div>
                  {!!suggestion.evidence?.length && (
                    <div className="mt-2 space-y-1">
                      {suggestion.evidence.slice(0, 2).map((evidence, idx) => (
                        <p key={`${suggestion.service_id}-${idx}`} className="rounded bg-slate-50 px-2 py-1 text-xs leading-5 text-slate-600">"{evidence.snippet}"</p>
                      ))}
                    </div>
                  )}
                </div>
              )})}
            </div>
          </div>
        )}
        {services.map((srv, idx) => (
          <div key={idx} className="grid gap-3 rounded-md border p-3 md:grid-cols-[2fr_1fr_1fr_auto]">
            <Select value={srv.service_id || ''} onChange={(value) => {
              const meta = taxonomy.find((item) => item.id === value);
              setServices((prev) => prev.map((item, i) => i === idx ? { ...item, service_id: value, service_name: meta?.name } : item));
            }}>
              <option value="">Seleziona servizio</option>
              {taxonomy.map((item) => <option key={item.id} value={item.id}>{item.name} - {item.category}</option>)}
            </Select>
            <Input placeholder="Prezzo" value={srv.price || ''} onChange={(e) => setServices((prev) => prev.map((item, i) => i === idx ? { ...item, price: e.target.value } : item))} />
            <Select value={srv.animal_type || 'cane'} onChange={(value) => setServices((prev) => prev.map((item, i) => i === idx ? { ...item, animal_type: value } : item))}>
              <option value="cane">Cane</option>
              <option value="gatto">Gatto</option>
              <option value="esotici">Esotici</option>
            </Select>
            <Button variant="ghost" onClick={() => setServices((prev) => prev.filter((_, i) => i !== idx))}><X className="h-4 w-4" /></Button>
          </div>
        ))}
        {!services.length && <p className="text-sm text-slate-500">Nessun servizio collegato.</p>}
      </div>
    </Card>
  );
}

function ReviewsEditor({ reviews, setReviews, save, loading }) {
  return (
    <Card>
      <CardHeader
        title="Recensioni manuali"
        action={<div className="flex gap-2"><Button variant="outline" onClick={() => setReviews((prev) => [...prev, { rating: 5, author_name: 'Anonimo', text: '', source: 'google' }])}><Plus className="h-4 w-4" /> Aggiungi</Button><Button onClick={save} disabled={loading || !reviews.length}><Upload className="h-4 w-4" /> Invia a Supabase</Button></div>}
      />
      <div className="space-y-3 p-5">
        {reviews.map((review, idx) => (
          <div key={idx} className="space-y-2 rounded-md border p-3">
            <div className="grid gap-2 md:grid-cols-[120px_1fr_auto]">
              <Input type="number" min="1" max="5" value={review.rating || ''} onChange={(e) => setReviews((prev) => prev.map((item, i) => i === idx ? { ...item, rating: e.target.value } : item))} />
              <Input value={review.author_name || ''} onChange={(e) => setReviews((prev) => prev.map((item, i) => i === idx ? { ...item, author_name: e.target.value } : item))} placeholder="Autore" />
              <Button variant="ghost" onClick={() => setReviews((prev) => prev.filter((_, i) => i !== idx))}><X className="h-4 w-4" /></Button>
            </div>
            <Textarea value={review.text || ''} onChange={(e) => setReviews((prev) => prev.map((item, i) => i === idx ? { ...item, text: e.target.value } : item))} placeholder="Testo recensione" />
          </div>
        ))}
        {!reviews.length && <p className="text-sm text-slate-500">Nessuna recensione disponibile.</p>}
      </div>
    </Card>
  );
}

function GalleryEditor({ clinic, uploadImage, deleteImage, loading }) {
  const images = Array.isArray(clinic.gallery_images) ? clinic.gallery_images : [];
  return (
    <Card>
      <CardHeader
        title="Galleria"
        action={<label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"><ImagePlus className="h-4 w-4" /> Carica<input type="file" accept="image/*" hidden disabled={loading} onChange={(e) => uploadImage(e.target.files?.[0])} /></label>}
      />
      <div className="p-5">
        {images.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {images.map((image) => (
              <div key={image} className="relative overflow-hidden rounded-md border">
                <img src={image} alt="" className="h-52 w-full object-cover" />
                <button type="button" onClick={() => deleteImage(image)} className="absolute right-2 top-2 rounded-full bg-white p-1 shadow" aria-label="Rimuovi immagine">
                  <Trash2 className="h-4 w-4 text-red-600" />
                </button>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-slate-500">Nessuna immagine.</p>}
      </div>
    </Card>
  );
}

function EnrichmentPanel({ clinic, runEnrich, result, loading }) {
  const [gmbQuery, setGmbQuery] = useState('');
  const [placeId, setPlaceId] = useState('');
  const items = [
    ['paginegialle', 'PagineGialle', 'Scraping dati e recensioni dalla source_url.', MessageSquare, !clinic.source_url],
    ['gmb', 'Google My Business', 'Coordinate, orari, recensioni e foto GMB (salvataggio /media).', MapPin, false],
    ['fnovi', 'FNOVI', 'Albo iscritti + match struttura (email, telefono, orari, servizi).', Stethoscope, false],
    ['website', 'Website', 'Spidering sito web, prezzi e immagini.', Globe, !clinic.website],
    ['images', 'Recupero immagini', 'Scarica foto da PG/sito e salva WebP su /media/gallery/clinics.', ImagePlus, false],
    ['deepseek', 'DeepSeek', 'Analisi AI delle recensioni.', Brain, false],
    ['complete', 'Refresh completo', 'Pipeline: PG → GMB → FNOVI → DeepSeek → Website.', Sparkles, false],
  ];
  return (
    <Card>
      <CardHeader title="Arricchimenti" description="Richiede gli script SPIDER disponibili sul server tramite ADMIN_TOOLS_ROOT." />
      <div className="grid gap-3 border-b p-5 md:grid-cols-2">
        <Field label="Query Google manuale">
          <Input
            value={gmbQuery}
            onChange={(event) => setGmbQuery(event.target.value)}
            placeholder="Es. Clinica Veterinaria Saline Pronto Soccorso H24"
          />
        </Field>
        <Field label="Google place_id">
          <Input
            value={placeId}
            onChange={(event) => setPlaceId(event.target.value)}
            placeholder="Es. ChIJ..."
          />
        </Field>
        <p className="text-sm leading-6 text-slate-500 md:col-span-2">
          Usa questi campi solo quando il matching automatico aggancia una scheda sbagliata o non trova il risultato Google corretto.
        </p>
      </div>
      <div className="grid gap-3 p-5 md:grid-cols-2">
        {items.map(([kind, title, desc, Icon, disabled]) => (
          <button
            key={kind}
            type="button"
            disabled={loading || disabled}
            onClick={() => runEnrich(kind, kind === 'gmb' ? { gmb_query: gmbQuery.trim(), place_id: placeId.trim() } : {})}
            className="rounded-md border p-4 text-left transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex items-center gap-2 font-semibold"><Icon className="h-4 w-4" /> {title}</div>
            <p className="mt-1 text-sm text-slate-500">{desc}</p>
          </button>
        ))}
      </div>
      {result && (
        <div className={`m-5 rounded-md border p-3 ${result.success ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
          <p className="font-semibold">{result.success ? 'Successo' : 'Errore'}</p>
          {result.command && <code className="mt-2 block break-all rounded bg-white p-2 text-xs">{result.command}</code>}
          {!!result.output?.length && <pre className="mt-2 max-h-72 overflow-auto rounded bg-slate-950 p-3 text-xs text-green-300">{result.output.join('\n')}</pre>}
          {!!result.error?.length && <pre className="mt-2 max-h-72 overflow-auto rounded bg-slate-950 p-3 text-xs text-red-300">{result.error.join('\n')}</pre>}
        </div>
      )}
    </Card>
  );
}

function TaxonomySection({ api, notify, initial }) {
  const [rows, setRows] = useState(initial);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({ name: '', category: '', description: '', allow_price: false, average_price: '' });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows((await api('taxonomy.list')).rows || []);
    } catch (error) {
      notify({ variant: 'destructive', title: 'Errore tassonomia', description: normalizeError(error) });
    } finally {
      setLoading(false);
    }
  }, [api, notify]);

  const saveRow = async (row) => {
    try {
      const clean = {
        ...row,
        name: row.name?.trim(),
        category: row.category?.trim(),
        description: row.description?.trim() || null,
        allow_price: !!row.allow_price,
        average_price: row.average_price === '' || row.average_price == null ? null : Number(row.average_price),
      };
      const data = await api('taxonomy.upsert', { row: clean });
      setRows((prev) => {
        const exists = prev.some((item) => item.id === data.row.id);
        return exists ? prev.map((item) => item.id === data.row.id ? data.row : item) : [...prev, data.row];
      });
      notify({ title: 'Servizio salvato' });
    } catch (error) {
      notify({ variant: 'destructive', title: 'Errore servizio', description: normalizeError(error) });
    }
  };

  const remove = async (id) => {
    if (!confirm('Eliminare questo servizio?')) return;
    try {
      await api('taxonomy.delete', { id });
      setRows((prev) => prev.filter((item) => item.id !== id));
      notify({ title: 'Servizio eliminato' });
    } catch (error) {
      notify({ variant: 'destructive', title: 'Errore eliminazione', description: normalizeError(error) });
    }
  };

  const importCsv = async (file) => {
    if (!file) return;
    const parsed = parseCsv(await file.text());
    if (!parsed.length) {
      notify({ variant: 'destructive', title: 'CSV non valido', description: 'Servono almeno name/nome e category/categoria.' });
      return;
    }
    try {
      await api('taxonomy.import', { rows: parsed });
      notify({ title: 'CSV importato', description: `${parsed.length} righe elaborate` });
      await load();
    } catch (error) {
      notify({ variant: 'destructive', title: 'Errore import CSV', description: normalizeError(error) });
    }
  };

  const filtered = rows.filter((row) => `${row.name} ${row.category}`.toLowerCase().includes(filter.toLowerCase()));

  return (
    <section className="space-y-4">
      <Toolbar title="Tassonomia servizi" description="Prestazioni, categorie, prezzi medi e abilitazione prezzo." loading={loading} onRefresh={load}>
        <Input placeholder="Filtro nome o categoria" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
          <FileSpreadsheet className="h-4 w-4" /> Importa CSV
          <input type="file" accept=".csv" hidden onChange={(e) => importCsv(e.target.files?.[0])} />
        </label>
      </Toolbar>

      <Card>
        <CardHeader title="Nuovo servizio" />
        <div className="grid gap-3 p-5 md:grid-cols-5">
          <Input placeholder="Nome" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
          <Input placeholder="Categoria" value={form.category} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} />
          <Input placeholder="Prezzo medio" type="number" value={form.average_price} onChange={(e) => setForm((prev) => ({ ...prev, average_price: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.allow_price} onChange={(e) => setForm((prev) => ({ ...prev, allow_price: e.target.checked }))} /> Abilita prezzo</label>
          <Button onClick={async () => { await saveRow(form); setForm({ name: '', category: '', description: '', allow_price: false, average_price: '' }); }}><Plus className="h-4 w-4" /> Aggiungi</Button>
          <Textarea className="md:col-span-5" placeholder="Descrizione" value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
        </div>
      </Card>

      <DataTable headers={['Nome', 'Categoria', 'Descrizione', 'Prezzo medio', 'Prezzo?', 'Azioni']}>
        {filtered.map((row) => (
          <TaxonomyRow key={row.id} row={row} onSave={saveRow} onDelete={remove} />
        ))}
      </DataTable>
    </section>
  );
}

function TaxonomyRow({ row, onSave, onDelete }) {
  const [draft, setDraft] = useState(row);
  useEffect(() => { setDraft(row); }, [row]);
  const set = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }));
  return (
    <tr className="border-t align-top">
      <td className="px-4 py-3"><Textarea value={draft.name || ''} onChange={(e) => set('name', e.target.value)} /></td>
      <td className="px-4 py-3"><Input value={draft.category || ''} onChange={(e) => set('category', e.target.value)} /></td>
      <td className="px-4 py-3"><Textarea value={draft.description || ''} onChange={(e) => set('description', e.target.value)} /></td>
      <td className="px-4 py-3"><Input type="number" value={draft.average_price ?? ''} onChange={(e) => set('average_price', e.target.value)} /></td>
      <td className="px-4 py-3"><input type="checkbox" checked={!!draft.allow_price} onChange={(e) => set('allow_price', e.target.checked)} /></td>
      <td className="px-4 py-3">
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onSave(draft)}><Save className="h-4 w-4" /></Button>
          <Button size="sm" variant="danger" onClick={() => onDelete(row.id)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </td>
    </tr>
  );
}

function CmsSection() {
  const links = [
    ['/admin-test/integratori', 'Lista articoli', 'Gestione articoli integratori CMS.'],
    ['/admin-test/integratori/new', 'Nuovo articolo', 'Editor articolo integratore.'],
    ['/admin-test/integratori/generate-ai', 'Genera con AI', 'Generazione contenuto e immagine.'],
    ['/admin-test/integratori/import', 'Import CSV', 'Import massivo contenuti.'],
  ];
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">CMS Integratori</h2>
        <p className="text-sm text-slate-500">Gestione articoli, import CSV e generazione AI della sezione integratori.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {links.map(([href, title, desc]) => (
          <a key={href} href={href} className="rounded-lg border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <PackageIcon />
            <p className="mt-3 font-semibold">{title}</p>
            <p className="mt-1 text-sm text-slate-500">{desc}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

function Toolbar({ title, description, loading, onRefresh, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-semibold">{title}</h2>
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {onRefresh && (
          <Button variant="outline" onClick={onRefresh} disabled={loading}>
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Aggiorna
          </Button>
        )}
      </div>
    </div>
  );
}

function DataTable({ headers, children }) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="bg-slate-100 text-slate-600">
          <tr>{headers.map((header) => <th key={header} className="px-4 py-2 text-left font-semibold">{header}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function EmptyRow({ cols, text }) {
  return <tr><td colSpan={cols} className="px-4 py-8 text-center text-slate-500">{text}</td></tr>;
}

function Badge({ children }) {
  return <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">{children}</span>;
}

function PackageIcon() {
  return (
    <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
      <FileSpreadsheet className="h-5 w-5" />
    </div>
  );
}
