import type { APIRoute } from 'astro';
import { query } from '@/lib/local-db';
import { sendClaimCreatedAdminEmail } from '@/lib/claim-emails';
import { requireLocalUser } from '@/lib/local-auth';

const json = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

export const POST: APIRoute = async (context) => {
  const { user } = await requireLocalUser(context);
  if (!user) return json({ success: false, error: 'Sessione richiesta.' }, 401);

  const body = await context.request.json().catch(() => ({}));
  const fn = String(body.fn || '');

  if (fn !== 'claim_clinic_secure') return json({ success: false, error: 'RPC non consentita.' }, 403);

  const clinicId = String(body.params?.p_clinic_id || '');
  if (!clinicId) return json({ success: false, error: 'clinic_not_found' }, 422);

  const client = await (await import('@/lib/local-db')).localDb!.connect();
  let committed = false;
  try {
    await client.query('begin');

    const owned = await client.query('select id from public.clinics where owner_id = $1 limit 1', [user.id]);
    if (owned.rows[0]) throw new Error('already_has_clinic');

    const clinic = await client.query(
      `select id, owner_id, name, slug, address, city, province, phone, email, website, status
       from public.clinics
       where id = $1
       for update`,
      [clinicId]
    );
    if (!clinic.rows[0]) throw new Error('clinic_not_found');
    if (clinic.rows[0].owner_id) throw new Error('clinic_already_claimed');

    await client.query(
      `update public.clinics set owner_id = $1, status = 'in_revisione', updated_at = now() where id = $2`,
      [user.id, clinicId]
    );
    const claim = await client.query(
      `insert into public.claims (user_id, clinic_id, status, created_at)
       values ($1, $2, 'pending', now())
       returning *`,
      [user.id, clinicId]
    );

    await client.query('commit');
    committed = true;

    const notification = await sendClaimCreatedAdminEmail({
      claim: claim.rows[0],
      clinic: clinic.rows[0],
      user,
    });

    await query(
      `update public.claims
       set admin_notified_at = case when $2::boolean then now() else admin_notified_at end,
           admin_notification_error = $3
       where id = $1`,
      [claim.rows[0].id, notification.success, notification.success ? null : notification.error || 'Errore invio email admin']
    ).catch(() => null);

    const marketingToken = context.cookies.get('vet_marketing_token')?.value;
    if (marketingToken) {
      await query(
        `update public.clinic_marketing_outreach
         set claimed_at = coalesce(claimed_at, now()),
             registered_user_id = coalesce(registered_user_id, $3),
             registered_at = coalesce(registered_at, now()),
             updated_at = now()
         where click_token::text = $1 and clinic_id = $2`,
        [marketingToken, clinicId, user.id]
      ).catch(() => null);
    }

    return json({ success: true, data: claim.rows[0], notification });
  } catch (error: any) {
    if (!committed) await client.query('rollback').catch(() => null);
    return json({ success: false, error: error?.message || 'Claim non riuscito.' }, 400);
  } finally {
    client.release();
  }
};
