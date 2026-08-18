import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const { Pool } = pg;

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }
}

loadEnv(path.resolve(process.cwd(), '.env'));

const DATABASE_URL = process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL;
const SITE_URL = process.env.SITE_URL || 'https://www.veterinari.org';
const FROM = process.env.MAIL_FROM || 'info@veterinari.org';
const LIMIT = Number(process.argv.find((arg) => arg.startsWith('--limit='))?.split('=')[1] || 20);
const REMINDER_LIMIT = Math.min(15, Number(process.argv.find((arg) => arg.startsWith('--reminder-limit='))?.split('=')[1] || 15));
const PREVIEW = process.argv.includes('--preview');
const DRY_RUN = process.argv.includes('--dry-run') || PREVIEW;
const TEST_TO = process.argv.find((arg) => arg.startsWith('--test-to='))?.split('=')[1];
const QA_CC = process.env.MARKETING_QA_CC || 'info@veterinari.org,romolo.velati@gmail.com';
const CAMPAIGN_KEY = 'lead-interest-v2';

if (!DATABASE_URL) throw new Error('DATABASE_URL non configurato.');

const pool = new Pool({ connectionString: DATABASE_URL, max: 3 });

function cleanEmail(value) {
  const raw = String(value || '').trim();
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

function cleanEmailList(value) {
  return Array.from(new Set(
    String(value || '')
      .split(/[,\s;]+/)
      .map(cleanEmail)
      .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  ));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizedEventService(value) {
  return String(value || '').trim().toLowerCase() || 'generic';
}

function eventTimeMs(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function compactMarketingEvents(events) {
  const sorted = [...events].sort((a, b) => eventTimeMs(b.created_at) - eventTimeMs(a.created_at));
  const compacted = [];
  const windowMs = 10 * 60 * 1000;

  for (const event of sorted) {
    const eventMs = eventTimeMs(event.created_at);
    const serviceKey = normalizedEventService(event.service_name);
    const requestKey = event.quote_request_id ? `quote:${event.quote_request_id}` : '';
    const match = compacted.find((group) => {
      if (group.event_type !== event.event_type) return false;
      if (requestKey && group.request_keys.has(requestKey)) return true;
      if (group.service_key !== serviceKey) return false;
      return Math.abs(group.latest_ms - eventMs) <= windowMs || Math.abs(group.earliest_ms - eventMs) <= windowMs;
    });

    if (match) {
      match.count += 1;
      match.latest_ms = Math.max(match.latest_ms, eventMs);
      match.earliest_ms = Math.min(match.earliest_ms, eventMs);
      if (requestKey) match.request_keys.add(requestKey);
      continue;
    }

    compacted.push({
      ...event,
      count: 1,
      service_key: serviceKey,
      latest_ms: eventMs,
      earliest_ms: eventMs,
      request_keys: new Set(requestKey ? [requestKey] : []),
    });
  }

  return compacted.sort((a, b) => b.latest_ms - a.latest_ms);
}

function eventWhenLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - eventDay.getTime()) / 86400000);
  const time = new Intl.DateTimeFormat('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Rome',
  }).format(date);

  if (diffDays === 0) return `oggi alle ${time}`;
  if (diffDays === 1) return `ieri alle ${time}`;

  const day = new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'long',
    timeZone: 'Europe/Rome',
  }).format(date);
  return `il ${day} alle ${time}`;
}

