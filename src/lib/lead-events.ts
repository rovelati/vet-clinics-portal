import type { APIContext } from 'astro';
import { createHash } from 'node:crypto';
import { query } from '@/lib/local-db';

export type LeadEventInput = {
  clinicId?: string | null;
  eventType: string;
  source?: string | null;
  quoteRequestId?: string | null;
  serviceSlug?: string | null;
  serviceName?: string | null;
  locationLabel?: string | null;
  pagePath?: string | null;
  linkUrl?: string | null;
  requesterEmail?: string | null;
  requesterPhone?: string | null;
  metadata?: Record<string, unknown>;
};

function cleanText(value: unknown) {
  return String(value || '').replace(/"/g, '').trim();
}

function normalizePhone(value: unknown) {
  return cleanText(value).replace(/[^\d+]/g, '');
}

function hashVisitor(context?: APIContext) {
  if (!context) return null;
  const forwarded = context.request.headers.get('cf-connecting-ip')
    || context.request.headers.get('x-forwarded-for')
    || '';
  const ua = context.request.headers.get('user-agent') || '';
  const raw = `${forwarded.split(',')[0].trim()}|${ua}`;
  if (!raw.trim()) return null;
  return createHash('sha256').update(raw).digest('hex').slice(0, 32);
}

export async function resolveClinicForLeadEvent(input: Pick<LeadEventInput, 'clinicId' | 'pagePath' | 'linkUrl'>) {
  const clinicId = cleanText(input.clinicId);
  if (clinicId) return clinicId;

  const pagePath = cleanText(input.pagePath);
  const slugMatch = pagePath.match(/^\/veterinari\/([^/?#]+)/);
  if (slugMatch?.[1]) {
    const { rows } = await query<{ id: string }>(
      `select id::text as id from public.clinics where slug = $1 limit 1`,
      [decodeURIComponent(slugMatch[1])]
    );
    if (rows[0]?.id) return rows[0].id;
  }

  const linkUrl = cleanText(input.linkUrl);
  if (linkUrl.startsWith('tel:')) {
    const phone = normalizePhone(linkUrl.replace(/^tel:/i, ''));
    if (phone) {
      const { rows } = await query<{ id: string }>(
        `select id::text as id
         from public.clinics
         where regexp_replace(coalesce(phone, ''), '[^0-9+]', '', 'g') = $1
            or regexp_replace(coalesce(telefono_norm, ''), '[^0-9+]', '', 'g') = $1
         order by updated_at desc nulls last
         limit 1`,
        [phone]
      );
      if (rows[0]?.id) return rows[0].id;
    }
  }

  if (linkUrl.startsWith('mailto:')) {
    const email = cleanText(linkUrl.replace(/^mailto:/i, '').split('?')[0]).toLowerCase();
    if (email) {
      const { rows } = await query<{ id: string }>(
        `select id::text as id from public.clinics where lower(trim(email)) = $1 limit 1`,
        [email]
      );
      if (rows[0]?.id) return rows[0].id;
    }
  }

  return null;
}

export async function recordLeadEvent(input: LeadEventInput, context?: APIContext) {
  const clinicId = await resolveClinicForLeadEvent(input);
  if (!clinicId) return null;

  const { rows } = await query<{ id: string }>(
    `insert into public.clinic_lead_events (
       clinic_id, event_type, source, quote_request_id,
       service_slug, service_name, location_label,
       page_path, link_url, visitor_hash,
       requester_email, requester_phone, metadata, created_at
     )
     values ($1, $2, $3, $4::uuid, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, now())
     returning id::text`,
    [
      clinicId,
      input.eventType,
      input.source || null,
      input.quoteRequestId || null,
      input.serviceSlug || null,
      input.serviceName || null,
      input.locationLabel || null,
      input.pagePath || null,
      input.linkUrl || null,
      hashVisitor(context),
      input.requesterEmail || null,
      input.requesterPhone || null,
      JSON.stringify(input.metadata || {}),
    ]
  );

  return rows[0]?.id || null;
}
