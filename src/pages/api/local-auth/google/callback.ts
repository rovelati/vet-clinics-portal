import type { APIRoute } from 'astro';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { localDb, query } from '@/lib/local-db';
import { createToken, setSessionCookie, type LocalUser } from '@/lib/local-auth';

const STATE_COOKIE = 'vet_oauth_state';
const AUTH_SECRET = import.meta.env.AUTH_SECRET || process.env.AUTH_SECRET || 'dev-local-auth-secret';

type GoogleProfile = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

function getConfig() {
  const clientId = import.meta.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = import.meta.env.GOOGLE_OAUTH_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = import.meta.env.GOOGLE_OAUTH_REDIRECT_URI || process.env.GOOGLE_OAUTH_REDIRECT_URI;
  return { clientId, clientSecret, redirectUri };
}

function verifyState(token: string | null | undefined) {
  if (!token || !token.includes('.')) return null;
  const [encoded, signature] = token.split('.');
  const expected = createHmac('sha256', AUTH_SECRET).update(encoded).digest('base64url');
  const left = Buffer.from(signature || '');
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!payload?.callbackPath || !payload?.createdAt) return null;
    if (Date.now() - Number(payload.createdAt) > 10 * 60 * 1000) return null;
    return payload as { callbackPath: string };
  } catch {
    return null;
  }
}

function safeCallbackPath(value: string | null | undefined) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  if (value.startsWith('/login') || value.startsWith('/register') || value.startsWith('/auth/callback')) return '/';
  return value;
}

async function fetchGoogleProfile(code: string) {
  const { clientId, clientSecret, redirectUri } = getConfig();
  if (!clientId || !clientSecret || !redirectUri) throw new Error('Google OAuth non configurato.');

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const tokenPayload = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !tokenPayload.access_token) {
    throw new Error(tokenPayload.error_description || tokenPayload.error || 'Scambio token Google non riuscito.');
  }

  const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
  });
  const profile = await profileResponse.json().catch(() => ({}));
  if (!profileResponse.ok || !profile.email || !profile.sub) {
    throw new Error('Profilo Google non disponibile.');
  }
  return profile as GoogleProfile;
}

export const GET: APIRoute = async (context) => {
  const code = context.url.searchParams.get('code');
  const state = context.url.searchParams.get('state');
  const storedState = context.cookies.get(STATE_COOKIE)?.value;
  const statePayload = verifyState(state);
  const storedPayload = verifyState(storedState);

  context.cookies.delete(STATE_COOKIE, { path: '/' });

  if (!code || !statePayload || !storedPayload || state !== storedState) {
    return context.redirect('/login?error=auth_failed', 302);
  }

  const callbackPath = safeCallbackPath(statePayload.callbackPath);

  if (!localDb) {
    return context.redirect('/login?error=auth_failed', 302);
  }

  try {
    const profile = await fetchGoogleProfile(code);
    if (profile.email_verified === false) {
      return context.redirect('/login?error=auth_failed', 302);
    }

    const email = profile.email.trim().toLowerCase();
    const fullName = (profile.name || `${profile.given_name || ''} ${profile.family_name || ''}`.trim() || email.split('@')[0]).trim();
    const role = callbackPath.includes('flow=claim') || callbackPath.includes('/claim/start') ? 'veterinario' : 'proprietario';

    const client = await localDb.connect();
    let user: LocalUser;
    try {
      await client.query('begin');

      const existing = await client.query<LocalUser & { profile_role?: string }>(
        `select l.id, l.email, l.full_name, l.role::text as role, l.phone, l.city, p.role::text as profile_role
         from public.local_auth_users l
         left join public.profiles p on p.id = l.id
         where l.email = $1 and l.disabled_at is null
         limit 1`,
        [email]
      );

      if (existing.rows[0]) {
        user = existing.rows[0];
        await client.query(
          `update public.local_auth_users
           set full_name = coalesce(nullif(full_name, ''), $2),
               last_login_at = now(),
               updated_at = now()
           where id = $1`,
          [user.id, fullName]
        );
      } else {
        const existingAuth = await client.query<any>(
          `select u.id, p.role::text as profile_role, p.full_name as profile_name
           from auth.users u
           left join public.profiles p on p.id = u.id
           where lower(u.email) = lower($1)
           limit 1`,
          [email]
        );
        const existingId = existingAuth.rows[0]?.id || null;
        const effectiveRole = existingAuth.rows[0]?.profile_role || role;
        const effectiveName = existingAuth.rows[0]?.profile_name || fullName;
        const inserted = await client.query<LocalUser>(
          `insert into public.local_auth_users (id, email, password_hash, full_name, role)
           values (coalesce($5::uuid, extensions.uuid_generate_v4()), $1, $2, $3, $4::public.user_role)
           returning id, email, full_name, role::text as role, phone, city`,
          [email, `oauth_google$${profile.sub}`, effectiveName, effectiveRole, existingId]
        );
        user = inserted.rows[0];
      }

      const authByEmail = await client.query<{ id: string }>(
        `select id from auth.users where lower(email) = lower($1) limit 1`,
        [email]
      );
      if (!authByEmail.rows[0] || authByEmail.rows[0].id === user.id) {
        await client.query(
          `insert into auth.users (
             id, aud, role, email, encrypted_password, email_confirmed_at,
             raw_app_meta_data, raw_user_meta_data, created_at, updated_at
           )
           values (
             $1, 'authenticated', 'authenticated', $2, $3, now(),
             '{"provider":"google","providers":["google"]}'::jsonb,
             jsonb_build_object('full_name', $4::text, 'role', $5::text, 'avatar_url', $6::text),
             now(), now()
           )
           on conflict (id) do update set
             email = excluded.email,
             raw_app_meta_data = excluded.raw_app_meta_data,
             raw_user_meta_data = excluded.raw_user_meta_data,
             updated_at = now()`,
          [user.id, email, `oauth_google$${profile.sub}`, fullName, user.role || role, profile.picture || null]
        );
      }

      await client.query(
        `insert into public.profiles (id, full_name, role, updated_at)
         values ($1, $2, $3::public.user_role, now())
         on conflict (id) do update set
           full_name = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
           role = excluded.role,
           updated_at = now()`,
        [user.id, fullName, user.role || role]
      );

      await client.query('commit');
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }

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
    return context.redirect(callbackPath, 302);
  } catch (error) {
    console.error('Google OAuth callback failed', error);
    return context.redirect('/login?error=auth_failed', 302);
  }
};
