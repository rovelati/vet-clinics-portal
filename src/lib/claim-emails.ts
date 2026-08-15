import { absoluteUrl, siteConfig } from '@/config/site';
import { escapeHtml, sendCloudflareEmail } from '@/lib/cloudflare-email';

type ClaimEmailUser = {
  id?: string | null;
  email?: string | null;
  full_name?: string | null;
};

type ClaimEmailClinic = {
  id?: string | null;
  name?: string | null;
  slug?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  status?: string | null;
};

type ClaimEmailClaim = {
  id?: string | null;
  status?: string | null;
  created_at?: string | Date | null;
};

function clinicUrl(clinic: ClaimEmailClinic) {
  return clinic.slug ? absoluteUrl(`/veterinari/${clinic.slug}`) : siteConfig.url;
}

function editUrl() {
  return absoluteUrl('/dashboard/veterinario');
}

function adminUrl() {
  return absoluteUrl('/admin-test');
}

function line(label: string, value: unknown) {
  const clean = String(value ?? '').trim();
  return clean ? `${label}: ${clean}` : `${label}: -`;
}

function detailList(items: Array<[string, unknown]>) {
  return `<dl>${items
    .map(([label, value]) => {
      const clean = String(value ?? '').trim() || '-';
      return `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(clean)}</dd>`;
    })
    .join('')}</dl>`;
}

function baseHtml(title: string, body: string) {
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

export async function sendClaimCreatedAdminEmail({
  claim,
  clinic,
  user,
}: {
  claim: ClaimEmailClaim;
  clinic: ClaimEmailClinic;
  user: ClaimEmailUser;
}) {
  const subject = `Nuovo claim clinica: ${clinic.name || 'scheda veterinaria'}`;
  const dashboardLink = adminUrl();
  const onlineLink = clinicUrl(clinic);
  const onlineLabel = clinic.status === 'pubblicata' ? 'Scheda online' : 'Scheda in attesa di revisione';
  const text = [
    'Nuova presa di possesso su Veterinari.org.',
    clinic.status === 'pubblicata'
      ? ''
      : 'Nota: la scheda resta raggiungibile e ricercabile, ma mostra un avviso di attesa revisione finche il claim non viene approvato.',
    '',
    line('Utente', user.full_name || user.email || user.id),
    line('Email utente', user.email),
    line('Claim ID', claim.id),
    line('Stato', claim.status || 'pending'),
    line('Clinica', clinic.name),
    line('Indirizzo', clinic.address),
    line('Telefono', clinic.phone),
    line('Email clinica', clinic.email),
    line('Sito web', clinic.website),
    line(onlineLabel, onlineLink),
    '',
    `Dashboard admin: ${dashboardLink}`,
  ].join('\n');
  const html = baseHtml(
    subject,
    `<h1>Nuova presa di possesso</h1>
    <p>Un account ha reclamato una scheda. La pubblicazione resta bloccata finche il business owner/admin non approva il claim.</p>
    ${detailList([
      ['Utente', user.full_name || user.email || user.id],
      ['Email utente', user.email],
      ['Claim ID', claim.id],
      ['Stato', claim.status || 'pending'],
      ['Clinica', clinic.name],
      ['Indirizzo', clinic.address],
      ['Telefono', clinic.phone],
      ['Email clinica', clinic.email],
      ['Sito web', clinic.website],
      [onlineLabel, onlineLink],
    ])}
    <p><a class="button" href="${escapeHtml(dashboardLink)}">Apri dashboard claim</a></p>`
  );

  return sendCloudflareEmail({
    to: 'romolo.velati@gmail.com',
    subject,
    text,
    html,
    replyTo: user.email || undefined,
  });
}

export async function sendClaimApprovedOwnerEmail({
  claim,
  clinic,
  user,
}: {
  claim: ClaimEmailClaim;
  clinic: ClaimEmailClinic;
  user: ClaimEmailUser;
}) {
  if (!user.email) return { success: false, error: 'Email del claimant mancante.' };

  const subject = 'Benvenuta su Veterinari.org: la tua scheda e online';
  const onlineLink = clinicUrl(clinic);
  const dashboardLink = editUrl();
  const benefitsLink = absoluteUrl('/vantaggi-veterinari');
  const blogLink = absoluteUrl('/blog');
  const displayName = user.full_name || 'dottoressa/dottore';
  const text = [
    `Ciao ${displayName},`,
    '',
    `benvenuta/o su Veterinari.org: la scheda "${clinic.name || 'veterinaria'}" e stata verificata ed e online.`,
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
    line('Clinica', clinic.name),
    line('Indirizzo', clinic.address),
    line('Telefono', clinic.phone),
    line('Email', clinic.email),
    line('Sito web', clinic.website),
    '',
    'Accedi con lo stesso account usato per il claim.',
  ].join('\n');
  const html = baseHtml(
    subject,
    `<h1>Benvenuta su Veterinari.org</h1>
    <p>Ciao ${escapeHtml(displayName)}, la scheda <strong>${escapeHtml(clinic.name || 'veterinaria')}</strong> e stata verificata ed e online.</p>
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
      ['Clinica', clinic.name],
      ['Indirizzo', clinic.address],
      ['Telefono', clinic.phone],
      ['Email', clinic.email],
      ['Sito web', clinic.website],
    ])}
    <p>
      <a class="button" href="${escapeHtml(dashboardLink)}">Completa la scheda</a>
      <a class="button secondary" href="${escapeHtml(benefitsLink)}">Scopri l area veterinari</a>
    </p>
    <p>Puoi accedere con lo stesso account usato per il claim.</p>
    <p style="font-size:13px;color:#6b7280">Riferimento claim: ${escapeHtml(claim.id || '-')}</p>
    <p style="font-size:13px;color:#6b7280">Articoli professionali: <a href="${escapeHtml(blogLink)}">scopri il blog</a>.</p>`
  );

  return sendCloudflareEmail({
    to: user.email,
    subject,
    text,
    html,
  });
}
