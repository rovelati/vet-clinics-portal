import type { APIRoute } from 'astro';
import { localDb, query } from '@/lib/local-db';
import {
  clearSessionCookie,
  createToken,
  hashPassword,
  publicUser,
  requireLocalUser,
  sessionPayload,
  setSessionCookie,
  verifyPassword,
} from '@/lib/local-auth';

const json = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

function normalizeEmail(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function normalizeRole(value: unknown) {
  const role = String(value || '').trim();
  if (role === 'admin') return 'admin';
  if (role === 'veterinario') return 'veterinario';
  return 'proprietario';
}

function validPassword(value: string) {
  return value.length >= 6 && /[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\;'\/~`]/.test(value);
}

export const GET: APIRoute = async (context) => {
  const action = context.url.searchParams.get('action') || 'session';
  if (action !== 'session') return json({ success: false, error: 'Azione non valida.' }, 400);

  const { user, token } = await requireLocalUser(context);
  return json({
    success: true,
    session: user && token ? sessionPayload(user, token) : null,
    user: user ? publicUser(user) : null,
  });
};

export const POST: APIRoute = async (context) => {
  const body = await context.request.json().catch(() => ({}));
  const action = String(body.action || '');

  if (action === 'logout') {
    clearSessionCookie(context);
    return json({ success: true });
  }

  if (action === 'login') {
    const email = normalizeEmail(body.email);
    const password = String(body.password || '');
    if (!email || !password) return json({ success: false, error: 'Email e password sono obbligatorie.' }, 422);

    const { rows } = await query<any>(
      `select id, email, password_hash, full_name, role::text as role, phone, city
       from public.local_auth_users
       where email = $1 and disabled_at is null
       limit 1`,
      [email]
    );
    const user = rows[0];
    if (!user || !verifyPassword(password, user.password_hash)) {
      return json({ success: false, error: 'Credenziali non valide.' }, 401);
    }

    const token = createToken(user);
    setSessionCookie(context, token);
    await query('update public.local_auth_users set last_login_at = now() where id = $1', [user.id]);
    const marketingToken = context.cookies.get('vet_marketing_token')?.value;
    if (marketingToken) {
      await query(
        `update public.clinic_marketing_outreach
         set registered_user_id = coalesce(registered_user_id, $2),
             registered_at = coalesce(registered_at, now()),
             updated_at = now()
         where click_token::text = $1`,
        [marketingToken, user.id]
      ).catch(() => null);
    }
    delete user.password_hash;
    return json({ success: true, session: sessionPayload(user, token), user: publicUser(user) });
  }

  if (action === 'register') {
    const email = normalizeEmail(body.email);
    const password = String(body.password || '');
    const fullName = String(body.full_name || body.fullName || '').trim() || email.split('@')[0];
    const role = normalizeRole(body.role || body.user_type);
    const phone = String(body.phone || '').trim() || null;
    const city = String(body.city || '').trim() || null;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ success: false, error: 'Email non valida.' }, 422);
    if (!validPassword(password)) return json({ success: false, error: 'La password deve contenere almeno 6 caratteri e 1 carattere speciale.' }, 422);

    if (!localDb) return json({ success: false, error: 'Registrazione temporaneamente non disponibile. Configurazione database mancante.' }, 503);

    const client = await localDb.connect();
    try {
      await client.query('begin');
      const passwordHash = hashPassword(password);
      const existingAuth = await client.query<any>(
        `select u.id, p.role::text as profile_role
         from auth.users u
         left join public.profiles p on p.id = u.id
         where lower(u.email) = lower($1)
         limit 1`,
        [email]
      );
      const existingId = existingAuth.rows[0]?.id || null;
      const effectiveRole = existingAuth.rows[0]?.profile_role || role;
      const { rows } = await client.query<any>(
        `insert into public.local_auth_users (id, email, password_hash, full_name, role, phone, city)
         values (coalesce($7::uuid, extensions.uuid_generate_v4()), $1, $2, $3, $4::public.user_role, $5, $6)
         returning id, email, full_name, role::text as role, phone, city`,
        [email, passwordHash, fullName, effectiveRole, phone, city, existingId]
      );
      const user = rows[0];
      await client.query(
        `insert into auth.users (
           id, aud, role, email, encrypted_password, email_confirmed_at,
           raw_app_meta_data, raw_user_meta_data, created_at, updated_at
         )
         values (
           $1, 'authenticated', 'authenticated', $2, $3, now(),
           '{"provider":"local","providers":["local"]}'::jsonb,
           jsonb_build_object('full_name', $4::text, 'role', $5::text),
           now(), now()
         )
         on conflict (id) do update set
           encrypted_password = excluded.encrypted_password,
           email_confirmed_at = coalesce(auth.users.email_confirmed_at, excluded.email_confirmed_at),
           raw_app_meta_data = excluded.raw_app_meta_data,
           raw_user_meta_data = excluded.raw_user_meta_data,
           updated_at = now()`,
        [user.id, email, passwordHash, fullName, effectiveRole]
      );
      await client.query(
        `insert into public.profiles (id, full_name, role, phone, city, updated_at)
         values ($1, $2, $3::public.user_role, $4, $5, now())
         on conflict (id) do update set
           full_name = excluded.full_name,
           role = public.profiles.role,
           phone = excluded.phone,
           city = excluded.city,
           updated_at = now()`,
        [user.id, fullName, effectiveRole, phone, city]
      );
      await client.query('commit');
      const token = createToken(user);
      setSessionCookie(context, token);
      const marketingToken = context.cookies.get('vet_marketing_token')?.value;
      if (marketingToken) {
        await query(
          `update public.clinic_marketing_outreach
           set registered_user_id = coalesce(registered_user_id, $2),
               registered_at = coalesce(registered_at, now()),
               updated_at = now()
           where click_token::text = $1`,
          [marketingToken, user.id]
        ).catch(() => null);
      }
      return json({ success: true, session: sessionPayload(user, token), user: publicUser(user) });
    } catch (error: any) {
      await client.query('rollback');
      if (String(error?.code) === '23505') return json({ success: false, error: 'Email gia registrata.' }, 409);
      return json({ success: false, error: error?.message || 'Registrazione non riuscita.' }, 500);
    } finally {
      client.release();
    }
  }

  return json({ success: false, error: 'Azione non valida.' }, 400);
};
