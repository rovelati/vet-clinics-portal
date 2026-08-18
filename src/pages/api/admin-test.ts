import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { loadSpiderEnv, resolveToolsRoot } from '@/lib/admin-tools';
import WebSocket from 'ws';
import { localDb, query } from '@/lib/local-db';
import { sendClaimApprovedOwnerEmail } from '@/lib/claim-emails';
import { requireLocalUser } from '@/lib/local-auth';

const supabaseUrl = import.meta.env.LOCAL_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
const allowUnauth = import.meta.env.ADMIN_TEST_ALLOW_UNAUTH === 'true';

const json = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

const admin = supabaseUrl && serviceKey
  ? createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
      global: import.meta.env.LOCAL_SUPABASE_URL ? { fetch: localPostgrestFetch } : undefined,
      realtime: { transport: WebSocket },
    })
  : null;

function localPostgrestFetch(input: RequestInfo | URL, init?: RequestInit) {
  const sourceUrl = input instanceof Request ? input.url : String(input);
  const url = new URL(sourceUrl);
  url.pathname = url.pathname.replace(/^\/rest\/v1\/?/, '/');
  const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
  headers.delete('apikey');
  headers.delete('authorization');
  return fetch(url, { ...init, headers });
}

async function requireAdmin(context: Parameters<APIRoute>[0]) {
  if (allowUnauth) return { ok: true as const, userId: null };

  const { user } = await requireLocalUser(context);
  if (!user?.id) {
    return { ok: false as const, response: json({ success: false, error: 'Sessione non valida o scaduta.' }, 401) };
  }

  if (user.role !== 'admin') {
    return { ok: false as const, response: json({ success: false, error: 'Permessi admin insufficienti.' }, 403) };
  }

  return {
    ok: true as const,
    userId: user.id,
    profile: {
      id: user.id,
      role: user.role,
      full_name: user.full_name,
      email: user.email,
    },
  };
}

function pickClinicUpdate(clinic: Record<string, any>) {
  const keys = [
    'name',
    'slug',
    'address',
    'street',
    'city',
    'province',
    'region',
    'cap',
    'country',
    'phone',
    'email',
    'website',
    'place_id',
    'maps_url',
    'lat',
    'lng',
    'hours',
    'source_url',
    'rating_avg_cached',
    'rating_count_cached',
    'status',
    'gallery_images',
  ];
  return Object.fromEntries(keys.filter((key) => key in clinic).map((key) => [key, clinic[key] ?? null]));
}

function blogSlug(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'articolo-veterinario';
}

async function uniqueBlogSlug(title: string, articleId: string) {
  const base = blogSlug(title);
  for (let suffix = 0; suffix < 100; suffix += 1) {
    const candidate = suffix ? `${base}-${suffix + 1}` : base;
    const { rows } = await query(
      `select id from public.veterinary_blog_articles where slug = $1 and id::text <> $2 limit 1`,
      [candidate, articleId]
    );
    if (!rows[0]) return candidate;
  }
  return `${base}-${Date.now()}`;
}

async function countWhere(table: string, where = 'true') {
  const { rows } = await query<{ count: number }>(`select count(*)::int as count from ${table} where ${where}`);
  return Number(rows[0]?.count || 0);
}

