import React, { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';

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

function isPetLoverRedirect(value) {
  return Boolean(value && value.startsWith('/dashboard/pet-lover'));
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
  return preferredRedirect || returnFromStorage || '/dashboard/pet-lover';
}

function googleIcon() {
  return (
    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function LoginApp() {
  const isBrowser = typeof window !== 'undefined';
  const params = useMemo(() => new URLSearchParams(isBrowser ? window.location.search : ''), [isBrowser]);
  const redirectAfterLogin = getSafeRedirect(params.get('redirect'));
  const emailFromQuery = params.get('email') || '';
  const errorFromQuery = params.get('error') || '';

  const [email, setEmail] = useState(emailFromQuery);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState(errorFromQuery ? 'Accesso non completato. Riprova.' : '');
  const [messageType, setMessageType] = useState(errorFromQuery ? 'error' : 'info');
  const [resetMode, setResetMode] = useState(params.get('reset_password') === '1');
  const [resetReady, setResetReady] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const registerHref = `/register${isBrowser ? window.location.search || '' : ''}`;

  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
  };

  useEffect(() => {
    if (!isBrowser) return undefined;

    let mounted = true;
    let subscription;

    const enablePasswordRecovery = async () => {
      const supabase = await getSupabase();
      const url = new URL(window.location.href);
      const type = url.searchParams.get('type');
      const authCode = url.searchParams.get('code');
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const hashType = hashParams.get('type');
      const isRecovery = type === 'recovery'
        || hashType === 'recovery'
        || url.searchParams.get('reset_password') === '1';

      if (authCode && isRecovery) {
        const { error } = await supabase.auth.exchangeCodeForSession(authCode);
        if (error) {
          if (mounted) {
            setResetMode(false);
            showMessage('Link per reimpostare la password non valido o scaduto. Richiedine uno nuovo.', 'error');
          }
          return;
        }
        window.history.replaceState(null, '', '/login?reset_password=1');
      }

      if (hashParams.has('access_token') && isRecovery) {
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            if (mounted) {
              setResetMode(false);
              showMessage('Link per reimpostare la password non valido o scaduto. Richiedine uno nuovo.', 'error');
            }
            return;
          }
          window.history.replaceState(null, '', '/login?reset_password=1');
        }
      }

      const { data } = await supabase.auth.getSession();
      if (mounted && (isRecovery || url.searchParams.get('reset_password') === '1')) {
        setResetMode(true);
        setResetReady(Boolean(data?.session));
        if (!data?.session) {
          showMessage('Apri il link ricevuto via email per impostare una nuova password.', 'info');
        } else {
          showMessage('Inserisci la nuova password per completare il recupero.', 'info');
        }
      }

      const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' && mounted) {
          setResetMode(true);
          setResetReady(Boolean(session));
          showMessage('Inserisci la nuova password per completare il recupero.', 'info');
          window.history.replaceState(null, '', '/login?reset_password=1');
        }
      });
      subscription = listener?.subscription;
    };

    enablePasswordRecovery();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [isBrowser]);

  const handleLogin = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      showMessage('Inserisci email e password.', 'error');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      showMessage('Inserisci un indirizzo email valido.', 'error');
      return;
    }

    setSubmitting(true);
    showMessage('');
    const supabase = await getSupabase();
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });
    setSubmitting(false);

    if (error) {
      showMessage(error.message || 'Accesso non riuscito. Verifica le credenziali.', 'error');
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    const signedInUser = userData?.user;
    if (!signedInUser?.id) {
      window.location.assign('/');
      return;
    }

    const preferred = (isClaimRedirect(redirectAfterLogin) || isQuoteRedirect(redirectAfterLogin) || isPetLoverRedirect(redirectAfterLogin)) ? redirectAfterLogin : null;
    const destination = await resolvePostLoginRoute(signedInUser.id, preferred);
    sessionStorage.removeItem('auth_return_to');
    window.location.replace(destination);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    showMessage('');

    const returnFromStorage = getSafeRedirect(sessionStorage.getItem('auth_return_to'));
    const redirect = redirectAfterLogin || returnFromStorage || '/';
    const callbackUrl = new URL(`${window.location.origin}/auth/callback`);
    callbackUrl.searchParams.set('redirect_to', redirect);
    if (isClaimRedirect(redirect)) callbackUrl.searchParams.set('flow', 'claim');

    sessionStorage.setItem('redirect_after_login', redirect);
    if (isClaimRedirect(redirect)) sessionStorage.setItem('oauth_flow', 'claim');

    const supabase = await getSupabase();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl.toString(),
        skipBrowserRedirect: false,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    setGoogleLoading(false);
    if (error) showMessage(error.message || 'Accesso con Google non riuscito.', 'error');
  };

  const handlePasswordReset = async () => {
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      showMessage('Inserisci prima un indirizzo email valido.', 'error');
      return;
    }

    setSubmitting(true);
    showMessage('');
    const supabase = await getSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/login?reset_password=1&type=recovery`,
    });
    setSubmitting(false);

    if (error) {
      showMessage(error.message || 'Invio reset password non riuscito.', 'error');
      return;
    }
    showMessage('Ti abbiamo inviato le istruzioni per reimpostare la password.', 'success');
  };

  const handlePasswordUpdate = async (event) => {
    event.preventDefault();

    if (!resetReady) {
      showMessage('Apri il link ricevuto via email per impostare una nuova password.', 'error');
      return;
    }

    if (resetPassword.length < 8) {
      showMessage('La nuova password deve contenere almeno 8 caratteri.', 'error');
      return;
    }

    if (resetPassword !== resetPasswordConfirm) {
      showMessage('Le password non coincidono.', 'error');
      return;
    }

    setResetSubmitting(true);
    showMessage('');
    const supabase = await getSupabase();
    const { error } = await supabase.auth.updateUser({ password: resetPassword });
    setResetSubmitting(false);

    if (error) {
      showMessage(error.message || 'Aggiornamento password non riuscito.', 'error');
      return;
    }

    await supabase.auth.signOut();
    setResetPassword('');
    setResetPasswordConfirm('');
    setResetMode(false);
    setResetReady(false);
    window.history.replaceState(null, '', '/login');
    showMessage('Password aggiornata. Ora puoi accedere con le nuove credenziali.', 'success');
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-lg border-0 bg-white shadow-2xl">
          <div className="px-6 pb-8 pt-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-blue-600">
              {resetMode ? <Lock className="h-8 w-8 text-white" aria-hidden="true" /> : <Mail className="h-8 w-8 text-white" aria-hidden="true" />}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {resetMode ? 'Reimposta la password' : 'Accedi al tuo Account'}
            </h1>
            <p className="mt-2 text-gray-600">
              {resetMode ? 'Scegli una nuova password per il tuo account' : 'Benvenuto di nuovo! Inserisci le tue credenziali'}
            </p>
          </div>

          <div className="px-6 pb-6">
            {message && (
              <div className={`mb-5 rounded-md px-4 py-3 text-sm ${
                messageType === 'error'
                  ? 'bg-red-50 text-red-700'
                  : messageType === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-blue-50 text-blue-700'
              }`}>
                {message}
              </div>
            )}

            {resetMode ? (
              <form onSubmit={handlePasswordUpdate} className="space-y-6">
                <div>
                  <label htmlFor="reset-password" className="mb-2 block text-sm font-medium text-gray-700">Nuova password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                    <input
                      id="reset-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Almeno 8 caratteri"
                      value={resetPassword}
                      onChange={(event) => setResetPassword(event.target.value)}
                      className="h-12 w-full rounded-md border border-gray-200 bg-white pl-10 pr-10 text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reset-password-confirm" className="mb-2 block text-sm font-medium text-gray-700">Conferma password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                    <input
                      id="reset-password-confirm"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Ripeti la nuova password"
                      value={resetPasswordConfirm}
                      onChange={(event) => setResetPasswordConfirm(event.target.value)}
                      className="h-12 w-full rounded-md border border-gray-200 bg-white pl-10 pr-10 text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="inline-flex h-12 w-full items-center justify-center rounded-md bg-green-600 px-4 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                  disabled={resetSubmitting || !resetReady}
                >
                  {resetSubmitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : 'Aggiorna password'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setResetMode(false);
                    setResetReady(false);
                    setResetPassword('');
                    setResetPasswordConfirm('');
                    window.history.replaceState(null, '', '/login');
                    showMessage('');
                  }}
                  className="inline-flex h-12 w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Torna al login
                </button>
              </form>
            ) : (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-gray-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="la-tua-email@esempio.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-12 w-full rounded-md border border-gray-200 bg-white pl-10 pr-3 text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="mb-2 block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="La tua password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 w-full rounded-md border border-gray-200 bg-white pl-10 pr-10 text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center text-sm text-gray-600">
                  <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                  <span className="ml-2">Ricordami</span>
                </label>
                <button type="button" onClick={handlePasswordReset} className="text-sm font-semibold text-green-600 hover:text-green-700">
                  {submitting ? 'Invio...' : 'Password dimenticata?'}
                </button>
              </div>

              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center rounded-md bg-green-600 px-4 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                disabled={submitting || googleLoading}
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : 'Accedi'}
              </button>
            </form>
            )}

            {!resetMode && <div className="mt-6 text-center">
              <p className="text-gray-600">
                Non hai ancora un account?{' '}
                <a href={registerHref} className="font-semibold text-green-600 hover:text-green-700">Registrati qui</a>
              </p>
            </div>}

            {!resetMode && <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-2 text-gray-500">Oppure</span>
                </div>
              </div>

              <button
                type="button"
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                disabled={googleLoading || submitting}
                onClick={handleGoogleLogin}
              >
                {googleLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" /> : googleIcon()}
                Continua con Google
              </button>
            </div>}
          </div>
        </div>
      </div>
    </div>
  );
}
