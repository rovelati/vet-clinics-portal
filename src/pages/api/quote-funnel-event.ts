import type { APIRoute } from 'astro';
import { createHash } from 'node:crypto';
import { query } from '@/lib/local-db';

const json = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

function cleanText(value: unknown) {
  return String(value || '').replace(/"/g, '').trim();
}

function cleanInt(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : null;
}

function cleanUuid(value: unknown) {
  const text = cleanText(value);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)
    ? text
    : null;
}

function hashVisitor(request: Request) {
  const forwarded = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')
    || '';
  const ua = request.headers.get('user-agent') || '';
  const raw = `${forwarded.split(',')[0].trim()}|${ua}`;
  if (!raw.trim()) return null;
  return createHash('sha256').update(raw).digest('hex').slice(0, 32);
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => ({}));
  const eventType = cleanText(body.event_type);
  if (!['quote_request_open'].includes(eventType)) {
    return json({ success: false, error: 'Evento non consentito.' }, 422);
  }

  const serviceSlug = cleanText(body.service_slug);
  if (!serviceSlug) return json({ success: false, error: 'Servizio mancante.' }, 422);

  const { rows } = await query<{ id: string }>(
    `insert into public.quote_funnel_events (
       event_type, service_slug, service_name, location_label, page_path,
       visitor_hash, selected_clinic_count, selected_clinic_id, metadata, created_at
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8::uuid, $9::jsonb, now())
     returning id::text`,
    [
      eventType,
      serviceSlug,
      cleanText(body.service_name) || null,
      cleanText(body.location_label) || null,
      cleanText(body.page_path) || null,
      hashVisitor(request),
      cleanInt(body.selected_clinic_count),
      cleanUuid(body.selected_clinic_id),
      JSON.stringify({
        trigger: cleanText(body.trigger).slice(0, 80),
        page_location: cleanText(body.page_location).slice(0, 300),
      }),
    ]
  );

  return json({ success: true, id: rows[0]?.id || null });
};
