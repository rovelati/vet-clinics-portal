import type { APIRoute } from 'astro';
import { supabasePublicServer } from '@/lib/supabase';

const clinicSelect = `
  id, name, address, phone, slug,
  rating_avg_cached, rating_count_cached,
  lat, lng, hours, raw_import, gallery_images, created_at
`;

function cleanSearchTerm(value: string | null) {
  return (value || '').replace(/"/g, '').replace(/[%,]/g, ' ').replace(/\s+/g, ' ').trim();
}

const json = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  });

export const GET: APIRoute = async ({ url }) => {
  if (!supabasePublicServer) {
    return json({ success: false, error: 'Database non configurato.' }, 503);
  }

  const cityTerm = cleanSearchTerm(url.searchParams.get('city'));
  const provinceTerm = cleanSearchTerm(url.searchParams.get('province')).toUpperCase();
  const filters: string[] = [];

  if (cityTerm) filters.push(`raw_import->>city.ilike.%${cityTerm}%`);
  if (provinceTerm) filters.push(`raw_import->>province.ilike.%${provinceTerm}%`);

  try {
    let request = supabasePublicServer
      .from('clinics')
      .select(clinicSelect)
      .in('status', ['pubblicata', 'in_revisione'])
      .not('slug', 'is', null)
      .limit(filters.length ? 1000 : 500);

    if (filters.length) request = request.or(filters.join(','));

    const { data, error } = await request
      .order('rating_avg_cached', { ascending: false, nullsFirst: false })
      .order('rating_count_cached', { ascending: false, nullsFirst: false });

    if (error) throw error;
    return json({ success: true, clinics: data ?? [] });
  } catch (error: any) {
    return json({ success: false, error: error?.message || 'Errore caricamento veterinari H24.' }, 500);
  }
};
