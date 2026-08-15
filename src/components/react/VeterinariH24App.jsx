import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Clock,
  MapPin,
  Navigation,
  Phone,
  Search,
  Star,
} from 'lucide-react';

const dayNames = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
const fallbackImage = '/favicon.svg';
const resultLimit = 7;
const maxNearbyDistanceKm = 100;
const clinicSelect = 'id, name, address, phone, slug, rating_avg_cached, rating_count_cached, lat, lng, hours, raw_import, gallery_images, created_at';

function selectBestClinicImage(images, fallback = fallbackImage) {
  if (!Array.isArray(images)) return fallback;

  const candidates = images
    .filter((image) => typeof image === 'string' && /^(https?:\/\/|\/media\/gallery\/clinics\/)/i.test(image))
    .map((image, index) => {
      const lower = image.toLowerCase();
      let score = 0;
      if (/maps\.googleapis\.com\/maps\/api\/streetview/i.test(lower)) score -= 100;
      if (/googleusercontent|googleapis\.com/i.test(lower)) score -= 40;
      if (/baumicio\.it\/media\/gallery\/clinics|veterinari\.org\/media\/gallery\/clinics/i.test(lower)) score += 35;
      if (lower.startsWith('/media/gallery/clinics/')) score += 45;
      if (/\.(jpe?g|webp)(\?|$)/i.test(lower)) score += 12;
      if (/\.(png|gif)(\?|$)/i.test(lower)) score += 5;
      if (/\.(svg|ico)(\?|$)/i.test(lower)) score -= 30;
      if (/_web_/i.test(lower)) score += 4;
      if (/_migrated_|_og/i.test(lower)) score += 8;
      if (/whatsapp|wa\.me|facebook|instagram|logo|icon|favicon|placeholder/i.test(lower)) score -= 80;
      const normalizedImage = image.replace(/^https?:\/\/(?:www\.)?(?:baumicio\.it|veterinari\.org)\/media\/gallery\/clinics\//i, '/media/gallery/clinics/');
      return { image: normalizedImage, score, index };
    })
    .filter((candidate) => candidate.score >= 0)
    .sort((a, b) => (b.score - a.score) || (a.index - b.index));

  return candidates[0]?.image || fallback;
}

function cleanText(value) {
  return typeof value === 'string' ? value.replace(/"/g, '').trim() : '';
}

function slugify(value) {
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

function cleanSearchTerm(value) {
  return cleanText(value).replace(/[%,]/g, ' ').replace(/\s+/g, ' ');
}

function parseCityPart(value) {
  const cityPart = cleanText(value);
  if (!cityPart) return { city: null, province: null, type: null };

  const match = cityPart.match(/^(.+)-([a-z]{2})$/i);
  if (match) {
    return {
      city: match[1].split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      province: match[2].toUpperCase(),
      type: 'city',
    };
  }

  if (/^[a-z]{2}$/i.test(cityPart)) {
    return { city: null, province: cityPart.toUpperCase(), type: 'province' };
  }

  return {
    city: cityPart.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    province: null,
    type: 'city',
  };
}

function generateH24Permalink({ city, province }) {
  if (!city) return '/veterinari-h24';
  return province && province.length === 2
    ? `/veterinari-h24/${province.toLowerCase()}/${slugify(city)}`
    : `/veterinari-h24/${slugify(city)}`;
}

function normalizeMinutes(timeString) {
  if (!timeString) return null;
  const [hours, minutes = '0'] = String(timeString).split(':').map((part) => parseInt(part, 10));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (hours === 24 && minutes === 0) return 24 * 60;
  return Math.max(0, Math.min(24 * 60, hours * 60 + minutes));
}

function slotCoversFullDay(slot) {
  if (typeof slot !== 'string') return false;
  const trimmed = slot.trim();
  if (/^h24$/i.test(trimmed) || /^24h$/i.test(trimmed) || /aperto\s*(24|h24)/i.test(trimmed)) return true;
  if (/(^|\s)00:00\s*[-–—]\s*(24:00|23:59|00:00)/.test(trimmed)) return true;
  const parts = trimmed.split(/[-–—]/).map((part) => part.trim());
  if (parts.length < 2) return false;
  const [start, end] = parts;
  return start === '00:00' && ['24:00', '23:59', '00:00'].includes(end);
}

function normalizeDaySlots(value) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string' && value.trim()) return [value];
  return [];
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
    if (startMinutes === endMinutes && ['00:00', '24:00'].includes(endRaw)) return true;
    if (endMinutes <= startMinutes) return nowMinutes >= startMinutes || nowMinutes < endMinutes;
    if (startMinutes === 0 && endMinutes >= 24 * 60 - 1) return true;
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
    verified: true,
  };
}

async function reverseGeocode(lat, lng) {
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=it`);
  if (!response.ok) return null;
  const data = await response.json();
  const address = data.address || {};
  const city = address.city || address.town || address.village || address.municipality || '';
  const region = address.state || address.region || '';
  const provinceFromIso = address['ISO3166-2-lvl6']?.startsWith('IT-') ? address['ISO3166-2-lvl6'].slice(3).toUpperCase() : null;
  return {
    lat,
    lng,
    display_name: [city, region, 'Italia'].filter(Boolean).join(', ') || data.display_name,
    cityName: city,
    province: provinceFromIso,
    verified: false,
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

function buildClinicsWithMeta(clinics, { searchLocation, userLocation, locationParam }) {
  const withMeta = clinics
    .map((clinic) => {
      const ratingValue = clinic.rating_avg_cached == null ? null : Number(clinic.rating_avg_cached);
      const reviewsValue = clinic.rating_count_cached == null ? null : Number(clinic.rating_count_cached);
      const lat = clinic.lat == null ? null : Number(clinic.lat);
      const lng = clinic.lng == null ? null : Number(clinic.lng);
      return {
        ...clinic,
        ...computeOpenStatus(clinic),
        ratingValue: Number.isFinite(ratingValue) ? ratingValue : null,
        reviewsValue: Number.isFinite(reviewsValue) ? reviewsValue : null,
        lat: Number.isFinite(lat) ? lat : null,
        lng: Number.isFinite(lng) ? lng : null,
      };
    })
    .filter((clinic) => clinic.isAlwaysOpen || clinic.isOpenNow);

  const refLocation = searchLocation || userLocation || null;
  let locationCity = searchLocation?.cityName || searchLocation?.display_name?.split(',')[0] || '';
  let locationProvince = searchLocation?.province || '';

  if (locationParam && !searchLocation) {
    const parsed = parseCityPart(locationParam);
    locationCity = parsed.city || '';
    locationProvince = parsed.province || '';
  }

  let filtered = withMeta;
  if (refLocation) {
    const withDistance = withMeta
      .map((clinic) => ({
        ...clinic,
        distance: clinic.lat !== null && clinic.lng !== null
          ? haversineDistance(refLocation, { lat: clinic.lat, lng: clinic.lng })
          : null,
      }))
      .filter((clinic) => clinic.distance !== null);

    const included = new Set();
    const exactCity = locationCity
      ? withDistance.filter((clinic) => {
        const clinicCity = cleanText(clinic.raw_import?.city).toLowerCase();
        const searchCity = cleanText(locationCity).toLowerCase();
        if (!clinicCity || !searchCity) return false;
        return clinicCity === searchCity || clinicCity.includes(searchCity) || searchCity.includes(clinicCity);
      })
      : [];
    exactCity.sort((a, b) => a.distance - b.distance).forEach((clinic) => included.add(clinic.id));
    filtered = [...exactCity];

    let radius = 10;
    while (filtered.length < resultLimit && radius <= maxNearbyDistanceKm) {
      const nearby = withDistance
        .filter((clinic) => !included.has(clinic.id) && clinic.distance <= radius)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, resultLimit - filtered.length);
      nearby.forEach((clinic) => included.add(clinic.id));
      filtered = [...filtered, ...nearby];
      radius += 10;
    }

    if (filtered.length < resultLimit && locationProvince) {
      const province = withDistance
        .filter((clinic) => (
          !included.has(clinic.id)
          && clinic.distance <= maxNearbyDistanceKm
          && cleanText(clinic.raw_import?.province).toUpperCase() === locationProvince
        ))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, resultLimit - filtered.length);
      filtered = [...filtered, ...province];
    }
  } else {
    filtered = withMeta.map((clinic) => ({
      ...clinic,
      distance: userLocation && clinic.lat !== null && clinic.lng !== null
        ? haversineDistance(userLocation, { lat: clinic.lat, lng: clinic.lng })
        : null,
    }));
  }

  return filtered.sort((a, b) => {
    if (a.isAlwaysOpen !== b.isAlwaysOpen) return a.isAlwaysOpen ? -1 : 1;
    if (a.distance !== null && b.distance !== null && Math.abs(a.distance - b.distance) > 0.1) return a.distance - b.distance;
    if ((a.ratingValue ?? 0) !== (b.ratingValue ?? 0)) return (b.ratingValue ?? 0) - (a.ratingValue ?? 0);
    return (b.reviewsValue ?? 0) - (a.reviewsValue ?? 0);
  });
}

function saveSearchLocation(location) {
  if (!location?.lat || !location?.lng) return;
  const cityName = cleanText(location.cityName || location.city || location.display_name?.split(',')?.[0] || '');
  const payload = {
    ...location,
    cityName,
    city: cityName,
    province: cleanText(location.province || ''),
    label: cityName,
    timestamp: Date.now(),
  };
  localStorage.setItem('lastSearchLocation', JSON.stringify(payload));
  document.cookie = `vet_last_location=${encodeURIComponent(JSON.stringify(payload))}; Max-Age=${30 * 24 * 60 * 60}; Path=/; SameSite=Lax`;
}

function loadSearchLocation() {
  try {
    const saved = JSON.parse(localStorage.getItem('lastSearchLocation') || 'null');
    if (!saved) return null;
    if (saved.timestamp && Date.now() - saved.timestamp > 7 * 24 * 60 * 60 * 1000) return null;
    return saved;
  } catch {
    return null;
  }
}

function hideGeoIpOpenNowBanner() {
  document.getElementById('geoip-open-now-banner')?.classList.add('hidden');
}

function H24Map({ clinics, searchLocation, userLocation }) {
  const [leaflet, setLeaflet] = useState(null);
  const points = clinics.filter((clinic) => clinic.lat !== null && clinic.lng !== null).slice(0, resultLimit);
  const hasFocusedLocation = Boolean(searchLocation || userLocation);
  const center = searchLocation
    ? [searchLocation.lat, searchLocation.lng]
    : userLocation
      ? [userLocation.lat, userLocation.lng]
      : points[0]
        ? [points[0].lat, points[0].lng]
        : [41.9027835, 12.4963655];
  const zoom = hasFocusedLocation ? 13 : 6;
  const mapKey = `${Number(center[0]).toFixed(4)}-${Number(center[1]).toFixed(4)}-${zoom}`;
  const visibleClinicPoints = points;
  const boundsPositions = [
    ...(hasFocusedLocation ? [center] : []),
    ...visibleClinicPoints.map((clinic) => [clinic.lat, clinic.lng]),
  ];

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
        title="Mappa veterinari H24"
        src={openStreetMapEmbedUrl(lat, lng, zoom)}
        className="h-full w-full rounded-lg border-0 shadow-lg"
        loading="lazy"
      />
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, L, useMap } = leaflet;
  function FitMapBounds({ positions, minZoom, maxZoom }) {
    const map = useMap();
    const positionsKey = positions.map((position) => `${Number(position[0]).toFixed(5)},${Number(position[1]).toFixed(5)}`).join('|');

    useEffect(() => {
      const frame = window.requestAnimationFrame(() => {
        const validPositions = positions
          .map(([lat, lng]) => [Number(lat), Number(lng)])
          .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));
        if (!validPositions.length) return;

        map.invalidateSize({ animate: false, pan: false });
        if (validPositions.length === 1) {
          map.setView(validPositions[0], Math.max(zoom, minZoom));
          return;
        }

        map.fitBounds(validPositions, {
          padding: [42, 42],
          maxZoom,
        });
        if (map.getZoom() < minZoom) map.setZoom(minZoom);
      });

      return () => window.cancelAnimationFrame(frame);
    }, [map, positionsKey, minZoom, maxZoom]);

    return null;
  }
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
      <FitMapBounds
        positions={boundsPositions.length ? boundsPositions : [center]}
        minZoom={userLocation ? 12 : hasFocusedLocation ? 11 : 5}
        maxZoom={hasFocusedLocation ? 14 : 13}
      />
      {hasFocusedLocation && (
        <Marker position={center} icon={redIcon}>
          <Popup>{userLocation ? 'La tua posizione' : 'Zona di ricerca'}</Popup>
        </Marker>
      )}
      {visibleClinicPoints.map((clinic) => (
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

function H24IntentSummary({ city }) {
  if (!city) return null;
  return (
    <section className="rounded-lg border border-red-100 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-sm font-bold uppercase tracking-wide text-red-700">Hai cercato veterinari H24 a {city}</p>
      <p className="mt-1 text-sm leading-6 text-gray-600">
        La mappa ti aiuta a capire dove si trovano le strutture. Nel listato trovi telefono, dettagli e indicazioni per contattare rapidamente un veterinario aperto.
      </p>
    </section>
  );
}

export default function VeterinariH24App({ initialClinics = [], initialLocationParam = '', initialLocationLabel = '' }) {
  const [clinics, setClinics] = useState(initialClinics);
  const [locationDraft, setLocationDraft] = useState('');
  const [searchLocation, setSearchLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [ipLocation, setIpLocation] = useState(null);
  const [isNearMe, setIsNearMe] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLoadingClinics, setIsLoadingClinics] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [hasSearched, setHasSearched] = useState(Boolean(initialLocationParam));
  const [error, setError] = useState('');
  const resultsRef = useRef(null);

  const scrollToResults = () => {
    window.setTimeout(() => {
      const target = resultsRef.current;
      if (!target) return;
      const headerOffset = window.matchMedia('(min-width: 1024px)').matches ? 92 : 74;
      const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }, 120);
  };

  const loadClinicsForLocation = async (location) => {
    setIsLoadingClinics(true);
    setError('');

    try {
      const cityTerm = cleanSearchTerm(location?.cityName || location?.display_name?.split(',')[0] || '');
      const provinceTerm = cleanSearchTerm(location?.province || '');
      const params = new URLSearchParams();
      if (cityTerm) params.set('city', cityTerm);
      if (provinceTerm) params.set('province', provinceTerm);
      const response = await fetch(`/api/h24-clinics?${params.toString()}`);
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Impossibile caricare i veterinari H24.');
      setClinics(payload.clinics ?? []);
    } catch (err) {
      setClinics([]);
      setError(err?.message || 'Impossibile caricare i veterinari H24.');
    } finally {
      setIsLoadingClinics(false);
    }
  };

  useEffect(() => {
    const boot = async () => {
      if (initialLocationParam) {
        const parsed = parseCityPart(initialLocationParam);
        const query = parsed.city && parsed.province ? `${parsed.city}, ${parsed.province}` : parsed.city || parsed.province || '';
        setLocationDraft(query);
        const location = await geocodeLocation(query);
        if (location) {
          hideGeoIpOpenNowBanner();
          setSearchLocation(location);
          setHasSearched(true);
          await loadClinicsForLocation(location);
        }
        return;
      }
      const ip = await getLocationFromIP();
      if (ip) setIpLocation(ip);
    };
    boot();
  }, [initialLocationParam]);

  const filteredClinics = useMemo(
    () => buildClinicsWithMeta(clinics, { searchLocation, userLocation: isNearMe ? userLocation : null, locationParam: initialLocationParam }),
    [clinics, searchLocation, userLocation, isNearMe, initialLocationParam]
  );
  const displayClinics = hasSearched ? filteredClinics.slice(0, resultLimit) : [];
  const intentCityLabel = (
    searchLocation?.cityName
    || userLocation?.cityName
    || initialLocationLabel.split(',')[0]
    || locationDraft.split(',')[0]
    || ''
  ).trim();
  const hasLocationIntent = Boolean(intentCityLabel);

  const search = async () => {
    const query = locationDraft.trim();
    if (!query && ipLocation) {
      hideGeoIpOpenNowBanner();
      setSearchLocation(ipLocation);
      setLocationDraft(ipLocation.display_name?.split(',')[0] || '');
      setIsNearMe(false);
      setHasSearched(true);
      await loadClinicsForLocation(ipLocation);
      scrollToResults();
      return;
    }
    if (!query) {
      setSearchLocation(null);
      setUserLocation(null);
      setClinics([]);
      setHasSearched(false);
      window.history.pushState({}, '', '/veterinari-h24');
      return;
    }
    setIsGeocoding(true);
    setError('');
    try {
      const location = await geocodeLocation(query);
      if (!location) {
        setError(`Non è stato possibile trovare "${query}".`);
        return;
      }
      hideGeoIpOpenNowBanner();
      setSearchLocation(location);
      setIsNearMe(false);
      setHasSearched(true);
      saveSearchLocation(location);
      const cityName = location.cityName || location.display_name?.split(',')[0] || query;
      setLocationDraft(cityName);
      window.history.pushState({}, '', generateH24Permalink({ city: cityName, province: location.province }));
      await loadClinicsForLocation(location);
      scrollToResults();
    } finally {
      setIsGeocoding(false);
    }
  };

  const locateMe = () => {
    setError('');
    if (!navigator.geolocation) {
      setError('Geolocalizzazione non supportata.');
      return;
    }
    const next = !isNearMe;
    setIsNearMe(next);
    if (!next) {
      setUserLocation(null);
      setClinics([]);
      setHasSearched(false);
      return;
    }
    setSearchLocation(null);
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const location = await reverseGeocode(lat, lng) || { lat, lng, display_name: `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
        hideGeoIpOpenNowBanner();
        setUserLocation(location);
        setLocationDraft(location.display_name?.split(',')[0] || '');
        setHasSearched(true);
        saveSearchLocation({ ...location, source: 'gps' });
        setIsDetectingLocation(false);
        await loadClinicsForLocation(location);
        scrollToResults();
      },
      () => {
        setIsNearMe(false);
        setIsDetectingLocation(false);
        setError('Consenti la posizione o inserisci una città manualmente.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-gray-50">
      <section className="overflow-hidden bg-gradient-to-r from-red-600 to-orange-600 py-12 text-white">
        <div className="mx-auto max-w-7xl min-w-0 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="mx-auto mb-4 max-w-5xl break-words text-2xl font-bold leading-tight sm:text-4xl md:text-5xl">
              {hasLocationIntent ? `Pronto soccorso veterinario H24 a ${intentCityLabel}` : 'Pronto soccorso veterinario H24 e aperto ora vicino a te'}
            </h1>
            <p className="mx-auto mb-8 max-w-3xl break-words text-base text-red-100 sm:text-xl">
              {hasLocationIntent
                ? 'Controlla cliniche, ambulatori e strutture per urgenze animali con telefono, disponibilita e indicazioni.'
                : 'Cerca il veterinario disponibile in questo momento nella tua zona: pronto soccorso, aperto ora, di turno o H24.'}
            </p>

            <div className="glass-effect mx-auto max-w-3xl min-w-0 rounded-lg border border-white/20 p-4 sm:p-5">
              <button
                type="button"
                onClick={locateMe}
                disabled={isDetectingLocation}
                className={`mb-3 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-base font-bold shadow-sm transition disabled:opacity-70 ${
                  isNearMe
                    ? 'bg-white text-green-700 ring-2 ring-green-200'
                    : 'bg-white text-red-700 hover:bg-red-50'
                }`}
              >
                <Navigation className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>{isDetectingLocation ? 'Rilevo la tua posizione...' : 'Trova pronto soccorso veterinario vicino a me'}</span>
              </button>
              <p className="mb-4 text-center text-xs font-medium text-red-50">
                Usa la posizione reale del telefono per vedere chi e aperto ora nelle vicinanze.
              </p>

              <div className="relative grid gap-2 sm:block">
                <MapPin className="absolute left-3 top-6 h-5 w-5 -translate-y-1/2 text-gray-400 sm:top-1/2" aria-hidden="true" />
                <input
                  value={locationDraft}
                  onChange={(event) => setLocationDraft(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && search()}
                  disabled={isGeocoding}
                  placeholder={ipLocation ? `Dove? Es. ${ipLocation.display_name?.split(',')[0] || 'Roma'}...` : 'Dove? Es. Roma, Milano, Torino...'}
                  className="h-12 w-full min-w-0 rounded-md border-0 bg-white/90 pl-10 pr-3 text-black outline-none focus:ring-0 sm:pr-28"
                />
                <button
                  type="button"
                  onClick={search}
                  disabled={isGeocoding}
                  className="inline-flex h-10 w-full items-center justify-center rounded-md bg-green-600 px-4 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 sm:absolute sm:right-2 sm:top-1/2 sm:h-9 sm:w-auto sm:-translate-y-1/2"
                >
                  <Search className="mr-1 h-4 w-4" aria-hidden="true" />
                  {isGeocoding ? 'Verifica...' : 'Cerca'}
                </button>
              </div>

              {ipLocation && !searchLocation && !isNearMe && (
                <div className="mt-3 min-w-0 rounded bg-white/10 p-2 text-left text-xs text-red-100">
                  <span className="block break-words">Posizione automaticamente rilevata: <strong>{ipLocation.display_name}</strong></span>
                  <button type="button" className="mt-1 inline-flex underline sm:ml-2 sm:mt-0" onClick={async () => { hideGeoIpOpenNowBanner(); setSearchLocation(ipLocation); setIsNearMe(false); setHasSearched(true); setLocationDraft(ipLocation.display_name?.split(',')[0] || ''); saveSearchLocation({ ...ipLocation, source: 'ip-explicit' }); await loadClinicsForLocation(ipLocation); scrollToResults(); }}>
                    Usa questa
                  </button>
                </div>
              )}

              <div className="mt-3 flex min-w-0 flex-wrap items-center justify-center gap-3 text-sm">
                {error && <span className="min-w-0 break-words text-left text-xs text-red-100">{error}</span>}
              </div>
            </div>
            {hasSearched && (
              <button
                type="button"
                onClick={scrollToResults}
                className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-white/20"
              >
                <span>Risultati sotto</span>
                <span className="animate-bounce text-lg leading-none" aria-hidden="true">↓</span>
              </button>
            )}
          </div>
        </div>
      </section>

      <main ref={resultsRef} className="mx-auto max-w-7xl min-w-0 overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
        {!hasSearched ? (
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <Clock className="mb-3 h-6 w-6 text-red-600" aria-hidden="true" />
              <h2 className="text-lg font-bold text-gray-900">Emergenza veterinaria</h2>
              <p className="mt-2 text-sm text-gray-600">Cerca una località per vedere le strutture aperte ora, di turno o disponibili H24.</p>
            </div>
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <MapPin className="mb-3 h-6 w-6 text-red-600" aria-hidden="true" />
              <h2 className="text-lg font-bold text-gray-900">Risultati vicini</h2>
              <p className="mt-2 text-sm text-gray-600">Dopo la ricerca i risultati vengono ordinati per distanza, disponibilità e recensioni.</p>
            </div>
            <div className="rounded-lg bg-white p-5 shadow-sm">
              <Navigation className="mb-3 h-6 w-6 text-red-600" aria-hidden="true" />
              <h2 className="text-lg font-bold text-gray-900">Mappa essenziale</h2>
              <p className="mt-2 text-sm text-gray-600">La mappa mostra al massimo 7 strutture per restare leggibile anche da mobile.</p>
            </div>
          </section>
        ) : (
          <>
            <div className="mb-6 hidden lg:block">
              <H24IntentSummary city={intentCityLabel} />
            </div>
            <div className="flex flex-col gap-8 lg:flex-row">
              <aside className="h-96 w-full overflow-hidden rounded-lg lg:sticky lg:top-24 lg:h-[calc(100vh-200px)] lg:w-1/2">
                <H24Map clinics={displayClinics} searchLocation={searchLocation} userLocation={isNearMe ? userLocation : null} />
              </aside>

              <div className="lg:hidden">
                <H24IntentSummary city={intentCityLabel} />
              </div>

              <section className="min-w-0 w-full lg:w-1/2">
                <div className="space-y-4">
                  {isLoadingClinics && (
                    <div className="rounded-lg bg-white p-6 text-center text-gray-600 shadow-sm">
                      Cerco veterinari disponibili nella zona...
                    </div>
                  )}

                  {!isLoadingClinics && !displayClinics.length && (
                    <div className="rounded-lg border-2 border-dashed bg-white p-6 text-center text-gray-600">
                      Nessuna clinica H24 trovata. Inserisci una località o usa "Vicino a me".
                    </div>
                  )}

                  {!isLoadingClinics && displayClinics.map((clinic, index) => {
                    const rating = clinic.ratingValue !== null ? clinic.ratingValue.toFixed(1) : null;
                    const badge = clinic.isAlwaysOpen ? 'H24' : 'Aperto ora';
                    const badgeClass = clinic.isAlwaysOpen ? 'bg-green-600' : 'bg-red-500';
                    const image = selectBestClinicImage(clinic.gallery_images);
                    const hasPhoto = image !== fallbackImage;
                    return (
                      <article key={clinic.id} className="vet-card-hover min-w-0 overflow-hidden rounded-lg border-0 bg-white shadow-lg">
                        <div className="flex min-w-0 flex-col gap-4 p-4 sm:flex-row">
                          {hasPhoto ? (
                            <img
                              src={image}
                              alt={clinic.name}
                              className="h-40 w-full shrink-0 rounded-lg object-cover sm:h-24 sm:w-24"
                              loading={index === 0 ? 'eager' : 'lazy'}
                              onError={(event) => { event.currentTarget.src = fallbackImage; event.currentTarget.className = 'h-40 w-full shrink-0 rounded-lg bg-green-50 object-contain p-8 sm:h-24 sm:w-24'; }}
                            />
                          ) : (
                            <div className="flex h-40 w-full shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-100 to-blue-100 sm:h-24 sm:w-24">
                              <img src={fallbackImage} alt="" className="h-10 w-10" loading={index === 0 ? 'eager' : 'lazy'} />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:justify-between">
                              <a href={`/veterinari/${clinic.slug}`} className="min-w-0 break-words text-lg font-bold text-gray-900 hover:text-green-600 sm:line-clamp-2">
                                {clinic.name}
                              </a>
                              <span className={`${badgeClass} inline-flex shrink-0 items-center rounded-full px-2 py-1 text-xs font-semibold text-white`}>
                                <Clock className="mr-1 h-3 w-3" aria-hidden="true" />
                                {badge}
                              </span>
                            </div>
                            {clinic.address && <p className="mt-1 min-w-0 break-words text-sm text-gray-600">{clinic.address}</p>}
                            <div className="mt-2 flex min-w-0 flex-col items-start gap-2 text-sm sm:flex-row sm:flex-wrap sm:items-center">
                              {rating && (
                                <span className="inline-flex min-w-0 flex-wrap items-center">
                                  <Star className="mr-1 h-4 w-4 shrink-0 fill-current text-yellow-400" aria-hidden="true" />
                                  <strong>{rating}</strong>
                                  {clinic.reviewsValue !== null && <span className="ml-1 break-words text-gray-500">({clinic.reviewsValue} recensioni)</span>}
                                </span>
                              )}
                              {clinic.todaysSlots?.length > 0 && <span className="min-w-0 break-words font-semibold text-green-600">Oggi: {clinic.todaysSlots.join(', ')}</span>}
                            </div>
                            {(searchLocation || isNearMe) && clinic.distance !== null && (
                              <p className="mt-2 min-w-0 break-words text-xs text-gray-500">A circa <strong>{clinic.distance.toFixed(1)} km</strong> {isNearMe ? 'da te' : `da ${searchLocation?.display_name?.split(',')[0] || locationDraft}`}</p>
                            )}
                            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                              {clinic.phone ? (
                                <a href={`tel:${clinic.phone.replace(/\s/g, '')}`} data-clinic-id={clinic.id} className="inline-flex items-center justify-center rounded-md bg-green-600 px-2 py-2 text-sm font-semibold text-white hover:bg-green-700">
                                  <Phone className="mr-1 h-4 w-4" aria-hidden="true" />
                                  Chiama
                                </a>
                              ) : <span />}
                              <a href={`/veterinari/${clinic.slug}`} className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                                Dettagli
                              </a>
                              {clinic.lat !== null && clinic.lng !== null && (
                                <a href={directionsUrl(clinic.lat, clinic.lng)} data-clinic-id={clinic.id} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-md border border-gray-300 px-2 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                                  <Navigation className="mr-1 h-4 w-4" aria-hidden="true" />
                                  Portami lì
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
