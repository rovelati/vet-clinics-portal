import type { APIRoute } from 'astro';
import { clinicDetailPaths, loadClinicRows, sitemapHead, urlset } from '@/lib/sitemap';

export const GET: APIRoute = async () => {
  const clinics = await loadClinicRows();
  return urlset(clinicDetailPaths(clinics), { changefreq: 'weekly', priority: '0.7' });
};

export const HEAD: APIRoute = sitemapHead;
