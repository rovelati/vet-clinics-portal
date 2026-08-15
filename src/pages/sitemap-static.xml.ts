import type { APIRoute } from 'astro';
import { sitemapHead, urlset } from '@/lib/sitemap';

const staticPaths = [
  '/',
  '/cerca-veterinari',
  '/servizi',
  '/blog',
  '/vantaggi-veterinari',
  '/chi-siamo',
  '/contatti',
  '/privacy-policy',
  '/cookie-policy',
  '/note-legali',
  '/credits',
];

export const GET: APIRoute = async () => urlset(staticPaths, { changefreq: 'weekly', priority: '0.7' });
export const HEAD: APIRoute = sitemapHead;
