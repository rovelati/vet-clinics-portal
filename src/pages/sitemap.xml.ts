import type { APIRoute } from 'astro';
import { sitemapHead, sitemapIndex } from '@/lib/sitemap';

const sitemapFiles = [
  '/sitemap-static.xml',
  '/sitemap-blog.xml',
  '/sitemap-veterinari.xml',
  '/sitemap-veterinari-localita.xml',
  '/sitemap-h24.xml',
  '/sitemap-quanto-costa.xml',
  '/sitemap-quanto-costa-listing-1.xml',
  '/sitemap-quanto-costa-listing-2.xml',
  '/sitemap-integratori.xml',
];

export const GET: APIRoute = async () => sitemapIndex(sitemapFiles);
export const HEAD: APIRoute = sitemapHead;
