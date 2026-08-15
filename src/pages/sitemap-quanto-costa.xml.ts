import type { APIRoute } from 'astro';
import { loadServiceSlugs, quantoCostaPaths, sitemapHead, urlset } from '@/lib/sitemap';

export const GET: APIRoute = async () => {
  const serviceSlugs = await loadServiceSlugs();
  return urlset(quantoCostaPaths(serviceSlugs), { changefreq: 'weekly', priority: '0.7' });
};

export const HEAD: APIRoute = sitemapHead;
