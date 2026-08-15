import type { APIRoute } from 'astro';
import { createHmac, randomBytes } from 'node:crypto';

const STATE_COOKIE = 'vet_oauth_state';
const AUTH_SECRET = import.meta.env.AUTH_SECRET || process.env.AUTH_SECRET || 'dev-local-auth-secret';

function getConfig() {
  const clientId = import.meta.env.GOOGLE_OAUTH_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID;
  const redirectUri = import.meta.env.GOOGLE_OAUTH_REDIRECT_URI || process.env.GOOGLE_OAUTH_REDIRECT_URI;
  return { clientId, redirectUri };
}

function safeRedirect(value: string | null) {
  if (!value) return '/';
  try {
    const url = new URL(value);
    if (url.origin !== 'https://www.veterinari.org' && !url.origin.startsWith('http://localhost')) return '/';
    if (url.pathname === '/auth/callback') {
      return safeRedirect(url.searchParams.get('redirect_to'));
    }
    return safeRedirect(`${url.pathname}${url.search}`);
  } catch {
    if (!value.startsWith('/') || value.startsWith('//')) return '/';
    if (value.startsWith('/login') || value.startsWith('/register') || value.startsWith('/auth/callback')) return '/';
    return value;
  }
}

function signState(payload: Record<string, unknown>) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', AUTH_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

export const GET: APIRoute = async (context) => {
  const { clientId, redirectUri } = getConfig();
  if (!clientId || !redirectUri) {
    return new Response('Google OAuth non configurato.', { status: 503 });
  }

  const callbackPath = safeRedirect(context.url.searchParams.get('redirect_to') || context.url.searchParams.get('redirect'));
  const nonce = randomBytes(16).toString('base64url');
  const state = signState({
    nonce,
    callbackPath,
    createdAt: Date.now(),
  });

  context.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 600,
  });

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('prompt', 'select_account');

  return context.redirect(authUrl.toString(), 302);
};
