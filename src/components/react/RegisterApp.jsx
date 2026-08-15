import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, Heart, Loader2, Lock, Mail, MapPin, Phone, Stethoscope, User, XCircle } from 'lucide-react';

async function getSupabase() {
  const { supabaseBrowser } = await import('@/lib/supabase-browser');
  return supabaseBrowser;
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

const initialFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  city: '',
  password: '',
  confirmPassword: '',
  userType: 'proprietario',
};

const PASSWORD_SPECIAL_RE = /[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\;'\/~`]/;

function passwordRules(password) {
  return [
    { label: 'Almeno 6 caratteri', passed: password.length >= 6 },
    { label: 'Almeno 1 carattere speciale', passed: PASSWORD_SPECIAL_RE.test(password) },
  ];
}

export default function RegisterApp() {
  const isBrowser = typeof window !== 'undefined';
  const [currentSearch, setCurrentSearch] = useState('');
  const params = useMemo(() => new URLSearchParams(currentSearch), [currentSearch]);
  const isClaimFlow = params.get('claim') === 'true';
  const requestedType = params.get('type');
  const redirectTo = params.get('redirect')?.startsWith('/') ? params.get('redirect') : '';
  const [formData, setFormData] = useState({
    ...initialFormData,
    email: params.get('email') || '',
    userType: isClaimFlow || requestedType === 'veterinario' ? 'veterinario' : 'proprietario',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');

  const loginHref = `/login${currentSearch}`;
  const loginRel = loginHref.includes('redirect=') ? 'nofollow' : undefined;
  const currentPasswordRules = passwordRules(formData.password);

  useEffect(() => {
    const search = window.location.search || '';
    setCurrentSearch(search);

    const nextParams = new URLSearchParams(search);
    const nextIsClaim = nextParams.get('claim') === 'true';
    const nextType = nextParams.get('type');
    const nextEmail = nextParams.get('email') || '';

    setFormData((current) => ({
      ...current,
      email: nextEmail || current.email,
      userType: nextIsClaim || nextType === 'veterinario' ? 'veterinario' : current.userType,
    }));
  }, []);

  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
  };

  const updateField = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const validateForm = () => {
    const normalizedEmail = formData.email.trim();

    if (!formData.firstName.trim() || !formData.lastName.trim() || !normalizedEmail || !formData.password) {
      showMessage('Per favore compila tutti i campi obbligatori.', 'error');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      showMessage('Inserisci un indirizzo email valido.', 'error');
      return false;
    }

    if (currentPasswordRules.some((rule) => !rule.passed)) {
      showMessage('La password deve avere almeno 6 caratteri e 1 carattere speciale.', 'error');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      showMessage('Le password inserite non corrispondono.', 'error');
      return false;
    }

    return true;
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    showMessage('');

    const supabase = await getSupabase();
    const normalizedEmail = formData.email.trim();
    const finalUserType = isClaimFlow ? 'veterinario' : formData.userType;
    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();

    try {
      const signUpOptions = {
        data: {
          full_name: fullName,
          user_type: finalUserType,
        },
      };

      if (isClaimFlow) {
        signUpOptions.emailRedirectTo = `${window.location.origin}/claim/start`;
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: formData.password,
        options: signUpOptions,
      });

      if (error) throw error;

      const user = data?.user;
      if (user?.id) {
        await supabase.from('profiles').upsert({
          id: user.id,
          full_name: fullName,
          role: finalUserType,
          phone: formData.phone.trim() || null,
          city: formData.city.trim() || null,
        }, {
          onConflict: 'id',
        });
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: formData.password,
      });

      if (!signInError) {
        showMessage('Registrazione completata.', 'success');
        if (isClaimFlow) {
          window.location.assign('/claim/start?step=2');
        } else if (finalUserType === 'veterinario') {
          window.location.assign('/dashboard/veterinario');
        } else {
          window.location.assign(redirectTo || '/dashboard/pet-lover');
        }
        return;
      }

      if (isClaimFlow) {
        window.location.assign(`/login?redirect=/claim/start&email=${encodeURIComponent(normalizedEmail)}`);
      } else {
        window.location.assign(`/login?email=${encodeURIComponent(normalizedEmail)}`);
      }
    } catch (error) {
      showMessage(error?.message || 'Si è verificato un errore durante la registrazione.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    showMessage('');

    const redirectAfterLogin = isClaimFlow
      ? '/claim/start?step=2'
      : formData.userType === 'veterinario'
        ? '/dashboard/veterinario'
        : (redirectTo || '/dashboard/pet-lover');

    if (isClaimFlow) {
      sessionStorage.setItem('claim_flow', 'true');
    }

    sessionStorage.setItem('redirect_after_login', redirectAfterLogin);
    if (isClaimFlow) sessionStorage.setItem('oauth_flow', 'claim');

    const callbackUrl = new URL(`${window.location.origin}/auth/callback`);
    callbackUrl.searchParams.set('redirect_to', redirectAfterLogin);
    if (isClaimFlow) callbackUrl.searchParams.set('flow', 'claim');

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

    setIsLoading(false);
    if (error) showMessage(error.message || 'Accesso con Google fallito. Riprova.', 'error');
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="overflow-hidden rounded-lg border-0 bg-white shadow-2xl">
          <div className="px-6 pb-8 pt-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-blue-600">
              <User className="h-8 w-8 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Crea il tuo Account</h1>
            <p className="mt-2 text-gray-600">Unisciti alla community di Veterinari.org</p>
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

            <form onSubmit={handleRegister} className="space-y-6">
              {!isClaimFlow && (
                <div>
                  <label className="mb-3 block text-sm font-medium text-gray-700">Tipo di Account</label>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                      formData.userType === 'proprietario'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="userType"
                        value="proprietario"
                        checked={formData.userType === 'proprietario'}
                        onChange={updateField}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <User className="mx-auto mb-2 h-8 w-8 text-green-600" aria-hidden="true" />
                        <div className="flex flex-wrap items-center justify-center gap-2 font-semibold text-gray-900">
                          <span>Proprietario</span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-sm font-bold text-rose-600">
                            <Heart className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                            Pet Lover
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">Ho un animale domestico</div>
                      </div>
                    </label>

                    <label className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                      formData.userType === 'veterinario'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="userType"
                        value="veterinario"
                        checked={formData.userType === 'veterinario'}
                        onChange={updateField}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <Stethoscope className="mx-auto mb-2 h-8 w-8 text-green-600" aria-hidden="true" />
                        <div className="flex flex-wrap items-center justify-center gap-2 font-semibold text-gray-900">
                          <span>Veterinario</span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-sm font-bold text-emerald-700">
                            <Stethoscope className="h-3.5 w-3.5" aria-hidden="true" />
                            Partner Veterinario
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">Sono un professionista</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {isClaimFlow && (
                <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 rounded-full bg-blue-100 p-2">
                      <User className="h-5 w-5 text-blue-600" aria-hidden="true" />
                    </div>
                    <div>
                      <h2 className="mb-1 font-semibold text-blue-900">Registrazione come Veterinario Proprietario</h2>
                      <p className="text-sm text-blue-800">
                        Stai reclamando la gestione di una struttura veterinaria su Veterinari.org.
                        Con questa registrazione otterrai l'accesso per gestire le informazioni della tua struttura.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  icon={User}
                  label="Nome *"
                  name="firstName"
                  placeholder="Il tuo nome"
                  value={formData.firstName}
                  onChange={updateField}
                  required
                />
                <Field
                  icon={User}
                  label="Cognome *"
                  name="lastName"
                  placeholder="Il tuo cognome"
                  value={formData.lastName}
                  onChange={updateField}
                  required
                />
              </div>

              <Field
                icon={Mail}
                type="email"
                label="Email *"
                name="email"
                placeholder="la-tua-email@esempio.com"
                value={formData.email}
                onChange={updateField}
                autoComplete="email"
                required
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field
                  icon={Phone}
                  type="tel"
                  label="Telefono"
                  name="phone"
                  placeholder="+39 123 456 7890"
                  value={formData.phone}
                  onChange={updateField}
                  autoComplete="tel"
                />
                <Field
                  icon={MapPin}
                  label="Citta"
                  name="city"
                  placeholder="La tua citta"
                  value={formData.city}
                  onChange={updateField}
                  autoComplete="address-level2"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <PasswordField
                  label="Password *"
                  name="password"
                  placeholder="Crea una password"
                  value={formData.password}
                  onChange={updateField}
                  shown={showPassword}
                  onToggle={() => setShowPassword((value) => !value)}
                  autoComplete="new-password"
                  rules={currentPasswordRules}
                />
                <PasswordField
                  label="Conferma Password *"
                  name="confirmPassword"
                  placeholder="Conferma la password"
                  value={formData.confirmPassword}
                  onChange={updateField}
                  shown={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword((value) => !value)}
                  autoComplete="new-password"
                  confirmationState={formData.confirmPassword ? formData.confirmPassword === formData.password : null}
                />
              </div>

              <label className="flex items-start gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  required
                  className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span>
                  Accetto i{' '}
                  <a href="/note-legali" className="font-semibold text-green-600 hover:text-green-700">Termini di Servizio</a>
                  {' '}e la{' '}
                  <a href="/privacy-policy" className="font-semibold text-green-600 hover:text-green-700">Privacy Policy</a>
                </span>
              </label>

              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center rounded-md bg-green-600 px-4 font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                    Registrazione in corso...
                  </>
                ) : (
                  'Crea Account'
                )}
              </button>
            </form>

            <div className="mt-6">
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
                disabled={isLoading}
                onClick={handleGoogleSignUp}
              >
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" /> : googleIcon()}
                Continua con Google
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Hai gia un account?{' '}
                <a href={loginHref} rel={loginRel} className="font-semibold text-green-600 hover:text-green-700">Accedi qui</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  autoComplete,
  icon: Icon,
  label,
  name,
  onChange,
  placeholder,
  required = false,
  type = 'text',
  value,
}) {
  return (
    <div>
      <label htmlFor={`register-${name}`} className="mb-2 block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <input
          id={`register-${name}`}
          type={type}
          name={name}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="h-12 w-full rounded-md border border-gray-200 bg-white pl-10 pr-3 text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          required={required}
        />
      </div>
    </div>
  );
}

function PasswordField({
  autoComplete,
  label,
  name,
  onChange,
  onToggle,
  placeholder,
  shown,
  value,
  rules,
  confirmationState,
}) {
  return (
    <div>
      <label htmlFor={`register-${name}`} className="mb-2 block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <input
          id={`register-${name}`}
          type={shown ? 'text' : 'password'}
          name={name}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="h-12 w-full rounded-md border border-gray-200 bg-white pl-10 pr-10 text-gray-900 outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          required
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label={shown ? 'Nascondi password' : 'Mostra password'}
        >
          {shown ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>
      {rules?.length > 0 && (
        <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
          <p className="text-xs font-semibold uppercase text-gray-500">Requisiti password</p>
          <div className="mt-2 grid gap-1">
            {rules.map((rule) => (
              <div key={rule.label} className={`flex items-center gap-2 text-sm ${rule.passed ? 'text-green-700' : value ? 'text-red-700' : 'text-gray-500'}`}>
                {rule.passed ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <XCircle className="h-4 w-4" aria-hidden="true" />}
                <span>{rule.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {confirmationState !== undefined && confirmationState !== null && (
        <div className={`mt-2 flex items-center gap-2 text-sm ${confirmationState ? 'text-green-700' : 'text-red-700'}`}>
          {confirmationState ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <XCircle className="h-4 w-4" aria-hidden="true" />}
          <span>{confirmationState ? 'Le password coincidono' : 'Le password non coincidono'}</span>
        </div>
      )}
    </div>
  );
}
