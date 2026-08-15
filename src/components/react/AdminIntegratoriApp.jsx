import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Download,
  Edit,
  Eye,
  FileDown,
  FileText,
  Image as ImageIcon,
  Loader2,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
  XCircle,
} from 'lucide-react';

async function getSupabase() {
  const { supabaseBrowser } = await import('@/lib/supabase-browser');
  return supabaseBrowser;
}

const emptyArticle = {
  titolo: '',
  slug: '',
  descrizione_breve: '',
  descrizione_completa: '',
  foto_url: '',
  categoria_id: '',
  amazon_url: '',
  amazon_valutazione: '',
  affiliate_link: '',
  affiliate_source: 'amazon',
  status: 'draft',
  faq: [],
};

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function normalizeError(error) {
  if (!error) return 'Errore sconosciuto';
  if (Array.isArray(error)) return error.join('\n');
  return error.message || String(error);
}

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"' && line[i + 1] === '"') {
      cur += '"';
      i += 1;
    } else if (ch === '"') {
      quoted = !quoted;
    } else if (ch === ',' && !quoted) {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

function parseCSV(csvContent) {
  const lines = csvContent.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error('CSV deve contenere header e almeno una riga.');
  const headers = parseCsvLine(lines[0]).map((item) => item.toLowerCase());
  if (!headers.includes('titolo') || !headers.includes('slug')) {
    throw new Error('Campi obbligatori mancanti: titolo, slug');
  }
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      let value = values[index] || '';
      if (header === 'faq') {
        try {
          value = value ? JSON.parse(value) : [];
        } catch {
          value = [];
        }
      }
      if (header === 'amazon_valutazione' && value) value = Number(value);
      row[header] = value || null;
    });
    row.status = row.status || 'draft';
    row.faq = Array.isArray(row.faq) ? row.faq : [];
    return row;
  });
}

