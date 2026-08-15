import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Check,
  ChevronRight,
  Euro,
  ExternalLink,
  FileText,
  Heart,
  HeartPulse,
  Home as HomeIcon,
  ImagePlus,
  Loader2,
  Mail,
  MapPin,
  PawPrint,
  Phone,
  Plus,
  Share2,
  Shield,
  Trash2,
} from 'lucide-react';

const emptyPet = {
  name: '',
  species: 'cane',
  breed: '',
  sex: '',
  birth_date: '',
  weight_kg: '',
  photo_url: '',
  microchip: '',
  neutered: '',
  allergies: '',
  conditions: '',
  medications: '',
  nutrition_notes: '',
  behavior_notes: '',
};

const breedOptions = {
  cane: [
    'Bastardino ❤',
    'Labrador Retriever',
    'Golden Retriever',
    'Pastore Tedesco',
    'Bulldog Francese',
    'Barboncino',
    'Chihuahua',
    'Jack Russell Terrier',
    'Beagle',
    'Border Collie',
    'Cocker Spaniel',
    'Bassotto',
    'Maltese',
    'Shih Tzu',
    'Volpino',
    'Pitbull',
    'Rottweiler',
    'Altro',
  ],
  gatto: [
    'Europeo ❤',
    'Siamese',
    'Persiano',
    'Maine Coon',
    'British Shorthair',
    'Certosino',
    'Ragdoll',
    'Bengala',
    'Siberiano',
    'Sphynx',
    'Altro',
  ],
  coniglio: ['Ariete', 'Nano', 'Testa di leone', 'Rex', 'Altro'],
  altro: ['Bastardino ❤', 'Altro'],
};

async function api(method = 'GET', body) {
  const response = await fetch('/api/pet-lover', {
    method,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) throw new Error(payload.error || 'Operazione non riuscita.');
  return payload.data;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function money(value) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(value || 0));
}