async function statsAction() {
  const [
    total,
    withGmb,
    withDeepSeek,
    withWebsite,
    withEmail,
    withWebsiteSpidered,
    withCoordinates,
    withRating,
    registeredUsers,
    registeredPetLovers,
    registeredVeterinarians,
    registeredAdmins,
    localAuthUsers,
    localAuthPetLovers,
    localAuthVeterinarians,
    claimedClinics,
    approvedClaims,
    quoteRequests,
    quoteRequestsSent,
  ] = await Promise.all([
    countWhere('public.clinics'),
    countWhere('public.clinics', `gmb_status is not null and gmb_status <> 'pending'`),
    countWhere('public.clinics', `deepupdate_status = 'completed'`),
    countWhere('public.clinics', `website is not null`),
    countWhere('public.clinics', `email is not null and email <> ''`),
    countWhere('public.clinics', `website_spidered_at is not null`),
    countWhere('public.clinics', `lat is not null and lng is not null`),
    countWhere('public.clinics', `rating_avg_cached is not null`),
    countWhere('public.profiles'),
    countWhere('public.profiles', `role = 'proprietario'`),
    countWhere('public.profiles', `role = 'veterinario'`),
    countWhere('public.profiles', `role = 'admin'`),
    countWhere('public.local_auth_users'),
    countWhere('public.local_auth_users', `role = 'proprietario'`),
    countWhere('public.local_auth_users', `role = 'veterinario'`),
    countWhere('public.clinics', `owner_id is not null`),
    countWhere('public.claims', `status = 'approved'`),
    countWhere('public.quote_requests'),
    countWhere('public.quote_requests', `status = 'sent'`),
  ]);

  const { rows: reviewRows } = await query<{ count: number }>(
    `select count(distinct clinic_id)::int as count from public.google_reviews where clinic_id is not null`
  );
  const withReviews = Number(reviewRows[0]?.count || 0);

  const { rows: serviceRows } = await query<{ count: number }>(
    `select count(*)::int as count
     from public.clinics
     where cardinality(coalesce(service_ids, '{}'::uuid[])) > 0`
  );
  const withServices = Number(serviceRows[0]?.count || 0);

  const { rows: fnoviRows } = await query<{
    exact_matches: number;
    matched_clinics: number;
    unique_matches: number;
    collected_emails: number;
    clinics_with_services: number;
    mapped_services: number;
    unmapped_services: number;
    semantic_clinics: number;
    semantic_suggestions: number;
  }>(
    `select
       (select count(*)::int
          from public.vets_match_pg_fnovi m
          join public.clinics mc on mc.id = m.clinic_id
         where m.score >= 100 and coalesce(mc.status::text, '') <> 'rimossa') as exact_matches,
       count(*) filter (
         where c.fnovi_id is not null and coalesce(c.status::text, '') <> 'rimossa'
       )::int as matched_clinics,
       count(distinct c.fnovi_id) filter (
         where c.fnovi_id is not null and coalesce(c.status::text, '') <> 'rimossa'
       )::int as unique_matches,
       count(distinct nullif(trim(c.raw_import->'fnovi'->>'email'), '')) filter (
         where coalesce(c.status::text, '') <> 'rimossa'
       )::int as collected_emails,
       count(*) filter (
         where coalesce(c.status::text, '') <> 'rimossa'
           and jsonb_array_length(
             case when jsonb_typeof(c.raw_import->'fnovi'->'servizi_mappati') = 'array'
               then c.raw_import->'fnovi'->'servizi_mappati' else '[]'::jsonb end
           ) > 0
       )::int as clinics_with_services,
       coalesce(sum(jsonb_array_length(
         case when jsonb_typeof(c.raw_import->'fnovi'->'servizi_mappati') = 'array'
           then c.raw_import->'fnovi'->'servizi_mappati' else '[]'::jsonb end
       )) filter (where coalesce(c.status::text, '') <> 'rimossa'), 0)::int as mapped_services,
       coalesce(sum(jsonb_array_length(
         case when jsonb_typeof(c.raw_import->'fnovi'->'servizi_non_mappati') = 'array'
           then c.raw_import->'fnovi'->'servizi_non_mappati' else '[]'::jsonb end
       )) filter (where coalesce(c.status::text, '') <> 'rimossa'), 0)::int as unmapped_services,
       count(*) filter (
         where coalesce(c.status::text, '') <> 'rimossa'
           and jsonb_array_length(
             case when jsonb_typeof(c.deepupdate_payload->'fnovi_semantic_service_suggestions'->'items') = 'array'
               then c.deepupdate_payload->'fnovi_semantic_service_suggestions'->'items' else '[]'::jsonb end
           ) > 0
       )::int as semantic_clinics,
       coalesce(sum(jsonb_array_length(
         case when jsonb_typeof(c.deepupdate_payload->'fnovi_semantic_service_suggestions'->'items') = 'array'
           then c.deepupdate_payload->'fnovi_semantic_service_suggestions'->'items' else '[]'::jsonb end
       )) filter (where coalesce(c.status::text, '') <> 'rimossa'), 0)::int as semantic_suggestions
     from public.clinics c`
  );
  const fnoviStats = fnoviRows[0] || {
    exact_matches: 0,
    matched_clinics: 0,
    unique_matches: 0,
    collected_emails: 0,
    clinics_with_services: 0,
    mapped_services: 0,
    unmapped_services: 0,
    semantic_clinics: 0,
    semantic_suggestions: 0,
  };

  const { rows: hoursRows } = await query<{ count: number }>(
    `select count(*)::int as count
     from public.clinics
     where hours is not null and hours::text not in ('{}', 'null', '')`
  );
  const withHours = Number(hoursRows[0]?.count || 0);

  return {
    total,
    withGmb,
    withReviews,
    withDeepSeek,
    withWebsite,
    withEmail,
    withWebsiteSpidered,
    withCoordinates,
    withServices,
    withRating,
    withHours,
    withoutHours: Math.max(0, total - withHours),
    registeredUsers,
    registeredPetLovers,
    registeredVeterinarians,
    registeredAdmins,
    localAuthUsers,
    localAuthPetLovers,
    localAuthVeterinarians,
    claimedClinics,
    approvedClaims,
    quoteRequests,
    quoteRequestsSent,
    fnoviExactMatches: Number(fnoviStats.exact_matches || 0),
    fnoviMatchedClinics: Number(fnoviStats.matched_clinics || 0),
    fnoviUniqueMatches: Number(fnoviStats.unique_matches || 0),
    fnoviCollectedEmails: Number(fnoviStats.collected_emails || 0),
    fnoviClinicsWithServices: Number(fnoviStats.clinics_with_services || 0),
    fnoviMappedServices: Number(fnoviStats.mapped_services || 0),
    fnoviUnmappedServices: Number(fnoviStats.unmapped_services || 0),
    fnoviSemanticClinics: Number(fnoviStats.semantic_clinics || 0),
    fnoviSemanticSuggestions: Number(fnoviStats.semantic_suggestions || 0),
  };
}

