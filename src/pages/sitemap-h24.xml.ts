import type { APIRoute } from 'astro';
import { h24Paths, loadClinicRows, sitemapHead, urlset } from '@/lib/sitemap';

export const GET: APIRoute = async () => {
  const clinics = await loadClinicRows();
  return urlset(h24Paths(clinics), { changefreq: 'daily', priority: '0.7' });
};

export const HEAD: APIRoute = sitemapHead;
