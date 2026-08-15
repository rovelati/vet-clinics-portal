import React, { useEffect, useMemo, useState } from 'react';
import {
  Clock,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  Route,
  Search,
  Star,
} from 'lucide-react';

const fallbackImage = '/favicon.svg';
const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
const genericTerms = new Set(['veterinario', 'veterinari', 'clinica', 'cliniche', 'ambulatorio', 'ambulatori', 'vet']);
const stopWords = new Set(['a', 'ad', 'al', 'alla', 'alle', 'allo', 'con', 'da', 'del', 'della', 'delle', 'di', 'il', 'la', 'le', 'lo', 'per', 'un', 'una']);
const semanticFamilies = {
  vaccin: ['vaccin', 'vaccino', 'vaccini', 'vaccinazione', 'vaccinazioni', 'profilassi', 'richiamo'],
  sterilizz: ['sterilizz', 'sterilizzazione', 'ovarioisterectomia', 'ovariectomia'],
  castraz: ['castraz', 'castrazione', 'orchiectomia'],
  ecograf: ['ecograf', 'ecografia', 'ecografico', 'ecocardiogramma', 'ecocardio'],
  radiograf: ['radiograf', 'radiografia', 'rx', 'raggi'],
  analis: ['analis', 'analisi', 'ematochimico', 'emocromo', 'sangue', 'laboratorio'],
  sangue: ['sangue', 'ematochimico', 'emocromo', 'ematologia', 'laboratorio', 'analisi'],
  esam: ['esam', 'esame', 'test', 'diagnostica'],
  feci: ['feci', 'coprologico', 'parassitologico', 'parassiti'],
  urin: ['urin', 'urine', 'urinario'],
  giardi: ['giardi', 'giardia'],
  leptospir: ['leptospir', 'leptospirosi'],
  leishman: ['leishman', 'leishmania'],
  rabbia: ['rabbia', 'antirabbica', 'antirabbico'],
  fiv: ['fiv'],
  felv: ['felv', 'leucemia'],
  microchip: ['microchip', 'anagrafe', 'identificazione'],
  dermatolog: ['dermatolog', 'dermatologia', 'cute', 'pelle'],
  domicili: ['domicili', 'domicilio'],
  anestes: ['anestes', 'anestesia', 'sedazione'],
  detartras: ['detartras', 'detartrase', 'detartrasi', 'denti', 'dentale'],
  sutur: ['sutur', 'sutura', 'ferita'],
  tac: ['tac', 'tomografia'],
  gastroscop: ['gastroscop', 'gastroscopia', 'endoscopia'],
  eutanas: ['eutanas', 'eutanasia'],
  cane: ['cane', 'cani', 'canino'],
  gatto: ['gatto', 'gatta', 'gatti', 'felino'],
  conigl: ['conigl', 'coniglio', 'conigli'],
};

