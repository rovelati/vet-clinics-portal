import type { APIRoute } from 'astro';
import { siteConfig } from '@/config/site';
import { getIntegratoreSlugs } from '@/lib/integratori';
import { supabasePublicServer } from '@/lib/supabase';
import {
  canonicalH24CityPath,
  canonicalVeterinariCityPath,
  canonicalVeterinariProvincePath,
  canonicalVeterinariRegionPath,
  provinceSlug,
  slugifyLocation,
} from '@/lib/seo-urls';

const XML_HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=3600',
};

export function cleanText(value: unknown) {
  return typeof value === 'string' ? value.replace(/"/g, '').trim() : '';
}

export function slugify(value: unknown) {
  return cleanText(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function absolute(path: string) {
  return new URL(path, siteConfig.url).toString();
}

export function xmlResponse(body: string, init?: ResponseInit) {
  return new Response(body, {
    ...init,
    headers: {
      ...XML_HEADERS,
      ...(init?.headers || {}),
    },
  });
}

export const sitemapHead: APIRoute = async () => xmlResponse('', { status: 200 });

export function sitemapIndex(paths: string[]) {
  const now = new Date().toISOString();
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((path) => `  <sitemap>
    <loc>${escapeXml(absolute(path))}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;
  return xmlResponse(body);
}

export function urlset(paths: string[], options: { changefreq?: string; priority?: string } = {}) {
  const now = new Date().toISOString();
  const uniquePaths = Array.from(new Set(paths)).filter(Boolean).sort((a, b) => a.localeCompare(b, 'it'));
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniquePaths.map((path) => `  <url>
    <loc>${escapeXml(absolute(path))}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${options.changefreq || 'weekly'}</changefreq>
    <priority>${options.priority || '0.6'}</priority>
  </url>`).join('\n')}
</urlset>`;
  return xmlResponse(body);
}

export async function loadAllRows(table: string, select: string, configure?: (query: any) => any) {
  if (!supabasePublicServer) return [];

  const rows: any[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    let query = supabasePublicServer.from(table).select(select).range(from, from + pageSize - 1);
    if (configure) query = configure(query);
    const { data, error } = await query;
    if (error) {
      console.error(`Errore generazione sitemap ${table}:`, error.message);
      return rows;
    }
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

export async function loadServiceSlugs() {
  const rows = await loadAllRows('services_taxonomy', 'name, allow_price', (query) => query.neq('allow_price', false));
  return Array.from(new Set(rows.map((service) => slugify(service.name)).filter(Boolean)));
}

export async function loadClinicRows() {
  return loadAllRows(
    'clinics',
    'slug, raw_import, pronto_soccorso_h24, hours',
    (query) => query.eq('status', 'pubblicata').not('slug', 'is', null)
  );
}

export function clinicDetailPaths(clinics: any[]) {
  return clinics.map((clinic) => cleanText(clinic.slug)).filter(Boolean).map((slug) => `/veterinari/${slug}`);
}

export function locationSets(clinics: any[]) {
  const cities = new Map<string, { city: string; province: string }>();
  const provinces = new Set<string>();
  const regions = new Set<string>();

  clinics.forEach((clinic) => {
    const city = cleanText(clinic.raw_import?.city);
    const province = cleanText(clinic.raw_import?.province).toUpperCase();
    const region = cleanText(clinic.raw_import?.region);
    if (city && province) cities.set(`${city.toLowerCase()}|${province}`, { city, province });
    if (province) provinces.add(province);
    if (region) regions.add(region);
  });

  return { cities: Array.from(cities.values()), provinces: Array.from(provinces), regions: Array.from(regions) };
}

export function veterinarianLocationPaths(clinics: any[]) {
  const { cities, provinces, regions } = locationSets(clinics);
  return [
    ...cities.map(({ city, province }) => canonicalVeterinariCityPath(city, province)),
    ...provinces.map((province) => canonicalVeterinariProvincePath(province)),
    ...regions.map((region) => canonicalVeterinariRegionPath(region)),
  ];
}

export function h24Paths(clinics: any[]) {
  const { cities } = locationSets(clinics);
  return ['/veterinari-h24', ...Array.from(cities.values()).map(({ city, province }) => canonicalH24CityPath(city, province))];
}

export function quantoCostaPaths(serviceSlugs: string[]) {
  return [
    '/quanto-costa',
    ...serviceSlugs.flatMap((slug) => [`/quanto-costa/${slug}`, `/quanto-costa/${slug}/cliniche`]),
  ];
}

export function quantoCostaListingPaths(serviceSlugs: string[], clinics: any[]) {
  const { cities } = locationSets(clinics);
  return cities.flatMap(({ city, province }) => {
    const location = `${slugifyLocation(city)}-${provinceSlug(province)}`;
    return serviceSlugs.map((serviceSlug) => `/quanto-costa/${location}/${serviceSlug}/cliniche`);
  });
}

export function integratoriPaths() {
  return ['/integratori', ...getIntegratoreSlugs().map((slug) => `/integratori/${slug}`)];
}