async function quoteRequestsListAction(payload: Record<string, any>) {
  const search = String(payload.search || '').trim();
  const status = String(payload.status || 'all').trim();
  const limit = Math.min(200, Math.max(1, Number(payload.limit || 100)));
  const params: any[] = [];
  const where: string[] = [];

  if (status && status !== 'all') {
    params.push(status);
    where.push(`qr.status = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    where.push(`(
      qr.service_name ilike $${params.length}
      or qr.service_slug ilike $${params.length}
      or qr.location_label ilike $${params.length}
      or qr.requester_email ilike $${params.length}
      or qr.requester_name ilike $${params.length}
      or qr.requester_phone ilike $${params.length}
      or qr.message ilike $${params.length}
    )`);
  }

  params.push(limit);

  const { rows } = await query<any>(
    `select
       qr.id::text,
       qr.user_id::text,
       qr.service_slug,
       qr.service_name,
       qr.location_label,
       qr.requester_name,
       qr.requester_email,
       qr.requester_phone,
       qr.message,
       qr.clinic_ids,
       qr.clinic_emails,
       cardinality(coalesce(qr.clinic_ids, '{}'::text[]))::int as clinic_count,
       cardinality(coalesce(qr.clinic_emails, '{}'::text[]))::int as email_count,
       qr.status,
       qr.clinic_email_status,
       qr.admin_email_status,
       qr.email_errors,
       qr.metadata,
       qr.created_at,
       qr.updated_at,
       coalesce(lu.email, au.email) as user_email,
       coalesce(lu.full_name, p.full_name) as user_full_name,
       coalesce(clinic_rows.clinics, '[]'::jsonb) as clinics
     from public.quote_requests qr
     left join public.profiles p on p.id = qr.user_id
     left join public.local_auth_users lu on lu.id = qr.user_id
     left join auth.users au on au.id = qr.user_id
     left join lateral (
       select jsonb_agg(
         jsonb_build_object(
           'id', c.id::text,
           'name', c.name,
           'slug', c.slug,
           'email', c.email,
           'status', c.status::text,
           'phone', c.phone,
           'city', c.city,
           'province', c.province
         )
         order by c.name
       ) as clinics
       from public.clinics c
       where c.id::text = any(coalesce(qr.clinic_ids, '{}'::text[]))
     ) clinic_rows on true
     ${where.length ? `where ${where.join(' and ')}` : ''}
     order by qr.created_at desc
     limit $${params.length}`,
    params
  );

  return rows || [];
}

async function marketingReportAction(payload: Record<string, any>) {
  const days = Math.min(365, Math.max(1, Number(payload.days || 30)));
  const status = String(payload.status || 'all').trim();
  const search = String(payload.search || '').trim();
  const limit = Math.min(300, Math.max(1, Number(payload.limit || 100)));
  const params: any[] = [days];
  const where: string[] = [`o.created_at >= now() - ($1::int * interval '1 day')`];

  if (status && status !== 'all') {
    params.push(status);
    where.push(`o.status = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    where.push(`(
      c.name ilike $${params.length}
      or c.slug ilike $${params.length}
      or c.city ilike $${params.length}
      or c.province ilike $${params.length}
      or o.recipient_email ilike $${params.length}
      or o.subject ilike $${params.length}
      or o.campaign_key ilike $${params.length}
    )`);
  }

  const whereSql = where.join(' and ');

  const [summaryResult, dailyResult, queueResult, targetResult, rowsResult] = await Promise.all([
    query<any>(
      `select
         count(*)::int as total,
         count(*) filter (where o.status = 'pending')::int as pending,
         count(*) filter (where o.status = 'sent')::int as sent,
         count(*) filter (where o.status = 'failed')::int as failed,
         count(*) filter (where o.clicked_at is not null)::int as clicked,
         count(*) filter (where o.registered_at is not null or o.registered_user_id is not null)::int as registered,
         count(*) filter (where o.claimed_at is not null)::int as claimed,
         count(*) filter (where o.lead_summary->>'queue_type' = 'direct_contact')::int as direct_contact,
         count(*) filter (where o.lead_summary->>'queue_type' = 'quote_reminder')::int as quote_reminder,
         max(o.sent_at) as last_sent_at,
         max(o.clicked_at) as last_clicked_at
       from public.clinic_marketing_outreach o
       join public.clinics c on c.id = o.clinic_id
       where ${whereSql}`,
      params
    ),
    query<any>(
      `select
         date_trunc('day', coalesce(o.sent_at, o.created_at))::date as day,
         count(*)::int as total,
         count(*) filter (where o.status = 'sent')::int as sent,
         count(*) filter (where o.status = 'failed')::int as failed,
         count(*) filter (where o.clicked_at is not null)::int as clicked,
         count(*) filter (where o.registered_at is not null or o.registered_user_id is not null)::int as registered,
         count(*) filter (where o.claimed_at is not null)::int as claimed
       from public.clinic_marketing_outreach o
       join public.clinics c on c.id = o.clinic_id
       where ${whereSql}
       group by 1
       order by 1 desc
       limit 45`,
      params
    ),
    query<any>(
      `select
         coalesce(nullif(o.lead_summary->>'queue_type', ''), 'non_classificata') as queue_type,
         count(*)::int as total,
         count(*) filter (where o.status = 'sent')::int as sent,
         count(*) filter (where o.clicked_at is not null)::int as clicked,
         count(*) filter (where o.registered_at is not null or o.registered_user_id is not null)::int as registered,
         count(*) filter (where o.claimed_at is not null)::int as claimed
       from public.clinic_marketing_outreach o
       join public.clinics c on c.id = o.clinic_id
       where ${whereSql}
       group by 1
       order by total desc`,
      params
    ),
    query<any>(
      `select
         coalesce(nullif(o.last_click_target, ''), 'non_specificato') as target,
         count(*)::int as clicks
       from public.clinic_marketing_outreach o
       join public.clinics c on c.id = o.clinic_id
       where ${whereSql}
         and o.clicked_at is not null
       group by 1
       order by clicks desc`,
      params
    ),
    query<any>(
      `select
         o.id::text,
         o.clinic_id::text,
         c.name as clinic_name,
         c.slug as clinic_slug,
         c.city as clinic_city,
         c.province as clinic_province,
         o.campaign_key,
         o.recipient_email,
         o.subject,
         o.status,
         o.lead_summary,
         o.sent_at,
         o.clicked_at,
         o.last_click_target,
         o.registered_at,
         o.claimed_at,
         o.error,
         o.created_at,
         o.updated_at
       from public.clinic_marketing_outreach o
       join public.clinics c on c.id = o.clinic_id
       where ${whereSql}
       order by o.created_at desc
       limit $${params.length + 1}`,
      [...params, limit]
    ),
  ]);

  const summary = summaryResult.rows[0] || {};
  const sent = Number(summary.sent || 0);
  const clicked = Number(summary.clicked || 0);
  const registered = Number(summary.registered || 0);
  const claimed = Number(summary.claimed || 0);

  return {
    summary: {
      ...summary,
      ctr: sent ? clicked / sent : 0,
      registrationRate: sent ? registered / sent : 0,
      claimRate: sent ? claimed / sent : 0,
      openTrackingAvailable: false,
    },
    daily: dailyResult.rows || [],
    queues: queueResult.rows || [],
    targets: targetResult.rows || [],
    rows: rowsResult.rows || [],
  };
}

async function loadClaimDetails(claimId: string) {
  const { rows } = await query<any>(
    `select
       claims.*,
       c.id as clinic_id,
       c.name as clinic_name,
       c.slug as clinic_slug,
       c.address as clinic_address,
       c.city as clinic_city,
       c.province as clinic_province,
       c.phone as clinic_phone,
       c.email as clinic_email,
       c.website as clinic_website,
       c.status::text as clinic_status,
       p.full_name as profile_full_name,
       coalesce(lu.email, au.email) as user_email,
       coalesce(lu.full_name, p.full_name) as user_full_name
     from public.claims claims
     left join public.clinics c on c.id = claims.clinic_id
     left join public.profiles p on p.id = claims.user_id
     left join public.local_auth_users lu on lu.id = claims.user_id
     left join auth.users au on au.id = claims.user_id
     where claims.id = $1
     limit 1`,
    [claimId]
  );
  return rows[0] || null;
}

async function runEnrichment(kind: string, payload: Record<string, any>) {
  const toolsRoot = resolveToolsRoot();
  const scripts: Record<string, string> = {
    paginegialle: 'SPIDER/scrape_paginegialle_reviews.py',
    gmb: 'SPIDER/arricchisci-clinic-gmb.py',
    fnovi: 'SPIDER/arricchisci-clinic-fnovi.py',
    website: 'SPIDER/arricchisci-clinic-website-prices.py',
    deepseek: 'SPIDER/update-withdeepseek.py',
    complete: 'SPIDER/refresh_clinic_complete.py',
    // Salva WebP su filesystem pubblico /media/gallery/clinics (non Supabase Storage)
    images: 'SPIDER/backfill_clinic_images_local.py',
  };
  const script = scripts[kind];
  if (!script) throw new Error(`Arricchimento non riconosciuto: ${kind}`);
  const scriptPath = path.join(toolsRoot, script);
  if (!existsSync(scriptPath)) {
    return {
      success: false,
      error: [`Script non trovato: ${scriptPath}`, 'Configura ADMIN_TOOLS_ROOT o copia codebase/SPIDER sul server.'],
    };
  }

  const args = [scriptPath, '--clinic-id', String(payload.clinic_id)];
  if (kind === 'paginegialle') {
    if (!payload.source_url) {
      return { success: false, error: ['source_url PagineGialle mancante sulla clinica.'] };
    }
    args.push('--url', String(payload.source_url), '--limit', '8');
  }
  if (kind === 'gmb') {
    // Persiste foto su filesystem pubblico (URL permanenti /media/...)
    args.push('--use-cache', '--upload-images');
    if (payload.gmb_query) args.push('--gmb-query', String(payload.gmb_query));
    if (payload.place_id) args.push('--place-id', String(payload.place_id));
  }
  if (kind === 'fnovi') {
    // In admin forzato: consente di rieseguire anche se già arricchita
    args.push('--force');
  }
  if (kind === 'deepseek') args.push('--review-limit', '8', '--include-completed');
  // refresh_clinic_complete.py usa --clinic-id (source_url la legge dal DB)
  if (kind === 'images') args.push('--include-existing', '--max-candidates', '8');

  const spiderEnv = loadSpiderEnv(toolsRoot);

  return await new Promise((resolve) => {
    const child = spawn('python3', args, {
      cwd: path.join(toolsRoot, 'SPIDER'),
      env: {
        ...process.env,
        ...spiderEnv,
        SUPABASE_URL: supabaseUrl || process.env.SUPABASE_URL || '',
        SUPABASE_SERVICE_ROLE_KEY: serviceKey || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        PYTHONUNBUFFERED: '1',
      },
    });
    const out: string[] = [];
    const err: string[] = [];
    child.stdout.on('data', (chunk) => out.push(String(chunk)));
    child.stderr.on('data', (chunk) => err.push(String(chunk)));
    child.on('close', (code) => {
      resolve({
        success: code === 0,
        returncode: code,
        command: `python3 ${args.map((part) => (/\s/.test(part) ? `"${part}"` : part)).join(' ')}`,
        output: out.join('').split('\n').filter(Boolean).slice(-120),
        error: err.join('').split('\n').filter(Boolean).slice(-120),
      });
    });
    child.on('error', (error) => {
      resolve({ success: false, error: [error.message] });
    });
    setTimeout(() => {
      child.kill('SIGTERM');
      resolve({ success: false, error: ['Timeout: processo oltre 10 minuti.'] });
    }, 600000);
  });
}

function slugify(value: string) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function readToolEnv(key: string) {
  const direct = import.meta.env[key] || process.env[key];
  if (direct) return direct;
  const toolsRoot = import.meta.env.ADMIN_TOOLS_ROOT || path.resolve(process.cwd(), '..', 'codebase');
  const envPath = path.join(toolsRoot, 'SPIDER', '.env');
  if (!existsSync(envPath)) return null;
  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const clean = line.trim();
    if (!clean || clean.startsWith('#') || !clean.includes('=')) continue;
    const [rawKey, ...parts] = clean.replace(/^export\s+/, '').split('=');
    if (rawKey.trim() === key) return parts.join('=').trim().replace(/^["']|["']$/g, '');
  }
  return null;
}

function normalizeIntegratore(row: Record<string, any>, userId?: string | null) {
  const title = String(row.titolo || '').trim();
  const slug = String(row.slug || slugify(title)).trim();
  return {
    slug,
    titolo: title,
    descrizione_breve: row.descrizione_breve || null,
    descrizione_completa: row.descrizione_completa || null,
    foto_url: row.foto_url || null,
    categoria_id: row.categoria_id || null,
    amazon_url: row.amazon_url || null,
    amazon_valutazione: row.amazon_valutazione === '' || row.amazon_valutazione == null ? null : Number(row.amazon_valutazione),
    faq: Array.isArray(row.faq) ? row.faq : [],
    affiliate_link: row.affiliate_link || null,
    affiliate_source: row.affiliate_source || 'amazon',
    status: row.status || 'draft',
    metadata: row.metadata && typeof row.metadata === 'object' ? row.metadata : {},
    ...(userId ? { created_by: userId } : {}),
  };
}

function asinFromAmazonUrl(url: string) {
  const match = String(url || '').match(/(?:\/dp\/|\/gp\/product\/|asin=)([A-Z0-9]{10})/i);
  return match?.[1]?.toUpperCase() || null;
}

async function generateIntegratorContent(productData: Record<string, any>, template?: string) {
  const apiKey = readToolEnv('DEEPSEEK_API_KEY');
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY non configurata.');

  const prompt = template || `Scrivi un articolo completo e dettagliato su questo integratore per animali domestici.

Dati prodotto:
- Nome: ${productData.title || productData.titolo || 'N/A'}
- Valutazione: ${productData.rating || productData.amazon_valutazione || 'N/A'} stelle
- Prezzo: ${productData.price || 'N/A'}
- Descrizione: ${productData.description || productData.descrizione_breve || 'N/A'}

L'articolo deve includere introduzione, benefici, composizione, modalita d'uso, quando e consigliato, possibili effetti collaterali e conclusioni. Scrivi in italiano con tono professionale e accessibile.`;

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'Sei un esperto veterinario e scrittore di contenuti per animali domestici.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2200,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || 'Errore generazione contenuto DeepSeek.');
  return data?.choices?.[0]?.message?.content || '';
}

async function generateIntegratorImage(prompt: string, width = 1024, height = 1024) {
  const apiKey = readToolEnv('RUNWARE_API_KEY');
  if (!apiKey) throw new Error('RUNWARE_API_KEY non configurata.');

  const taskUUID = crypto.randomUUID();
  const response = await fetch('https://api.runware.ai/v1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([
      { taskType: 'authentication', apiKey },
      {
        taskType: 'imageInference',
        taskUUID,
        positivePrompt: prompt,
        model: readToolEnv('RUNWARE_MODEL') || 'runware:101@1',
        width,
        height,
        numberResults: 1,
        outputType: 'URL',
      },
    ]),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || data?.error || 'Errore generazione immagine Runware.');
  const items = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  const image = items.find((item: any) => item?.taskType === 'imageInference' || item?.imageURL || item?.imageUrl);
  return image?.imageURL || image?.imageUrl || image?.imageURLS?.[0] || '';
}

