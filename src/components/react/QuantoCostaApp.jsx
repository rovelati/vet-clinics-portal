import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bone,
  Cat,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Dog,
  Heart,
  MapPin,
  Navigation,
  Search,
  Stethoscope,
} from 'lucide-react';

function cleanText(value) {
  return typeof value === 'string' ? value.replace(/"/g, '').trim() : '';
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function formatCurrency(value) {
  return typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(0)} €` : 'n.d.';
}

function buildRange(min, max) {
  return typeof min === 'number' && typeof max === 'number' ? `${min.toFixed(0)} - ${max.toFixed(0)} €` : 'n.d.';
}

const iconByCategory = {
  visite: Stethoscope,
  visita: Stethoscope,
  'esami e diagnostica': BarChart,
  vaccinazioni: Heart,
  vaccinazione: Heart,
  chirurgia: Bone,
  'prevenzione parassiti': Heart,
  identificazione: DollarSign,
  ricovero: Stethoscope,
  anestesia: Stethoscope,
  eutanasia: Heart,
};

function getIcon(category) {
  const categoryKey = cleanText(category).toLowerCase();
  if (iconByCategory[categoryKey]) return iconByCategory[categoryKey];
  const matchingKey = Object.keys(iconByCategory).find((key) => categoryKey.includes(key) || key.includes(categoryKey));
  return matchingKey ? iconByCategory[matchingKey] : DollarSign;
}

async function geocodeLocation(locationName) {
  const cleanedLocation = cleanText(locationName);
  if (!cleanedLocation) return null;
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${cleanedLocation}, Italia`)}&limit=1&addressdetails=1&countrycodes=it`,
    { headers: { 'Accept-Language': 'it' } }
  );
  if (!response.ok) return null;
  const data = await response.json();
  const result = data?.[0];
  if (!result) return null;
  const address = result.address || {};
  const provinceFromIso = address['ISO3166-2-lvl6']?.startsWith('IT-') ? address['ISO3166-2-lvl6'].slice(3).toUpperCase() : null;
  return {
    lat: Number(result.lat),
    lng: Number(result.lon),
    display_name: result.display_name,
    cityName: address.city || address.town || address.village || address.municipality || cleanedLocation,
    province: provinceFromIso,
    verified: true,
    source: 'search',
  };
}

async function reverseGeocode(lat, lng) {
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=it`);
  if (!response.ok) return null;
  const data = await response.json();
  const address = data.address || {};
  const city = address.city || address.town || address.village || address.municipality || '';
  const provinceFromIso = address['ISO3166-2-lvl6']?.startsWith('IT-') ? address['ISO3166-2-lvl6'].slice(3).toUpperCase() : null;
  return {
    lat,
    lng,
    display_name: data.display_name || [city, address.state || address.region, 'Italia'].filter(Boolean).join(', '),
    cityName: city,
    province: provinceFromIso,
    verified: true,
    source: 'gps',
  };
}

async function getLocationFromIP() {
  const services = [
    'https://ipapi.co/json/',
    'https://ip-api.com/json/?fields=status,message,country,regionName,city,lat,lon',
  ];

  for (const serviceUrl of services) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);
      const response = await fetch(serviceUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) continue;
      const data = await response.json();
      if (data.latitude && data.longitude) {
        return {
          lat: Number(data.latitude),
          lng: Number(data.longitude),
          display_name: [data.city, data.region || data.regionName, data.country_name || data.country || 'Italia'].filter(Boolean).join(', '),
          cityName: data.city,
          province: null,
          verified: false,
          source: 'ip',
        };
      }
      if (data.lat && data.lon && data.status === 'success') {
        return {
          lat: Number(data.lat),
          lng: Number(data.lon),
          display_name: [data.city, data.regionName, data.country || 'Italia'].filter(Boolean).join(', '),
          cityName: data.city,
          province: null,
          verified: false,
          source: 'ip',
        };
      }
    } catch {
      // Try the next service.
    }
  }
  return null;
}

