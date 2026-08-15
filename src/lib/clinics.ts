import { supabasePublicServer } from '@/lib/supabase';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export interface ClinicSummary {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  slug: string | null;
  rating_avg_cached: number | null;
  rating_count_cached: number | null;
  owner_id?: string | null;
  claimed_at?: string | null;
  lat?: number | string | null;
  lng?: number | string | null;
  hours?: Record<string, unknown> | null;
  created_at?: string | null;
  raw_import: {
    city?: string;
    province?: string;
    region?: string;
    tags?: string[];
    flags?: string[];
  } | null;
  gallery_images: string[] | null;
}

const clinicSelect = `
  id, name, address, phone, slug,
  rating_avg_cached, rating_count_cached,
  lat, lng, hours, raw_import, gallery_images, created_at, owner_id, claimed_at
`;

function cleanSearchTerm(value: string) {
  return value.trim().replace(/[%,]/g, ' ').replace(/\s+/g, ' ');
}

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

const RATING_PRIOR_AVERAGE = 4.64;
const RATING_PRIOR_WEIGHT = 20;

function reliableRatingScore(clinic: ClinicSummary) {
  const rating = toNumber(clinic.rating_avg_cached);
  const reviewCount = Math.max(0, toNumber(clinic.rating_count_cached) ?? 0);
  if (rating === null || reviewCount === 0) return Number.NEGATIVE_INFINITY;

  return (
    (reviewCount * rating + RATING_PRIOR_WEIGHT * RATING_PRIOR_AVERAGE) /
    (reviewCount + RATING_PRIOR_WEIGHT)
  );
}

function rankClinicsByReliableRating(clinics: ClinicSummary[]) {
  return [...clinics].sort((a, b) => {
    const scoreDifference = reliableRatingScore(b) - reliableRatingScore(a);
    if (scoreDifference !== 0) return scoreDifference;
    return (toNumber(b.rating_count_cached) ?? 0) - (toNumber(a.rating_count_cached) ?? 0);
  });
}

function distanceKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const radius = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return radius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export async function getFeaturedClinics(limit = 6): Promise<ClinicSummary[]> {
  if (!supabasePublicServer) return [];

  const { data, error } = await supabasePublicServer
    .from('clinics')
    .select(clinicSelect)
    .eq('status', 'pubblicata')
    .not('slug', 'is', null)
    .order('rating_avg_cached', { ascending: false, nullsFirst: false })
    .order('rating_count_cached', { ascending: false, nullsFirst: false })
    .limit(Math.max(limit * 10, 60));

  if (error) {
    console.error('Errore caricamento cliniche in evidenza:', error.message);
    return [];
  }

  return rankClinicsByReliableRating((data ?? []) as ClinicSummary[]).slice(0, limit);
}