function dateLabel(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

const itDays = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

function parseIntervals(label) {
  const value = String(label || '').toLowerCase().trim();
  if (!value || value.includes('chiuso') || value.includes('appuntament')) return [];
  if (value === 'h24' || value === '24 ore' || value === '24h' || value.includes('h24') || (value.includes('24') && !value.includes(':'))) return [[0, 24 * 60]];
  return String(label || '')
    .split(',')
    .map((part) => part.match(/(\d{1,2}):?(\d{2})?\s*-\s*(\d{1,2}):?(\d{2})?/))
    .filter(Boolean)
    .map((match) => {
      const start = Number(match[1]) * 60 + Number(match[2] || 0);
      const end = Number(match[3]) * 60 + Number(match[4] || 0);
      return end > start ? [start, end] : null;
    })
    .filter(Boolean);
}

function openLabel(hours) {
  if (!hours || typeof hours !== 'object') return { label: 'Orari non disponibili', className: 'bg-slate-100 text-slate-600' };
  const today = itDays[new Date().getDay()];
  const raw = hours[today] || hours[today.toLowerCase()];
  const text = Array.isArray(raw) ? raw.join(', ') : raw;
  const intervals = parseIntervals(text);
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  if (intervals.some(([start, end]) => minutes >= start && minutes < end)) return { label: 'Aperto ora', className: 'bg-emerald-100 text-emerald-700' };
  return { label: 'Chiuso ora', className: 'bg-slate-100 text-slate-600' };
}

function userLabel(user) {
  return user?.full_name || user?.email || 'Pet Lover';
}

function petPublicPath(pet) {
  return pet?.id ? `/dashboard/pet-lover#animale-${pet.id}` : '/dashboard/pet-lover';
}

export default function PetLoverApp() {
  const [data, setData] = useState(null);
  const [active, setActive] = useState('home');
  const [editingPet, setEditingPet] = useState(null);
  const [reminder, setReminder] = useState({ pet_id: '', reminder_type: 'vaccino', title: '', due_date: '', repeat_rule: '', notes: '' });
  const [expense, setExpense] = useState({ pet_id: '', spent_on: todayIso(), amount: '', category: 'visita', vendor: '', document_url: '', notes: '' });
  const [fiscal, setFiscal] = useState({ fiscal_code: '', billing_name: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api()
      .then((next) => {
        setData(next);
        setFiscal({
          fiscal_code: next?.fiscal_profile?.fiscal_code || '',
          billing_name: next?.fiscal_profile?.billing_name || '',
        });
      })
      .catch((error) => {
        if (String(error.message).includes('Sessione')) {
          window.location.assign('/login?redirect=/dashboard/pet-lover');
          return;
        }
        setMessage(error.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const pets = data?.pets || [];
  const user = data?.user || null;
  const reminders = data?.reminders || [];
  const expenses = data?.expenses || [];
  const shareLinks = data?.share_links || [];
  const favoriteClinics = data?.favorite_clinics || [];
  const upcoming = reminders.filter((item) => !item.completed_at).slice(0, 3);
  const currentYear = new Date().getFullYear();
  const yearlyTotal = useMemo(() => expenses
    .filter((item) => String(item.spent_on || '').startsWith(String(currentYear)))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0), [expenses, currentYear]);
  const selectedPetId = active.startsWith('pet:') ? active.slice(4) : '';
  const selectedPet = selectedPetId ? pets.find((pet) => pet.id === selectedPetId) : null;

  useEffect(() => {
    const syncHash = () => {
      const match = window.location.hash.match(/^#animale-(.+)$/);
      if (match?.[1]) setActive(`pet:${match[1]}`);
    };
    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  const openPet = (pet) => {
    if (!pet?.id) return;
    window.location.hash = `animale-${pet.id}`;
    setActive(`pet:${pet.id}`);
  };

  const goHome = () => {
    if (window.location.hash) window.history.pushState('', document.title, window.location.pathname);
    setActive('home');
  };

  const run = async (body, successMessage) => {
    setSaving(true);
    setMessage('');
    try {
      const next = await api('POST', body);
      setData(next);
      setMessage(successMessage || 'Salvato.');
      return next;
    } catch (error) {
      setMessage(error.message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const savePet = async (event) => {
    event.preventDefault();
    const next = await run({ action: 'save_pet', pet: editingPet }, 'Scheda animale salvata.');
    if (next) {
      setEditingPet(null);
      setActive('home');
    }
  };

  const saveReminder = async (event) => {
    event.preventDefault();
    const next = await run({ action: 'save_reminder', reminder }, 'Scadenza aggiunta.');
    if (next) setReminder({ pet_id: pets[0]?.id || '', reminder_type: 'vaccino', title: '', due_date: '', repeat_rule: '', notes: '' });
  };

  const saveExpense = async (event) => {
    event.preventDefault();
    const next = await run({ action: 'save_expense', expense }, 'Spesa salvata.');
    if (next) setExpense({ pet_id: pets[0]?.id || '', spent_on: todayIso(), amount: '', category: 'visita', vendor: '', document_url: '', notes: '' });
  };

  const createShare = async (petId) => {
    await run({ action: 'create_share_link', pet_id: petId, scopes: ['base', 'health'] }, 'Link di condivisione creato.');
    setActive('share');
  };

  const shareWithFavorite = async (clinic) => {
    if (!pets.length) {
      setMessage('Aggiungi prima la scheda del tuo animale per condividerla con un veterinario.');
      setActive('pets');
      return;
    }
    await createShare(pets[0].id);
    if (clinic?.email) {
      setMessage(`Link creato. Ora puoi inviarlo a ${clinic.name} dalla sezione Condivisione.`);
    }
  };

  if (loading) {
    return <div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-10 w-10 animate-spin text-emerald-700" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 md:pb-8">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-emerald-100 text-emerald-700">
              <PawPrint className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase text-emerald-700">Area Pet Lover</p>
              <h1 className="text-xl font-bold text-slate-950">La tua zampa digitale</h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                <PawPrint className="h-4 w-4 text-emerald-600" />
                Benvenuto, <span className="font-semibold text-slate-900">{userLabel(user)}</span>
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        {message && (
          <div className={`mb-4 rounded-md px-4 py-3 text-sm ${message.includes('non') || message.includes('richiest') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
            {message}
          </div>
        )}

        {active === 'home' && (
          <Home
            pets={pets}
            upcoming={upcoming}
            yearlyTotal={yearlyTotal}
            currentYear={currentYear}
            onAddPet={() => setEditingPet({ ...emptyPet })}
            onEditPet={(pet) => setEditingPet({ ...emptyPet, ...pet, neutered: pet.neutered === null || pet.neutered === undefined ? '' : String(pet.neutered) })}
            onOpenPet={openPet}
            onCreateShare={createShare}
            setActive={setActive}
            favoriteClinics={favoriteClinics}
          />
        )}

        {active === 'pets' && (
          <PetsView
            pets={pets}
            onAdd={() => setEditingPet({ ...emptyPet })}
            onEdit={(pet) => setEditingPet({ ...emptyPet, ...pet, neutered: pet.neutered === null || pet.neutered === undefined ? '' : String(pet.neutered) })}
            onDelete={(pet) => run({ action: 'delete_pet', id: pet.id }, 'Animale eliminato.')}
            onOpenPet={openPet}
            onCreateShare={createShare}
          />
        )}

        {selectedPet && (
          <PetDetailView pet={selectedPet} onHome={goHome} onEdit={() => setEditingPet({ ...emptyPet, ...selectedPet, neutered: selectedPet.neutered === null || selectedPet.neutered === undefined ? '' : String(selectedPet.neutered) })} onCreateShare={() => createShare(selectedPet.id)} />
        )}

        {active === 'reminders' && (
          <RemindersView
            pets={pets}
            reminders={reminders}
            reminder={reminder}
            setReminder={setReminder}
            onSubmit={saveReminder}
            onToggle={(item, completed) => run({ action: 'toggle_reminder', id: item.id, completed }, completed ? 'Scadenza completata.' : 'Scadenza riaperta.')}
            saving={saving}
          />
        )}

        {active === 'expenses' && (
          <ExpensesView
            pets={pets}
            expenses={expenses}
            expense={expense}
            setExpense={setExpense}
            fiscal={fiscal}
            setFiscal={setFiscal}
            yearlyTotal={yearlyTotal}
            currentYear={currentYear}
            onExpense={saveExpense}
            onFiscal={(event) => {
              event.preventDefault();
              run({ action: 'save_fiscal_profile', ...fiscal }, 'Dati fiscali salvati.');
            }}
            saving={saving}
          />
        )}

        {active === 'share' && <ShareView pets={pets} shareLinks={shareLinks} onCreateShare={createShare} onRevoke={(link) => run({ action: 'revoke_share_link', id: link.id }, 'Link revocato.')} />}

        {active === 'favorites' && <FavoriteClinicsView clinics={favoriteClinics} onShare={shareWithFavorite} onRemove={(clinic) => run({ action: 'toggle_favorite_clinic', clinic_id: clinic.id }, 'Veterinario rimosso dai preferiti.')} />}

        {editingPet && (
          <PetForm
            pet={editingPet}
            setPet={setEditingPet}
            onSubmit={savePet}
            onCancel={() => setEditingPet(null)}
            saving={saving}
          />
        )}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white md:hidden">
        <div className="grid grid-cols-6">
          <TabButton active={active === 'home'} icon={PawPrint} label="Home" onClick={goHome} />
          <TabButton active={active === 'pets'} icon={HeartPulse} label="Animali" onClick={() => setActive('pets')} />
          <TabButton active={active === 'favorites'} icon={Heart} label="Vet" onClick={() => setActive('favorites')} />
          <TabButton active={active === 'reminders'} icon={CalendarDays} label="Scadenze" onClick={() => setActive('reminders')} />
          <TabButton active={active === 'expenses'} icon={Euro} label="Spese" onClick={() => setActive('expenses')} />
          <TabButton active={active === 'share'} icon={Share2} label="Share" onClick={() => setActive('share')} />
        </div>
      </nav>

      <div className="hidden border-t border-slate-200 bg-white md:block">
        <div className="mx-auto flex max-w-6xl gap-2 px-4 py-4 sm:px-6 lg:px-8">
          {[
            ['home', PawPrint, 'Home'],
            ['pets', HeartPulse, 'Animali'],
            ['favorites', Heart, 'Veterinari'],
            ['reminders', CalendarDays, 'Scadenze'],
            ['expenses', Euro, 'Spese'],
            ['share', Share2, 'Condivisione'],
          ].map(([id, Icon, label]) => <TabButton key={id} active={active === id} icon={Icon} label={label} onClick={() => id === 'home' ? goHome() : setActive(id)} desktop />)}
        </div>
      </div>
    </div>
  );
}

function Home({ pets, upcoming, yearlyTotal, currentYear, onAddPet, onEditPet, onOpenPet, onCreateShare, setActive, favoriteClinics }) {
  if (!pets.length) {
    return (
      <section className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
        <div className="grid h-14 w-14 place-items-center rounded-md bg-emerald-100 text-emerald-700"><PawPrint className="h-8 w-8" /></div>
        <h2 className="mt-5 text-2xl font-bold text-slate-950">Aggiungi il tuo primo animale</h2>
        <p className="mt-2 text-slate-600">In meno di un minuto crei la scheda base. Poi potrai aggiungere scadenze, spese e condivisione col veterinario.</p>
        <button onClick={onAddPet} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 font-semibold text-white hover:bg-emerald-700 sm:w-auto">
          <Plus className="h-5 w-5" /> Aggiungi animale
        </button>
      </section>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-950">I tuoi animali</h2>
          <button onClick={onAddPet} className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Aggiungi</button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {pets.map((pet) => <PetCard key={pet.id} pet={pet} onOpen={() => onOpenPet(pet)} onEdit={() => onEditPet(pet)} onCreateShare={() => onCreateShare(pet.id)} />)}
        </div>
      </section>
      <aside className="space-y-3">
        <SummaryCard icon={CalendarDays} title="Prossime scadenze" value={upcoming.length ? upcoming[0].title : 'Nessuna'} hint={upcoming.length ? dateLabel(upcoming[0].due_date) : 'Aggiungi vaccini e promemoria'} onClick={() => setActive('reminders')} />
        <SummaryCard icon={Heart} title="Veterinari preferiti" value={favoriteClinics.length ? `${favoriteClinics.length} salvati` : 'Nessuno'} hint="La rubrica del tuo animale" onClick={() => setActive('favorites')} />
        <SummaryCard icon={Euro} title={`Spese ${currentYear}`} value={money(yearlyTotal)} hint="Archivio utile per 730 e rimborsi" onClick={() => setActive('expenses')} />
        <SummaryCard icon={Share2} title="Condivisione" value="Link sicuro" hint="Invia la scheda al veterinario" onClick={() => setActive('share')} />
      </aside>
    </div>
  );
}

function FavoriteClinicsView({ clinics, onShare, onRemove }) {
  return (
    <section>
      <div className="mb-4">
        <p className="text-sm font-semibold uppercase text-emerald-700">Mini CRM Pet Lover</p>
        <h2 className="mt-1 text-xl font-bold text-slate-950">I veterinari del tuo animale</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">Tieni a portata di mano cliniche, ambulatori e pronto soccorso utili per il tuo pet.</p>
      </div>
      {!clinics.length ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid h-12 w-12 place-items-center rounded-md bg-emerald-100 text-emerald-700"><Heart className="h-6 w-6" /></div>
          <h3 className="mt-4 text-lg font-bold text-slate-950">Non hai ancora veterinari preferiti</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">Cerca una struttura e tocca il cuore sulla scheda per salvarla qui.</p>
          <a href="/cerca-veterinari" className="mt-5 inline-flex rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Cerca veterinari</a>
        </div>
      ) : (
        <div className="space-y-3">
          {clinics.map((clinic) => {
            const state = openLabel(clinic.hours);
            const phone = String(clinic.phone || '').replace(/\s+/g, '');
            return (
              <article key={clinic.favorite_id || clinic.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-950">{clinic.name}</h3>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${state.className}`}>{state.label}</span>
                      {clinic.pronto_soccorso_h24 && <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">H24</span>}
                      {clinic.owner_id || clinic.claimed_at ? <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Verificato</span> : null}
                    </div>
                    {clinic.address && <p className="mt-1 flex gap-1 text-sm leading-6 text-slate-600"><MapPin className="mt-1 h-4 w-4 shrink-0" />{clinic.address}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                    {clinic.phone && <a href={`tel:${phone}`} className="inline-flex justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"><Phone className="mr-1 h-4 w-4" />Chiama</a>}
                    {clinic.email && <a href={`mailto:${clinic.email}`} className="inline-flex justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800"><Mail className="mr-1 h-4 w-4" />Scrivi</a>}
                    <a href={`/veterinari/${clinic.slug}`} className="inline-flex justify-center rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800"><ExternalLink className="mr-1 h-4 w-4" />Scheda</a>
                    <button onClick={() => onShare(clinic)} className="inline-flex justify-center rounded-md border border-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-700"><Share2 className="mr-1 h-4 w-4" />Condividi dati</button>
                    <button onClick={() => onRemove(clinic)} className="col-span-2 text-left text-xs font-semibold text-red-700 sm:col-span-1 sm:px-2">Rimuovi</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function PetsView({ pets, onAdd, onEdit, onDelete, onOpenPet, onCreateShare }) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-950">Animali</h2>
        <button onClick={onAdd} className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Aggiungi</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pets.map((pet) => (
          <div key={pet.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <PetCard pet={pet} onOpen={() => onOpenPet(pet)} onEdit={() => onEdit(pet)} onCreateShare={() => onCreateShare(pet.id)} compact />
            <button onClick={() => onDelete(pet)} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-red-700"><Trash2 className="h-4 w-4" /> Elimina</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function RemindersView({ pets, reminders, reminder, setReminder, onSubmit, onToggle, saving }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <Panel title="Nuova scadenza">
        <form onSubmit={onSubmit} className="space-y-3">
          <Select label="Animale" value={reminder.pet_id} onChange={(value) => setReminder({ ...reminder, pet_id: value })} required>
            <option value="">Seleziona</option>
            {pets.map((pet) => <option key={pet.id} value={pet.id}>{pet.name}</option>)}
          </Select>
          <Select label="Tipo" value={reminder.reminder_type} onChange={(value) => setReminder({ ...reminder, reminder_type: value })}>
            <option value="vaccino">Vaccino</option>
            <option value="antiparassitario">Antiparassitario</option>
            <option value="visita">Visita</option>
            <option value="farmaco">Farmaco</option>
            <option value="altro">Altro</option>
          </Select>
          <Input label="Titolo" value={reminder.title} onChange={(value) => setReminder({ ...reminder, title: value })} required />
          <Input label="Data" type="date" value={reminder.due_date} onChange={(value) => setReminder({ ...reminder, due_date: value })} required />
          <Input label="Ripetizione" placeholder="Annuale, mensile..." value={reminder.repeat_rule} onChange={(value) => setReminder({ ...reminder, repeat_rule: value })} />
          <Textarea label="Note" value={reminder.notes} onChange={(value) => setReminder({ ...reminder, notes: value })} />
          <Submit saving={saving}>Aggiungi scadenza</Submit>
        </form>
      </Panel>
      <Panel title="Agenda salute">
        <div className="space-y-2">
          {reminders.map((item) => (
            <button key={item.id} onClick={() => onToggle(item, !item.completed_at)} className="flex w-full items-center justify-between gap-3 rounded-md border border-slate-200 bg-white p-3 text-left hover:bg-slate-50">
              <div>
                <p className={`font-semibold ${item.completed_at ? 'text-slate-400 line-through' : 'text-slate-950'}`}>{item.title}</p>
                <p className="text-sm text-slate-500">{item.reminder_type} · {dateLabel(item.due_date)}</p>
              </div>
              <span className={`grid h-7 w-7 place-items-center rounded-full border ${item.completed_at ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'}`}>{item.completed_at && <Check className="h-4 w-4" />}</span>
            </button>
          ))}
          {!reminders.length && <p className="text-sm text-slate-500">Nessuna scadenza inserita.</p>}
        </div>
      </Panel>
    </div>
  );
}

function ExpensesView({ pets, expenses, expense, setExpense, fiscal, setFiscal, yearlyTotal, currentYear, onExpense, onFiscal, saving }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <div className="space-y-5">
        <Panel title="Nuova spesa">
          <form onSubmit={onExpense} className="space-y-3">
            <Select label="Animale" value={expense.pet_id} onChange={(value) => setExpense({ ...expense, pet_id: value })}>
              <option value="">Non associata</option>
              {pets.map((pet) => <option key={pet.id} value={pet.id}>{pet.name}</option>)}
            </Select>
            <Input label="Data" type="date" value={expense.spent_on} onChange={(value) => setExpense({ ...expense, spent_on: value })} required />
            <Input label="Importo" type="number" step="0.01" value={expense.amount} onChange={(value) => setExpense({ ...expense, amount: value })} required />
            <Select label="Categoria" value={expense.category} onChange={(value) => setExpense({ ...expense, category: value })}>
              <option value="visita">Visita</option>
              <option value="farmaco">Farmaco</option>
              <option value="analisi">Analisi</option>
              <option value="intervento">Intervento</option>
              <option value="altro">Altro</option>
            </Select>
            <Input label="Veterinario / farmacia" value={expense.vendor} onChange={(value) => setExpense({ ...expense, vendor: value })} />
            <Input label="URL documento" value={expense.document_url} onChange={(value) => setExpense({ ...expense, document_url: value })} />
            <Submit saving={saving}>Salva spesa</Submit>
          </form>
        </Panel>
        <Panel title="Dati fiscali opzionali">
          <form onSubmit={onFiscal} className="space-y-3">
            <Input label="Codice fiscale" value={fiscal.fiscal_code} onChange={(value) => setFiscal({ ...fiscal, fiscal_code: value })} />
            <Input label="Intestatario" value={fiscal.billing_name} onChange={(value) => setFiscal({ ...fiscal, billing_name: value })} />
            <p className="text-xs leading-5 text-slate-500">Utile solo per fatture, rimborsi e riepilogo spese. Non e obbligatorio.</p>
            <Submit saving={saving}>Salva dati fiscali</Submit>
          </form>
        </Panel>
      </div>
      <Panel title={`Spese ${currentYear}: ${money(yearlyTotal)}`}>
        <div className="space-y-2">
          {expenses.map((item) => <div key={item.id} className="rounded-md border border-slate-200 bg-white p-3"><div className="flex justify-between gap-3"><p className="font-semibold text-slate-950">{item.vendor || item.category}</p><p className="font-semibold text-slate-950">{money(item.amount)}</p></div><p className="text-sm text-slate-500">{dateLabel(item.spent_on)} · {item.category}</p></div>)}
          {!expenses.length && <p className="text-sm text-slate-500">Nessuna spesa salvata.</p>}
        </div>
      </Panel>
    </div>
  );
}

function ShareView({ pets, shareLinks, onCreateShare, onRevoke }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <Panel title="Crea link per veterinario">
        <div className="space-y-2">
          {pets.map((pet) => <button key={pet.id} onClick={() => onCreateShare(pet.id)} className="flex w-full items-center justify-between rounded-md border border-slate-200 bg-white p-3 text-left hover:bg-slate-50"><span className="font-semibold">{pet.name}</span><ChevronRight className="h-4 w-4" /></button>)}
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-500">Il link dura 14 giorni e puo essere revocato.</p>
      </Panel>
      <Panel title="Link attivi e recenti">
        <div className="space-y-2">
          {shareLinks.map((link) => {
            const url = `${window.location.origin}/pet-share/${link.token}`;
            const revoked = Boolean(link.revoked_at);
            return (
              <div key={link.id} className="rounded-md border border-slate-200 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md bg-emerald-100 text-xl">
                      {link.pet_photo_url ? <img src={link.pet_photo_url} alt="" className="h-full w-full object-cover" /> : '🐾'}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">{link.pet_name || 'Scheda animale'}</p>
                      <p className="truncate text-xs text-slate-500">{link.pet_species || ''}{link.pet_breed ? ` · ${link.pet_breed}` : ''}</p>
                      <p className="mt-1 truncate text-sm font-semibold text-slate-950">{url}</p>
                      <p className="text-xs text-slate-500">Scade il {dateLabel(link.expires_at)}{revoked ? ' · revocato' : ''}</p>
                    </div>
                  </div>
                  {!revoked && <button onClick={() => navigator.clipboard.writeText(url)} className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold">Copia</button>}
                </div>
                {!revoked && <button onClick={() => onRevoke(link)} className="mt-2 text-xs font-semibold text-red-700">Revoca</button>}
              </div>
            );
          })}
          {!shareLinks.length && <p className="text-sm text-slate-500">Nessun link creato.</p>}
        </div>
      </Panel>
    </div>
  );
}

function PetDetailView({ pet, onHome, onEdit, onCreateShare }) {
  return (
    <section className="space-y-4">
      <button onClick={onHome} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800">
        <HomeIcon className="h-4 w-4" /> Home
      </button>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-lg bg-emerald-100 text-4xl">
            {pet.photo_url ? <img src={pet.photo_url} alt="" className="h-full w-full object-cover" /> : '🐾'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold uppercase text-emerald-700">Scheda anagrafica</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-950">{pet.name}</h2>
            <p className="mt-1 text-slate-500">{pet.species}{pet.breed ? ` · ${pet.breed}` : ''}</p>
            <p className="mt-2 break-all text-xs text-slate-400">{petPublicPath(pet)}</p>
          </div>
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <Info label="Sesso" value={pet.sex} />
          <Info label="Data nascita" value={dateLabel(pet.birth_date)} />
          <Info label="Peso" value={pet.weight_kg ? `${pet.weight_kg} kg` : ''} />
          <Info label="Microchip" value={pet.microchip} />
          <Info label="Sterilizzato" value={pet.neutered === true ? 'Si' : pet.neutered === false ? 'No' : ''} />
          <Info label="Allergie" value={pet.allergies} />
          <Info label="Patologie" value={pet.conditions} />
          <Info label="Farmaci" value={pet.medications} />
          <Info label="Alimentazione" value={pet.nutrition_notes} />
          <Info label="Comportamento" value={pet.behavior_notes} />
        </dl>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button onClick={onEdit} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800">Modifica</button>
          <button onClick={onCreateShare} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Condividi con veterinario</button>
        </div>
      </div>
    </section>
  );
}

function Info({ label, value }) {
  if (!value) return null;
  return <div className="rounded-md border border-slate-100 bg-slate-50 p-3"><dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt><dd className="mt-1 text-sm text-slate-900">{value}</dd></div>;
}

function PetForm({ pet, setPet, onSubmit, onCancel, saving }) {
  const set = (key, value) => setPet({ ...pet, [key]: value });
  const breeds = breedOptions[pet.species] || breedOptions.altro;
  const visibleBreeds = pet.breed && !breeds.includes(pet.breed) ? [pet.breed, ...breeds] : breeds;
  const handlePhoto = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      window.alert('Carica una foto in formato immagine.');
      return;
    }
    if (file.size > 1_200_000) {
      window.alert('Foto troppo grande. Usa una immagine sotto 1,2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set('photo_url', String(reader.result || ''));
    reader.readAsDataURL(file);
  };
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4">
      <div className="mx-auto max-w-2xl rounded-lg bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-950">{pet.id ? 'Modifica animale' : 'Nuovo animale'}</h2>
          <button onClick={onCancel} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold">Chiudi</button>
        </div>
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <Input label="Nome" value={pet.name} onChange={(value) => set('name', value)} required />
          <Select label="Specie" value={pet.species} onChange={(value) => setPet({ ...pet, species: value, breed: '' })}>
            <option value="cane">Cane</option>
            <option value="gatto">Gatto</option>
            <option value="coniglio">Coniglio</option>
            <option value="altro">Altro</option>
          </Select>
          <Select label="Razza" value={pet.breed || ''} onChange={(value) => set('breed', value)}>
            <option value="">Seleziona</option>
            {visibleBreeds.map((breed) => <option key={breed} value={breed}>{breed}</option>)}
          </Select>
          <Select label="Sesso" value={pet.sex || ''} onChange={(value) => set('sex', value)}>
            <option value="">Non indicato</option>
            <option value="femmina">Femmina</option>
            <option value="maschio">Maschio</option>
          </Select>
          <Input label="Data nascita" type="date" value={pet.birth_date || ''} onChange={(value) => set('birth_date', value)} />
          <Input label="Peso kg" type="number" step="0.1" value={pet.weight_kg || ''} onChange={(value) => set('weight_kg', value)} />
          <PhotoUpload pet={pet} onFile={handlePhoto} onRemove={() => set('photo_url', '')} />
          <Input label="Microchip" value={pet.microchip || ''} onChange={(value) => set('microchip', value)} />
          <Select label="Sterilizzato" value={pet.neutered ?? ''} onChange={(value) => set('neutered', value === '' ? '' : value === 'true')}>
            <option value="">Non indicato</option>
            <option value="true">Si</option>
            <option value="false">No</option>
          </Select>
          <div className="hidden sm:block"></div>
          <Textarea label="Allergie" value={pet.allergies || ''} onChange={(value) => set('allergies', value)} />
          <Textarea label="Patologie" value={pet.conditions || ''} onChange={(value) => set('conditions', value)} />
          <Textarea label="Farmaci" value={pet.medications || ''} onChange={(value) => set('medications', value)} />
          <Textarea label="Alimentazione" value={pet.nutrition_notes || ''} onChange={(value) => set('nutrition_notes', value)} />
          <Textarea label="Comportamento" value={pet.behavior_notes || ''} onChange={(value) => set('behavior_notes', value)} className="sm:col-span-2" />
          <div className="flex gap-2 sm:col-span-2">
            <Submit saving={saving}>Salva animale</Submit>
            <button type="button" onClick={onCancel} className="h-11 rounded-md border border-slate-300 px-4 font-semibold text-slate-700">Annulla</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PhotoUpload({ pet, onFile, onRemove }) {
  return (
    <div className="sm:col-span-2">
      <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Foto</span>
      <div className="flex flex-col gap-3 rounded-md border border-slate-300 p-3 sm:flex-row sm:items-center">
        <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-md bg-emerald-100 text-3xl">
          {pet.photo_url ? <img src={pet.photo_url} alt="" className="h-full w-full object-cover" /> : '🐾'}
        </div>
        <div className="flex-1">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">
            <ImagePlus className="h-4 w-4" /> Carica foto
            <input type="file" accept="image/*" className="hidden" onChange={(event) => onFile(event.target.files?.[0])} />
          </label>
          {pet.photo_url && <button type="button" onClick={onRemove} className="ml-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700">Rimuovi</button>}
          <p className="mt-2 text-xs leading-5 text-slate-500">Max 1 foto, sotto 1,2 MB. La preview comparira nella scheda e nel link condiviso.</p>
        </div>
      </div>
    </div>
  );
}

function PetCard({ pet, onOpen, onEdit, onCreateShare, compact = false }) {
  return (
    <article className={`${compact ? '' : 'rounded-lg border border-slate-200 bg-white p-4 shadow-sm'}`}>
      <div className="flex gap-3">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-md bg-emerald-100 text-2xl">
          {pet.photo_url ? <img src={pet.photo_url} alt="" className="h-full w-full object-cover" /> : '🐾'}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold text-slate-950">{pet.name}</h3>
          <p className="text-sm text-slate-500">{pet.species}{pet.breed ? ` · ${pet.breed}` : ''}</p>
          {pet.microchip && <p className="mt-1 truncate text-xs text-slate-500">Microchip {pet.microchip}</p>}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <button onClick={onOpen} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800">Scheda</button>
        <button onClick={onEdit} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800">Modifica</button>
        <button onClick={onCreateShare} className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">Condividi</button>
      </div>
    </article>
  );
}

function SummaryCard({ icon: Icon, title, value, hint, onClick }) {
  return (
    <button onClick={onClick} className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm hover:bg-slate-50">
      <Icon className="h-5 w-5 text-emerald-600" />
      <p className="mt-3 text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-1 text-lg font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{hint}</p>
    </button>
  );
}

function Panel({ title, children }) {
  return <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><h2 className="mb-4 text-lg font-bold text-slate-950">{title}</h2>{children}</section>;
}

function TabButton({ active, icon: Icon, label, onClick, desktop = false }) {
  return (
    <button onClick={onClick} className={`${desktop ? 'rounded-md px-4 py-2' : 'py-2'} flex flex-col items-center justify-center gap-1 text-xs font-semibold ${active ? 'text-emerald-700' : 'text-slate-500'}`}>
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  );
}

function Input({ label, value, onChange, type = 'text', required = false, placeholder = '', step }) {
  return <label className="block"><span className="mb-1 block text-xs font-semibold uppercase text-slate-500">{label}</span><input type={type} step={step} value={value || ''} onChange={(event) => onChange(event.target.value)} required={required} placeholder={placeholder} className="h-11 w-full rounded-md border border-slate-300 px-3 text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label>;
}

function Select({ label, value, onChange, children, required = false }) {
  return <label className="block"><span className="mb-1 block text-xs font-semibold uppercase text-slate-500">{label}</span><select value={value || ''} onChange={(event) => onChange(event.target.value)} required={required} className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100">{children}</select></label>;
}

function Textarea({ label, value, onChange, className = '' }) {
  return <label className={`block ${className}`}><span className="mb-1 block text-xs font-semibold uppercase text-slate-500">{label}</span><textarea value={value || ''} onChange={(event) => onChange(event.target.value)} rows={3} className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label>;
}

function Submit({ saving, children }) {
  return <button type="submit" disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{children}</button>;
}
