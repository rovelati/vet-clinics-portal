import type { APIRoute } from 'astro';
import { recordLeadEvent } from '@/lib/lead-events';

const json = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

function cleanText(value: unknown) {
  return String(value || '').replace(/"/g, '').trim();
}

export const POST: APIRoute = async (context) => {
  const body = await context.request.json().catch(() => ({}));
  const eventType = cleanText(body.event_type);
  const linkUrl = cleanText(body.link_url);

  if (!['click_phone', 'click_email', 'click_directions'].includes(eventType)) {
    return json({ success: false, error: 'Evento non consentito.' }, 422);
  }

  if (!linkUrl) return json({ success: false, error: 'Link mancante.' }, 422);

  const id = await recordLeadEvent({
    eventType,
    source: 'site-click',
    clinicId: cleanText(body.clinic_id) || null,
    pagePath: cleanText(body.page_path) || null,
    linkUrl,
    metadata: {
      page_title: cleanText(body.page_title),
      page_location: cleanText(body.page_location),
      link_text: cleanText(body.link_text).slice(0, 160),
    },
  }, context);

  return json({ success: true, recorded: Boolean(id), id });
};