export default function AdminIntegratoriApp({ mode = 'list', articleId = null }) {
  const [token, setToken] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [toast, setToast] = useState(null);
  const [categories, setCategories] = useState([]);
  const [bootError, setBootError] = useState(null);

  const notify = useCallback((payload) => {
    setToast(payload);
    window.clearTimeout(window.__adminIntToastTimer);
    window.__adminIntToastTimer = window.setTimeout(() => setToast(null), 4500);
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
    if (!response.ok || data.success === false) throw new Error(data.error || `Richiesta fallita (${response.status})`);
    return data;
  }, [token]);

  useEffect(() => {
    let mounted = true;
    getSupabase().then(async (supabase) => {
      const { data } = await supabase.auth.getSession();
      if (mounted) {
        setToken(data?.session?.access_token || null);
        setLoadingSession(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (loadingSession) return;
    api('integratori.categories')
      .then((data) => setCategories(data.rows || []))
      .catch((error) => setBootError(normalizeError(error)));
  }, [api, loadingSession]);

  if (loadingSession) {
    return <LoadingScreen />;
  }

  if (bootError) {
    return (
      <AdminPage title="CMS Integratori" subtitle="Area amministrativa protetta">
        <Panel className="p-8 text-center">
          <XCircle className="mx-auto h-10 w-10 text-red-600" />
          <h2 className="mt-3 text-xl font-semibold">Accesso non disponibile</h2>
          <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{bootError}</p>
          <div className="mt-5 flex justify-center gap-2">
            <a className="btn" href="/login">Login</a>
            <a className="btn-outline" href="/admin-test">Torna admin</a>
          </div>
        </Panel>
      </AdminPage>
    );
  }

  return (
    <>
      {mode === 'list' && <ListView api={api} notify={notify} categories={categories} />}
      {mode === 'editor' && <EditorView api={api} notify={notify} categories={categories} articleId={articleId} />}
      {mode === 'import' && <ImportView api={api} notify={notify} />}
      {mode === 'ai' && <AIView api={api} notify={notify} categories={categories} />}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}

function ListView({ api, notify, categories }) {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('integratori.list', { search, category, status, page, per_page: 20 });
      setRows(data.rows || []);
      setTotalPages(data.total_pages || 1);
      setCount(data.count || 0);
    } catch (error) {
      notify({ variant: 'destructive', title: 'Errore articoli', description: normalizeError(error) });
    } finally {
      setLoading(false);
    }
  }, [api, notify, search, category, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  const duplicate = async (id) => {
    try {
      await api('integratori.duplicate', { id });
      notify({ title: 'Articolo duplicato' });
      await load();
    } catch (error) {
      notify({ variant: 'destructive', title: 'Errore duplicazione', description: normalizeError(error) });
    }
  };

  const remove = async (row) => {
    if (!confirm(`Eliminare "${row.titolo}"?`)) return;
    try {
      await api('integratori.delete', { id: row.id });
      notify({ title: 'Articolo eliminato' });
      await load();
    } catch (error) {
      notify({ variant: 'destructive', title: 'Errore eliminazione', description: normalizeError(error) });
    }
  };

  return (
    <AdminPage title="Gestione Integratori" subtitle="Gestisci gli articoli sugli integratori per animali">
      <Panel className="p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-wrap gap-3">
            <div className="relative min-w-64 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Cerca per titolo" className="pl-9" />
            </div>
            <Select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
              <option value="all">Tutte le categorie</option>
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
            </Select>
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="all">Tutti gli status</option>
              <option value="pubblicato">Pubblicato</option>
              <option value="draft">Bozza</option>
              <option value="archivio">Archivio</option>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={load} disabled={loading}><RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Aggiorna</Button>
            <a className="btn-outline" href="/admin-test/integratori/import"><FileDown className="h-4 w-4" /> Importa CSV</a>
            <a className="btn-outline" href="/admin-test/integratori/generate-ai"><Sparkles className="h-4 w-4" /> Genera con AI</a>
            <a className="btn" href="/admin-test/integratori/new"><Plus className="h-4 w-4" /> Nuovo articolo</a>
          </div>
        </div>
      </Panel>

      <Panel>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold">Articoli ({count})</h2>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-2 text-left">Titolo</th>
                <th className="px-4 py-2 text-left">Categoria</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Data</th>
                <th className="px-4 py-2 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{row.titolo}</td>
                  <td className="px-4 py-3">{row.categoria?.nome || '-'}</td>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  <td className="px-4 py-3 text-slate-500">{row.created_at ? new Date(row.created_at).toLocaleDateString('it-IT') : '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <IconLink href={`/integratori/${row.slug}`} title="Anteprima" external><Eye className="h-4 w-4" /></IconLink>
                      <IconLink href={`/admin-test/integratori/${row.id}/edit`} title="Modifica"><Edit className="h-4 w-4" /></IconLink>
                      <IconButton title="Duplica" onClick={() => duplicate(row.id)}><Copy className="h-4 w-4" /></IconButton>
                      <IconButton title="Elimina" onClick={() => remove(row)}><Trash2 className="h-4 w-4 text-red-600" /></IconButton>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan="5" className="px-4 py-10 text-center text-slate-500">Nessun articolo trovato.</td></tr>}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-5 py-4">
            <p className="text-sm text-slate-500">Pagina {page} di {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>Precedente</Button>
              <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>Successiva</Button>
            </div>
          </div>
        )}
      </Panel>
    </AdminPage>
  );
}

function EditorView({ api, notify, categories, articleId }) {
  const isNew = !articleId || articleId === 'new';
  const [form, setForm] = useState(emptyArticle);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [scraping, setScraping] = useState(false);

  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    api('integratori.get', { id: articleId })
      .then((data) => setForm({ ...emptyArticle, ...data.row, faq: data.row?.faq || [] }))
      .catch((error) => notify({ variant: 'destructive', title: 'Errore articolo', description: normalizeError(error) }))
      .finally(() => setLoading(false));
  }, [api, articleId, isNew, notify]);

  const set = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'titolo' && isNew ? { slug: slugify(value) } : {}),
    }));
  };

  const save = async (publish = false) => {
    if (!form.titolo || !form.slug) {
      notify({ variant: 'destructive', title: 'Campi obbligatori', description: 'Titolo e slug sono obbligatori.' });
      return;
    }
    setSaving(true);
    try {
      const data = await api('integratori.save', { id: isNew ? null : articleId, row: { ...form, status: publish ? 'pubblicato' : form.status } });
      notify({ title: publish ? 'Articolo pubblicato' : 'Articolo salvato' });
      if (isNew) window.location.assign(`/admin-test/integratori/${data.row.id}/edit`);
      else setForm({ ...emptyArticle, ...data.row, faq: data.row?.faq || [] });
    } catch (error) {
      notify({ variant: 'destructive', title: 'Errore salvataggio', description: normalizeError(error) });
    } finally {
      setSaving(false);
    }
  };

  const scrapeAmazon = async () => {
    if (!form.amazon_url) {
      notify({ variant: 'destructive', title: 'URL richiesto', description: 'Inserisci prima un URL Amazon.' });
      return;
    }
    setScraping(true);
    try {
      const data = await api('integratori.scrapeAmazon', { url: form.amazon_url });
      setForm((prev) => ({
        ...prev,
        amazon_url: data.product.url || prev.amazon_url,
        affiliate_link: prev.affiliate_link || data.product.url,
        metadata: { ...(prev.metadata || {}), asin: data.product.asin },
      }));
      notify({ title: 'ASIN recuperato', description: data.product.asin });
    } catch (error) {
      notify({ variant: 'destructive', title: 'Errore Amazon', description: normalizeError(error) });
    } finally {
      setScraping(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <AdminPage title={isNew ? 'Nuovo articolo' : 'Modifica articolo'} subtitle="CMS integratori">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <a className="btn-outline" href="/admin-test/integratori"><ArrowLeft className="h-4 w-4" /> Torna alla lista</a>
        <div className="flex flex-wrap gap-2">
          <a className={`btn-outline ${!form.slug || form.status !== 'pubblicato' ? 'pointer-events-none opacity-50' : ''}`} href={`/integratori/${form.slug}`} target="_blank" rel="noreferrer"><Eye className="h-4 w-4" /> Anteprima</a>
          <Button variant="outline" onClick={() => save(false)} disabled={saving}><Save className="h-4 w-4" /> Salva bozza</Button>
          <Button onClick={() => save(true)} disabled={saving}><Save className="h-4 w-4" /> Pubblica</Button>
        </div>
      </div>
      <ArticleForm
        form={form}
        set={set}
        setForm={setForm}
        categories={categories}
        scrapeAmazon={scrapeAmazon}
        scraping={scraping}
      />
    </AdminPage>
  );
}

function ArticleForm({ form, set, setForm, categories, scrapeAmazon, scraping }) {
  const updateFaq = (idx, field, value) => {
    setForm((prev) => ({ ...prev, faq: prev.faq.map((item, i) => i === idx ? { ...item, [field]: value } : item) }));
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Panel>
          <PanelHeader title="Informazioni base" />
          <div className="space-y-4 p-5">
            <Field label="Titolo *"><Input value={form.titolo || ''} onChange={(e) => set('titolo', e.target.value)} maxLength={255} /></Field>
            <Field label="Slug URL *">
              <Input value={form.slug || ''} onChange={(e) => set('slug', e.target.value)} />
              <p className="mt-1 text-xs text-slate-500">URL: /integratori/{form.slug || 'slug'}</p>
            </Field>
            <Field label="Descrizione breve">
              <Textarea value={form.descrizione_breve || ''} onChange={(e) => set('descrizione_breve', e.target.value)} maxLength={150} rows={3} />
              <p className="mt-1 text-xs text-slate-500">{(form.descrizione_breve || '').length}/150 caratteri</p>
            </Field>
            <Field label="Descrizione completa"><Textarea value={form.descrizione_completa || ''} onChange={(e) => set('descrizione_completa', e.target.value)} rows={14} className="font-mono" /></Field>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Immagine" />
          <div className="space-y-4 p-5">
            <Field label="URL immagine"><Input value={form.foto_url || ''} onChange={(e) => set('foto_url', e.target.value)} placeholder="https://..." /></Field>
            {form.foto_url && <img src={form.foto_url} alt="Anteprima" className="max-h-72 w-full rounded-md border object-cover" />}
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="FAQ"
            action={<Button variant="outline" onClick={() => setForm((prev) => ({ ...prev, faq: [...(prev.faq || []), { domanda: '', risposta: '' }] }))}><Plus className="h-4 w-4" /> Aggiungi FAQ</Button>}
          />
          <div className="space-y-4 p-5">
            {(form.faq || []).map((item, idx) => (
              <div key={idx} className="space-y-3 rounded-md border p-4">
                <div className="flex justify-end">
                  <Button variant="ghost" onClick={() => setForm((prev) => ({ ...prev, faq: prev.faq.filter((_, i) => i !== idx) }))}><X className="h-4 w-4" /></Button>
                </div>
                <Field label="Domanda"><Input value={item.domanda || ''} onChange={(e) => updateFaq(idx, 'domanda', e.target.value)} /></Field>
                <Field label="Risposta"><Textarea value={item.risposta || ''} onChange={(e) => updateFaq(idx, 'risposta', e.target.value)} rows={3} /></Field>
              </div>
            ))}
            {!form.faq?.length && <p className="text-center text-sm text-slate-500">Nessuna FAQ.</p>}
          </div>
        </Panel>
      </div>
      <aside className="space-y-6">
        <Panel>
          <PanelHeader title="Pubblicazione" />
          <div className="space-y-2 p-5">
            {['draft', 'pubblicato', 'archivio'].map((status) => (
              <label key={status} className="flex items-center gap-2 text-sm">
                <input type="radio" checked={form.status === status} onChange={() => set('status', status)} />
                {status === 'draft' ? 'Bozza' : status === 'pubblicato' ? 'Pubblicato' : 'Archivio'}
              </label>
            ))}
          </div>
        </Panel>
        <Panel>
          <PanelHeader title="Categoria" />
          <div className="p-5">
            <Select value={form.categoria_id || ''} onChange={(e) => set('categoria_id', e.target.value)}>
              <option value="">Seleziona categoria</option>
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
            </Select>
          </div>
        </Panel>
        <Panel>
          <PanelHeader title="Amazon/Affiliazione" />
          <div className="space-y-4 p-5">
            <Field label="URL Amazon">
              <div className="flex gap-2">
                <Input value={form.amazon_url || ''} onChange={(e) => set('amazon_url', e.target.value)} />
                <Button variant="outline" onClick={scrapeAmazon} disabled={scraping}>{scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</Button>
              </div>
            </Field>
            <Field label="Valutazione"><Input type="number" min="0" max="5" step="0.1" value={form.amazon_valutazione || ''} onChange={(e) => set('amazon_valutazione', e.target.value)} /></Field>
            <Field label="Link affiliato"><Input value={form.affiliate_link || ''} onChange={(e) => set('affiliate_link', e.target.value)} /></Field>
            <Field label="Fonte">
              <Select value={form.affiliate_source || 'amazon'} onChange={(e) => set('affiliate_source', e.target.value)}>
                <option value="amazon">Amazon</option>
                <option value="aliexpress">AliExpress</option>
                <option value="altro">Altro</option>
              </Select>
            </Field>
          </div>
        </Panel>
      </aside>
    </div>
  );
}

function ImportView({ api, notify }) {
  const [parsed, setParsed] = useState([]);
  const [errors, setErrors] = useState([]);
  const [results, setResults] = useState(null);
  const [importing, setImporting] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    try {
      const rows = parseCSV(await file.text());
      const validation = [];
      rows.forEach((row, idx) => {
        if (!row.titolo) validation.push(`Riga ${idx + 2}: titolo mancante`);
        if (!row.slug) validation.push(`Riga ${idx + 2}: slug mancante`);
        if (row.descrizione_breve && row.descrizione_breve.length > 150) validation.push(`Riga ${idx + 2}: descrizione breve oltre 150 caratteri`);
      });
      setParsed(rows);
      setErrors(validation);
      setResults(null);
      notify(validation.length ? { variant: 'destructive', title: 'CSV con errori', description: `${validation.length} errori rilevati` } : { title: 'CSV valido', description: `${rows.length} articoli pronti` });
    } catch (error) {
      setParsed([]);
      setErrors([normalizeError(error)]);
      notify({ variant: 'destructive', title: 'Errore CSV', description: normalizeError(error) });
    }
  };

  const importRows = async () => {
    setImporting(true);
    try {
      const data = await api('integratori.import', { rows: parsed });
      setResults(data.result);
      notify({ title: 'Import completato', description: `${data.result.success.length} importati, ${data.result.errors.length} errori` });
    } catch (error) {
      notify({ variant: 'destructive', title: 'Errore import', description: normalizeError(error) });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = `titolo,slug,descrizione_breve,descrizione_completa,foto_url,categoria_id,amazon_url,amazon_valutazione,affiliate_link,affiliate_source,status,faq
Omega-3 per Cani,omega-3-per-cani,Integratore omega-3 per cani,Descrizione completa...,https://example.com/image.jpg,,https://amazon.it/dp/XXXXXXXXXX,4.5,https://amzn.to/...,amazon,draft,"[{""domanda"":""Come si usa?"",""risposta"":""Secondo indicazione veterinaria""}]"`;
    const url = URL.createObjectURL(new Blob([template], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template-integratori.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminPage title="Importa Articoli da CSV" subtitle="Carica un file CSV per importare piu articoli contemporaneamente">
      <div className="mb-4"><a className="btn-outline" href="/admin-test/integratori"><ArrowLeft className="h-4 w-4" /> Torna alla lista</a></div>
      <Panel className="p-5">
        <div className="space-y-4">
          <Field label="Seleziona file CSV"><Input type="file" accept=".csv" onChange={(e) => handleFile(e.target.files?.[0])} /></Field>
          <Button variant="outline" onClick={downloadTemplate}><Download className="h-4 w-4" /> Scarica template</Button>
        </div>
      </Panel>
      {!!errors.length && <ResultBox destructive title="Errori di validazione" lines={errors} />}
      {!!parsed.length && (
        <Panel>
          <PanelHeader title={`Anteprima articoli (${parsed.length})`} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-100"><tr><th className="px-4 py-2 text-left">Titolo</th><th className="px-4 py-2 text-left">Slug</th><th className="px-4 py-2 text-left">Status</th></tr></thead>
              <tbody>{parsed.slice(0, 10).map((row, idx) => <tr key={idx} className="border-t"><td className="px-4 py-2">{row.titolo}</td><td className="px-4 py-2">{row.slug}</td><td className="px-4 py-2">{row.status || 'draft'}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="border-t p-4">
            <Button onClick={importRows} disabled={!parsed.length || !!errors.length || importing}>{importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />} Importa {parsed.length} articoli</Button>
          </div>
        </Panel>
      )}
      {results && (
        <Panel className="p-5">
          <h2 className="mb-3 font-semibold">Risultati import</h2>
          <p className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-5 w-5" /> Importati: {results.success.length}</p>
          <p className="mt-2 flex items-center gap-2 text-red-700"><XCircle className="h-5 w-5" /> Errori: {results.errors.length}</p>
          {!!results.errors.length && <ul className="mt-3 list-disc pl-5 text-sm text-red-700">{results.errors.map((err, idx) => <li key={idx}>{err.article}: {err.error}</li>)}</ul>}
        </Panel>
      )}
    </AdminPage>
  );
}

function AIView({ api, notify, categories }) {
  const [amazonUrl, setAmazonUrl] = useState('');
  const [product, setProduct] = useState(null);
  const [form, setForm] = useState(emptyArticle);
  const [promptTemplate, setPromptTemplate] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const scrape = async () => {
    if (!amazonUrl) return;
    setLoading(true);
    try {
      const data = await api('integratori.scrapeAmazon', { url: amazonUrl });
      setProduct(data.product);
      setForm((prev) => ({ ...prev, amazon_url: amazonUrl, affiliate_link: amazonUrl, metadata: { asin: data.product.asin } }));
      notify({ title: 'Dati prodotto inizializzati', description: data.product.asin });
    } catch (error) {
      notify({ variant: 'destructive', title: 'Errore Amazon', description: normalizeError(error) });
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async () => {
    setLoading(true);
    try {
      const data = await api('integratori.generateContent', { product_data: { ...product, ...form }, template: promptTemplate });
      setForm((prev) => ({ ...prev, descrizione_completa: data.content }));
      notify({ title: 'Contenuto generato' });
    } catch (error) {
      notify({ variant: 'destructive', title: 'Errore generazione contenuto', description: normalizeError(error) });
    } finally {
      setLoading(false);
    }
  };

  const generateImage = async () => {
    setLoading(true);
    try {
      const data = await api('integratori.generateImage', { prompt: imagePrompt, width: 1024, height: 1024 });
      setForm((prev) => ({ ...prev, foto_url: data.image_url }));
      notify({ title: 'Immagine generata' });
    } catch (error) {
      notify({ variant: 'destructive', title: 'Errore generazione immagine', description: normalizeError(error) });
    } finally {
      setLoading(false);
    }
  };

  const save = async (publish = false) => {
    setSaving(true);
    try {
      const data = await api('integratori.save', { row: { ...form, status: publish ? 'pubblicato' : form.status } });
      notify({ title: publish ? 'Articolo pubblicato' : 'Articolo salvato' });
      window.location.assign(`/admin-test/integratori/${data.row.id}/edit`);
    } catch (error) {
      notify({ variant: 'destructive', title: 'Errore salvataggio', description: normalizeError(error) });
    } finally {
      setSaving(false);
    }
  };

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value, ...(field === 'titolo' ? { slug: slugify(value) } : {}) }));

  return (
    <AdminPage title="Genera Articolo con AI" subtitle="Parti da un URL Amazon e genera contenuto/immagine">
      <div className="mb-4"><a className="btn-outline" href="/admin-test/integratori"><ArrowLeft className="h-4 w-4" /> Torna alla lista</a></div>
      <Panel>
        <PanelHeader title="Step 1: URL Amazon" />
        <div className="flex flex-col gap-3 p-5 md:flex-row">
          <Input value={amazonUrl} onChange={(e) => setAmazonUrl(e.target.value)} placeholder="https://amazon.it/dp/..." />
          <Button onClick={scrape} disabled={!amazonUrl || loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Recupera</Button>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Informazioni base" />
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <Field label="Titolo *"><Input value={form.titolo} onChange={(e) => set('titolo', e.target.value)} /></Field>
          <Field label="Slug *"><Input value={form.slug} onChange={(e) => set('slug', e.target.value)} /></Field>
          <Field label="Descrizione breve" className="md:col-span-2"><Textarea value={form.descrizione_breve || ''} onChange={(e) => set('descrizione_breve', e.target.value)} maxLength={150} /></Field>
          <Field label="Categoria"><Select value={form.categoria_id || ''} onChange={(e) => set('categoria_id', e.target.value)}><option value="">Seleziona categoria</option>{categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}</Select></Field>
          <Field label="Valutazione"><Input type="number" step="0.1" value={form.amazon_valutazione || ''} onChange={(e) => set('amazon_valutazione', e.target.value)} /></Field>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Generazione contenuto" />
        <div className="space-y-4 p-5">
          <Field label="Template prompt opzionale"><Textarea value={promptTemplate} onChange={(e) => setPromptTemplate(e.target.value)} rows={4} /></Field>
          <Button onClick={generateContent} disabled={loading || (!product && !form.titolo)}><Sparkles className="h-4 w-4" /> Genera contenuto completo</Button>
          <Field label="Contenuto"><Textarea value={form.descrizione_completa || ''} onChange={(e) => set('descrizione_completa', e.target.value)} rows={16} className="font-mono" /></Field>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Generazione immagine" />
        <div className="space-y-4 p-5">
          <Field label="Prompt immagine"><Textarea value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} rows={3} placeholder="Integratore per cani, confezione moderna, sfondo bianco..." /></Field>
          <Button variant="outline" onClick={generateImage} disabled={loading || !imagePrompt}><ImageIcon className="h-4 w-4" /> Genera immagine</Button>
          <Field label="URL immagine"><Input value={form.foto_url || ''} onChange={(e) => set('foto_url', e.target.value)} /></Field>
          {form.foto_url && <img src={form.foto_url} alt="" className="max-h-72 rounded-md border object-cover" />}
        </div>
      </Panel>

      <div className="flex gap-2">
        <Button variant="outline" disabled={saving} onClick={() => save(false)}><Save className="h-4 w-4" /> Salva bozza</Button>
        <Button disabled={saving} onClick={() => save(true)}><Save className="h-4 w-4" /> Pubblica</Button>
      </div>
    </AdminPage>
  );
}

function AdminPage({ title, subtitle, children }) {
  return (
    <div className="bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Admin test</p>
            <h1 className="text-3xl font-bold text-slate-950">{title}</h1>
            {subtitle && <p className="mt-2 text-slate-600">{subtitle}</p>}
          </div>
          <a className="btn-outline" href="/admin-test">Console admin</a>
        </div>
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-10 w-10 animate-spin text-slate-600" /></div>;
}

function Panel({ children, className = '' }) {
  return <div className={`rounded-lg border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

function PanelHeader({ title, action }) {
  return <div className="flex items-center justify-between gap-3 border-b px-5 py-4"><h2 className="font-semibold">{title}</h2>{action}</div>;
}

function Field({ label, children, className = '' }) {
  return <label className={`block space-y-1 ${className}`}><span className="text-xs font-semibold uppercase text-slate-500">{label}</span>{children}</label>;
}

function Input(props) {
  return <input {...props} className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-700 ${props.className || ''}`} />;
}

function Textarea(props) {
  return <textarea {...props} className={`min-h-[90px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-700 ${props.className || ''}`} />;
}

function Select(props) {
  return <select {...props} className={`rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-700 ${props.className || ''}`} />;
}

function Button({ children, variant = 'default', className = '', ...props }) {
  const cls = variant === 'outline'
    ? 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
    : variant === 'ghost'
      ? 'border-transparent bg-transparent text-slate-700 hover:bg-slate-100'
      : 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800';
  return <button type="button" className={`inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${cls} ${className}`} {...props}>{children}</button>;
}

function IconButton({ children, title, onClick }) {
  return <button type="button" title={title} onClick={onClick} className="rounded-md p-2 hover:bg-slate-100">{children}</button>;
}

function IconLink({ children, title, href, external }) {
  return <a title={title} href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} className="inline-flex rounded-md p-2 hover:bg-slate-100">{children}</a>;
}

function StatusBadge({ status }) {
  const map = {
    pubblicato: 'bg-emerald-100 text-emerald-800',
    draft: 'bg-slate-100 text-slate-700',
    archivio: 'bg-amber-100 text-amber-800',
  };
  const label = status === 'pubblicato' ? 'Pubblicato' : status === 'archivio' ? 'Archivio' : 'Bozza';
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${map[status] || map.draft}`}>{label}</span>;
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className={`fixed bottom-5 right-5 z-50 max-w-md rounded-lg border px-4 py-3 shadow-lg ${toast.variant === 'destructive' ? 'border-red-200 bg-red-50 text-red-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
      <div className="flex gap-3">
        <div><p className="font-semibold">{toast.title}</p>{toast.description && <p className="mt-1 whitespace-pre-line text-sm opacity-80">{toast.description}</p>}</div>
        <button type="button" className="ml-auto" onClick={onClose}><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

function ResultBox({ title, lines, destructive }) {
  return (
    <Panel className={`p-5 ${destructive ? 'border-red-200 bg-red-50' : ''}`}>
      <h2 className={`font-semibold ${destructive ? 'text-red-700' : ''}`}>{title}</h2>
      <ul className="mt-3 list-disc pl-5 text-sm text-red-700">{lines.map((line, idx) => <li key={idx}>{line}</li>)}</ul>
    </Panel>
  );
}
