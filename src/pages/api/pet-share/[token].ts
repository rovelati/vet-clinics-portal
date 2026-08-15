import type { APIRoute } from 'astro';
import { query } from '@/lib/local-db';

const json = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

function cleanToken(value: unknown) {
  return String(value || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 120);
}

export const GET: APIRoute = async (context) => {
  const token = cleanToken(context.params.token);
  if (!token) return json({ success: false, error: 'Link non valido.' }, 404);

  const result = await query<any>(
    `select
       s.id::text as share_id,
       s.scopes,
       s.expires_at,
       p.id::text as pet_id,
       p.name,
       p.species,
       p.breed,
       p.sex,
       p.birth_date,
       p.weight_kg,
       p.photo_url,
       p.microchip,
       p.neutered,
       p.allergies,
       p.conditions,
       p.medications,
       p.nutrition_notes,
       p.behavior_notes,
       u.full_name as owner_name,
       u.email as owner_email,
       u.phone as owner_phone
     from public.pet_share_links s
     join public.pet_profiles p on p.id = s.pet_id
     join public.local_auth_users u on u.id = s.owner_id
     where s.token = $1
       and s.revoked_at is null
       and s.expires_at > now()
     limit 1`,
    [token]
  );

  const share = result.rows[0];
  if (!share) return json({ success: false, error: 'Link scaduto o revocato.' }, 404);

  await query(`update public.pet_share_links set last_viewed_at = now() where id::text = $1`, [share.share_id]).catch(() => null);
  return json({ success: true, data: share });
};
