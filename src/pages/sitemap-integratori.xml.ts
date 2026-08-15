import type { APIRoute } from 'astro';
import { integratoriPaths, sitemapHead, urlset } from '@/lib/sitemap';

export const GET: APIRoute = async () => urlset(integratoriPaths(), { changefreq: 'weekly', priority: '0.6' });
export const HEAD: APIRoute = sitemapHead;
