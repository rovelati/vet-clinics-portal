import type { APIRoute } from 'astro';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { siteConfig } from '@/config/site';
import { escapeHtml, sendCloudflareEmail } from '@/lib/cloudflare-email';
import { normalizeEmail, validEmail } from '@/lib/email-normalization';
import { recordLeadEvent } from '@/lib/lead-events';
import { query } from '@/lib/local-db';
import { requireLocalUser } from '@/lib/local-auth';

const MAX_CLINICS = 20;
const DUPLICATE_WINDOW_MINUTES = 15;

const json = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

function cleanText(value: unknown) {
  return String(value || '').replace(/"/g, '').trim();
}

function captchaSecret() {
  return import.meta.env.AUTH_SECRET || process.env.AUTH_SECRET || import.meta.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-quote-captcha-secret';
}

function verifyCaptcha(token: string, answer: string) {
  const match = token.match(/^(\d+):(\d+):(\d+)\.([A-Za-z0-9_-]+)$/);
  if (!match) return false;

  const [, aRaw, bRaw, expiresRaw, signature] = match;
  if (Date.now() > Number(expiresRaw)) return false;

  const payload = `${aRaw}:${bRaw}:${expiresRaw}`;
  const expected = createHmac('sha256', captchaSecret()).update(payload).digest('base64url');
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return false;

  return Number(answer) === Number(aRaw) + Number(bRaw);
}

function line(label: string, value: unknown) {
  const text = cleanText(value);
  return text ? `${label}: ${text}` : '';
}

function normalizeMessage(value: string) {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function sourceUrlFromPath(path: string) {
  if (!path) return siteConfig.url;
  try {
    return new URL(path, siteConfig.url).toString();
  } catch {
    return siteConfig.url;
  }
}

function buildNearbyExtensionUrl(sourcePath: string) {
  const sourceUrl = sourceUrlFromPath(sourcePath);
  const url = new URL(sourceUrl);
  url.searchParams.set('estendi', '1');
  url.searchParams.set('raggio', 'provincia');
  return url.toString();
}

function clinicListText(clinics: Array<{ name: string; email: string }>) {
  return clinics
    .map((clinic) => {
      const name = cleanText(clinic.name) || clinic.email;
      return `- ${name}${clinic.email ? ` (${clinic.email})` : ''}`;
    })
    .join('\n');
}

function clinicListHtml(clinics: Array<{ name: string; email: string }>) {
  return clinics
    .map((clinic) => {
      const name = cleanText(clinic.name) || clinic.email;
      return `<li><strong>${escapeHtml(name)}</strong>${clinic.email ? ` <span style="color:#64748b">${escapeHtml(clinic.email)}</span>` : ''}</li>`;
    })
    .join('');
}

function buttonHtml(label: string, href: string, background: string, color = '#ffffff') {
  return `<a href="${href}" style="display:block;text-align:center;background:${background};color:${color};text-decoration:none;font-weight:800;border-radius:10px;padding:15px 18px;margin:10px 0">${escapeHtml(label)}</a>`;
}

function buildRequesterEmail({
  serviceName,
  locationLabel,
  requesterName,
  requesterEmail,
  averagePrice,
  sourcePath,
  clinics,
}: {
  serviceName: string;
  locationLabel: string;
  requesterName: string;
  requesterEmail: string;
  averagePrice: string;
  sourcePath: string;
  clinics: Array<{ name: string; email: string }>;
}) {
  const title = `Preventivo inviato per ${serviceName}${locationLabel ? ` a ${locationLabel}` : ''}`;
  const sourceUrl = sourceUrlFromPath(sourcePath);
  const extendUrl = buildNearbyExtensionUrl(sourcePath);
  const registerUrl = `${siteConfig.url}/register?type=proprietario&redirect=/dashboard/pet-lover`;
  const petLoverUrl = `${siteConfig.url}/pet-lover`;
  const priceText = averagePrice
    ? `Prezzo medio indicativo rilevato: ${averagePrice}.`
    : 'Prezzo medio indicativo non disponibile per questa prestazione nella zona.';
  const introName = requesterName ? `Buongiorno ${requesterName},` : 'Buongiorno,';
  const clinicCount = clinics.length;

  const text = [
    title,
    '',
    introName,
    '',
    'grazie per aver utilizzato Veterinari.org.',
    `Abbiamo inviato la tua richiesta per ${serviceName}${locationLabel ? ` a ${locationLabel}` : ''} a ${clinicCount} ${clinicCount === 1 ? 'clinica veterinaria' : 'cliniche veterinarie'}.`,
    '',
    'Riepilogo richiesta:',
    `Prestazione: ${serviceName}`,
    locationLabel ? `Zona: ${locationLabel}` : '',
    priceText,
    `Email indicata: ${requesterEmail}`,
    '',
    'Cliniche contattate:',
    clinicListText(clinics),
    '',
    'CTA:',
    `Estendi la richiesta ad altre cliniche: ${extendUrl}`,
    `Registrati gratis come Pet Lover: ${registerUrl}`,
    `Scopri i vantaggi dell area clienti: ${petLoverUrl}`,
    '',
    `Pagina origine: ${sourceUrl}`,
    '',
    'Lo Staff di Veterinari.org',
  ].filter(Boolean).join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;color:#172033;line-height:1.55;max-width:720px">
      <h1 style="font-size:26px;line-height:1.25;margin:0 0 14px">${escapeHtml(title)}</h1>
      <p style="margin:0 0 14px">${escapeHtml(introName)}</p>
      <p style="margin:0 0 18px">Grazie per aver utilizzato <strong>Veterinari.org</strong>. Abbiamo inviato la tua richiesta a <strong>${clinicCount} ${clinicCount === 1 ? 'clinica veterinaria' : 'cliniche veterinarie'}</strong>.</p>

      <div style="border:1px solid #bbf7d0;background:#f0fdf4;border-radius:12px;padding:18px;margin:18px 0">
        <p style="margin:0 0 6px;font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:#15803d;font-weight:800">Riepilogo</p>
        <p style="margin:0 0 8px;font-size:20px;font-weight:800">${escapeHtml(serviceName)}${locationLabel ? ` a ${escapeHtml(locationLabel)}` : ''}</p>
        <p style="margin:0;color:#334155">${escapeHtml(priceText)}</p>
      </div>

      <div style="margin:22px 0">
        ${buttonHtml('Estendi la richiesta ad altre cliniche', extendUrl, '#4f46e5')}
        ${buttonHtml('Registrati gratis come Pet Lover', registerUrl, '#16a34a')}
        ${buttonHtml('Scopri i vantaggi dell area clienti', petLoverUrl, '#ffffff', '#166534').replace('style="display:block;', 'style="display:block;border:1px solid #86efac;')}
      </div>

      <div style="border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:20px 0">
        <h2 style="font-size:18px;margin:0 0 10px">Cliniche contattate</h2>
        <ul style="margin:0;padding-left:20px">${clinicListHtml(clinics)}</ul>
      </div>

      <div style="border:1px solid #dbeafe;background:#eff6ff;border-radius:12px;padding:16px;margin:20px 0">
        <p style="margin:0 0 8px;font-size:18px;font-weight:800">Hai un amico peloso?</p>
        <p style="margin:0">Con l area Pet Lover puoi creare gratis la scheda digitale del tuo animale, salvare vaccini, scadenze e spese veterinarie, e condividere i dati con il veterinario quando serve.</p>
      </div>

      <p style="margin:18px 0 0;color:#64748b;font-size:13px">Pagina origine: <a href="${sourceUrl}" style="color:#2563eb">${sourceUrl}</a></p>
      <p style="margin-top:24px">Lo Staff di Veterinari.org</p>
    </div>`;

  return { subject: title, text, html };
}

function buildClinicEmail({
  clinicName,
  clinicSlug,
  clinicId,
  resultType,
  serviceName,
  locationLabel,
  requesterName,
  requesterEmail,
  requesterPhone,
  message,
}: {
  clinicName: string;
  clinicSlug: string;
  clinicId: string;
  resultType: string;
  serviceName: string;
  locationLabel: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  message: string;
}) {
  const title = `Richiesta preventivo per ${serviceName}${locationLabel ? ` a ${locationLabel}` : ''}`;
  const clinicUrl = clinicSlug ? `${siteConfig.url}/veterinari/${clinicSlug}` : siteConfig.url;
  const claimUrl = `${siteConfig.url}/claim?clinic=${encodeURIComponent(clinicId)}`;
  const benefitsUrl = `${siteConfig.url}/vantaggi-veterinari`;
  const hasDeclaredService = ['price', 'declared', 'related'].includes(resultType);
  const relevanceText = hasDeclaredService
    ? `La richiesta arriva da una pagina dedicata a ${serviceName}${locationLabel ? ` a ${locationLabel}` : ''}. La tua struttura risulta tra quelle con prezzo, prestazione o servizio affine indicato.`
    : `La richiesta arriva da una pagina dedicata a ${serviceName}${locationLabel ? ` a ${locationLabel}` : ''}. Non ci risulta ancora che questa prestazione sia dichiarata sulla tua scheda: se la offri, puoi registrarti gratis e aggiungerla.`;
  const relevanceHtml = hasDeclaredService
    ? `La richiesta arriva da una pagina dedicata a <strong>${escapeHtml(serviceName)}${locationLabel ? ` a ${escapeHtml(locationLabel)}` : ''}</strong>. La tua struttura risulta tra quelle con prezzo, prestazione o servizio affine indicato.`
    : `La richiesta arriva da una pagina dedicata a <strong>${escapeHtml(serviceName)}${locationLabel ? ` a ${escapeHtml(locationLabel)}` : ''}</strong>. Non ci risulta ancora che questa prestazione sia dichiarata sulla tua scheda: se la offri, puoi registrarti gratis e aggiungerla.`;
  const contactLines = [
    line('Nome', requesterName || 'Non indicato'),
    line('Email', requesterEmail || 'Non indicata'),
    line('Telefono', requesterPhone || 'Non indicato'),
  ].filter(Boolean);

  const text = [
    title,
    '',
    `Struttura: ${clinicName}`,
    '',
    'Azione consigliata:',
    'Rispondi direttamente a questa email per contattare il cliente: il campo Reply-To e impostato con l email del richiedente.',
    requesterEmail ? `Email cliente nel Reply-To: ${requesterEmail}` : '',
    '',
    relevanceText,
    '',
    'Verifica la tua scheda su Veterinari.org:',
    `Scheda online: ${clinicUrl}`,
    `Reclama o completa la scheda gratuitamente: ${claimUrl}`,
    `Vantaggi per veterinari: ${benefitsUrl}`,
    '',
    'Perche ricevi questa richiesta:',
    `Un proprietario di animale ha inviato una richiesta di preventivo tramite Veterinari.org per una prestazione nella tua zona${locationLabel ? ` (${locationLabel})` : ''}.`,
    'Veterinari.org mette in contatto proprietari di animali e strutture veterinarie: piu la scheda e completa, piu e facile ricevere richieste qualificate.',
    '',
    'Contatti cliente:',
    ...contactLines,
    '',
    'Messaggio:',
    message,
    '',
    'Lo Staff di Veterinari.org',
  ].filter(Boolean).join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;color:#172033;line-height:1.55;max-width:720px">
    <h1 style="font-size:26px;line-height:1.25;margin:0 0 18px">${escapeHtml(title)}</h1>
    <p style="margin:0 0 14px"><strong>Struttura:</strong> ${escapeHtml(clinicName)}</p>
    <div style="border:1px solid #bbf7d0;background:#f0fdf4;border-radius:10px;padding:16px;margin:18px 0">
      <p style="margin:0 0 8px;font-size:18px"><strong>Rispondi direttamente a questa email</strong></p>
      <p style="margin:0">La risposta andra al cliente perche il campo <strong>Reply-To</strong> e impostato su ${escapeHtml(requesterEmail || 'l email indicata dal cliente')}.</p>
    </div>
    <div style="border:1px solid #dbeafe;background:#eff6ff;border-radius:10px;padding:16px;margin:18px 0">
      <p style="margin:0 0 10px">${relevanceHtml}</p>
      <p style="margin:0 0 8px;font-size:18px"><strong>Ricevere piu richieste qualificate</strong></p>
      <p style="margin:0 0 10px">Controlla la tua scheda, completa servizi, orari, contatti e listino prezzi. Le schede complete sono piu utili agli utenti che cercano un preventivo.</p>
      <p style="margin:0 0 8px"><a href="${claimUrl}" style="color:#166534;font-weight:bold">Reclama o aggiorna gratuitamente la scheda</a></p>
      <p style="margin:0 0 8px"><a href="${clinicUrl}" style="color:#2563eb">Vedi la scheda online</a></p>
      <p style="margin:0"><a href="${benefitsUrl}" style="color:#2563eb">Scopri i vantaggi per veterinari</a></p>
    </div>
    <p style="margin:18px 0 8px"><strong>Perche ricevi questa richiesta?</strong><br>
    Un proprietario di animale ha inviato una richiesta di preventivo tramite Veterinari.org per una prestazione nella tua zona${locationLabel ? ` (${escapeHtml(locationLabel)})` : ''}.</p>
    <p style="margin:0 0 18px"><strong>Chi siamo:</strong> Veterinari.org mette in contatto proprietari di animali e strutture veterinarie, aiutando gli utenti a trovare servizi, prezzi indicativi, disponibilita e contatti affidabili.</p>
    <h2 style="font-size:21px;margin:24px 0 10px">Contatti cliente</h2>
    <ul style="margin-top:0">
      <li><strong>Nome:</strong> ${escapeHtml(requesterName || 'Non indicato')}</li>
      <li><strong>Email:</strong> ${escapeHtml(requesterEmail || 'Non indicata')}</li>
      <li><strong>Telefono:</strong> ${escapeHtml(requesterPhone || 'Non indicato')}</li>
    </ul>
    <h2 style="font-size:21px;margin:24px 0 10px">Messaggio del cliente</h2>
    <div style="border-left:4px solid #16a34a;background:#f8fafc;padding:12px 14px;margin-bottom:22px">${escapeHtml(message).replace(/\n/g, '<br>')}</div>
    <p style="margin-top:24px">Lo Staff di Veterinari.org</p>
    </div>`;

  return { subject: title, text, html };
}

export const POST: APIRoute = async (context) => {
  const body = await context.request.json().catch(() => ({}));
  if (cleanText(body.company)) return json({ success: true, ignored: true });

  const serviceSlug = cleanText(body.service_slug);
  const serviceName = cleanText(body.service_name) || serviceSlug.split('-').join(' ');
  const locationLabel = cleanText(body.location_label);
  const requesterName = cleanText(body.name);
  const requesterEmail = normalizeEmail(body.email);
  const requesterPhone = cleanText(body.phone);
  const message = cleanText(body.message);
  const averagePrice = cleanText(body.average_price);
  const sourcePath = cleanText(body.source_path) || new URL(context.request.headers.get('referer') || '/', siteConfig.url).pathname;
  const captchaAnswer = cleanText(body.captcha_answer);
  const captchaToken = cleanText(body.captcha_token);
  const privacyAccepted = body.privacy_accepted === true || cleanText(body.privacy_accepted) === 'true';
  const clinicIds = Array.isArray(body.clinic_ids)
    ? body.clinic_ids.map((id: unknown) => cleanText(id)).filter(Boolean).slice(0, MAX_CLINICS)
    : [];
  const clinicMatches = new Map<string, { result_type: string; result_label: string }>();
  if (Array.isArray(body.clinic_matches)) {
    body.clinic_matches.forEach((item: any) => {
      const id = cleanText(item?.id);
      if (!id) return;
      clinicMatches.set(id, {
        result_type: cleanText(item?.result_type),
        result_label: cleanText(item?.result_label),
      });
    });
  }

  if (!serviceSlug || !serviceName) return json({ success: false, error: 'Prestazione mancante.' }, 422);
  if (!requesterEmail) return json({ success: false, error: 'Inserisci una email.' }, 422);
  if (!validEmail(requesterEmail)) return json({ success: false, error: 'Email non valida.' }, 422);
  if (!message || message.length < 20) return json({ success: false, error: 'Aggiungi una richiesta piu completa.' }, 422);
  if (!privacyAccepted) return json({ success: false, error: 'Accetta l informativa privacy per inviare la richiesta.' }, 422);
  if (!verifyCaptcha(captchaToken, captchaAnswer)) return json({ success: false, error: 'Verifica anti-spam non valida.' }, 422);
  if (clinicIds.length === 0) return json({ success: false, error: 'Nessuna clinica con email disponibile.' }, 422);

  const { user } = await requireLocalUser(context);

  const clinicsResult = await query<any>(
    `select id::text as id, name, slug, email
     from public.clinics
     where id::text = any($1::text[])
       and nullif(trim(email), '') is not null`,
    [clinicIds]
  );
  const clinics = clinicsResult.rows
    .map((clinic) => ({
      ...clinic,
      email: normalizeEmail(clinic.email),
      result_type: clinicMatches.get(clinic.id)?.result_type || '',
      result_label: clinicMatches.get(clinic.id)?.result_label || '',
    }))
    .filter((clinic) => clinic.email && validEmail(clinic.email));

  if (clinics.length === 0) return json({ success: false, error: 'Nessuna clinica con email disponibile.' }, 422);

  const clinicEmails = Array.from(new Set(clinics.map((clinic) => clinic.email)));
  const duplicateResult = await query<any>(
    `select id::text as id, created_at, clinic_emails
     from public.quote_requests
     where requester_email = $1
       and service_slug = $2
       and coalesce(location_label, '') = coalesce($3, '')
       and lower(regexp_replace(coalesce(message, ''), '\\s+', ' ', 'g')) = $4
       and created_at >= now() - ($5::int * interval '1 minute')
       and status in ('received', 'sent', 'received_email_warning')
     order by created_at desc
     limit 1`,
    [
      requesterEmail,
      serviceSlug,
      locationLabel || null,
      normalizeMessage(message),
      DUPLICATE_WINDOW_MINUTES,
    ]
  );
  const duplicateRequest = duplicateResult.rows[0];
  if (duplicateRequest) {
    return json({
      success: true,
      duplicate: true,
      request_id: duplicateRequest.id,
      sent_count: 0,
      clinic_count: Array.isArray(duplicateRequest.clinic_emails) ? duplicateRequest.clinic_emails.length : clinicEmails.length,
      message: 'Richiesta gia inviata pochi minuti fa: non l abbiamo reinviata alle cliniche.',
    });
  }

  const insertResult = await query<any>(
    `insert into public.quote_requests (
       user_id, service_slug, service_name, location_label,
       requester_name, requester_email, requester_phone, message,
       clinic_ids, clinic_emails, status, metadata, created_at
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9::text[], $10::text[], 'received', $11::jsonb, now())
     returning id::text`,
    [
      user?.id || null,
      serviceSlug,
      serviceName,
      locationLabel || null,
      requesterName || null,
      requesterEmail || null,
      requesterPhone || null,
      message,
      clinics.map((clinic) => clinic.id),
      clinicEmails,
      JSON.stringify({
        source: 'quanto-costa',
        privacy_accepted: true,
        privacy_accepted_at: new Date().toISOString(),
        average_price: averagePrice || null,
        source_path: sourcePath,
        page: context.request.headers.get('referer') || '',
        clinics: clinics.map((clinic) => ({ id: clinic.id, name: clinic.name, slug: clinic.slug, email: clinic.email, result_type: clinic.result_type, result_label: clinic.result_label })),
      }),
    ]
  );
  const requestId = insertResult.rows[0]?.id;

  const clinicEmailResults = [];
  const clinicsByEmail = new Map<string, any>();
  for (const clinic of clinics) {
    if (!clinicsByEmail.has(clinic.email)) clinicsByEmail.set(clinic.email, clinic);
  }

  for (const [clinicEmail, clinic] of clinicsByEmail) {
    const emailTemplate = buildClinicEmail({
      clinicName: cleanText(clinic.name) || 'la tua struttura',
      clinicSlug: cleanText(clinic.slug),
      clinicId: cleanText(clinic.id),
      resultType: cleanText(clinic.result_type),
      serviceName,
      locationLabel,
      requesterName,
      requesterEmail,
      requesterPhone,
      message,
    });
    const result = await sendCloudflareEmail({
      to: clinicEmail,
      from: siteConfig.publicEmail,
      replyTo: requesterEmail || undefined,
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html,
    });
    clinicEmailResults.push({ to: clinicEmail, success: result.success, error: result.error || null });
  }

  await Promise.all(clinics.map((clinic) => recordLeadEvent({
    clinicId: clinic.id,
    eventType: 'quote_request_submit',
    source: 'quanto-costa',
    quoteRequestId: requestId,
    serviceSlug,
    serviceName,
    locationLabel,
    pagePath: new URL(context.request.headers.get('referer') || '/', siteConfig.url).pathname,
    requesterEmail,
    requesterPhone,
    metadata: {
      request_id: requestId,
      clinic_name: clinic.name,
      clinic_email: clinic.email,
    },
  }, context).catch(() => null)));

  const clinicFailures = clinicEmailResults.filter((result) => !result.success);
  const emailWarning = clinicFailures.length > 0;
  const requesterEmailTemplate = buildRequesterEmail({
    serviceName,
    locationLabel,
    requesterName,
    requesterEmail,
    averagePrice,
    sourcePath,
    clinics: Array.from(clinicsByEmail.values()).map((clinic) => ({ name: clinic.name, email: clinic.email })),
  });
  const requesterEmailResult = await sendCloudflareEmail({
    to: requesterEmail,
    from: siteConfig.publicEmail,
    subject: requesterEmailTemplate.subject,
    text: requesterEmailTemplate.text,
    html: requesterEmailTemplate.html,
  });

  await query(
    `update public.quote_requests
     set status = $2,
         clinic_email_status = $3,
         admin_email_status = $4,
         email_errors = $5::jsonb,
         metadata = coalesce(metadata, '{}'::jsonb) || $6::jsonb,
         updated_at = now()
     where id = $1`,
    [
      requestId,
      emailWarning ? 'received_email_warning' : 'sent',
      clinicFailures.length === 0 ? 'sent' : 'partial_or_failed',
      'not_sent',
      JSON.stringify({ clinics: clinicEmailResults, admin: { success: true, skipped: true, reason: 'admin_email_disabled' } }),
      JSON.stringify({ requester_email: { success: requesterEmailResult.success, error: requesterEmailResult.error || null } }),
    ]
  );

  return json({
    success: true,
    request_id: requestId,
    sent_count: clinicEmailResults.filter((result) => result.success).length,
    clinic_count: clinicEmails.length,
    email_warning: emailWarning,
    requester_email_sent: requesterEmailResult.success,
  });
};
