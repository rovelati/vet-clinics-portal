import type { APIRoute } from 'astro';
import { query } from '@/lib/local-db';
import { sitemapHead, urlset } from '@/lib/sitemap';

export const GET: APIRoute = async () => {
  const paths = ['/blog'];
  try {
    const { rows } = await query<{ slug: string }>(
      `select slug
         from public.veterinary_blog_articles
        where status = 'published' and slug is not null
        order by published_at desc nulls last`
    );
    paths.push(...rows.map((row) => `/blog/${row.slug}`));
  } catch {
    // The blog remains available while the migration is being deployed.
  }
  return urlset(paths, { changefreq: 'weekly', priority: '0.7' });
};

export const HEAD: APIRoute = sitemapHead;