export const POST: APIRoute = async (context) => {
  const { request } = context;
  const gate = await requireAdmin(context);
  if (!gate.ok) return gate.response;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: 'JSON non valido.' }, 400);
  }

  const action = body?.action;

  try {
    if (action === 'bootstrap') {
      const [stats, taxonomy] = await Promise.all([
        statsAction(),
        query(`select * from public.services_taxonomy order by category, name`).then(({ rows }) => rows || []),
      ]);
      return json({ success: true, stats, taxonomy, profile: gate.profile || null, allowUnauth });
    }

    if (action === 'stats') return json({ success: true, stats: await statsAction() });

    if (action === 'quotes.list') {
      return json({ success: true, rows: await quoteRequestsListAction(body) });
    }

    if (action === 'marketing.report') {
      return json({ success: true, ...(await marketingReportAction(body)) });
    }

    if (action === 'users.list') {
      const { rows } = await query(
        `select coalesce(p.id, lu.id, au.id)::text as id,
                coalesce(lu.email, au.email) as email,
                coalesce(lu.full_name, p.full_name, au.raw_user_meta_data->>'full_name') as full_name,
                coalesce(p.role::text, lu.role::text, au.raw_user_meta_data->>'role', 'proprietario') as role,
                greatest(
                  coalesce(p.updated_at, '-infinity'::timestamptz),
                  coalesce(lu.updated_at, '-infinity'::timestamptz),
                  coalesce(au.updated_at, '-infinity'::timestamptz)
                ) as updated_at,
                p.id is not null as has_profile,
                lu.id is not null as has_local_auth,
                au.id is not null as has_auth_user
           from public.profiles p
           full join public.local_auth_users lu on lu.id = p.id
           full join auth.users au on au.id = coalesce(p.id, lu.id)
          order by updated_at desc nulls last`
      );
      return json({ success: true, rows: rows || [] });
    }

    if (action === 'users.role') {
      const { id, role } = body;
      const { error } = await admin!.from('profiles').update({ role, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      return json({ success: true });
    }

    if (action === 'users.delete') {
      const id = String(body?.id || '').trim();
      if (!id) return json({ success: false, error: 'ID utente mancante.' }, 400);
      if (gate.userId && id === gate.userId) {
        return json({ success: false, error: 'Non puoi cancellare il tuo account admin mentre sei loggato.' }, 400);
      }

      const userRow = await query<{ id: string; role: string | null; email: string | null; full_name: string | null }>(
        `select p.id::text,
                p.role::text as role,
                coalesce(lu.email, au.email) as email,
                coalesce(lu.full_name, p.full_name) as full_name
           from public.profiles p
           left join public.local_auth_users lu on lu.id = p.id
           left join auth.users au on au.id = p.id
          where p.id::text = $1
          limit 1`,
        [id]
      );
      const target = userRow.rows[0];
      if (!target) return json({ success: false, error: 'Utente non trovato.' }, 404);
      if (target.role === 'admin') {
        return json({ success: false, error: 'Per sicurezza non e possibile cancellare un admin da questa azione.' }, 400);
      }

      if (!localDb) throw new Error('DATABASE_URL non configurato.');
      const client = await localDb.connect();
      try {
        await client.query('begin');
        await client.query(
          `update public.clinics
              set owner_id = null,
                  claimed_at = null,
                  updated_at = now()
            where owner_id::text = $1`,
          [id]
        );
        await client.query('delete from public.pet_share_links where owner_id::text = $1', [id]);
        await client.query('delete from public.pet_health_reminders where owner_id::text = $1', [id]);
        await client.query('delete from public.pet_expenses where owner_id::text = $1', [id]);
        await client.query('delete from public.pet_favorite_clinics where owner_id::text = $1', [id]);
        await client.query('delete from public.pet_owner_fiscal_profiles where owner_id::text = $1', [id]);
        await client.query('delete from public.pet_profiles where owner_id::text = $1', [id]);
        await client.query('delete from public.claims where user_id::text = $1', [id]);

        await client.query('delete from auth.mfa_amr_claims where session_id in (select id from auth.sessions where user_id::text = $1)', [id]);
        await client.query('delete from auth.refresh_tokens where session_id in (select id from auth.sessions where user_id::text = $1)', [id]);
        await client.query('delete from auth.sessions where user_id::text = $1', [id]);
        await client.query('delete from auth.identities where user_id::text = $1', [id]);
        await client.query('delete from auth.one_time_tokens where user_id::text = $1', [id]);
        await client.query('delete from auth.mfa_challenges where factor_id in (select id from auth.mfa_factors where user_id::text = $1)', [id]);
        await client.query('delete from auth.mfa_factors where user_id::text = $1', [id]);
        await client.query('delete from public.local_auth_users where id::text = $1', [id]);
        await client.query('delete from public.profiles where id::text = $1', [id]);
        await client.query('delete from auth.users where id::text = $1', [id]);
        await client.query('commit');
      } catch (error) {
        await client.query('rollback').catch(() => null);
        throw error;
      } finally {
        client.release();
      }

      return json({ success: true, deleted: { id, email: target.email, full_name: target.full_name } });
    }

    if (action === 'claims.list') {
      const { rows } = await query<any>(
        `select
           claims.*,
           coalesce(lu.email, au.email) as user_email,
           jsonb_build_object('id', p.id, 'full_name', coalesce(lu.full_name, p.full_name)) as profiles,
           jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'status', c.status::text) as clinics
         from public.claims claims
         left join public.profiles p on p.id = claims.user_id
         left join public.local_auth_users lu on lu.id = claims.user_id
         left join auth.users au on au.id = claims.user_id
         left join public.clinics c on c.id = claims.clinic_id
         order by claims.created_at desc nulls last`
      );
      return json({ success: true, rows });
    }

    if (action === 'claims.update') {
      const { claim_id, clinic_id, status } = body;
      if (!['approved', 'rejected', 'pending'].includes(String(status))) {
        return json({ success: false, error: 'Stato claim non valido.' }, 422);
      }

      const claim = await loadClaimDetails(String(claim_id));
      if (!claim) return json({ success: false, error: 'Claim non trovato.' }, 404);

      await query(
        `update public.claims
         set status = $2,
             approved_at = case when $2 = 'approved' then coalesce(approved_at, now()) else approved_at end
         where id = $1`,
        [claim_id, status]
      );

      if (status === 'approved' && clinic_id) {
        await query(
          `update public.clinics
           set status = 'pubblicata',
               owner_id = coalesce(owner_id, $2),
               claimed_at = coalesce(claimed_at, now()),
               updated_at = now()
           where id = $1`,
          [clinic_id, claim.user_id]
        );
      }
      if (status === 'rejected' && clinic_id) {
        await query(`update public.clinics set status = 'in_revisione', updated_at = now() where id = $1`, [clinic_id]);
      }

      let notification = null;
      if (status === 'approved' && claim.status !== 'approved' && !claim.owner_notified_at) {
        notification = await sendClaimApprovedOwnerEmail({
          claim: { id: claim.id, status, created_at: claim.created_at },
          clinic: {
            id: claim.clinic_id,
            name: claim.clinic_name,
            slug: claim.clinic_slug,
            address: claim.clinic_address,
            city: claim.clinic_city,
            province: claim.clinic_province,
            phone: claim.clinic_phone,
            email: claim.clinic_email,
            website: claim.clinic_website,
            status: 'pubblicata',
          },
          user: {
            id: claim.user_id,
            email: claim.user_email,
            full_name: claim.user_full_name,
          },
        });
        await query(
          `update public.claims
           set owner_notified_at = case when $2::boolean then now() else owner_notified_at end,
               owner_notification_error = $3
           where id = $1`,
          [claim_id, notification.success, notification.success ? null : notification.error || 'Errore invio email claimant']
        ).catch(() => null);
      }

      return json({ success: true, notification });
    }

    if (action === 'blog.list') {
      const { rows } = await query(
        `select a.*,
                c.name as clinic_name,
                c.slug as clinic_slug,
                coalesce(lu.full_name, p.full_name) as author_name,
                coalesce(lu.email, au.email) as author_email
           from public.veterinary_blog_articles a
           join public.clinics c on c.id = a.clinic_id
           left join public.profiles p on p.id = a.author_id
           left join public.local_auth_users lu on lu.id = a.author_id
           left join auth.users au on au.id = a.author_id
          order by case a.status when 'pending' then 0 when 'rejected' then 1 when 'published' then 2 else 3 end,
                   a.submitted_at desc nulls last,
                   a.updated_at desc`
      );
      return json({ success: true, rows });
    }

    if (action === 'blog.review') {
      const articleId = String(body?.id || '').trim();
      const status = String(body?.status || '').trim();
      const adminNote = String(body?.admin_note || '').trim().slice(0, 2_000) || null;
      if (!articleId) return json({ success: false, error: 'ID articolo mancante.' }, 422);
      if (!['pending', 'published', 'rejected'].includes(status)) {
        return json({ success: false, error: 'Stato editoriale non valido.' }, 422);
      }
      if (status === 'rejected' && !adminNote) {
        return json({ success: false, error: 'Indica cosa deve correggere il veterinario.' }, 422);
      }

      const current = await query<any>(
        `select id, title, status from public.veterinary_blog_articles where id::text = $1 limit 1`,
        [articleId]
      );
      if (!current.rows[0]) return json({ success: false, error: 'Articolo non trovato.' }, 404);
      const slug = status === 'published'
        ? await uniqueBlogSlug(current.rows[0].title, articleId)
        : null;
      const { rows } = await query(
        `update public.veterinary_blog_articles
            set status = $2,
                admin_note = $3,
                slug = case when $2 = 'published' then coalesce(slug, $4) else slug end,
                reviewed_at = now(),
                reviewed_by = $5,
                published_at = case when $2 = 'published' then coalesce(published_at, now()) else published_at end,
                updated_at = now()
          where id::text = $1
          returning *`,
        [articleId, status, adminNote, slug, gate.userId]
      );
      return json({ success: true, article: rows[0] });
    }

    if (action === 'taxonomy.list') {
      const { data, error } = await admin!.from('services_taxonomy').select('*').order('category').order('name');
      if (error) throw error;
      return json({ success: true, rows: data || [] });
    }

    if (action === 'taxonomy.upsert') {
      const row = body.row;
      const query = row.id
        ? admin!.from('services_taxonomy').update(row).eq('id', row.id).select().single()
        : admin!.from('services_taxonomy').insert(row).select().single();
      const { data, error } = await query;
      if (error) throw error;
      return json({ success: true, row: data });
    }

    if (action === 'taxonomy.import') {
      const { rows } = body;
      const { data, error } = await admin!.from('services_taxonomy').upsert(rows, { onConflict: 'name' }).select();
      if (error) throw error;
      return json({ success: true, rows: data || [] });
    }

    if (action === 'taxonomy.delete') {
      const { id } = body;
      const { error } = await admin!.from('services_taxonomy').delete().eq('id', id);
      if (error) throw error;
      return json({ success: true });
    }

    if (action === 'clinics.search') {
      const query = String(body.query || '').trim();
      if (!query) return json({ success: true, rows: [] });
      const safe = query.replace(/[%,]/g, ' ');
      const { data, error } = await admin!
        .from('clinics')
        .select('id, name, slug, address, city, province, status')
        .or(`name.ilike.%${safe}%,slug.ilike.%${safe}%,address.ilike.%${safe}%,city.ilike.%${safe}%`)
        .limit(25);
      if (error) throw error;
      return json({ success: true, rows: data || [] });
    }

    if (action === 'clinics.load') {
      const { slug } = body;
      const { data, error } = await admin!.rpc('get_clinic_page', { p_slug: slug });
      if (error) throw error;
      if (!data?.clinic) return json({ success: false, error: 'Clinica non trovata.' }, 404);
      const { data: full } = await admin!.from('clinics').select('*').eq('id', data.clinic.id).maybeSingle();
      return json({
        success: true,
        clinic: { ...(full || {}), ...(data.clinic || {}) },
        services: data.services || [],
        reviews: data.latest3 || [],
      });
    }

    if (action === 'clinics.save') {
      const clinic = body.clinic || {};
      const services = body.services || [];
      if (!clinic.id) return json({ success: false, error: 'clinic.id mancante.' }, 422);
      const update = pickClinicUpdate(clinic);
      const { error } = await admin!.from('clinics').update(update).eq('id', clinic.id);
      if (error) throw error;

      if (Array.isArray(services)) {
        const ids = services.map((item: any) => item.service_id).filter(Boolean);
        const { error: serviceIdError } = await admin!.from('clinics').update({ service_ids: ids }).eq('id', clinic.id);
        if (serviceIdError) throw serviceIdError;
      }
      return json({ success: true });
    }

    if (action === 'reviews.save') {
      const payload = (body.reviews || []).map((review: any) => ({
        review_id: review.review_id || undefined,
        rating: Number(review.rating || review.star_rating),
        text: review.text || review.comment || '',
        author_name: review.author_name || review.reviewer_name || 'Anonimo',
        profile_photo_url: review.profile_photo_url || review.reviewer_photo || null,
        time: review.time || review.created_at_g || new Date().toISOString(),
        source: review.source || 'google',
      })).filter((review: any) => review.rating >= 1 && review.rating <= 5);
      const { data, error } = await admin!.rpc('upsert_google_reviews', {
        p_clinic_id: body.clinic_id,
        p_reviews: payload,
        p_options: { recompute_summary: true },
      });
      if (error) throw error;
      return json({ success: true, result: data });
    }

    if (action === 'gallery.delete') {
      const { clinic_id, image_url } = body;
      const { data: clinic, error: clinicError } = await admin!.from('clinics').select('gallery_images').eq('id', clinic_id).maybeSingle();
      if (clinicError) throw clinicError;
      const next = (clinic?.gallery_images || []).filter((url: string) => url !== image_url);
      const { error } = await admin!.from('clinics').update({ gallery_images: next }).eq('id', clinic_id);
      if (error) throw error;
      const marker = '/storage/v1/object/public/gallery/';
      const idx = String(image_url).indexOf(marker);
      if (idx !== -1) {
        const objectPath = decodeURIComponent(String(image_url).slice(idx + marker.length));
        await admin!.storage.from('gallery').remove([objectPath]);
      }
      return json({ success: true, gallery_images: next });
    }

    if (action === 'enrich') {
      const result = await runEnrichment(body.kind, body);
      return json(result as Record<string, unknown>);
    }

    if (action === 'integratori.categories') {
      const { data, error } = await admin!.from('integratori_categorie').select('*').order('nome');
      if (error) throw error;
      return json({ success: true, rows: data || [] });
    }

    if (action === 'integratori.list') {
      const page = Math.max(1, Number(body.page || 1));
      const perPage = Math.min(100, Math.max(1, Number(body.per_page || 20)));
      let query = admin!
        .from('integratori_articoli')
        .select('*, categoria:integratori_categorie(nome, slug)', { count: 'exact' })
        .order('created_at', { ascending: false });
      if (body.category && body.category !== 'all') query = query.eq('categoria_id', body.category);
      if (body.status && body.status !== 'all') query = query.eq('status', body.status);
      if (body.search) query = query.ilike('titolo', `%${String(body.search).trim()}%`);
      const from = (page - 1) * perPage;
      const { data, error, count } = await query.range(from, from + perPage - 1);
      if (error) throw error;
      return json({ success: true, rows: data || [], count: count || 0, page, total_pages: Math.max(1, Math.ceil((count || 0) / perPage)) });
    }

    if (action === 'integratori.get') {
      const { id } = body;
      const { data, error } = await admin!.from('integratori_articoli').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      if (!data) return json({ success: false, error: 'Articolo non trovato.' }, 404);
      return json({ success: true, row: data });
    }

    if (action === 'integratori.save') {
      const row = normalizeIntegratore(body.row || {}, gate.userId || null);
      if (!row.titolo || !row.slug) return json({ success: false, error: 'Titolo e slug sono obbligatori.' }, 422);
      const query = body.id
        ? admin!.from('integratori_articoli').update({ ...row, updated_at: new Date().toISOString() }).eq('id', body.id).select().single()
        : admin!.from('integratori_articoli').insert(row).select().single();
      const { data, error } = await query;
      if (error) throw error;
      return json({ success: true, row: data });
    }

    if (action === 'integratori.delete') {
      const { error } = await admin!.from('integratori_articoli').delete().eq('id', body.id);
      if (error) throw error;
      return json({ success: true });
    }

    if (action === 'integratori.duplicate') {
      const { data: source, error: sourceError } = await admin!.from('integratori_articoli').select('*').eq('id', body.id).maybeSingle();
      if (sourceError) throw sourceError;
      if (!source) return json({ success: false, error: 'Articolo non trovato.' }, 404);
      const { id, created_at, updated_at, ...copy } = source;
      const { data, error } = await admin!.from('integratori_articoli').insert({
        ...copy,
        slug: `${source.slug}-copy-${Date.now()}`,
        titolo: `${source.titolo} (Copia)`,
        status: 'draft',
        created_by: gate.userId || source.created_by || null,
      }).select().single();
      if (error) throw error;
      return json({ success: true, row: data });
    }

    if (action === 'integratori.import') {
      const rows = Array.isArray(body.rows) ? body.rows : [];
      const results = { success: [] as any[], errors: [] as any[] };
      for (const row of rows) {
        try {
          const payload = normalizeIntegratore(row, gate.userId || null);
          if (!payload.titolo || !payload.slug) throw new Error('Titolo e slug sono obbligatori.');
          const { data, error } = await admin!.from('integratori_articoli').insert(payload).select().single();
          if (error) throw error;
          results.success.push(data);
        } catch (error: any) {
          results.errors.push({ article: row?.titolo || row?.slug || 'Sconosciuto', error: error?.message || String(error) });
        }
      }
      return json({ success: true, result: results });
    }

    if (action === 'integratori.scrapeAmazon') {
      const asin = asinFromAmazonUrl(body.url);
      if (!asin) return json({ success: false, error: 'URL Amazon non valido o ASIN non trovato.' }, 422);
      return json({ success: true, product: { asin, url: body.url, title: '', description: '', rating: null, image: '' } });
    }

    if (action === 'integratori.generateContent') {
      const content = await generateIntegratorContent(body.product_data || {}, body.template || '');
      return json({ success: true, content });
    }

    if (action === 'integratori.generateImage') {
      if (!body.prompt) return json({ success: false, error: 'Prompt immagine obbligatorio.' }, 422);
      const image_url = await generateIntegratorImage(String(body.prompt), Number(body.width || 1024), Number(body.height || 1024));
      return json({ success: true, image_url });
    }

    return json({ success: false, error: `Azione non supportata: ${action}` }, 400);
  } catch (error: any) {
    return json({ success: false, error: error?.message || String(error) }, 500);
  }
};
