import type { APIRoute } from 'astro';
import { query } from '@/lib/local-db';
import { requireLocalUser } from '@/lib/local-auth';

const json = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

function text(value: unknown, max: number) {
  return String(value || '').replace(/\r\n/g, '\n').trim().slice(0, max);
}

async function approvedClinic(userId: string) {
  const { rows } = await query<any>(
    `select c.id, c.name, c.slug
       from public.clinics c
       join public.claims cl on cl.clinic_id = c.id and cl.user_id = $1
      where c.owner_id = $1 and cl.status = 'approved'
      order by cl.approved_at desc nulls last, cl.created_at desc
      limit 1`,
    [userId]
  );
  return rows[0] || null;
}

export const GET: APIRoute = async (context) => {
  const { user } = await requireLocalUser(context);
  if (!user) return json({ success: false, error: 'Sessione richiesta.' }, 401);

  const clinic = await approvedClinic(user.id);
  if (!clinic) {
    return json({ success: true, clinic: null, articles: [], canSubmit: false });
  }

  const { rows } = await query(
    `select id, clinic_id, title, slug, excerpt, content, image_url, status,
            admin_note, submitted_at, reviewed_at, published_at, created_at, updated_at
       from public.veterinary_blog_articles
      where author_id = $1 and clinic_id = $2
      order by updated_at desc`,
    [user.id, clinic.id]
  );
  return json({ success: true, clinic, articles: rows, canSubmit: true });
};

export const POST: APIRoute = async (context) => {
  const { user } = await requireLocalUser(context);
  if (!user) return json({ success: false, error: 'Sessione richiesta.' }, 401);

  const clinic = await approvedClinic(user.id);
  if (!clinic) return json({ success: false, error: 'Il claim deve essere approvato prima di proporre articoli.' }, 403);

  const body = await context.request.json().catch(() => ({}));
  const action = String(body.action || 'save');
  const id = text(body.id, 80) || null;
  const title = text(body.title, 180);
  const excerpt = text(body.excerpt, 320) || null;
  const content = text(body.content, 30_000);
  const imageUrl = text(body.image_url, 1_000) || null;

  if (!['save', 'submit'].includes(action)) return json({ success: false, error: 'Azione non valida.' }, 422);
  if (title.length < 8) return json({ success: false, error: 'Inserisci un titolo di almeno 8 caratteri.' }, 422);
  if (content.length < 300) return json({ success: false, error: 'L articolo deve contenere almeno 300 caratteri.' }, 422);
  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) return json({ success: false, error: 'URL immagine non valido.' }, 422);

  const nextStatus = action === 'submit' ? 'pending' : 'draft';
  let rows;
  if (id) {
    const result = await query<any>(
      `update public.veterinary_blog_articles
          set title = $1, excerpt = $2, content = $3, image_url = $4,
              status = $5, admin_note = case when $5 = 'pending' then null else admin_note end,
              submitted_at = case when $5 = 'pending' then now() else submitted_at end,
              updated_at = now()
        where id::text = $6 and author_id = $7 and clinic_id = $8
          and status in ('draft', 'rejected')
      returning *`,
      [title, excerpt, content, imageUrl, nextStatus, id, user.id, clinic.id]
    );
    rows = result.rows;
  } else {
    const result = await query<any>(
      `insert into public.veterinary_blog_articles
        (clinic_id, author_id, title, excerpt, content, image_url, status, submitted_at)
       values ($1, $2, $3, $4, $5, $6, $7, case when $7 = 'pending' then now() else null end)
       returning *`,
      [clinic.id, user.id, title, excerpt, content, imageUrl, nextStatus]
    );
    rows = result.rows;
  }

  if (!rows[0]) return json({ success: false, error: 'Articolo non modificabile: potrebbe essere gia in revisione o pubblicato.' }, 409);
  return json({ success: true, article: rows[0] });
};