function serviceNamesFromEvents(events) {
  const names = [];
  const seen = new Set();
  for (const event of events) {
    const name = String(event.service_name || '').trim();
    if (!name || name === 'Richiesta informazioni' || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    names.push(name);
  }
  return names.slice(0, 4);
}

function truncateWords(value, maxLength) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3).replace(/\s+\S*$/, '').trim()}...`;
}

function primaryMarketingEvent(events, preferredTypes = null) {
  const priority = {
    quote_request_submit: 4,
    contact_request_submit: 3,
    click_phone: 2,
    click_directions: 2,
    click_email: 1,
  };
  const compacted = compactMarketingEvents(events);
  const filtered = preferredTypes?.length
    ? compacted.filter((event) => preferredTypes.includes(event.event_type))
    : compacted;
  return filtered
    .sort((a, b) => {
      const priorityDiff = (priority[b.event_type] || 0) - (priority[a.event_type] || 0);
      return priorityDiff || b.latest_ms - a.latest_ms;
    })[0] || null;
}

function campaignSubject(clinic, events) {
  const preferredTypes = clinic.queue_type === 'direct_contact' ? ['click_phone', 'click_directions'] : null;
  const event = primaryMarketingEvent(events, preferredTypes);
  const service = truncateWords(event?.service_name, 42);
  if (clinic.queue_type === 'direct_contact') {
    return `${truncateWords(clinic.name, 48)}: un utente ha cercato di contattarti`;
  }
  if (event?.event_type === 'quote_request_submit' && service && service !== 'Richiesta informazioni') {
    return `Una richiesta per ${service} dalla tua scheda`;
  }
  if (event?.event_type === 'contact_request_submit') {
    return `Una richiesta di informazioni per ${truncateWords(clinic.name, 42)}`;
  }
  return `${truncateWords(clinic.name, 48)}: un utente ha cercato di contattarti`;
}

function primaryEventSentence(events, preferredTypes = null) {
  const event = primaryMarketingEvent(events, preferredTypes);
  if (!event) return 'negli ultimi giorni un utente ha interagito con la scheda';

  const when = eventWhenLabel(event.created_at);
  const service = String(event.service_name || '').trim();
  if (event.event_type === 'quote_request_submit') {
    return service && service !== 'Richiesta informazioni'
      ? `${when} è stata inviata una richiesta per ${service}`
      : `${when} è stata inviata una richiesta di preventivo`;
  }
  if (event.event_type === 'contact_request_submit') return `${when} è stata inviata una richiesta di informazioni`;
  if (event.event_type === 'click_phone') return `${when} un utente ha selezionato il numero di telefono`;
  if (event.event_type === 'click_directions') return `${when} un utente ha aperto il percorso verso la struttura`;
  if (event.event_type === 'click_email') return `${when} un utente ha selezionato l'indirizzo email`;
  return `${when} un utente ha interagito con la scheda`;
}

function profileCompletenessHints(clinic) {
  const hints = [];
  if (!Number(clinic.declared_service_count || 0)) hints.push('selezionare i servizi realmente offerti');
  if (!clinic.hours) hints.push('aggiornare gli orari');
  if (!clinic.website) hints.push('aggiungere sito web o pagina ufficiale');
  if (!clinic.phone) hints.push('verificare il numero di telefono');
  if (!Number(clinic.price_count || 0)) hints.push('aggiungere, solo se lo desideri, prezzi indicativi');
  return hints;
}

