import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { mkdirSync, writeFileSync, chmodSync, existsSync } from 'node:fs';
import path from 'node:path';
import WebSocket from 'ws';
import { requireLocalUser } from '@/lib/local-auth';
import { loadSpiderEnv, resolveToolsRoot } from '@/lib/admin-tools';

const supabaseUrl = import.meta.env.LOCAL_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
const allowUnauth = import.meta.env.ADMIN_TEST_ALLOW_UNAUTH === 'true';
const publicSiteUrl = (import.meta.env.PUBLIC_SITE_URL || 'https://veterinari.org').replace(/\/$/, '');

const json = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

const admin = supabaseUrl && serviceKey
  ? createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
      global: import.meta.env.LOCAL_SUPABASE_URL ? { fetch: localPostgrestFetch } : undefined,
      realtime: { transport: WebSocket },
    })
  : null;

function localPostgrestFetch(input: RequestInfo | URL, init?: RequestInit) {
  const sourceUrl = input instanceof Request ? input.url : String(input);
  const url = new URL(sourceUrl);
  url.pathname = url.pathname.replace(/^\/rest\/v1\/?/, '/');
  const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
  headers.delete('apikey');
  headers.delete('authorization');
  return fetch(url, { ...init, headers });
}

function slugSafe(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'clinic';
}

function resolveMediaDir(): string {
  const spiderEnv = loadSpiderEnv(resolveToolsRoot());
  const fromEnv =
    process.env.VETERINARI_MEDIA_DIR ||
    spiderEnv.VETERINARI_MEDIA_DIR ||
    import.meta.env.VETERINARI_MEDIA_DIR;
  if (fromEnv && String(fromEnv).trim()) return String(fromEnv).trim();

  const candidates = [
    '/var/www/veterinari-org/public/media/gallery/clinics',
    path.resolve(process.cwd(), 'public/media/gallery/clinics'),
  ];
  for (const dir of candidates) {
    if (existsSync(dir) || existsSync(path.dirname(dir))) return dir;
  }
  return candidates[candidates.length - 1];
}

async function requireAdmin(context: Parameters<APIRoute>[0]) {
  if (!admin) return { ok: false as const, response: json({ success: false, error: 'SUPABASE_SERVICE_ROLE_KEY non configurata sul server.' }, 503) };
  if (allowUnauth) return { ok: true as const };

  const { user } = await requireLocalUser(context);
  if (!user?.id) return { ok: false as const, response: json({ success: false, error: 'Sessione non valida o scaduta.' }, 401) };

  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin' || user.role !== 'admin') return { ok: false as const, response: json({ success: false, error: 'Permessi admin insufficienti.' }, 403) };
  return { ok: true as const };
}

export const POST: APIRoute = async (context) => {
  const { request } = context;
  const gate = await requireAdmin(context);
  if (!gate.ok) return gate.response;

  try {
    const form = await request.formData();
    const clinicId = String(form.get('clinic_id') || '');
    const file = form.get('image');

    if (!clinicId || !(file instanceof File)) {
      return json({ success: false, error: 'clinic_id e image sono obbligatori.' }, 422);
    }

    const { data: clinic, error: clinicError } = await admin!
      .from('clinics')
      .select('id, slug, gallery_images')
      .eq('id', clinicId)
      .maybeSingle();
    if (clinicError) throw clinicError;
    if (!clinic) return json({ success: false, error: 'Clinica non trovata.' }, 404);

    const extension = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const filename = `${slugSafe(clinic.slug || clinic.id)}_${String(clinic.id).slice(0, 8)}_${Date.now()}.${extension}`;
    const mediaDir = resolveMediaDir();
    mkdirSync(mediaDir, { recursive: true });

    const target = path.join(mediaDir, filename);
    const bytes = Buffer.from(await file.arrayBuffer());
    writeFileSync(target, bytes);
    try {
      chmodSync(target, 0o644);
    } catch {
      // ignore permission quirks on some hosts
    }

    // Allineato a SPIDER/upload_images_to_storage.py → /media/gallery/clinics/...
    const imageUrl = `${publicSiteUrl}/media/gallery/clinics/${filename}`;
    const galleryImages = [...(Array.isArray(clinic.gallery_images) ? clinic.gallery_images : []), imageUrl];
    const { error: updateError } = await admin!.from('clinics').update({ gallery_images: galleryImages }).eq('id', clinicId);
    if (updateError) throw updateError;

    return json({ success: true, image_url: imageUrl, gallery_images: galleryImages, storage: 'filesystem' });
  } catch (error: any) {
    return json({ success: false, error: error?.message || String(error) }, 500);
  }
};
