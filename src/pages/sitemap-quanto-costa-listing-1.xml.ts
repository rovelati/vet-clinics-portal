import type { APIRoute } from 'astro';
import { loadClinicRows, loadServiceSlugs, quantoCostaListingPaths, sitemapHead, urlset } from '@/lib/sitemap';

const CHUNK_SIZE = 45000;

export const GET: APIRoute = async () => {
  const [serviceSlugs, clinics] = await Promise.all([loadServiceSlugs(), loadClinicRows()]);
  const paths = quantoCostaListingPaths(serviceSlugs, clinics).slice(0, CHUNK_SIZE);
  return urlset(paths, { changefreq: 'weekly', priority: '0.5' });
};

export const HEAD: APIRoute = sitemapHead;
