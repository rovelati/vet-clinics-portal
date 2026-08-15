import type { APIRoute } from 'astro';
import { query } from '@/lib/local-db';
import { requireLocalUser } from '@/lib/local-auth';

const allowedTables = new Set(['profiles', 'clinics', 'claims']);

const json = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

function safeIdentifier(value: string) {
  if (!/^[a-z_][a-z0-9_]*$/i.test(value)) throw new Error('Identificatore non valido.');
  return value;
}

function parseFilters(url: URL) {
  try {
    return JSON.parse(url.searchParams.get('filters') || '[]') as Array<{ op: string; column: string; value: any }>;
  } catch {
    return [];
  }
}

function selectClause(table: string, select: string | null) {
  if (!select || select.trim() === '*' || select.includes('\n')) return '*';
  if (select.includes(':') || select.includes('(')) return '*';
  const columns = select.split(',').map((item) => item.trim()).filter(Boolean);
  if (!columns.length) return '*';
  return columns.map(safeIdentifier).map((column) => `"${column}"`).join(', ');
}

function addFilter(where: string[], params: any[], filter: { op: string; column: string; value: any }) {
  const column = filter.column;
  const param = () => {
    params.push(filter.value);
    return `$${params.length}`;
  };

  if (column.includes('->>')) {
    const [base, key] = column.split('->>').map((part) => part.trim());
    const expression = `"${safeIdentifier(base)}"->>'${key.replace(/[^a-z0-9_ -]/gi, '')}'`;
    if (filter.op === 'eq') where.push(`${expression} = ${param()}`);
    if (filter.op === 'ilike') where.push(`${expression} ilike ${param()}`);
    return;
  }

  const expression = `"${safeIdentifier(column)}"`;
  if (filter.op === 'eq') where.push(`${expression} = ${param()}`);
  if (filter.op === 'neq') where.push(`${expression} <> ${param()}`);
  if (filter.op === 'in' && Array.isArray(filter.value) && filter.value.length) {
    params.push(filter.value.map((value) => String(value)));
    where.push(`${expression}::text = ANY($${params.length}::text[])`);
  }
  if (filter.op === 'is') where.push(`${expression} is ${filter.value === null ? 'null' : 'not null'}`);
  if (filter.op === 'not_is') where.push(`${expression} is not null`);
}

function addOrFilter(where: string[], params: any[], value: string) {
  const parts = value.split(',').map((part) => part.trim()).filter(Boolean);
  const clauses = parts.map((part) => {
    const match = part.match(/^(.+?)\.ilike\.%(.+)%$/);
    if (!match) return null;
    const [, column, rawValue] = match;
    params.push(`%${rawValue.replace(/[%]/g, '')}%`);
    const placeholder = `$${params.length}`;
    if (column.includes('->>')) {
      const [base, key] = column.split('->>').map((item) => item.trim());
      return `"${safeIdentifier(base)}"->>'${key.replace(/[^a-z0-9_ -]/gi, '')}' ilike ${placeholder}`;
    }
    return `"${safeIdentifier(column)}" ilike ${placeholder}`;
  }).filter(Boolean);
  if (clauses.length) where.push(`(${clauses.join(' or ')})`);
}

export const GET: APIRoute = async (context) => {
  const table = context.url.searchParams.get('table') || '';
  if (!allowedTables.has(table)) return json({ success: false, error: 'Tabella non consentita.' }, 403);

  const { user } = await requireLocalUser(context);
  const select = selectClause(table, context.url.searchParams.get('select'));
  const where: string[] = [];
  const params: any[] = [];

  for (const filter of parseFilters(context.url)) addFilter(where, params, filter);
  const or = context.url.searchParams.get('or');
  if (or) addOrFilter(where, params, or);

  if (table === 'profiles') {
    if (!user) return json({ success: false, error: 'Sessione richiesta.' }, 401);
    where.push(`id = $${params.push(user.id)}`);
  }
  if (table === 'claims') {
    if (!user) return json({ success: false, error: 'Sessione richiesta.' }, 401);
    where.push(`user_id = $${params.push(user.id)}`);
  }

  const limit = Math.max(1, Math.min(1000, Number(context.url.searchParams.get('limit') || '100')));
  const single = context.url.searchParams.get('single') === '1';
  const sql = `select ${select} from public.${safeIdentifier(table)}${where.length ? ` where ${where.join(' and ')}` : ''} limit ${single ? 1 : limit}`;

  try {
    const { rows } = await query(sql, params);
    return json({ success: true, data: single ? (rows[0] || null) : rows });
  } catch (error: any) {
    return json({ success: false, error: error?.message || 'Query non riuscita.' }, 500);
  }
};

export const POST: APIRoute = async (context) => {
  const body = await context.request.json().catch(() => ({}));
  const table = String(body.table || '');
  const action = String(body.action || '');
  if (!allowedTables.has(table)) return json({ success: false, error: 'Tabella non consentita.' }, 403);

  const { user } = await requireLocalUser(context);
  if (!user) return json({ success: false, error: 'Sessione richiesta.' }, 401);

  if (action === 'upsert_profile') {
    const row = body.row || {};
    const fullName = String(row.full_name || user.full_name || user.email.split('@')[0]).trim();
    const role = ['admin', 'veterinario', 'proprietario'].includes(row.role) ? row.role : user.role;
    const phone = row.phone || null;
    const city = row.city || null;
    const result = await query(
      `insert into public.profiles (id, full_name, role, phone, city, updated_at)
       values ($1, $2, $3::public.user_role, $4, $5, now())
       on conflict (id) do update set full_name = excluded.full_name, role = excluded.role, phone = excluded.phone, city = excluded.city, updated_at = now()
       returning *`,
      [user.id, fullName, role, phone, city]
    );
    return json({ success: true, data: result.rows[0] });
  }

  if (action === 'update_clinic') {
    const row = body.row || {};
    const filters = Array.isArray(body.filters) ? body.filters : [];
    const id = filters.find((filter: any) => filter.column === 'id' && filter.op === 'eq')?.value;
    if (!id) return json({ success: false, error: 'ID clinica richiesto.' }, 422);

    const allowed = ['name', 'specialization', 'address', 'phone', 'email', 'website', 'description', 'hours', 'status', 'updated_at'];
    const keys = Object.keys(row).filter((key) => allowed.includes(key));
    if (!keys.length) return json({ success: false, error: 'Nessun campo aggiornabile.' }, 422);
    const params = keys.map((key) => row[key]);
    params.push(id, user.id);
    const setSql = keys.map((key, index) => `"${key}" = $${index + 1}`).join(', ');
    const result = await query(
      `update public.clinics set ${setSql} where id = $${params.length - 1} and owner_id = $${params.length} returning *`,
      params
    );
    if (!result.rows[0]) return json({ success: false, error: 'Scheda non trovata o non associata all account.' }, 404);
    return json({ success: true, data: result.rows[0] });
  }

  return json({ success: false, error: 'Azione non valida.' }, 400);
};
