CREATE OR REPLACE FUNCTION public.get_clinic_page(p_slug text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
WITH c AS (
  SELECT
    id, owner_id, claimed_at, name, specialization, address, phone, email, website, description,
    hours, status, created_at, updated_at, service_ids,
    rating_avg_cached, rating_count_cached, rating_expires_at, rating_source,
    slug, lat, lng, sentiment, pronto_soccorso_h24, reperibilita_h24,
    CASE
      WHEN gallery_images IS NOT NULL AND array_length(gallery_images, 1) > 0
      THEN ARRAY[gallery_images[1]]
      ELSE ARRAY[]::text[]
    END AS gallery_images,
    jsonb_build_object(
      'city', raw_import->>'city',
      'province', raw_import->>'province',
      'region', raw_import->>'region',
      'postal_code', raw_import->>'postal_code',
      'tags', CASE
        WHEN jsonb_typeof(raw_import->'tags') = 'array'
        THEN (raw_import->'tags')::jsonb
        ELSE '[]'::jsonb
      END,
      'description', CASE
        WHEN raw_import->>'description' IS NOT NULL
        THEN substring(raw_import->>'description', 1, 200)
        ELSE NULL
      END
    ) AS raw_import,
    source_url
  FROM public.clinics
  WHERE slug = p_slug
    AND status IN ('pubblicata', 'in_revisione', 'rimossa')
  LIMIT 1
),
svc_prices AS (
  SELECT st.id AS service_id, st.name AS service_name, st.category AS service_category,
         sp.price, sp.animal_type, st.average_price AS avg_price_from_taxonomy
  FROM c JOIN public.services_prices sp ON sp.clinic_id = c.id
         JOIN public.services_taxonomy st ON st.id = sp.service_id
),
svc_no_prices AS (
  SELECT DISTINCT st.id AS service_id, st.name AS service_name, st.category AS service_category,
         NULL::numeric AS price, NULL::text AS animal_type, st.average_price AS avg_price_from_taxonomy
  FROM c,
       UNNEST(COALESCE(c.service_ids, ARRAY[]::uuid[])) AS service_id
  JOIN public.services_taxonomy st ON st.id = service_id
  WHERE NOT EXISTS (
    SELECT 1 FROM public.services_prices sp
    WHERE sp.clinic_id = c.id AND sp.service_id = st.id
  )
),
svc AS (
  SELECT * FROM svc_prices
  UNION
  SELECT * FROM svc_no_prices
  ORDER BY service_category, service_name NULLS LAST
),
sum AS (
  SELECT s.* FROM c JOIN public.google_reviews_summary s ON s.clinic_id = c.id
),
rev AS (
  SELECT r.review_id, r.source, r.star_rating, r.comment, r.reviewer_name,
         r.reviewer_photo, r.reviewer_url, r.is_anonymous, r.created_at_g
  FROM c JOIN public.google_reviews r ON r.clinic_id = c.id
  WHERE r.star_rating IS NOT NULL AND (r.expires_at IS NULL OR r.expires_at > now())
  ORDER BY r.created_at_g DESC
  LIMIT 10
)
SELECT jsonb_build_object(
  'clinic',  (SELECT to_jsonb(c.*) FROM c),
  'services',(SELECT COALESCE(jsonb_agg(to_jsonb(svc.*)), '[]'::jsonb) FROM svc),
  'summary', (SELECT to_jsonb(sum.*) FROM sum),
  'latest3', (SELECT COALESCE(jsonb_agg(to_jsonb(rev.*)), '[]'::jsonb) FROM rev),
  'source_url', (SELECT c.source_url FROM c)
);
$function$;