export async function getNearbyClinicsFromVisitor({
  city,
  province,
  lat,
  lng,
  limit = 6,
}: {
  city?: string;
  province?: string;
  lat?: number | null;
  lng?: number | null;
  limit?: number;
}): Promise<ClinicSummary[]> {
  if (!supabasePublicServer) return [];

  const cityTerm = cleanSearchTerm(city ?? '');
  const provinceTerm = cleanSearchTerm(province ?? '').toUpperCase();

  if (cityTerm || provinceTerm) {
    let request = supabasePublicServer
      .from('clinics')
      .select(clinicSelect)
      .eq('status', 'pubblicata')
      .not('slug', 'is', null)
      .limit(Math.max(limit * 10, 60));

    const filters = [];
    if (cityTerm) filters.push(`raw_import->>city.ilike.%${cityTerm}%`);
    if (provinceTerm) filters.push(`raw_import->>province.ilike.%${provinceTerm}%`);
    request = request.or(filters.join(','));

    request = request
      .order('rating_avg_cached', { ascending: false, nullsFirst: false })
      .order('rating_count_cached', { ascending: false, nullsFirst: false });

    const { data, error } = await request;
    if (error) {
      console.error('Errore caricamento cliniche vicino al visitatore:', error.message);
      return [];
    }
    if (data?.length) {
      return rankClinicsByReliableRating(data as ClinicSummary[]).slice(0, limit);
    }
  }

  if (lat !== null && lng !== null && lat !== undefined && lng !== undefined) {
    const { data, error } = await supabasePublicServer
      .from('clinics')
      .select(clinicSelect)
      .eq('status', 'pubblicata')
      .not('slug', 'is', null)
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .limit(1200);

    if (error) {
      console.error('Errore caricamento cliniche per coordinate visitatore:', error.message);
      return [];
    }

    return ((data ?? []) as ClinicSummary[])
      .map((clinic) => ({
        clinic,
        distance: distanceKm({ lat, lng }, { lat: toNumber(clinic.lat) ?? 0, lng: toNumber(clinic.lng) ?? 0 }),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)
      .map((item) => item.clinic);
  }

  return [];
}

export async function searchClinics({
  query,
  location,
  limit = 24,
}: {
  query?: string;
  location?: string;
  limit?: number;
}): Promise<ClinicSummary[]> {
  if (!supabasePublicServer) return [];

  const searchTerm = cleanSearchTerm(query ?? '');
  const locationTerm = cleanSearchTerm(location ?? '');

  let request = supabasePublicServer
    .from('clinics')
    .select(clinicSelect)
    .in('status', ['pubblicata', 'in_revisione'])
    .not('slug', 'is', null)
    .limit(limit);

  if (locationTerm) {
    request = request.or(
      `raw_import->>city.ilike.%${locationTerm}%,raw_import->>province.ilike.%${locationTerm}%`
    );
  } else if (searchTerm) {
    request = request.or(
      `name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,raw_import->>city.ilike.%${searchTerm}%`
    );
  }

  request = request
    .order('rating_avg_cached', { ascending: false, nullsFirst: false })
    .order('rating_count_cached', { ascending: false, nullsFirst: false });

  const { data, error } = await request;

  if (error) {
    console.error('Errore ricerca cliniche:', error.message);
    return [];
  }

  return (data ?? []) as ClinicSummary[];
}

export function clinicCityLabel(clinic: ClinicSummary) {
  const city = clinic.raw_import?.city?.replace(/"/g, '').trim();
  const province = clinic.raw_import?.province?.replace(/"/g, '').trim();
  if (city && province) return `${city}, ${province}`;
  return city || province || null;
}

export function selectBestClinicImage(images: unknown, fallback = '/favicon.svg') {
  if (!Array.isArray(images)) return fallback;

  const candidates = images
    .filter((image): image is string => typeof image === 'string' && /^(https?:\/\/|\/media\/gallery\/clinics\/)/i.test(image))
    .map((image, index) => {
      const lower = image.toLowerCase();
      let score = 0;
      const localPath = clinicMediaLocalPath(image);

      if (/maps\.googleapis\.com\/maps\/api\/streetview/i.test(lower)) score -= 100;
      if (/lh3\.googleusercontent\.com\/places\//i.test(lower)) score += 12;
      else if (/googleusercontent|googleapis\.com/i.test(lower)) score -= 60;
      if (/baumicio\.it\/media\/gallery\/clinics|veterinari\.org\/media\/gallery\/clinics/i.test(lower)) score += 35;
      if (lower.startsWith('/media/gallery/clinics/')) score += 35;
      if (localPath) score += existsSync(localPath) ? 70 : -120;
      if (/\.(jpe?g|webp)(\?|$)/i.test(lower)) score += 18;
      if (/\.(png|gif)(\?|$)/i.test(lower)) score += 5;
      if (/\.(svg|ico)(\?|$)/i.test(lower)) score -= 30;
      if (/_web_/i.test(lower)) score += 4;
      if (/_migrated_|_og/i.test(lower)) score += 10;
      if (/whatsapp|wa\.me|facebook|instagram|logo|icon|favicon|placeholder/i.test(lower)) score -= 80;
      if (localPath && !isUsableClinicPhoto(localPath)) score -= 160;

      return { image, score, index };
    })
    .filter((candidate) => candidate.score >= 0)
    .sort((a, b) => (b.score - a.score) || (a.index - b.index));

  return localizeClinicImage(candidates[0]?.image) || fallback;
}

export function clinicImage(clinic: ClinicSummary) {
  return selectBestClinicImage(clinic.gallery_images);
}

function localizeClinicImage(image: string | undefined) {
  if (!image) return '';
  return image.replace(/^https?:\/\/(?:www\.)?(?:baumicio\.it|veterinari\.org)\/media\/gallery\/clinics\//i, '/media/gallery/clinics/');
}

function clinicMediaLocalPath(image: string) {
  const localUrl = localizeClinicImage(image);
  if (!localUrl.startsWith('/media/gallery/clinics/')) return null;
  const relativePath = decodeURIComponent(localUrl.replace(/^\//, '').split('?')[0]);
  return join(process.cwd(), 'public', relativePath);
}

function isUsableClinicPhoto(path: string) {
  try {
    const stat = statSync(path);
    if (stat.size < 8_000) return false;

    const dimensions = readImageDimensions(path);
    if (!dimensions) return true;

    const { width, height } = dimensions;
    return width >= 300 && height >= 180 && width * height >= 100_000;
  } catch {
    return false;
  }
}

function readImageDimensions(path: string) {
  const buffer = readFileSync(path);
  if (buffer.length < 32) return null;

  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  if (buffer.subarray(0, 3).toString('ascii') === 'GIF') {
    return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
  }

  if (buffer.subarray(0, 2).equals(Buffer.from([0xff, 0xd8]))) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
      }
      offset += 2 + length;
    }
  }

  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
    const chunk = buffer.subarray(12, 16).toString('ascii');
    if (chunk === 'VP8X' && buffer.length >= 30) {
      return {
        width: 1 + buffer.readUIntLE(24, 3),
        height: 1 + buffer.readUIntLE(27, 3),
      };
    }
    if (chunk === 'VP8 ' && buffer.length >= 30) {
      return {
        width: buffer.readUInt16LE(26) & 0x3fff,
        height: buffer.readUInt16LE(28) & 0x3fff,
      };
    }
    if (chunk === 'VP8L' && buffer.length >= 25) {
      const bits = buffer.readUInt32LE(21);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
      };
    }
  }

  return null;
}
