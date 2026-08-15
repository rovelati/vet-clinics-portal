import pg from 'pg';

const { Pool } = pg;

const apply = process.argv.includes('--apply');
const connectionString = process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL o LOCAL_DATABASE_URL non configurato.');
  process.exit(1);
}

function cleanText(value) {
  return typeof value === 'string' ? value.replace(/"/g, '').trim() : '';
}

function normalizeEmail(value) {
  const raw = cleanText(value);
  if (!raw) return '';

  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw.replace(/%20/gi, ' ');
  }

  const prepared = decoded
    .replace(/^mailto:/i, '')
    .replace(/&[#a-z0-9-]+;/gi, ' ')
    .replace(/(@[a-z0-9.-]+),(com|it|net|org|eu)\b/gi, '$1.$2')
    .replace(/^\d+\s*mail/i, '')
    .replace(/\.(it|com|net|org|eu)(p\.?\s*iva|telefono|indirizzo|privacy|pec|dir)/gi, '.$1 $2')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/^["'<(]+|[>"').,;:]+$/g, ' ')
    .toLowerCase();

  const match = prepared.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}\b/i);
  return match ? match[0] : prepared.replace(/\s+/g, '');
}

function validEmail(value) {
  return /^[^\s@<>()[\],;:]+@[^\s@<>()[\],;:]+\.[^\s@<>()[\],;:]+$/.test(value);
}

function normalizeEmailList(values) {
  const list = Array.isArray(values) ? values : [];
  return Array.from(new Set(list.map(normalizeEmail).filter(validEmail)));
}

const pool = new Pool({ connectionString, max: 2, connectionTimeoutMillis: 5000 });

try {
  const clinics = await pool.query(`
    select id::text as id, name, slug, email
    from public.clinics
    where email is not null and trim(email) <> ''
    order by name
  `);

  const changedClinics = [];
  const invalidClinics = [];

  for (const clinic of clinics.rows) {
    const normalized = normalizeEmail(clinic.email);
    if (!validEmail(normalized)) {
      invalidClinics.push({ ...clinic, normalized });
      continue;
    }
    if (normalized !== clinic.email) {
      changedClinics.push({ ...clinic, normalized });
    }
  }

  const quoteRequests = await pool.query(`
    select id::text as id, clinic_emails
    from public.quote_requests
    where clinic_emails is not null
      and cardinality(clinic_emails) > 0
  `);

  const changedRequests = [];
  for (const request of quoteRequests.rows) {
    const normalized = normalizeEmailList(request.clinic_emails);
    const current = Array.isArray(request.clinic_emails) ? request.clinic_emails : [];
    if (JSON.stringify(normalized) !== JSON.stringify(current)) {
      changedRequests.push({ id: request.id, from: current, to: normalized });
    }
  }

  console.log(JSON.stringify({
    mode: apply ? 'apply' : 'dry-run',
    clinics_checked: clinics.rowCount,
    clinics_to_update: changedClinics.length,
    clinics_invalid_after_cleanup: invalidClinics.length,
    quote_requests_checked: quoteRequests.rowCount,
    quote_requests_to_update: changedRequests.length,
    sample_clinic_updates: changedClinics.slice(0, 20).map((item) => ({
      id: item.id,
      name: item.name,
      from: item.email,
      to: item.normalized,
    })),
    sample_invalid_clinics: invalidClinics.slice(0, 20).map((item) => ({
      id: item.id,
      name: item.name,
      email: item.email,
      normalized: item.normalized,
    })),
    sample_quote_request_updates: changedRequests.slice(0, 20),
  }, null, 2));

  if (!apply) {
    await pool.end();
    process.exit(0);
  }

  await pool.query('begin');
  try {
    for (const clinic of changedClinics) {
      await pool.query(
        `update public.clinics set email = $2, updated_at = now() where id::text = $1`,
        [clinic.id, clinic.normalized]
      );
    }

    for (const request of changedRequests) {
      await pool.query(
        `update public.quote_requests set clinic_emails = $2::text[], updated_at = now() where id::text = $1`,
        [request.id, request.to]
      );
    }

    await pool.query('commit');
  } catch (error) {
    await pool.query('rollback');
    throw error;
  }

  console.log(JSON.stringify({
    applied: true,
    clinics_updated: changedClinics.length,
    quote_requests_updated: changedRequests.length,
    invalid_clinics_left_unchanged: invalidClinics.length,
  }, null, 2));
} finally {
  await pool.end();
}
