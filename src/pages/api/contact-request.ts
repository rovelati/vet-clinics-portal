import type { APIRoute } from 'astro';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { siteConfig } from '@/config/site';
import { escapeHtml, sendCloudflareEmail } from '@/lib/cloudflare-email';
import { normalizeEmail, validEmail } from '@/lib/email-normalization';
import { recordLeadEvent } from '@/lib/lead-events';
import { query } from '@/lib/local-db';
import { requireLocalUser } from '@/lib/local-auth';

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

function buildClinicEmail({
  clinicName,
  clinicSlug,
  clinicId,
  requesterName,
  requesterEmail,
  requesterPhone,
  message,
}: {
  clinicName: string;
  clinicSlug: string;
  clinicId: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  message: string;
}) {
  const title = `Richiesta informazioni per ${clinicName}`;
  const clinicUrl = clinicSlug ? `${siteConfig.url}/veterinari/${clinicSlug}` : siteConfig.url;
  const claimUrl = `${siteConfig.url}/claim?clinic=${encodeURIComponent(clinicId)}`;
  const benefitsUrl = `${siteConfig.url}/vantaggi-veterinari`;
  const contactLines = [
    line('Nome', requesterName || 'Non indicato'),
    line('Email', requesterEmail || 'Non indicata'),
    line('Telefono', requesterPhone || 'Non indicato'),
  ].filter(Boolean);

  const text = [
    title,
    '',
    'Azione consigliata:',
    'Rispondi direttamente a questa email per contattare il cliente: il campo Reply-To e impostato con l email del richiedente.',
    requesterEmail ? `Email cliente nel Reply-To: ${requesterEmail}` : '',
    '',
    'Verifica la tua scheda su Veterinari.org:',
    `Scheda online: ${clinicUrl}`,
    `Reclama o completa la scheda gratuitamente: ${claimUrl}`,
    `Vantaggi per veterinari: ${benefitsUrl}`,
    '',
    'Perche ricevi questa email:',
    'Un proprietario di animale ha inviato una richiesta informazioni tramite Veterinari.org dalla scheda della tua struttura.',
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
    <div style="border:1px solid #bbf7d0;background:#f0fdf4;border-radius:10px;padding:16px;margin:18px 0">
      <p style="margin:0 0 8px;font-size:18px"><strong>Rispondi direttamente a questa email</strong></p>
      <p style="margin:0">La risposta andra al cliente perche il campo <strong>Reply-To</strong> e impostato su ${escapeHtml(requesterEmail || 'l email indicata dal cliente')}.</p>
    </div>
    <div style="border:1px solid #dbeafe;background:#eff6ff;border-radius:10px;padding:16px;margin:18px 0">
      <p style="margin:0 0 8px;font-size:18px"><strong>Ricevere piu richieste qualificate</strong></p>
      <p style="margin:0 0 10px">Controlla la tua scheda, completa servizi, orari, contatti e listino prezzi. Le schede complete sono piu utili agli utenti che cercano una struttura.</p>
      <p style="margin:0 0 8px"><a href="${claimUrl}" style="color:#166534;font-weight:bold">Reclama o aggiorna gratuitamente la scheda</a></p>
      <p style="margin:0 0 8px"><a href="${clinicUrl}" style="color:#2563eb">Vedi la scheda online</a></p>
      <p style="margin:0"><a href="${benefitsUrl}" style="color:#2563eb">Scopri i vantaggi per veterinari</a></p>
    </div>
    <p style="margin:18px 0 8px"><strong>Perche ricevi questa email?</strong><br>
    Un proprietario di animale ha inviato una richiesta informazioni tramite Veterinari.org dalla scheda della tua struttura.</p>
    <p style="margin:0 0 18px"><strong>Chi siamo:</strong> Veterinari.org mette in contatto proprietari di animali e strutture veterinarie, aiutando gli utenti a trovare servizi, disponibilita e contatti affidabili.</p>
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

  const clinicId = cleanText(body.clinic_id);
  const requesterName = cleanText(body.name);
  const requesterEmail = normalizeEmail(body.email);
  const requesterPhone = cleanText(body.phone);
  const message = cleanText(body.message);
  const captchaAnswer = cleanText(body.captcha_answer);
  const captchaToken = cleanText(body.captcha_token);
  const privacyAccepted = body.privacy_accepted === true || cleanText(body.privacy_accepted) === 'true';

  if (!clinicId) return json({ success: false, error: 'Clinica mancante.' }, 422);
  if (!requesterEmail && !requesterPhone) return json({ success: false, error: 'Inserisci almeno email o telefono.' }, 422);
  if (requesterEmail && !validEmail(requesterEmail)) return json({ success: false, error: 'Email non valida.' }, 422);
  if (!message || message.length < 20) return json({ success: false, error: 'Aggiungi una richiesta piu completa.' }, 422);
  if (!privacyAccepted) return json({ success: false, error: 'Accetta l informativa privacy per inviare la richiesta.' }, 422);
  if (!verifyCaptcha(captchaToken, captchaAnswer)) return json({ success: false, error: 'Verifica anti-spam non valida.' }, 422);

  const clinicResult = await query<any>(
    `select id::text as id, name, slug, email
     from public.clinics
     where id::text = $1
       and nullif(trim(email), '') is not null
     limit 1`,
    [clinicId]
  );
  const clinic = clinicResult.rows[0]
    ? { ...clinicResult.rows[0], email: normalizeEmail(clinicResult.rows[0].email) }
    : null;
  if (!clinic?.email || !validEmail(clinic.email)) return json({ success: false, error: 'Questa struttura non ha un contatto email disponibile.' }, 422);

  const { user } = await requireLocalUser(context);
  const insertResult = await query<any>(
    `insert into public.quote_requests (
       user_id, service_slug, service_name, location_label,
       requester_name, requester_email, requester_phone, message,
       clinic_ids, clinic_emails, status, metadata, created_at
     )
     values ($1, 'contatto-scheda', 'Richiesta informazioni', null, $2, $3, $4, $5, $6::text[], $7::text[], 'received', $8::jsonb, now())
     returning id::text`,
    [
      user?.id || null,
      requesterName || null,
      requesterEmail || null,
      requesterPhone || null,
      message,
      [clinic.id],
      [clinic.email],
      JSON.stringify({
        source: 'scheda-veterinario',
        privacy_accepted: true,
        privacy_accepted_at: new Date().toISOString(),
        page: context.request.headers.get('referer') || '',
        clinics: [{ id: clinic.id, name: clinic.name, slug: clinic.slug, email: clinic.email }],
      }),
    ]
  );
  const requestId = insertResult.rows[0]?.id;
  const emailTemplate = buildClinicEmail({
    clinicName: clinic.name,
    clinicSlug: cleanText(clinic.slug),
    clinicId: cleanText(clinic.id),
    requesterName,
    requesterEmail,
    requesterPhone,
    message,
  });

  const clinicResultEmail = await sendCloudflareEmail({
    to: clinic.email,
    from: siteConfig.publicEmail,
    replyTo: requesterEmail || undefined,
    subject: emailTemplate.subject,
    text: emailTemplate.text,
    html: emailTemplate.html,
  });

  await recordLeadEvent({
    clinicId: clinic.id,
    eventType: 'contact_request_submit',
    source: 'scheda-veterinario',
    quoteRequestId: requestId,
    serviceSlug: 'contatto-scheda',
    serviceName: 'Richiesta informazioni',
    pagePath: new URL(context.request.headers.get('referer') || '/', siteConfig.url).pathname,
    requesterEmail,
    requesterPhone,
    metadata: {
      request_id: requestId,
      clinic_name: clinic.name,
      clinic_email: clinic.email,
    },
  }, context).catch(() => null);

  await query(
    `update public.quote_requests
     set status = $2,
         clinic_email_status = $3,
         admin_email_status = 'not_sent',
         email_errors = $4::jsonb,
         updated_at = now()
     where id = $1`,
    [
      requestId,
      clinicResultEmail.success ? 'sent' : 'received_email_warning',
      clinicResultEmail.success ? 'sent' : 'partial_or_failed',
      JSON.stringify({ clinics: [{ to: clinic.email, success: clinicResultEmail.success, error: clinicResultEmail.error || null }], admin: { success: true, skipped: true, reason: 'admin_email_disabled' } }),
    ]
  );

  return json({
    success: true,
    request_id: requestId,
    sent_count: clinicResultEmail.success ? 1 : 0,
    email_warning: !clinicResultEmail.success,
  });
};