function saveLocation(key, location) {
  if (!location?.lat || !location?.lng) return;
  const saved = { ...location, timestamp: Date.now() };
  localStorage.setItem(key, JSON.stringify(saved));
  if (key === 'lastSearchLocation' || key === 'lastUserLocation') {
    const cityName = cleanText(location.cityName || location.city || location.display_name?.split(',')?.[0] || '');
    const payload = {
      cityName,
      city: cityName,
      province: cleanText(location.province || ''),
      lat: Number.isFinite(Number(location.lat)) ? Number(location.lat) : null,
      lng: Number.isFinite(Number(location.lng)) ? Number(location.lng) : null,
      label: cityName,
      display_name: cleanText(location.display_name || cityName),
      source: key === 'lastUserLocation' ? 'gps' : 'search',
      timestamp: Date.now(),
    };
    if (payload.cityName || (payload.lat !== null && payload.lng !== null)) {
      document.cookie = `vet_last_location=${encodeURIComponent(JSON.stringify(payload))}; Max-Age=${30 * 24 * 60 * 60}; Path=/; SameSite=Lax`;
    }
  }
}

function loadLocation(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || 'null');
    if (!saved) return null;
    if (saved.timestamp && Date.now() - saved.timestamp > 7 * 24 * 60 * 60 * 1000) return null;
    return saved;
  } catch {
    return null;
  }
}

function locationSlugFrom(location) {
  const cityName = location?.cityName || location?.display_name?.split(',')[0] || '';
  const locationSlug = slugify(cityName);
  if (!locationSlug) return '';
  const province = cleanText(location?.province).toLowerCase();
  return province && province.length === 2 ? `${locationSlug}-${province}` : locationSlug;
}

