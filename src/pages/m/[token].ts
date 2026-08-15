import type { APIRoute } from 'astro';
import { siteConfig } from '@/config/site';
import { query } from '@/lib/local-db';

function safeTarget(value: string | null) {
  if (value === 'claim') return 'claim';
  if (value === 'benefits') return 'benefits';
  return 'profile';
}

function destinationFor(target: string, clinic: { id: string; slug: string | null }) {
  if (target === 'claim') return `${siteConfig.url}/claim?clinic=${encodeURIComponent(clinic.id)}`;
  if (target === 'benefits') return `${siteConfig.url}/vantaggi-veterinari`;
  return clinic.slug ? `${siteConfig.url}/veterinari/${clinic.slug}` : siteConfig.url;
}

export const GET: APIRoute = async (context) => {
  const token = context.params.token || '';
  const target = safeTarget(context.url.searchParams.get('to'));

  const { rows } = await query<{ id: string; clinic_id: string; slug: string | null }>(
    `select o.id::text as id, o.clinic_id::text as clinic_id, c.slug
     from public.clinic_marketing_outreach o
     join public.clinics c on c.id = o.clinic_id
     where o.click_token::text = $1
     limit 1`,
    [token]
  );

  const row = rows[0];
  if (!row) return context.redirect(siteConfig.url, 302);

  await query(
    `update public.clinic_marketing_outreach
     set clicked_at = coalesce(clicked_at, now()),
         last_click_target = $2,
         updated_at = now(),
         metadata = metadata || jsonb_build_object('last_click_at', now(), 'last_click_user_agent', $3::text)
     where id = $1`,
    [row.id, target, context.request.headers.get('user-agent') || '']
  ).catch(() => null);

  context.cookies.set('vet_marketing_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  return context.redirect(destinationFor(target, { id: row.clinic_id, slug: row.slug }), 302);
};
