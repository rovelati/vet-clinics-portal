import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

async function getSupabase() {
  const { supabaseBrowser } = await import('@/lib/supabase-browser');
  return supabaseBrowser;
}

function getSafeRedirect(value) {
  if (!value) return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  if (value.startsWith('/login') || value.startsWith('/register') || value.startsWith('/auth/callback')) return null;
  return value;
}

function isClaimRedirect(value) {
  return Boolean(value && (value.startsWith('/claim/start') || value.startsWith('/claim')));
}

function isQuoteRedirect(value) {
  return Boolean(value && value.startsWith('/preventivi/'));
}

async function resolvePostLoginRoute(userId, preferredRedirect = null) {
  const supabase = await getSupabase();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.role === 'admin') return '/adminconsole';
  if (preferredRedirect && isQuoteRedirect(preferredRedirect)) return preferredRedirect;

  let hasClinic = false;
  const { data: clinicData, error: clinicError } = await supabase
    .from('clinics')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle();

  if (clinicData?.id) {
    hasClinic = true;
  } else if (clinicError) {
    const { data: claimData } = await supabase
      .from('claims')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (claimData?.id) hasClinic = true;
  }

  if (hasClinic) return '/dashboard/veterinario';

  const returnFromStorage = getSafeRedirect(sessionStorage.getItem('auth_return_to'));
  return preferredRedirect || returnFromStorage || '/';
}

export default function AuthCallbackApp() {
  const [message, setMessage] = useState('Completamento autenticazione...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const url = new URL(window.location.href);
        const redirectFromUrl = getSafeRedirect(url.searchParams.get('redirect_to'));
        const flowFromUrl = url.searchParams.get('flow');
        const authCode = url.searchParams.get('code');
        const supabase = await getSupabase();

        if (authCode) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode);
          if (exchangeError) {
            window.location.replace('/login?error=auth_failed');
            return;
          }
          window.history.replaceState(null, '', window.location.pathname);
        }

        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        if (hashParams.has('access_token')) {
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              window.location.replace('/login?error=auth_failed');
              return;
            }
            window.history.replaceState(null, '', window.location.pathname);
          }
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) {
          window.location.replace('/login?error=auth_failed');
          return;
        }

        if (!data?.session) {
          const oauthError = url.searchParams.get('error') || url.searchParams.get('error_description');
          window.location.replace(oauthError ? '/login?error=auth_failed' : '/login');
          return;
        }

        const redirectAfterLogin = getSafeRedirect(sessionStorage.getItem('redirect_after_login'));
        const claimFlow = sessionStorage.getItem('claim_flow');
        const oauthFlow = sessionStorage.getItem('oauth_flow');
        const claimRequested = flowFromUrl === 'claim'
          || claimFlow === 'true'
          || oauthFlow === 'claim'
          || isClaimRedirect(redirectFromUrl)
          || isClaimRedirect(redirectAfterLogin);

        if (claimRequested) {
          sessionStorage.removeItem('claim_flow');
          sessionStorage.removeItem('oauth_flow');
          sessionStorage.removeItem('redirect_after_login');
          sessionStorage.setItem('claim_from_google', 'true');
          window.location.replace('/claim/start?step=2');
          return;
        }

        setMessage('Accesso completato. Reindirizzamento...');
        const preferredRedirect = redirectFromUrl || redirectAfterLogin;
        sessionStorage.removeItem('redirect_after_login');
        const destination = await resolvePostLoginRoute(data.session.user.id, preferredRedirect);
        sessionStorage.removeItem('auth_return_to');
        window.location.replace(destination);
      } catch {
        window.location.replace('/login?error=callback_error');
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 px-4">
      <div className="text-center">
        <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-green-600" aria-hidden="true" />
        <p className="text-lg text-gray-700">{message}</p>
      </div>
    </div>
  );
}
