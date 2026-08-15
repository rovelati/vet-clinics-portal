import type { APIRoute } from 'astro';
import { loadClinicRows, sitemapHead, urlset, veterinarianLocationPaths } from '@/lib/sitemap';

export const GET: APIRoute = async () => {
  const clinics = await loadClinicRows();
  return urlset(veterinarianLocationPaths(clinics), { changefreq: 'weekly', priority: '0.6' });
};

export const HEAD: APIRoute = sitemapHead;