export default function QuantoCostaApp({ initialStats = [] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showServiceSuggestions, setShowServiceSuggestions] = useState(false);
  const [activeServiceSuggestion, setActiveServiceSuggestion] = useState(0);
  const [locationTerm, setLocationTerm] = useState('');
  const [searchLocation, setSearchLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isNearMe, setIsNearMe] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [expandedRow, setExpandedRow] = useState(null);
  const [message, setMessage] = useState('');

  const filteredStats = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return initialStats;
    return initialStats.filter((item) => [item.name, item.category].filter(Boolean).some((field) => field.toLowerCase().includes(term)));
  }, [initialStats, searchTerm]);

  const serviceSuggestions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const source = term ? filteredStats : initialStats;
    return [...source]
      .sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aStarts = term && aName.startsWith(term);
        const bStarts = term && bName.startsWith(term);
        if (aStarts !== bStarts) return aStarts ? -1 : 1;
        if ((b.count || 0) !== (a.count || 0)) return (b.count || 0) - (a.count || 0);
        return a.name.localeCompare(b.name, 'it');
      })
      .slice(0, 8);
  }, [filteredStats, initialStats, searchTerm]);

  const sortedData = useMemo(() => {
    const data = [...filteredStats];
    data.sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
    return data;
  }, [filteredStats, sortConfig]);

  const topServices = useMemo(() => {
    const ranked = [...initialStats].filter((item) => item.count > 0).sort((a, b) => b.count - a.count).slice(0, 3);
    if (ranked.length < 3) {
      return [...ranked, ...initialStats.filter((item) => item.count === 0).slice(0, 3 - ranked.length)];
    }
    return ranked;
  }, [initialStats]);

  const activeLocation = (isNearMe && userLocation) ? userLocation : searchLocation;
  const activeLocationLabel = activeLocation?.display_name?.split(',')[0] || '';

  const buildServiceUrl = (serviceSlug, locationOverride = activeLocation) => {
    const locationSlug = locationSlugFrom(locationOverride);
    return locationSlug ? `/quanto-costa/${locationSlug}/${serviceSlug}/cliniche` : `/quanto-costa/${serviceSlug}/cliniche`;
  };

  const navigateTo = (href) => {
    window.location.href = href;
  };

  const findMatchingService = () => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return null;
    return initialStats.find((service) => service.name.toLowerCase() === term)
      || filteredStats.find((service) => service.name.toLowerCase().startsWith(term))
      || filteredStats[0]
      || null;
  };

  const selectService = (service) => {
    setSearchTerm(service.name);
    setActiveServiceSuggestion(0);
    setShowServiceSuggestions(false);
  };

  const searchLocationNow = async () => {
    const query = locationTerm.trim();
    if (!query) {
      setSearchLocation(null);
      return null;
    }
    setIsGeocoding(true);
    setMessage('');
    try {
      const location = await geocodeLocation(query);
      if (!location) {
        setMessage(`Non è stato possibile trovare "${query}".`);
        setSearchLocation(null);
        return null;
      }
      setSearchLocation(location);
      setIsNearMe(false);
      setLocationTerm(location.cityName || location.display_name?.split(',')[0] || query);
      saveLocation('lastSearchLocation', location);
      return location;
    } finally {
      setIsGeocoding(false);
    }
  };

  const submitSearch = async () => {
    const locationForUrl = locationTerm.trim() && !activeLocation ? await searchLocationNow() : activeLocation;
    const service = findMatchingService();
    if (service) navigateTo(buildServiceUrl(service.slug, locationForUrl));
  };

  const toggleNearMe = async () => {
    setMessage('');
    if (isNearMe) {
      setIsNearMe(false);
      setUserLocation(null);
      return;
    }

    setIsNearMe(true);
    setSearchLocation(null);
    setLocationTerm('');
    setIsLoadingLocation(true);

    const saved = loadLocation('lastUserLocation');
    if (saved) {
      setUserLocation(saved);
      setIsLoadingLocation(false);
      return;
    }

    if (!navigator.geolocation) {
      const ipLocation = await getLocationFromIP();
      if (ipLocation) {
        setUserLocation(ipLocation);
        saveLocation('lastUserLocation', ipLocation);
        setIsLoadingLocation(false);
        return;
      }
      setIsNearMe(false);
      setIsLoadingLocation(false);
      setMessage('Geolocalizzazione non supportata. Inserisci una località manualmente.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const location = await reverseGeocode(lat, lng) || { lat, lng, display_name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, verified: true, source: 'gps' };
        setUserLocation(location);
        saveLocation('lastUserLocation', location);
        setIsLoadingLocation(false);
      },
      async () => {
        const ipLocation = await getLocationFromIP();
        if (ipLocation) {
          setUserLocation(ipLocation);
          saveLocation('lastUserLocation', ipLocation);
          setIsLoadingLocation(false);
          return;
        }
        setIsNearMe(false);
        setIsLoadingLocation(false);
        setMessage('Consenti la posizione o usa la ricerca manuale.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const requestSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'ascending' ? 'descending' : 'ascending',
    }));
  };

  const sortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />;
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      <section className="overflow-hidden bg-gradient-to-r from-indigo-700 to-purple-700 pb-16 pt-8 text-white sm:pb-28 sm:pt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-100 sm:mb-3 sm:text-sm">Preventivi veterinari</p>
            <h1 className="break-words text-2xl font-bold leading-tight sm:text-4xl md:text-5xl">Quanto costa una prestazione veterinaria?</h1>
            <p className="mx-auto mt-3 max-w-2xl break-words text-sm leading-6 text-indigo-100 sm:mt-4 sm:text-xl sm:leading-8">
              Cerca la prestazione, scegli la localita e trova cliniche da contattare per prezzo, disponibilita e preventivo.
            </p>
          </div>
        </div>
      </section>

      <section className="-mt-12 pb-8 sm:-mt-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-lg bg-white p-4 shadow-2xl sm:p-6">
            <div className="mb-5 grid grid-cols-3 gap-2 text-center text-xs font-semibold text-gray-600 sm:text-sm">
              <div className="rounded-md bg-indigo-50 px-2 py-2 text-indigo-700">1. Prestazione</div>
              <div className="rounded-md bg-indigo-50 px-2 py-2 text-indigo-700">2. Localita</div>
              <div className="rounded-md bg-green-50 px-2 py-2 text-green-700">3. Preventivo</div>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.25fr_0.85fr]">
              <div className="min-w-0">
                <label htmlFor="search-service" className="mb-1 block text-sm font-semibold text-gray-800">Quale prestazione cerchi?</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                  <input
                    id="search-service"
                    value={searchTerm}
                    autoComplete="off"
                    role="combobox"
                    aria-expanded={showServiceSuggestions && serviceSuggestions.length > 0}
                    aria-controls="service-suggestions"
                    onFocus={() => setShowServiceSuggestions(true)}
                    onBlur={() => window.setTimeout(() => setShowServiceSuggestions(false), 120)}
                    onChange={(event) => {
                      setSearchTerm(event.target.value);
                      setActiveServiceSuggestion(0);
                      setShowServiceSuggestions(true);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowDown' && serviceSuggestions.length) {
                        event.preventDefault();
                        setShowServiceSuggestions(true);
                        setActiveServiceSuggestion((current) => Math.min(current + 1, serviceSuggestions.length - 1));
                        return;
                      }
                      if (event.key === 'ArrowUp' && serviceSuggestions.length) {
                        event.preventDefault();
                        setShowServiceSuggestions(true);
                        setActiveServiceSuggestion((current) => Math.max(current - 1, 0));
                        return;
                      }
                      if (event.key === 'Escape') {
                        setShowServiceSuggestions(false);
                        return;
                      }
                      if (event.key === 'Enter') {
                        if (showServiceSuggestions && serviceSuggestions[activeServiceSuggestion]) {
                          event.preventDefault();
                          selectService(serviceSuggestions[activeServiceSuggestion]);
                          return;
                        }
                        submitSearch();
                      }
                    }}
                    placeholder="Es. ecografia addominale, sterilizzazione cane..."
                    className="h-14 w-full min-w-0 rounded-md border border-gray-300 bg-white pl-10 pr-3 text-base text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                  {showServiceSuggestions && serviceSuggestions.length > 0 && (
                    <div
                      id="service-suggestions"
                      role="listbox"
                      className="absolute left-0 right-0 top-full z-30 mt-2 max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-white py-2 shadow-xl"
                    >
                      {serviceSuggestions.map((service, index) => {
                        const displayPrice = service.median || service.averagePriceFromTaxonomy || null;
                        const Icon = getIcon(service.category);
                        const active = index === activeServiceSuggestion;
                        return (
                          <button
                            key={service.id}
                            type="button"
                            role="option"
                            aria-selected={active}
                            onMouseEnter={() => setActiveServiceSuggestion(index)}
                            onMouseDown={(event) => {
                              event.preventDefault();
                              selectService(service);
                            }}
                            className={`flex w-full min-w-0 items-center gap-3 px-4 py-3 text-left ${active ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                          >
                            <Icon className="h-5 w-5 shrink-0 text-indigo-600" aria-hidden="true" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-gray-900">{service.name}</span>
                              <span className="mt-0.5 block truncate text-xs text-gray-500">{service.category || 'Servizio veterinario'}</span>
                            </span>
                            {displayPrice ? (
                              <span className="shrink-0 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                                {formatCurrency(displayPrice)}
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">Ti porteremo alla pagina con cliniche, prezzi indicativi e richiesta di contatto.</p>
              </div>

              <div className="min-w-0">
                <label htmlFor="search-location" className="mb-1 block text-sm font-semibold text-gray-800">Dove?</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                  <input
                    id="search-location"
                    value={locationTerm}
                    onChange={(event) => setLocationTerm(event.target.value)}
                    onBlur={() => locationTerm.trim() && searchLocationNow()}
                    onKeyDown={(event) => event.key === 'Enter' && searchLocationNow()}
                    disabled={isGeocoding || isNearMe}
                    placeholder="Es. Milano, Roma, Torino..."
                    className="h-14 w-full min-w-0 rounded-md border border-gray-300 bg-white pl-10 pr-14 text-base text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100"
                  />
                  <button
                    type="button"
                    onClick={toggleNearMe}
                    disabled={isLoadingLocation}
                    title={isNearMe ? 'Disattiva geolocalizzazione' : 'Usa la mia posizione'}
                    className={`absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md border text-sm transition ${isNearMe ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    <Navigation className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                {activeLocationLabel && (
                  <p className="mt-1 flex min-w-0 items-center gap-1 text-xs text-gray-500">
                    <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 break-words">{activeLocationLabel}</span>
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={submitSearch}
              disabled={!searchTerm.trim()}
              className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-md bg-green-600 px-4 text-base font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Trova cliniche e preventivi
            </button>
            <div className="mt-4 flex min-w-0 flex-col gap-1 text-sm text-gray-500 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <p>{initialStats.length ? `${filteredStats.length} prestazioni disponibili.` : 'Nessuna prestazione disponibile al momento.'}</p>
              {isGeocoding && <p>Verifica localita...</p>}
              {isLoadingLocation && <p>Rilevamento posizione...</p>}
              {message && <p className="min-w-0 break-words text-indigo-700">{message}</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-8 pt-2">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Prestazioni piu richieste</h2>
            <p className="mt-1 text-sm text-gray-600">Parti da una prestazione frequente e arriva alle cliniche da contattare.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {!topServices.length && (
              <div className="rounded-lg bg-white p-10 text-center text-gray-500 shadow-lg md:col-span-3">
                Nessun dato prezzo pubblicato dalle cliniche. Invia una richiesta di preventivo per ottenere offerte personalizzate.
              </div>
            )}
            {topServices.map((service) => {
              const Icon = getIcon(service.category);
              const hasTaxonomyPrice = service.averagePriceFromTaxonomy && service.averagePriceFromTaxonomy > 0;
              return (
                <article key={service.id} className="vet-card-hover min-w-0 overflow-hidden rounded-lg bg-white p-5 shadow-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    <Icon className="h-8 w-8 shrink-0 text-indigo-600" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <h3 className="break-words text-lg font-semibold text-gray-800">{service.name}</h3>
                      <p className="break-words text-sm text-gray-500">{service.category || 'Categoria non assegnata'}</p>
                    </div>
                  </div>
                  <div className="mt-4 min-h-20 space-y-1 text-sm text-gray-600">
                    {service.count > 0 ? (
                      <>
                        <p className="font-medium">Prezzi segnalati: <span className="text-indigo-600">{service.count}</span></p>
                        <p>Range: <span className="font-semibold">{buildRange(service.min, service.max)}</span></p>
                        {hasTaxonomyPrice && <p className="text-xs text-gray-500">Media di mercato: <span className="font-medium">{formatCurrency(service.averagePriceFromTaxonomy)}</span></p>}
                      </>
                    ) : hasTaxonomyPrice ? (
                      <p>Prezzo medio indicativo: <span className="font-semibold text-indigo-600">{formatCurrency(service.averagePriceFromTaxonomy)}</span></p>
                    ) : (
                      <p className="italic text-gray-500">Nessun prezzo disponibile</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTo(buildServiceUrl(service.slug))}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-3 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Trova cliniche
                  </button>
                  <a href={`/quanto-costa/${service.slug}`} className="mt-2 inline-flex w-full items-center justify-center rounded-md border border-gray-300 px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                    Descrizione Prestazione
                  </a>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-lg bg-white shadow-lg">
            <div className="border-b border-gray-100 p-6">
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                <BarChart className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                Tutte le prestazioni
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Confronta il prezzo indicativo e apri la pagina della prestazione per contattare le cliniche.
              </p>
            </div>
            <div className="grid gap-3 p-4 md:hidden">
              {sortedData.length ? sortedData.map((item) => {
                const hasTaxonomyPrice = item.averagePriceFromTaxonomy && item.averagePriceFromTaxonomy > 0;
                const displayPrice = item.median || item.averagePriceFromTaxonomy || null;
                return (
                  <article key={item.id} className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words text-base font-bold text-gray-900">{item.name}</h3>
                        <p className="mt-1 text-xs text-gray-500">{item.category || 'Categoria non assegnata'}</p>
                      </div>
                      <div className="shrink-0 rounded-md bg-indigo-50 px-2 py-1 text-right text-sm font-bold text-indigo-700">
                        {displayPrice ? formatCurrency(displayPrice) : 'n.d.'}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <p><span className="block text-xs text-gray-400">Prezzi</span>{item.count > 0 ? item.count : '0'}</p>
                      <p><span className="block text-xs text-gray-400">Range</span>{item.count > 0 ? buildRange(item.min, item.max) : hasTaxonomyPrice ? formatCurrency(item.averagePriceFromTaxonomy) : 'n.d.'}</p>
                    </div>
                    <div className="mt-4 grid gap-2">
                      <a href={buildServiceUrl(item.slug)} className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-3 text-sm font-semibold text-white hover:bg-indigo-700">
                        Trova cliniche e preventivi
                      </a>
                      <a href={`/quanto-costa/${item.slug}`} className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                        Leggi la descrizione
                      </a>
                    </div>
                  </article>
                );
              }) : (
                <div className="rounded-lg bg-white p-6 text-center text-gray-500">Nessuna prestazione disponibile al momento.</div>
              )}
            </div>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-[900px] divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4 text-left font-semibold">
                      <button type="button" onClick={() => requestSort('name')} className="inline-flex items-center gap-1">Prestazione {sortIcon('name')}</button>
                    </th>
                    <th className="hidden p-4 text-left font-semibold md:table-cell">Categoria</th>
                    <th className="p-4 text-left font-semibold">
                      <button type="button" onClick={() => requestSort('count')} className="inline-flex items-center gap-1">Prezzi caricati {sortIcon('count')}</button>
                    </th>
                    <th className="p-4 text-left font-semibold">Range</th>
                    <th className="p-4 text-left font-semibold">
                      <button type="button" onClick={() => requestSort('median')} className="inline-flex items-center gap-1">Valore mediano {sortIcon('median')}</button>
                    </th>
                    <th className="p-4 text-left font-semibold">Azione</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedData.length ? sortedData.map((item) => {
                    const hasTaxonomyPrice = item.averagePriceFromTaxonomy && item.averagePriceFromTaxonomy > 0;
                    const displayPrice = item.median || item.averagePriceFromTaxonomy || null;
                    const priceSource = item.median ? 'cliniche' : (hasTaxonomyPrice ? 'tariffario' : null);
                    const isExpanded = expandedRow === item.id;
                    return (
                      <React.Fragment key={item.id}>
                        <tr className="cursor-pointer hover:bg-gray-50" onClick={() => setExpandedRow(isExpanded ? null : item.id)}>
                          <td className="p-4 font-medium text-gray-900">{item.name}</td>
                          <td className="hidden p-4 text-gray-600 md:table-cell">{item.category || '-'}</td>
                          <td className="p-4 font-mono">{item.count > 0 ? <span className="font-semibold text-indigo-600">{item.count}</span> : <span className="text-gray-400">0</span>}</td>
                          <td className="p-4 font-mono">{item.count > 0 ? buildRange(item.min, item.max) : hasTaxonomyPrice ? <span className="italic text-gray-500">Da tariffario: {formatCurrency(item.averagePriceFromTaxonomy)}</span> : 'n.d.'}</td>
                          <td className="p-4 font-mono font-semibold">
                            {displayPrice ? (
                              <span className={item.median ? 'text-indigo-600' : 'text-gray-600'}>
                                {formatCurrency(displayPrice)}
                                {priceSource && <span className="ml-1 text-xs font-normal text-gray-400">({priceSource === 'cliniche' ? 'da cliniche' : 'tariffario'})</span>}
                              </span>
                            ) : <span className="text-gray-400">n.d.</span>}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-2">
                              <a href={buildServiceUrl(item.slug)} className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-xs font-semibold ${item.count ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                                Vedi Cliniche
                              </a>
                              <a href={`/quanto-costa/${item.slug}`} className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                                Descrizione
                              </a>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-indigo-50">
                            <td colSpan={6} className="p-4">
                              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div>
                                  <h3 className="mb-2 font-bold">Dettagli prestazione</h3>
                                  <p className="text-sm text-gray-600">{item.name}</p>
                                  <p className="text-sm text-gray-500">Categoria: {item.category || 'n.d.'}</p>
                                  {item.animals?.length > 0 && (
                                    <p className="mt-2 flex flex-wrap gap-2 text-sm text-gray-500">
                                      {item.animals.map((animal) => (
                                        <span key={animal} className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1">
                                          {/gatto|cat/i.test(animal) ? <Cat className="h-3 w-3" aria-hidden="true" /> : <Dog className="h-3 w-3" aria-hidden="true" />}
                                          {animal}
                                        </span>
                                      ))}
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <h3 className="mb-2 font-bold">Statistiche prezzo</h3>
                                  {item.count > 0 ? (
                                    <>
                                      <p className="text-sm">Range: <span className="font-semibold">{buildRange(item.min, item.max)}</span></p>
                                      <p className="text-sm">Mediana: <span className="font-semibold">{formatCurrency(item.median)}</span></p>
                                      <p className="text-sm">Media: <span className="font-semibold">{formatCurrency(item.avg)}</span></p>
                                      <p className="mt-1 text-xs text-gray-500">Basato su {item.count} cliniche</p>
                                    </>
                                  ) : hasTaxonomyPrice ? (
                                    <p className="text-sm">Prezzo medio indicativo: <span className="font-semibold">{formatCurrency(item.averagePriceFromTaxonomy)}</span><span className="mt-1 block text-xs text-gray-500">(dal tariffario di riferimento)</span></p>
                                  ) : (
                                    <p className="text-sm text-gray-500">Nessun dato disponibile</p>
                                  )}
                                </div>
                                <div>
                                  <h3 className="mb-2 font-bold">Vuoi un preventivo?</h3>
                                  <a href={buildServiceUrl(item.slug)} className="inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                                    Trova cliniche
                                  </a>
                                  <a href={`/quanto-costa/${item.slug}`} className="mt-2 inline-flex w-full items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                                    Descrizione Prestazione
                                  </a>
                                  {item.count === 0 && <p className="mt-2 text-xs text-gray-500">Invia una richiesta di preventivo per ottenere offerte personalizzate.</p>}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  }) : (
                    <tr>
                      <td className="p-6 text-center text-gray-500" colSpan={6}>Nessuna prestazione disponibile al momento.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