function selectBestClinicImage(images, fallback = fallbackImage) {
  if (!Array.isArray(images)) return fallback;

  const candidates = images
    .filter((image) => typeof image === 'string' && (/^https?:\/\//i.test(image) || image.startsWith('/')))
    .map((image, index) => {
      const lower = image.toLowerCase();
      let score = 0;
      if (lower.startsWith('/media/gallery/clinics/')) score += 20;
      if (/\.(jpe?g|webp)(\?|$)/i.test(lower)) score += 12;
      if (/\.(png|gif|svg|ico)(\?|$)/i.test(lower)) score -= 30;
      if (/_web_/i.test(lower)) score += 3;
      if (/_migrated_|_og/i.test(lower)) score += 8;
      if (/whatsapp|wa\.me|facebook|instagram|logo|icon|favicon|placeholder/i.test(lower)) score -= 80;
      return { image, score, index };
    })
    .filter((candidate) => candidate.score >= 0)
    .sort((a, b) => (b.score - a.score) || (a.index - b.index));

  return candidates[0]?.image || fallback;
}

async function getSupabase() {
  const { supabaseBrowser } = await import('@/lib/supabase-browser');
  return supabaseBrowser;
}

function cleanText(value) {
  return typeof value === 'string' ? value.replace(/"/g, '').trim() : '';
}

function cleanSearchTerm(value) {
  return cleanText(value).replace(/[%,]/g, ' ').replace(/\s+/g, ' ');
}

function saveLastLocationPreference(location, fallbackLabel = '') {
  if (!location || typeof window === 'undefined') return;
  const cityName = cleanText(location.cityName || location.city || location.display_name?.split(',')?.[0] || fallbackLabel);
  const province = cleanText(location.province || '');
  const payload = {
    cityName,
    city: cityName,
    province,
    lat: Number.isFinite(Number(location.lat)) ? Number(location.lat) : null,
    lng: Number.isFinite(Number(location.lng)) ? Number(location.lng) : null,
    label: cityName || cleanText(fallbackLabel),
    display_name: cleanText(location.display_name || cityName || fallbackLabel),
    source: location.source || 'search',
    timestamp: Date.now(),
  };
  if (!payload.cityName && (payload.lat === null || payload.lng === null)) return;
  const encoded = encodeURIComponent(JSON.stringify(payload));
  localStorage.setItem('lastSearchLocation', JSON.stringify(payload));
  document.cookie = `vet_last_location=${encoded}; Max-Age=${30 * 24 * 60 * 60}; Path=/; SameSite=Lax`;
}

function normalizeSearchText(value) {
  return cleanText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stemToken(value) {
  const token = normalizeSearchText(value);
  if (!token) return '';
  if (/^vaccin/.test(token)) return 'vaccin';
  if (/^conigl/.test(token)) return 'conigl';
  if (/^sterilizz/.test(token)) return 'sterilizz';
  if (/^castraz/.test(token)) return 'castraz';
  if (/^ecograf/.test(token)) return 'ecograf';
  if (/^radiograf/.test(token)) return 'radiograf';
  if (/^eutanas/.test(token)) return 'eutanas';
  if (/^fiv/.test(token)) return 'fiv';
  if (/^felv/.test(token)) return 'felv';
  if (/^leishman/.test(token)) return 'leishman';
  if (/^giardi/.test(token)) return 'giardi';
  if (/^leptospir/.test(token)) return 'leptospir';
  if (/^analis/.test(token)) return 'analis';
  if (/^sangu|^emato|^emocromo/.test(token)) return 'sangue';
  if (/^esam/.test(token)) return 'esam';
  if (/^urin/.test(token)) return 'urin';
  if (/^feci|^fecal|^coprolog|^parassit/.test(token)) return 'feci';
  if (/^microchip|^anagraf/.test(token)) return 'microchip';
  if (/^dermatolog|^pelle|^cute/.test(token)) return 'dermatolog';
  if (/^domicil/.test(token)) return 'domicili';
  if (/^anestes|^sedaz/.test(token)) return 'anestes';
  if (/^detartras|^dent/.test(token)) return 'detartras';
  if (/^sutur|^ferit/.test(token)) return 'sutur';
  if (/^tac|^tomograf/.test(token)) return 'tac';
  if (/^gastroscop|^endoscop/.test(token)) return 'gastroscop';
  if (/^cane|^canin/.test(token)) return 'cane';
  if (/^gatt|^felin/.test(token)) return 'gatto';
  return token.replace(/(zioni|zione|mente|ità|ita|ici|ico|ica|che|chi|are|ere|ire|ato|ata|ati|ate|ino|ina|ini|ine|ale|ali|e|i|o|a)$/i, '');
}

function searchTokens(value) {
  return normalizeSearchText(value)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !stopWords.has(token))
    .map(stemToken)
    .filter(Boolean);
}

function tokenAliases(token) {
  return [...new Set([token, ...(semanticFamilies[token] || [])].map(stemToken).filter(Boolean))];
}

function serviceSuggestionTokens(service) {
  return searchTokens(`${service?.name || ''} ${service?.slug || ''}`);
}

function buildSemanticProfile(query, serviceSuggestions = []) {
  const baseTokens = [...new Set(searchTokens(query))];
  if (!baseTokens.length) return { tokens: [], groups: [], intentLabel: cleanText(query) || 'veterinari' };

  const expandedTokens = new Set(baseTokens);
  serviceSuggestions.forEach((service) => {
    const serviceTokens = serviceSuggestionTokens(service);
    const overlaps = serviceTokens.some((token) => baseTokens.includes(token) || baseTokens.some((baseToken) => tokenAliases(baseToken).includes(token)));
    if (overlaps) serviceTokens.forEach((token) => expandedTokens.add(token));
  });

  const tokens = [...expandedTokens];
  const groups = tokens.map((token) => tokenAliases(token));
  return { tokens, groups, intentLabel: describeSearchIntentFromTokens(baseTokens) };
}

function clinicSearchHaystack(clinic) {
  const raw = clinic?.raw_import && typeof clinic.raw_import === 'object' ? clinic.raw_import : {};
  const fields = [
    clinic?.name,
    clinic?.address,
    raw.city,
    raw.province,
    raw.region,
    raw.category,
    raw.description,
    raw.specialization,
  ];
  ['tags', 'flags', 'services', 'service_mentions', 'categories'].forEach((key) => {
    if (Array.isArray(raw[key])) fields.push(...raw[key]);
  });
  fields.push(JSON.stringify(raw));
  return normalizeSearchText(fields.filter(Boolean).join(' '));
}

function classifyClinicQueryMatch(clinic, query, serviceSuggestions = []) {
  const profile = buildSemanticProfile(query, serviceSuggestions);
  const tokens = profile.tokens;
  if (!tokens.length || genericTerms.has(normalizeSearchText(query))) {
    return { tier: 'generic', score: 0, label: '' };
  }

  const haystack = clinicSearchHaystack(clinic);
  const haystackTokens = new Set(searchTokens(haystack));
  const matchedGroups = profile.groups.filter((aliases) => aliases.some((token) => haystackTokens.has(token)));
  const exactPhrase = normalizeSearchText(query);

  if (exactPhrase && haystack.includes(exactPhrase)) {
    return { tier: 'exact', score: 300 + matchedGroups.length * 10, label: 'Match esatto' };
  }
  if (matchedGroups.length === profile.groups.length) {
    return { tier: 'exact', score: 260 + matchedGroups.length * 10, label: 'Servizio coerente' };
  }
  if (matchedGroups.length > 0) {
    return { tier: 'partial', score: 140 + matchedGroups.length * 10, label: 'Match parziale' };
  }
  return { tier: 'ask', score: 10, label: 'Da verificare' };
}

function describeSearchIntentFromTokens(tokens) {
  if (!tokens.length) return 'veterinari';
  return tokens
    .map((token) => {
      if (token === 'vaccin') return 'vaccini';
      if (token === 'conigl') return 'coniglio';
      if (token === 'sterilizz') return 'sterilizzazione';
      if (token === 'castraz') return 'castrazione';
      if (token === 'ecograf') return 'ecografia';
      if (token === 'radiograf') return 'radiografia';
      if (token === 'analis') return 'analisi';
      if (token === 'sangue') return 'sangue';
      if (token === 'esam') return 'esami';
      if (token === 'urin') return 'urine';
      if (token === 'feci') return 'feci';
      if (token === 'dermatolog') return 'dermatologia';
      if (token === 'domicili') return 'domicilio';
      if (token === 'anestes') return 'anestesia';
      if (token === 'detartras') return 'detartrasi';
      if (token === 'sutur') return 'sutura';
      if (token === 'gastroscop') return 'gastroscopia';
      return token;
    })
    .join(' ');
}

function describeSearchIntent(value, serviceSuggestions = []) {
  return buildSemanticProfile(value, serviceSuggestions).intentLabel;
}

function normalizeSlugText(value) {
  return cleanText(value)
    .replace(/\bcampo\s+nell['’]?\s*elba\b/i, 'campo dell elba')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function isH24Intent(value) {
  const normalized = ` ${normalizeSlugText(value).replace(/-/g, ' ')} `;
  return /\b(h24|24h|24 ore|aperto 24|urgenza|emergenza|pronto soccorso)\b/.test(normalized)
    || /\bveterinari? h24\b/.test(normalized)
    || /\bcliniche? h24\b/.test(normalized);
}

function canonicalVeterinariCityPath(city, province) {
  const citySlug = normalizeSlugText(city);
  const provinceSlug = cleanText(province).toLowerCase();
  return citySlug && provinceSlug ? `/veterinari/${provinceSlug}/${citySlug}` : '/cerca-veterinari';
}

function normalizeMinutes(value) {
  if (!value) return null;
  const [hours, minutes = '0'] = String(value).split(':').map((part) => parseInt(part, 10));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (hours === 24 && minutes === 0) return 24 * 60;
  return Math.max(0, Math.min(24 * 60, hours * 60 + minutes));
}

function normalizeDaySlots(value) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string' && value.trim()) return [value];
  return [];
}

function slotCoversFullDay(slot) {
  if (typeof slot !== 'string') return false;
  const trimmed = slot.trim();
  if (/^h24$/i.test(trimmed) || /^24h$/i.test(trimmed) || /aperto\s*(24|h24)/i.test(trimmed)) return true;
  if (/(^|\s)00:00\s*[-–—]\s*(24:00|23:59|00:00)/.test(trimmed)) return true;
  const parts = trimmed.split(/[-–—]/).map((part) => part.trim());
  return parts.length >= 2 && parts[0] === '00:00' && ['24:00', '23:59', '00:00'].includes(parts[1]);
}

function computeOpenStatus(clinic, referenceDate = new Date()) {
  const hours = clinic?.hours || {};
  const todaysKey = dayNames[referenceDate.getDay()];
  const todaysSlots = normalizeDaySlots(hours[todaysKey]);
  const rawImport = clinic?.raw_import && typeof clinic.raw_import === 'object' ? clinic.raw_import : {};
  const tags = Array.isArray(rawImport.tags) ? rawImport.tags : [];
  const flags = Array.isArray(rawImport.flags) ? rawImport.flags : [];
  const tagList = [...tags, ...flags].map((tag) => cleanText(tag).toLowerCase()).filter(Boolean);
  const hasExplicitH24Tag = tagList.some((tag) => /^h24$|^24h$|^aperto\s*24\s*ore$|^aperto\s*h24$/.test(tag));
  const hasAnyH24Slot = Object.values(hours).some((slots) => normalizeDaySlots(slots).some(slotCoversFullDay));
  const isAlwaysOpen = hasExplicitH24Tag || hasAnyH24Slot;

  if (isAlwaysOpen) return { isAlwaysOpen: true, isOpenNow: true, todaysSlots };

  const nowMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();
  const isOpenNow = todaysSlots.some((slot) => {
    const [startRaw, endRaw] = String(slot).split(/[-–—]/).map((part) => part.trim());
    const startMinutes = normalizeMinutes(startRaw);
    const endMinutes = normalizeMinutes(endRaw);
    if (startMinutes === null || endMinutes === null) return false;
    if (endMinutes <= startMinutes) return nowMinutes >= startMinutes || nowMinutes < endMinutes;
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  });

  return { isAlwaysOpen: false, isOpenNow, todaysSlots };
}

function haversineDistance(from, to) {
  const radius = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLon = ((to.lng - from.lng) * Math.PI) / 180;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return radius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function openStreetMapEmbedUrl(lat, lng, zoom = 13) {
  const delta = zoom >= 13 ? 0.018 : 0.08;
  const west = lng - delta;
  const south = lat - delta;
  const east = lng + delta;
  const north = lat + delta;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${west}%2C${south}%2C${east}%2C${north}&layer=mapnik&marker=${lat}%2C${lng}`;
}

function directionsUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat}%2C${lng}&travelmode=driving`;
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
  };
}

async function reverseGeocode(lat, lng) {
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=it`);
  if (!response.ok) return null;
  const data = await response.json();
  const address = data.address || {};
  const city = address.city || address.town || address.village || address.municipality || '';
  const region = address.state || address.region || '';
  return {
    lat,
    lng,
    display_name: [city, region, 'Italia'].filter(Boolean).join(', ') || data.display_name,
    cityName: city,
  };
}

async function getLocationFromIP() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) return null;
    const data = await response.json();
    if (!data.latitude || !data.longitude) return null;
    return {
      lat: Number(data.latitude),
      lng: Number(data.longitude),
      display_name: [data.city, data.region, data.country_name || 'Italia'].filter(Boolean).join(', '),
      cityName: data.city || '',
    };
  } catch {
    return null;
  }
}

function cityLabel(clinic) {
  const city = cleanText(clinic.raw_import?.city);
  const province = cleanText(clinic.raw_import?.province);
  if (city && province) return `${city}, ${province}`;
  return city || province || '';
}

function normalizeClinic(clinic) {
  const lat = clinic.lat == null ? null : Number(clinic.lat);
  const lng = clinic.lng == null ? null : Number(clinic.lng);
  const ratingValue = clinic.rating_avg_cached == null ? null : Number(clinic.rating_avg_cached);
  const reviewsValue = clinic.rating_count_cached == null ? null : Number(clinic.rating_count_cached);

  return {
    ...clinic,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    ratingValue: Number.isFinite(ratingValue) ? ratingValue : null,
    reviewsValue: Number.isFinite(reviewsValue) ? reviewsValue : null,
    image: selectBestClinicImage(clinic.gallery_images),
    ...computeOpenStatus(clinic),
  };
}

function scoreClinic(clinic) {
  const rating = clinic.ratingValue ?? 0;
  const reviews = clinic.reviewsValue ? Math.log10(1 + clinic.reviewsValue) : 0;
  return rating + reviews;
}

function buildPermalink(location) {
  const city = location?.cityName || location?.display_name?.split(',')[0] || '';
  if (!city) return '/cerca-veterinari';
  if (location?.province) return canonicalVeterinariCityPath(city, location.province);
  return `/cerca-veterinari?location=${normalizeSlugText(city)}`;
}

function enrichAndSort(clinics, { query, location, hasLocationIntent = false, sortBy, radius, serviceSuggestions = [] }) {
  const search = normalizeSearchText(query);
  const queryTokens = buildSemanticProfile(query, serviceSuggestions).tokens;
  const hasQueryIntent = queryTokens.length > 0 && !genericTerms.has(search);
  const locationCity = cleanText(location?.cityName || location?.display_name?.split(',')[0]).toLowerCase();
  const locationProvince = cleanText(location?.province).toUpperCase();

  let enriched = clinics.map((clinic) => {
    const normalized = normalizeClinic(clinic);
    const distance = location && normalized.lat !== null && normalized.lng !== null
      ? haversineDistance(location, { lat: normalized.lat, lng: normalized.lng })
      : null;
    const queryMatch = classifyClinicQueryMatch(normalized, query, serviceSuggestions);
    return { ...normalized, distance, queryMatch };
  });

  if (location) {
    const exactCity = [];
    const nearby = [];
    const province = [];
    enriched.forEach((clinic) => {
      const clinicCity = cleanText(clinic.raw_import?.city).toLowerCase();
      const clinicProvince = cleanText(clinic.raw_import?.province).toUpperCase();
      const cityMatch = Boolean(locationCity && clinicCity && clinicCity === locationCity);
      if (cityMatch) exactCity.push(clinic);
      else if (clinic.distance !== null && clinic.distance <= radius) nearby.push(clinic);
      else if (locationProvince && clinicProvince === locationProvince) province.push(clinic);
    });
    enriched = [...exactCity, ...nearby.sort((a, b) => a.distance - b.distance), ...province];
  }

  if (hasQueryIntent && !location && !hasLocationIntent) {
    enriched = enriched.filter((clinic) => ['exact', 'partial'].includes(clinic.queryMatch?.tier));
  }

  return enriched.sort((a, b) => {
    if (hasQueryIntent) {
      const matchDelta = (b.queryMatch?.score || 0) - (a.queryMatch?.score || 0);
      if (matchDelta !== 0) return matchDelta;
    }
    if (sortBy === 'distance' && a.distance !== null && b.distance !== null) return a.distance - b.distance;
    if (sortBy === 'open') {
      if (a.isOpenNow !== b.isOpenNow) return a.isOpenNow ? -1 : 1;
      if (a.isAlwaysOpen !== b.isAlwaysOpen) return a.isAlwaysOpen ? -1 : 1;
    }
    if (a.distance !== null && b.distance !== null && Math.abs(a.distance - b.distance) > 0.1 && sortBy !== 'best') return a.distance - b.distance;
    return scoreClinic(b) - scoreClinic(a);
  });
}

function SearchMap({ clinics, location, userLocation }) {
  const [leaflet, setLeaflet] = useState(null);
  const points = clinics.filter((clinic) => clinic.lat !== null && clinic.lng !== null).slice(0, 30);
  const center = location
    ? [location.lat, location.lng]
    : userLocation
      ? [userLocation.lat, userLocation.lng]
      : points[0]
        ? [points[0].lat, points[0].lng]
        : [41.9027835, 12.4963655];
  const zoom = location || userLocation ? 11 : 6;
  const mapKey = `${Number(center[0]).toFixed(4)}-${Number(center[1]).toFixed(4)}-${zoom}`;

  useEffect(() => {
    let mounted = true;
    Promise.all([
      import('react-leaflet'),
      import('leaflet'),
      import('leaflet/dist/leaflet.css'),
    ]).then(([reactLeaflet, leafletModule]) => {
      if (!mounted) return;
      setLeaflet({ ...reactLeaflet, L: leafletModule.default || leafletModule });
    }).catch(() => setLeaflet(null));
    return () => {
      mounted = false;
    };
  }, []);

  if (!leaflet) {
    const [lat, lng] = center;
    return (
      <iframe
        title="Mappa veterinari"
        src={openStreetMapEmbedUrl(lat, lng, zoom)}
        className="h-full w-full rounded-lg border-0 shadow-lg"
        loading="lazy"
      />
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, L } = leaflet;
  const blueIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
  const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  return (
    <MapContainer key={mapKey} center={center} zoom={zoom} scrollWheelZoom={false} className="h-full w-full rounded-lg shadow-lg">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {(location || userLocation) && (
        <Marker position={center} icon={redIcon}>
          <Popup>{userLocation ? 'La tua posizione' : 'Zona di ricerca'}</Popup>
        </Marker>
      )}
      {points.map((clinic) => (
        <Marker key={clinic.id} position={[clinic.lat, clinic.lng]} icon={blueIcon}>
          <Popup>
            <strong>{clinic.name}</strong>
            {clinic.address && <div>{clinic.address}</div>}
            <a href={`/veterinari/${clinic.slug}`} className="text-blue-600">Vedi dettagli</a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default function CercaVeterinariApp({ initialClinics = [], initialQuery = '', initialLocation = '', serviceSuggestions = [] }) {
  const [queryDraft, setQueryDraft] = useState(initialQuery);
  const [locationDraft, setLocationDraft] = useState(initialLocation.replace(/-/g, ' '));
  const [rawClinics, setRawClinics] = useState(initialClinics);
  const [searchLocation, setSearchLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [ipLocation, setIpLocation] = useState(null);
  const [sortBy, setSortBy] = useState('relevance');
  const [radius, setRadius] = useState(30);
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    getLocationFromIP().then((location) => {
      if (location) setIpLocation(location);
    });
  }, []);

  useEffect(() => {
    if (!initialLocation) return;
    geocodeLocation(initialLocation.replace(/-/g, ' ')).then((location) => {
      if (location) setSearchLocation(location);
    });
  }, [initialLocation]);

  const visibleClinics = useMemo(
    () => enrichAndSort(rawClinics, {
      query: queryDraft,
      location: searchLocation || userLocation,
      hasLocationIntent: Boolean(cleanText(locationDraft)),
      sortBy,
      radius,
      serviceSuggestions,
    }),
    [rawClinics, queryDraft, locationDraft, searchLocation, userLocation, sortBy, radius, serviceSuggestions]
  );
  const displayClinics = showAll ? visibleClinics : visibleClinics.slice(0, 24);
  const matchSummary = useMemo(() => {
    const hasQuery = buildSemanticProfile(queryDraft, serviceSuggestions).tokens.length > 0 && !genericTerms.has(normalizeSearchText(queryDraft));
    return {
      hasQuery,
      intentLabel: describeSearchIntent(queryDraft, serviceSuggestions),
      exact: visibleClinics.filter((clinic) => clinic.queryMatch?.tier === 'exact').length,
      partial: visibleClinics.filter((clinic) => clinic.queryMatch?.tier === 'partial').length,
      ask: visibleClinics.filter((clinic) => clinic.queryMatch?.tier === 'ask').length,
    };
  }, [visibleClinics, queryDraft, serviceSuggestions]);

  const loadClinics = async ({ query, location }) => {
    setLoading(true);
    setError('');
    setShowAll(false);

    try {
      let foundLocation = null;
      if (location) {
        foundLocation = await geocodeLocation(location);
        if (!foundLocation) {
          setError(`Non e stato possibile trovare "${location}". Mostro risultati testuali.`);
        }
        setSearchLocation(foundLocation);
        setUserLocation(null);
        if (foundLocation) saveLastLocationPreference(foundLocation, location);
      }

      const supabase = await getSupabase();
      const cleanedQuery = cleanText(query);
      const cleanedLocation = cleanText(location);
      const search = cleanedQuery.toLowerCase();
      const isGeneric = genericTerms.has(search);
      const locationCityTerm = cleanSearchTerm(foundLocation?.cityName || foundLocation?.display_name?.split(',')[0] || '');
      const locationProvinceTerm = cleanSearchTerm(foundLocation?.province || '');

      let request = supabase
        .from('clinics')
        .select('id, name, address, phone, slug, rating_avg_cached, rating_count_cached, lat, lng, hours, raw_import, gallery_images, created_at, owner_id, claimed_at')
        .in('status', ['pubblicata', 'in_revisione'])
        .not('slug', 'is', null)
        .limit(foundLocation ? 800 : 120);

      if (foundLocation && (locationCityTerm || locationProvinceTerm)) {
        const filters = [];
        if (locationCityTerm) filters.push(`raw_import->>city.ilike.%${locationCityTerm}%`);
        if (locationProvinceTerm) filters.push(`raw_import->>province.ilike.%${locationProvinceTerm}%`);
        request = request.or(filters.join(','));
      } else if (cleanedLocation && !foundLocation) {
        request = request.or(`raw_import->>city.ilike.%${cleanedLocation}%,raw_import->>province.ilike.%${cleanedLocation}%,address.ilike.%${cleanedLocation}%`);
      } else if (cleanedQuery && !isGeneric && !foundLocation) {
        request = request.or(`name.ilike.%${cleanedQuery}%,address.ilike.%${cleanedQuery}%,raw_import->>city.ilike.%${cleanedQuery}%`);
      }

      request = request
        .order('rating_avg_cached', { ascending: false, nullsFirst: false })
        .order('rating_count_cached', { ascending: false, nullsFirst: false });

      const { data, error: queryError } = await request;
      if (queryError) throw queryError;

      setRawClinics(data ?? []);
      if (foundLocation && (isGeneric || !cleanedQuery)) {
        const cityName = foundLocation.cityName || foundLocation.display_name?.split(',')[0] || cleanedLocation;
        window.history.pushState({}, '', buildPermalink({ ...foundLocation, cityName }));
      } else {
        const params = new URLSearchParams();
        if (cleanedQuery) params.set('query', cleanedQuery);
        if (cleanedLocation) params.set('location', normalizeSlugText(cleanedLocation));
        window.history.pushState({}, '', `/cerca-veterinari${params.toString() ? `?${params.toString()}` : ''}`);
      }
    } catch (err) {
      setError(err?.message || 'Impossibile caricare le cliniche.');
    } finally {
      setLoading(false);
    }
  };

  const serviceSearchTarget = (query, location) => {
    const querySlug = normalizeSlugText(query);
    if (!querySlug) return null;
    const service = serviceSuggestions.find((item) => normalizeSlugText(item?.name) === querySlug || item?.slug === querySlug);
    if (!service?.slug) return null;
    const locationSlug = normalizeSlugText(location);
    return locationSlug
      ? `/quanto-costa/${locationSlug}/${service.slug}/cliniche`
      : `/quanto-costa/${service.slug}/cliniche`;
  };

  useEffect(() => {
    if (!initialQuery && !initialLocation) return;
    loadClinics({ query: initialQuery, location: initialLocation.replace(/-/g, ' ') });
  // Run once to expand direct query-string loads beyond the server-rendered first page.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (isH24Intent(queryDraft)) {
      const locationSlug = normalizeSlugText(locationDraft);
      window.location.href = locationSlug ? `/veterinari-h24/${locationSlug}` : '/veterinari-h24';
      return;
    }
    const target = serviceSearchTarget(queryDraft, locationDraft);
    if (target) {
      window.location.href = target;
      return;
    }
    loadClinics({ query: queryDraft, location: locationDraft });
  };

  const useIpLocation = () => {
    if (!ipLocation) return;
    setSearchLocation(ipLocation);
    setUserLocation(null);
    setLocationDraft(ipLocation.cityName || ipLocation.display_name?.split(',')[0] || '');
    saveLastLocationPreference({ ...ipLocation, source: 'ip-explicit' });
    window.history.pushState({}, '', buildPermalink(ipLocation));
  };

  const locateMe = () => {
    setError('');
    if (!navigator.geolocation) {
      setError('Geolocalizzazione non supportata.');
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const location = await reverseGeocode(lat, lng) || { lat, lng, display_name: `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
        setUserLocation(location);
        setSearchLocation(null);
        setLocationDraft(location.cityName || location.display_name?.split(',')[0] || '');
        saveLastLocationPreference({ ...location, source: 'gps' });
        setDetectingLocation(false);
      },
      () => {
        setDetectingLocation(false);
        setError('Consenti la posizione o inserisci una citta manualmente.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const locationLabel = searchLocation?.cityName || userLocation?.cityName || locationDraft || '';
  const searchedWhat = cleanText(queryDraft) || 'veterinari';
  const searchedWhere = cleanText(locationLabel);
  const hasSearchIntent = Boolean(searchedWhat || searchedWhere);
  const todayLabel = new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
  const cityHeading = searchedWhere
    ? `Veterinari, cliniche e ambulatori a ${searchedWhere.split(',')[0]}`
    : 'Cerca veterinari vicino a te';

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      <section className="overflow-hidden bg-gradient-to-br from-green-700 via-emerald-700 to-slate-900 py-8 text-white sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="text-left sm:text-center">
              <p className="mb-2 text-sm font-bold uppercase tracking-wide text-emerald-100">
                Ricerca veterinari
              </p>
              <h1 className="mb-3 break-words text-3xl font-bold leading-tight md:text-5xl">{cityHeading}</h1>
              <p className="mx-auto mb-6 max-w-3xl text-base leading-7 text-emerald-50 sm:text-xl">
                Trova veterinari vicino a te, cliniche, ambulatori e strutture veterinarie nella zona indicata, con mappa, telefono, orari e recensioni.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="search-glow mx-auto max-w-4xl overflow-hidden rounded-lg border border-white/20 bg-white shadow-lg">
              <div className="grid gap-0 sm:grid-cols-[1fr_18rem_auto]">
                <div className="border-b border-gray-200 sm:border-b-0 sm:border-r">
                  <label htmlFor="vet-query" className="block px-4 pt-3 text-xs font-bold uppercase tracking-wide text-gray-500">Cosa</label>
                  <input
                    id="vet-query"
                    type="search"
                    value={queryDraft}
                    onChange={(event) => setQueryDraft(event.target.value)}
                    placeholder="Veterinari, clinica, ambulatorio, nome struttura"
                    className="h-12 w-full border-0 px-4 pb-3 text-base text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0 sm:text-lg"
                  />
                </div>
                <div className="relative border-b border-gray-200 sm:border-b-0 sm:border-r">
                  <MapPin className="pointer-events-none absolute left-3 top-[2.35rem] h-5 w-5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                  <label htmlFor="vet-location" className="block px-4 pl-10 pt-3 text-xs font-bold uppercase tracking-wide text-gray-500">Dove</label>
                  <input
                    id="vet-location"
                    type="search"
                    value={locationDraft}
                    onChange={(event) => setLocationDraft(event.target.value)}
                    placeholder={ipLocation ? `Es. ${ipLocation.cityName || 'Roma'}` : 'Es. Roma'}
                    className="h-12 w-full border-0 px-4 pb-3 pl-10 text-base text-gray-900 outline-none placeholder:text-gray-400 focus:ring-0 sm:text-lg"
                  />
                </div>
                <button type="submit" disabled={loading} className="inline-flex h-16 items-center justify-center bg-gray-900 px-6 font-semibold text-white hover:bg-black disabled:opacity-60 sm:h-full">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Search className="h-5 w-5" aria-hidden="true" />}
                  <span className="ml-2">Cerca</span>
                </button>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-sm">
              <button
                type="button"
                onClick={locateMe}
                disabled={detectingLocation}
                className="inline-flex items-center rounded-md border border-white/40 px-3 py-2 text-white hover:bg-white/10 disabled:opacity-60"
              >
                <Navigation className="mr-2 h-4 w-4" aria-hidden="true" />
                {detectingLocation ? 'Rilevamento...' : 'Vicino a me'}
              </button>
              {ipLocation && !searchLocation && !userLocation && (
                <button type="button" onClick={useIpLocation} className="inline-flex max-w-full items-center rounded-md bg-white/10 px-3 py-2 text-left text-green-50 hover:bg-white/20">
                  Usa posizione rilevata: <strong className="ml-1">{ipLocation.cityName || ipLocation.display_name}</strong>
                </button>
              )}
              {error && <span className="max-w-full break-words text-red-100">{error}</span>}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 rounded-lg border border-green-100 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-green-700">Risultati ricerca</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">
              {visibleClinics.length} strutture trovate{locationLabel ? ` vicino a ${locationLabel}` : ''}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {matchSummary.hasQuery
                ? `Hai cercato ${matchSummary.intentLabel}. Mostriamo prima le strutture con match esatto (${matchSummary.exact}), poi quelle con servizi affini (${matchSummary.partial}) e infine quelle in zona da contattare per conferma (${matchSummary.ask}).`
                : 'Le strutture sono ordinate per pertinenza, distanza e recensioni disponibili.'}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">
              Raggio
              <select value={radius} onChange={(event) => setRadius(Number(event.target.value))} className="mt-1 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-900">
                <option value={10}>10 km</option>
                <option value={30}>30 km</option>
                <option value={50}>50 km</option>
                <option value={100}>100 km</option>
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700">
              Ordina
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-900">
                <option value="relevance">Pertinenza</option>
                <option value="distance">Distanza</option>
                <option value="best">Recensioni</option>
                <option value="open">Aperti ora</option>
              </select>
            </label>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,42%)]">
          <section className="order-2 min-w-0 lg:order-1">
            {loading && (
              <div className="mb-4 rounded-lg border bg-white p-4 text-sm text-gray-600">
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" aria-hidden="true" />
                Caricamento cliniche...
              </div>
            )}

            {!displayClinics.length && !loading ? (
              <div className="rounded-lg border-2 border-dashed bg-white p-8 text-center">
                <h3 className="text-lg font-bold text-gray-900">Nessuna struttura trovata</h3>
                <p className="mt-2 text-gray-600">Prova una localita diversa o una ricerca piu generica.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayClinics.map((clinic, index) => (
                  <ClinicResultCard key={clinic.id} clinic={clinic} eager={index === 0} />
                ))}
              </div>
            )}

            {!showAll && visibleClinics.length > displayClinics.length && (
              <div className="mt-6 text-center">
                <button type="button" onClick={() => setShowAll(true)} className="inline-flex h-11 items-center justify-center rounded-md bg-green-600 px-5 font-semibold text-white hover:bg-green-700">
                  Mostra tutte le {visibleClinics.length} strutture
                </button>
              </div>
            )}
          </section>

          <aside className="order-1 min-w-0 lg:sticky lg:top-24 lg:order-2 lg:h-[calc(100vh-180px)]">
            <div className="h-[420px] overflow-hidden rounded-lg lg:h-full">
              <SearchMap clinics={displayClinics} location={searchLocation} userLocation={userLocation} />
            </div>
            {hasSearchIntent && (
              <div className="mt-4 rounded-lg border border-green-100 bg-white p-4 shadow-sm">
                <p className="text-sm font-bold uppercase tracking-wide text-green-700">
                  Hai cercato {searchedWhat}{searchedWhere ? ` a ${searchedWhere}` : ''}
                </p>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  Dati consultati {todayLabel}. Usa la mappa per orientarti nella zona, poi scegli dal listato la struttura da chiamare o aprire in dettaglio.
                </p>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

function ClinicResultCard({ clinic, eager }) {
  const rating = clinic.ratingValue !== null ? clinic.ratingValue.toFixed(1) : null;
  const telHref = clinic.phone ? `tel:${clinic.phone.replace(/\s/g, '')}` : null;
  const detailsHref = clinic.slug ? `/veterinari/${clinic.slug}` : '#';
  const hasPhoto = clinic.image !== fallbackImage;
  const mediaClassName = 'order-first h-44 w-full shrink-0 rounded-lg object-cover sm:h-28 sm:w-28';
  const placeholderClassName = 'order-first flex h-44 w-full shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-100 to-blue-100 sm:h-28 sm:w-28';
  const mapsHref = clinic.lat !== null && clinic.lng !== null
    ? directionsUrl(clinic.lat, clinic.lng)
    : null;
  const statusLabel = clinic.isAlwaysOpen ? 'H24' : clinic.isOpenNow ? 'Aperto ora' : null;
  const isVerified = Boolean(clinic.claimed_at || clinic.owner_id);
  const matchBadge = clinic.queryMatch?.label
    ? {
        exact: 'bg-green-100 text-green-800',
        partial: 'bg-blue-100 text-blue-800',
        ask: 'bg-amber-100 text-amber-800',
      }[clinic.queryMatch.tier]
    : null;

  return (
    <article className="vet-card-hover overflow-hidden rounded-lg border-0 bg-white shadow-lg">
      <div className="flex flex-col gap-4 p-4 sm:flex-row">
        {hasPhoto ? (
          <img
            src={clinic.image}
            alt={clinic.name}
            className={mediaClassName}
            loading={eager ? 'eager' : 'lazy'}
            onError={(event) => {
              event.currentTarget.src = fallbackImage;
              event.currentTarget.className = `${mediaClassName} bg-green-50 object-contain p-8`;
            }}
          />
        ) : (
          <div className={placeholderClassName}>
            <img src={fallbackImage} alt="" className="h-12 w-12" loading={eager ? 'eager' : 'lazy'} />
          </div>
        )}

        <div className="order-last min-w-0 flex-1">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <a href={detailsHref} className="min-w-0 break-words text-lg font-bold text-gray-900 hover:text-green-600">
              {clinic.name}
            </a>
            {statusLabel && (
              <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-1 text-xs font-semibold text-white ${clinic.isAlwaysOpen ? 'bg-green-600' : 'bg-blue-600'}`}>
                <Clock className="mr-1 h-3 w-3" aria-hidden="true" />
                {statusLabel}
              </span>
            )}
            {isVerified && (
              <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700" title="Scheda reclamata e verificata da Veterinari.org">
                Veterinario Verificato
              </span>
            )}
          </div>

          {cityLabel(clinic) && <p className="mt-1 text-sm font-semibold text-green-700">{cityLabel(clinic)}</p>}
          {clinic.address && <p className="mt-1 break-words text-sm text-gray-600">{clinic.address}</p>}

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {matchBadge && (
              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${matchBadge}`}>
                {clinic.queryMatch.label}
              </span>
            )}
            {rating && (
              <span className="inline-flex items-center">
                <Star className="mr-1 h-4 w-4 fill-current text-yellow-400" aria-hidden="true" />
                <strong>{rating}</strong>
                {clinic.reviewsValue !== null && <span className="ml-1 text-gray-500">({clinic.reviewsValue})</span>}
              </span>
            )}
            {clinic.distance !== null && <span className="text-gray-600">A circa <strong>{clinic.distance.toFixed(1)} km</strong></span>}
            {clinic.todaysSlots?.length > 0 && <span className="font-semibold text-green-600">Oggi: {clinic.todaysSlots.join(', ')}</span>}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {telHref ? (
              <a href={telHref} className="inline-flex h-10 items-center justify-center rounded-md bg-green-600 px-3 text-sm font-semibold text-white hover:bg-green-700">
                <Phone className="mr-1 h-4 w-4" aria-hidden="true" />
                Chiama
              </a>
            ) : (
              <a href={detailsHref} className="inline-flex h-10 items-center justify-center rounded-md bg-green-600 px-3 text-sm font-semibold text-white hover:bg-green-700">
                Dettagli
              </a>
            )}
            <a href={detailsHref} className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              Dettagli
            </a>
            {mapsHref ? (
              <a href={mapsHref} data-clinic-id={clinic.id} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center justify-center rounded-md border border-gray-300 px-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                <Route className="mr-1 h-4 w-4" aria-hidden="true" />
                Portami lì
              </a>
            ) : (
              <span />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
