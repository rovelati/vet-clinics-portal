import { Pool } from 'pg';

const claimId = process.argv[2];
if (!claimId) {
  console.error('Usage: node scripts/send-approved-claim-welcome.mjs <claim-id>');
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL non configurato.');
  process.exit(1);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function line(label, value) {
  const clean = String(value ?? '').trim();
  return clean ? `${label}: ${clean}` : `${label}: -`;
}

function detailList(items) {
  return `<dl>${items
    .map(([label, value]) => {
      const clean = String(value ?? '').trim() || '-';
      return `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(clean)}</dd>`;
    })
    .join('')}</dl>`;
}

function baseHtml(title, body) {
  return `<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <style>
      body{margin:0;background:#f6f8fb;color:#111827;font-family:Arial,sans-serif;line-height:1.5}
      .wrap{max-width:680px;margin:0 auto;padding:28px 18px}
      .card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:28px}
      h1{margin:0 0 16px;font-size:24px;line-height:1.2}
      h2{margin:24px 0 8px;font-size:18px}
      p{margin:0 0 14px}
      a{color:#166534;font-weight:700}
      .button{display:inline-block;margin:8px 10px 8px 0;padding:12px 16px;border-radius:8px;background:#16a34a;color:#fff;text-decoration:none}
      .button.secondary{background:#111827}
      dl{display:grid;grid-template-columns:150px 1fr;gap:8px 14px;margin:14px 0}
      dt{font-weight:700;color:#4b5563}
      dd{margin:0;color:#111827;word-break:break-word}
      ul,ol{padding-left:20px;margin:8px 0 0}
      li{margin:6px 0}
    </style>
  </head>
  <body><div class="wrap"><div class="card">${body}</div></div></body>
</html>`;
}

async function sendMailgunEmail({ to, subject, text, html }) {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const baseUrl = process.env.MAILGUN_BASE_URL || 'https://api.mailgun.net';
  const from = process.env.MAIL_FROM || 'info@veterinari.org';
  if (!apiKey || !domain) throw new Error('Mailgun non configurato.');

  const form = new FormData();
  form.set('from', from);
  form.set('to', to);
  form.set('subject', subject);
  form.set('text', text);
  form.set('html', html);

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/v3/${domain}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}`,
    },
    body: form,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Mailgun HTTP ${response.status}`);
  }
  return data;
}

const pool = new Pool({ connectionString, max: 1 });

