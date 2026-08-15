async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    return { data: null, error: { message: payload.error || `Errore HTTP ${response.status}` } };
  }
  return { data: payload, error: null };
}

class LocalQueryBuilder {
  constructor(table) {
    this.table = table;
    this._select = '*';
    this._filters = [];
    this._or = '';
    this._limit = 100;
    this._single = false;
    this._update = null;
    this._upsert = null;
  }

  select(columns = '*') {
    this._select = columns;
    return this;
  }

  eq(column, value) {
    this._filters.push({ op: 'eq', column, value });
    return this;
  }

  neq(column, value) {
    this._filters.push({ op: 'neq', column, value });
    return this;
  }

  is(column, value) {
    this._filters.push({ op: 'is', column, value });
    return this;
  }

  not(column, op, value) {
    this._filters.push({ op: op === 'is' ? 'not_is' : `not_${op}`, column, value });
    return this;
  }

  or(value) {
    this._or = value;
    return this;
  }

  in(column, values) {
    this._filters.push({ op: 'in', column, value: values });
    return this;
  }

  order() {
    return this;
  }

  limit(value) {
    this._limit = value;
    return this;
  }

  maybeSingle() {
    this._single = true;
    return this.execute();
  }

  single() {
    this._single = true;
    return this.execute();
  }

  update(row) {
    this._update = row;
    return this;
  }

  upsert(row) {
    this._upsert = row;
    return this.execute();
  }

  async execute() {
    if (this._upsert && this.table === 'profiles') {
      const { data, error } = await requestJson('/api/local-data', {
        method: 'POST',
        body: JSON.stringify({ table: this.table, action: 'upsert_profile', row: this._upsert }),
      });
      return { data: data?.data || null, error };
    }

    if (this._update && this.table === 'clinics') {
      const { data, error } = await requestJson('/api/local-data', {
        method: 'POST',
        body: JSON.stringify({ table: this.table, action: 'update_clinic', row: this._update, filters: this._filters }),
      });
      return { data: data?.data || null, error };
    }

    const params = new URLSearchParams({
      table: this.table,
      select: this._select,
      limit: String(this._limit || 100),
      filters: JSON.stringify(this._filters),
    });
    if (this._or) params.set('or', this._or);
    if (this._single) params.set('single', '1');
    const { data, error } = await requestJson(`/api/local-data?${params.toString()}`);
    return { data: data?.data ?? null, error };
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }
}

let listeners = new Set();

async function emitAuthChange(event, session) {
  for (const listener of listeners) listener(event, session);
}

export const supabaseBrowser = {
  auth: {
    async getSession() {
      const { data, error } = await requestJson('/api/local-auth?action=session');
      return { data: { session: data?.session || null }, error };
    },
    async getUser() {
      const { data, error } = await requestJson('/api/local-auth?action=session');
      return { data: { user: data?.user || null }, error };
    },
    async signInWithPassword({ email, password }) {
      const { data, error } = await requestJson('/api/local-auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'login', email, password }),
      });
      if (!error) await emitAuthChange('SIGNED_IN', data?.session || null);
      return { data: { session: data?.session || null, user: data?.user || null }, error };
    },
    async signUp({ email, password, options }) {
      const { data, error } = await requestJson('/api/local-auth', {
        method: 'POST',
        body: JSON.stringify({
          action: 'register',
          email,
          password,
          full_name: options?.data?.full_name,
          role: options?.data?.user_type,
        }),
      });
      if (!error) await emitAuthChange('SIGNED_IN', data?.session || null);
      return { data: { session: data?.session || null, user: data?.user || null }, error };
    },
    async signOut() {
      const { error } = await requestJson('/api/local-auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'logout' }),
      });
      if (!error) await emitAuthChange('SIGNED_OUT', null);
      return { error };
    },
    async signInWithOAuth({ provider, options } = {}) {
      if (provider !== 'google') {
        return { data: null, error: { message: 'Provider OAuth non supportato.' } };
      }
      const redirectTo = options?.redirectTo || `${window.location.origin}/auth/callback`;
      let finalRedirect = redirectTo;
      try {
        const redirectUrl = new URL(redirectTo);
        if (redirectUrl.pathname === '/auth/callback') {
          finalRedirect = redirectUrl.searchParams.get('redirect_to') || '/';
        }
      } catch {
        finalRedirect = redirectTo;
      }
      const startUrl = new URL('/api/local-auth/google/start', window.location.origin);
      startUrl.searchParams.set('redirect_to', finalRedirect);
      window.location.assign(startUrl.toString());
      return { data: { url: startUrl.toString() }, error: null };
    },
    async resetPasswordForEmail() {
      return { data: null, error: { message: 'Reset password non ancora disponibile con auth locale. Contatta la redazione.' } };
    },
    async updateUser() {
      return { data: null, error: { message: 'Aggiornamento password non ancora disponibile con auth locale.' } };
    },
    async exchangeCodeForSession() {
      return { data: null, error: { message: 'Callback OAuth non disponibile con auth locale.' } };
    },
    async setSession() {
      return { data: null, error: { message: 'Sessione esterna non supportata.' } };
    },
    onAuthStateChange(callback) {
      listeners.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => listeners.delete(callback),
          },
        },
      };
    },
  },
  from(table) {
    return new LocalQueryBuilder(table);
  },
  async rpc(fn, params) {
    const { data, error } = await requestJson('/api/local-rpc', {
      method: 'POST',
      body: JSON.stringify({ fn, params }),
    });
    return { data: data?.data || null, error };
  },
};
