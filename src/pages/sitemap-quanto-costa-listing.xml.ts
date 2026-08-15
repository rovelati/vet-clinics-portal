import type { APIRoute } from 'astro';
import { sitemapHead, sitemapIndex } from '@/lib/sitemap';

export const GET: APIRoute = async () => sitemapIndex([
  '/sitemap-quanto-costa-listing-1.xml',
  '/sitemap-quanto-costa-listing-2.xml',
]);

export const HEAD: APIRoute = sitemapHead;