try {
  const { rows } = await pool.query(
    `select cl.id::text as claim_id,
            coalesce(lu.email, au.email) as user_email,
            coalesce(lu.full_name, p.full_name) as full_name,
            c.name, c.slug, c.address, c.phone, c.email, c.website
       from public.claims cl
       join public.clinics c on c.id = cl.clinic_id
       left join public.local_auth_users lu on lu.id = cl.user_id
       left join public.profiles p on p.id = cl.user_id
       left join auth.users au on au.id = cl.user_id
      where cl.id::text = $1`,
    [claimId]
  );
  const row = rows[0];
  if (!row?.user_email) throw new Error('Claim o email claimant non trovati.');

  const onlineLink = `https://www.veterinari.org/veterinari/${row.slug}`;
  const dashboardLink = 'https://www.veterinari.org/dashboard/veterinario';
  const benefitsLink = 'https://www.veterinari.org/vantaggi-veterinari';
  const blogLink = 'https://www.veterinari.org/blog';
  const displayName = row.full_name || 'dottoressa/dottore';
  const subject = 'Benvenuta su Veterinari.org: la tua scheda e online';

  const text = [
    `Ciao ${displayName},`,
    '',
    `benvenuta/o su Veterinari.org: la scheda "${row.name || 'veterinaria'}" e stata verificata ed e online.`,
    'Da questo momento puoi usare la tua area veterinario per rendere la scheda piu completa, utile e chiara per i proprietari di animali.',
    '',
    'Link utili:',
    `- Vedi la scheda online: ${onlineLink}`,
    `- Accedi alla dashboard veterinario: ${dashboardLink}`,
    `- Scopri i vantaggi dell area veterinari: ${benefitsLink}`,
    '',
    'Cosa fare adesso per migliorare la scheda:',
    '1. Controlla telefono, email, sito web, indirizzo e orari.',
    '2. Completa la descrizione della struttura: specializzazioni, approccio, servizi principali.',
    '3. Aggiungi o aggiorna foto reali della struttura.',
    '4. Indica le prestazioni offerte e, dove utile, prezzi o range indicativi.',
    '5. Se fai reperibilita, urgenze o H24, mantieni questa informazione sempre precisa.',
    '',
    'Come usarla:',
    '- La scheda riceve utenti da ricerche locali, Veterinari H24 e percorsi Quanto Costa.',
    '- I proprietari possono salvarti tra i preferiti e contattarti dalla scheda.',
    '- Le informazioni complete riducono richieste generiche e aumentano contatti piu qualificati.',
    '- In futuro l area veterinario includera statistiche semplici su visualizzazioni, click, chiamate e richieste.',
    '',
    'Riepilogo scheda:',
    line('Clinica', row.name),
    line('Indirizzo', row.address),
    line('Telefono', row.phone),
    line('Email', row.email),
    line('Sito web', row.website),
    '',
    'Accedi con lo stesso account usato per il claim.',
  ].join('\n');

  const html = baseHtml(
    subject,
    `<h1>Benvenuta su Veterinari.org</h1>
    <p>Ciao ${escapeHtml(displayName)}, la scheda <strong>${escapeHtml(row.name || 'veterinaria')}</strong> e stata verificata ed e online.</p>
    <p>Da questo momento puoi usare la tua area veterinario per rendere la scheda piu completa, utile e chiara per i proprietari di animali.</p>
    <p>
      <a class="button" href="${escapeHtml(dashboardLink)}">Apri la dashboard</a>
      <a class="button secondary" href="${escapeHtml(onlineLink)}">Vedi la scheda online</a>
    </p>
    <h2>Cosa fare adesso</h2>
    <ol>
      <li>Controlla telefono, email, sito web, indirizzo e orari.</li>
      <li>Completa la descrizione con specializzazioni, approccio e servizi principali.</li>
      <li>Aggiungi foto reali della struttura.</li>
      <li>Indica prestazioni offerte e, dove utile, prezzi o range indicativi.</li>
      <li>Se fai reperibilita, urgenze o H24, mantieni questa informazione sempre precisa.</li>
    </ol>
    <h2>Come usare Veterinari.org</h2>
    <ul>
      <li>La scheda riceve utenti da ricerche locali, Veterinari H24 e percorsi Quanto Costa.</li>
      <li>I proprietari possono salvarti tra i preferiti e contattarti dalla scheda.</li>
      <li>Informazioni complete riducono richieste generiche e aumentano contatti piu qualificati.</li>
      <li>In futuro l area veterinario includera statistiche semplici su visualizzazioni, click, chiamate e richieste.</li>
    </ul>
    ${detailList([
      ['Clinica', row.name],
      ['Indirizzo', row.address],
      ['Telefono', row.phone],
      ['Email', row.email],
      ['Sito web', row.website],
    ])}
    <p>
      <a class="button" href="${escapeHtml(dashboardLink)}">Completa la scheda</a>
      <a class="button secondary" href="${escapeHtml(benefitsLink)}">Scopri l area veterinari</a>
    </p>
    <p>Puoi accedere con lo stesso account usato per il claim.</p>
    <p style="font-size:13px;color:#6b7280">Riferimento claim: ${escapeHtml(row.claim_id || '-')}</p>
    <p style="font-size:13px;color:#6b7280">Articoli professionali: <a href="${escapeHtml(blogLink)}">scopri il blog</a>.</p>`
  );

  const result = await sendMailgunEmail({ to: row.user_email, subject, text, html });
  console.log(JSON.stringify({ success: true, to: row.user_email, id: result?.id || result?.message || null }, null, 2));
} finally {
  await pool.end();
}