function buildEmail({ clinic, outreach, events }) {
  const hasTrackingToken = outreach.click_token && outreach.click_token !== 'test-token' && outreach.click_token !== 'dry-run-token';
  const clickBase = `${SITE_URL}/api/marketing-click?token=${encodeURIComponent(outreach.click_token || '')}`;
  const profileUrl = hasTrackingToken ? `${clickBase}&to=profile` : `${SITE_URL}/veterinari/${clinic.slug}`;
  const claimUrl = hasTrackingToken ? `${clickBase}&to=claim` : `${SITE_URL}/claim?clinic=${encodeURIComponent(clinic.slug || '')}`;
  const serviceNames = serviceNamesFromEvents(events);
  const hints = profileCompletenessHints(clinic);
  const title = campaignSubject(clinic, events);
  const visibleClinicName = clinic.name || 'la tua struttura';
  const queueType = clinic.queue_type || 'direct_contact';
  const requestedServices = serviceNames.length ? serviceNames.join(', ') : '';
  const isQuoteReminder = queueType === 'quote_reminder';
  const titleHtml = isQuoteReminder
    ? 'Hai ricevuto una richiesta di preventivo'
    : 'Una persona ha cercato di contattarti';
  const preferredTypes = isQuoteReminder ? ['quote_request_submit'] : ['click_phone', 'click_directions'];
  const directOrQuoteEventSentence = primaryEventSentence(events, preferredTypes);
  const nextStep = isQuoteReminder
    ? requestedServices
      ? `Se avete già risposto, potete usare la registrazione gratuita per prendere possesso della scheda e ricevere richieste più chiare per ${requestedServices}.`
      : 'Se avete già risposto, potete usare la registrazione gratuita per prendere possesso della scheda e ricevere richieste più chiare.'
    : hints.length
      ? `Puoi iniziare verificando ${hints.slice(0, 2).join(' e ')}. Se vuoi ricevere più contatti diretti, aggiungi o conferma email, telefono, orari e servizi.`
      : 'Puoi controllare che dati, servizi e modalità di contatto siano ancora corretti per ricevere più contatti diretti.';
  const leadExplanation = isQuoteReminder
    ? 'Ti scriviamo come promemoria: un proprietario ha inviato una richiesta tramite Veterinari.org. La struttura può rispondere direttamente al cliente e, registrandosi gratis, gestire meglio dati e servizi della scheda.'
    : 'Ti scriviamo perché un utente ha mostrato intenzione di contatto aprendo telefono o percorso. Verificando la scheda puoi rendere più semplice ricevere nuovi contatti.';
  const logoUrl = `${SITE_URL}/apple-touch-icon.png`;

  const text = [
    'Gentile Veterinario/a,',
    '',
    `dalla scheda di "${visibleClinicName}" è arrivato un segnale concreto: ${directOrQuoteEventSentence}.`,
    '',
    leadExplanation,
    '',
    'La scheda è già visibile gratuitamente su Veterinari.org. Verificandola puoi correggere i dati, confermare i servizi offerti e scegliere come ricevere le richieste.',
    '',
    nextStep,
    '',
    'Il listino prezzi è facoltativo: puoi pubblicare un prezzo indicativo, invitare il proprietario a contattarti oppure non mostrarlo.',
    '',
    `Verifica e aggiorna gratuitamente la scheda: ${claimUrl}`,
    `Guarda prima la scheda pubblica: ${profileUrl}`,
    '',
    'La registrazione è gratuita e non richiede alcun abbonamento.',
    'Ricevi questa email perché la scheda, creata da informazioni pubbliche, ha generato una recente interazione.',
    '',
    'Lo Staff di Veterinari.org',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;color:#172033;line-height:1.55;max-width:680px">
      <div style="display:flex;align-items:center;gap:12px;margin:0 0 18px">
        <img src="${logoUrl}" alt="Veterinari.org" width="48" height="48" style="display:block;border-radius:12px">
        <div>
          <div style="font-size:22px;font-weight:700;color:#16a34a;line-height:1.1">Veterinari.org</div>
          <div style="font-size:14px;color:#667085">Portale gratuito per veterinari e proprietari di animali</div>
        </div>
      </div>
      <div style="display:none;max-height:0;overflow:hidden;color:#fff;opacity:0">Verifica il dato e aggiorna gratuitamente la scheda della struttura.</div>
      <h1 style="font-size:25px;line-height:1.25;margin:0 0 14px">${escapeHtml(titleHtml)}</h1>
      <p>Gentile Veterinario/a,</p>
      <p>Dalla scheda di <strong>${escapeHtml(visibleClinicName)}</strong> è arrivato un segnale concreto.</p>
      <div style="border-left:4px solid #16a34a;background:#f0fdf4;padding:14px 16px;margin:20px 0">
        <p style="margin:0;font-size:17px"><strong>${escapeHtml(directOrQuoteEventSentence)}.</strong></p>
      </div>
      <p>${escapeHtml(leadExplanation)}</p>
      <p>La scheda è già visibile gratuitamente su Veterinari.org. Verificandola puoi <strong>correggere i dati, confermare i servizi offerti e scegliere come ricevere le richieste</strong>.</p>
      <p>${escapeHtml(nextStep)}</p>
      <div style="margin:22px 0">
        <a href="${claimUrl}" style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;font-weight:bold;padding:13px 18px;border-radius:8px">Verifica e aggiorna la scheda</a>
      </div>
      <p style="font-size:14px;color:#475467"><strong>Il listino prezzi è facoltativo.</strong> Puoi pubblicare un prezzo indicativo, invitare il proprietario a contattarti oppure non mostrarlo.</p>
      <p><a href="${profileUrl}" style="color:#166534">Guarda prima la scheda pubblica</a></p>
      <p style="font-size:13px;color:#667085;margin-top:26px">La registrazione è gratuita e non richiede alcun abbonamento. Ricevi questa email perché la scheda, creata da informazioni pubbliche, ha generato una recente interazione.</p>
      <p style="margin-top:24px">Lo Staff di Veterinari.org</p>
    </div>`;

  return { subject: title, text, html };
}

async function sendMailgun({ to, cc, subject, text, html }) {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const baseUrl = (process.env.MAILGUN_BASE_URL || 'https://api.mailgun.net').replace(/\/$/, '');
  if (!apiKey || !domain) throw new Error('MAILGUN_API_KEY o MAILGUN_DOMAIN non configurati.');

  const form = new FormData();
  form.set('from', FROM);
  form.set('to', to);
  for (const ccRecipient of cleanEmailList(cc)) form.append('cc', ccRecipient);
  form.set('subject', subject);
  form.set('text', text);
  form.set('html', html);

  const response = await fetch(`${baseUrl}/v3/${domain}/messages`, {
    method: 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString('base64')}` },
    body: form,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || data.error || `Mailgun HTTP ${response.status}`);
  return data;
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const candidates = await client.query(
      `with recent_events as (
         select e.clinic_id,
                array_agg(e.id order by e.created_at desc) as event_ids,
                jsonb_agg(jsonb_build_object(
                  'id', e.id::text,
                  'event_type', e.event_type,
                  'quote_request_id', e.quote_request_id::text,
                  'service_name', e.service_name,
                  'location_label', e.location_label,
                  'created_at', e.created_at
                ) order by e.created_at desc) as events_json,
                max(e.created_at) as last_event_at,
                count(*) as event_count,
                count(*) filter (where e.event_type = 'click_phone') as phone_clicks,
                count(*) filter (where e.event_type = 'click_directions') as direction_clicks,
                count(*) filter (where e.event_type = 'click_email') as email_clicks,
                count(*) filter (where e.event_type = 'quote_request_submit') as quote_requests,
                count(*) filter (where e.event_type = 'contact_request_submit') as contact_requests
          from public.clinic_lead_events e
          where e.created_at >= now() - interval '30 days'
          group by e.clinic_id
       ),
       base as (
         select c.id::text,
                c.name,
                c.slug,
                c.email,
                c.phone,
                c.website,
                c.hours,
                coalesce(cardinality(c.service_ids), 0) as declared_service_count,
                coalesce(sp.price_count, 0) as price_count,
                r.*,
                case
                  when (r.phone_clicks + r.direction_clicks) > 0 then 'direct_contact'
                  when r.quote_requests > 0 then 'quote_reminder'
                  else 'other'
                end as queue_type,
                (
                  (case when (r.phone_clicks + r.direction_clicks) > 0 then 1000 else 0 end)
                  + (r.phone_clicks * 8)
                  + (r.direction_clicks * 7)
                  + (r.quote_requests * 5)
                  + (r.contact_requests * 3)
                  + (r.email_clicks * 2)
                  + least(r.event_count, 5)
                  + case when coalesce(sp.price_count, 0) = 0 then 6 else 0 end
                  + case when coalesce(cardinality(c.service_ids), 0) = 0 then 4 else 0 end
                  + case when c.hours is null then 2 else 0 end
                ) as engagement_score
         from recent_events r
         join public.clinics c on c.id = r.clinic_id
         left join (
           select clinic_id, count(*) as price_count
           from public.services_prices
           group by clinic_id
         ) sp on sp.clinic_id = c.id
         where nullif(trim(c.email), '') is not null
           and c.owner_id is null
           and c.status <> 'rimossa'
           and (
             (r.phone_clicks + r.direction_clicks) > 0
             or r.quote_requests > 0
           )
           and not exists (
             select 1 from public.clinic_marketing_outreach o
             where o.clinic_id = c.id
               and o.status in ('pending', 'sent')
               and o.created_at >= now() - interval '45 days'
           )
       ),
       ranked as (
         select base.*,
                row_number() over (
                  partition by queue_type
                  order by engagement_score desc, last_event_at desc
                ) as queue_position
         from base
         where queue_type in ('direct_contact', 'quote_reminder')
       )
       select *
       from ranked
       where queue_type = 'direct_contact'
          or (queue_type = 'quote_reminder' and queue_position <= $2)
       order by
         case queue_type when 'direct_contact' then 0 else 1 end,
         engagement_score desc,
         last_event_at desc
       limit $1`,
      [LIMIT, REMINDER_LIMIT]
    );

    const prepared = [];
    for (const row of candidates.rows) {
      const email = cleanEmail(row.email);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;
      if (DRY_RUN || TEST_TO) {
        prepared.push({
          clinic: row,
          outreach: { id: TEST_TO ? 'test' : 'dry-run', click_token: TEST_TO ? 'test-token' : 'dry-run-token' },
          events: row.events_json || [],
        });
        continue;
      }
      const inserted = await client.query(
        `insert into public.clinic_marketing_outreach (
           clinic_id, campaign_key, recipient_email, subject, status,
           lead_event_ids, lead_summary, metadata, created_at, updated_at
         )
         values ($1, $2, $3, $4, 'pending', $5::uuid[], $6::jsonb, $7::jsonb, now(), now())
         returning id::text, click_token::text`,
        [
          row.id,
          CAMPAIGN_KEY,
          email,
          campaignSubject(row, row.events_json || []),
          row.event_ids,
          JSON.stringify({
            event_count: Number(row.event_count || 0),
            phone_clicks: Number(row.phone_clicks || 0),
            direction_clicks: Number(row.direction_clicks || 0),
            email_clicks: Number(row.email_clicks || 0),
            quote_requests: Number(row.quote_requests || 0),
            contact_requests: Number(row.contact_requests || 0),
            queue_type: row.queue_type,
            queue_position: Number(row.queue_position || 0),
            declared_service_count: Number(row.declared_service_count || 0),
            price_count: Number(row.price_count || 0),
            engagement_score: Number(row.engagement_score || 0),
            last_event_at: row.last_event_at,
          }),
          JSON.stringify({
            clinic_slug: row.slug,
            campaign_goal: 'verify_profile_and_confirm_requested_services',
          }),
        ]
      );
      prepared.push({ clinic: row, outreach: inserted.rows[0], events: row.events_json || [] });
    }
    await client.query('commit');

    let sentCount = 0;
    let previewPrinted = false;
    for (const item of prepared) {
      const email = buildEmail(item);
      const recipient = cleanEmail(item.clinic.email);
      if (TEST_TO) {
        const testRecipient = cleanEmail(TEST_TO);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testRecipient)) throw new Error(`Email test non valida: ${TEST_TO}`);
        const testText = [
          `TEST interno. Destinatario reale previsto: ${item.clinic.name} <${recipient}>`,
          '',
          email.text,
        ].join('\n');
        const testHtml = `
          <div style="font-family:Arial,sans-serif;border:1px solid #fde68a;background:#fffbeb;padding:12px;margin-bottom:16px">
            <strong>TEST interno.</strong> Destinatario reale previsto: ${escapeHtml(item.clinic.name)} &lt;${escapeHtml(recipient)}&gt;
          </div>
          ${email.html}`;
        await sendMailgun({ to: testRecipient, subject: `[TEST] ${email.subject}`, text: testText, html: testHtml });
        console.log(`test sent ${item.clinic.name} preview to <${testRecipient}>`);
        continue;
      }
      if (DRY_RUN) {
        console.log(`[dry-run] queue=${item.clinic.queue_type} pos=${item.clinic.queue_position} score=${item.clinic.engagement_score} phone=${item.clinic.phone_clicks || 0} directions=${item.clinic.direction_clicks || 0} quotes=${item.clinic.quote_requests || 0} prices=${item.clinic.price_count} services=${item.clinic.declared_service_count} ${item.clinic.name} <${recipient}> ${item.outreach.click_token}`);
        if (PREVIEW && !previewPrinted) {
          console.log('\n--- SUBJECT ---\n');
          console.log(email.subject);
          console.log('\n--- TEXT ---\n');
          console.log(email.text);
          previewPrinted = true;
        }
        continue;
      }
      try {
        const qaCc = sentCount === 0 ? cleanEmailList(QA_CC).filter((email) => email !== recipient) : [];
        const result = await sendMailgun({ to: recipient, cc: qaCc, ...email });
        await pool.query(
          `update public.clinic_marketing_outreach
           set status = 'sent', sent_at = now(), updated_at = now(), metadata = metadata || $2::jsonb
           where id = $1`,
          [item.outreach.id, JSON.stringify({ mailgun: result, qa_cc: qaCc.length ? qaCc : null })]
        );
        console.log(`sent ${item.clinic.name} <${recipient}>${qaCc.length ? ` cc <${qaCc.join(', ')}>` : ''}`);
        sentCount += 1;
      } catch (error) {
        await pool.query(
          `update public.clinic_marketing_outreach
           set status = 'failed', error = $2, updated_at = now()
           where id = $1`,
          [item.outreach.id, error?.message || String(error)]
        );
        console.error(`failed ${item.clinic.name}: ${error?.message || error}`);
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
