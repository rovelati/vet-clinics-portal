import type { APIRoute } from 'astro';
import { randomBytes } from 'node:crypto';
import { query } from '@/lib/local-db';
import { requireLocalUser } from '@/lib/local-auth';

const json = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });

function cleanText(value: unknown, max = 1000) {
  return String(value || '').replace(/"/g, '').trim().slice(0, max);
}

function cleanDate(value: unknown) {
  const text = cleanText(value, 20);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function cleanNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function cleanPhoto(value: unknown) {
  const photo = String(value || '').trim();
  if (!photo) return null;
  if (/^data:image\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(photo) && photo.length <= 1_600_000) return photo;
  if (/^https?:\/\//i.test(photo)) return cleanText(photo, 1000);
  return null;
}

function petPayload(row: Record<string, unknown>) {
  return {
    name: cleanText(row.name, 120),
    species: cleanText(row.species, 40) || 'cane',
    breed: cleanText(row.breed, 120) || null,
    sex: cleanText(row.sex, 40) || null,
    birth_date: cleanDate(row.birth_date),
    weight_kg: cleanNumber(row.weight_kg),
    photo_url: cleanPhoto(row.photo_url),
    microchip: cleanText(row.microchip, 80) || null,
    neutered: typeof row.neutered === 'boolean' ? row.neutered : null,
    allergies: cleanText(row.allergies, 1200) || null,
    conditions: cleanText(row.conditions, 1200) || null,
    medications: cleanText(row.medications, 1200) || null,
    nutrition_notes: cleanText(row.nutrition_notes, 1200) || null,
    behavior_notes: cleanText(row.behavior_notes, 1200) || null,
  };
}

async function loadDashboard(userId: string) {
  const [user, pets, reminders, expenses, fiscal, shares, favoriteClinics] = await Promise.all([
    query(
      `select id::text, email, full_name
       from public.local_auth_users
       where id = $1
       limit 1`,
      [userId]
    ),
    query(
      `select id::text, name, species, breed, sex, birth_date, weight_kg, photo_url,
              microchip, neutered, allergies, conditions, medications, nutrition_notes,
              behavior_notes, created_at, updated_at
       from public.pet_profiles
       where owner_id = $1
       order by created_at asc`,
      [userId]
    ),
    query(
      `select id::text, pet_id::text, reminder_type, title, due_date, repeat_rule, notes,
              completed_at, created_at, updated_at
       from public.pet_health_reminders
       where owner_id = $1
       order by completed_at nulls first, due_date asc
       limit 100`,
      [userId]
    ),
    query(
      `select id::text, pet_id::text, spent_on, amount, category, vendor, document_url, notes,
              created_at, updated_at
       from public.pet_expenses
       where owner_id = $1
       order by spent_on desc
       limit 100`,
      [userId]
    ),
    query(
      `select fiscal_code, billing_name
       from public.pet_owner_fiscal_profiles
       where owner_id = $1
       limit 1`,
      [userId]
    ),
    query(
      `select s.id::text, s.token, s.pet_id::text, s.scopes, s.expires_at, s.revoked_at, s.created_at, s.last_viewed_at,
              p.name as pet_name, p.species as pet_species, p.breed as pet_breed, p.photo_url as pet_photo_url
       from public.pet_share_links s
       join public.pet_profiles p on p.id = s.pet_id
       where s.owner_id = $1
       order by s.created_at desc
       limit 50`,
      [userId]
    ),
    query(
      `select f.id::text as favorite_id, f.created_at as favorited_at,
              c.id::text, c.name, c.slug, c.address, c.phone, c.email, c.website,
              c.hours, c.lat, c.lng, c.rating_avg_cached, c.rating_count_cached,
              c.pronto_soccorso_h24, c.owner_id, c.claimed_at
       from public.pet_favorite_clinics f
       join public.clinics c on c.id = f.clinic_id
       where f.owner_id = $1
         and coalesce(c.status::text, 'pubblicata') not in ('rimossa', 'non_approvata')
       order by f.created_at desc
       limit 100`,
      [userId]
    ),
  ]);

  return {
    user: user.rows[0] || null,
    pets: pets.rows,
    reminders: reminders.rows,
    expenses: expenses.rows,
    fiscal_profile: fiscal.rows[0] || null,
    share_links: shares.rows,
    favorite_clinics: favoriteClinics.rows,
  };
}

export const GET: APIRoute = async (context) => {
  const { user } = await requireLocalUser(context);
  if (!user) return json({ success: false, error: 'Sessione richiesta.' }, 401);

  try {
    return json({ success: true, data: await loadDashboard(user.id) });
  } catch (error: any) {
    return json({ success: false, error: error?.message || 'Caricamento non riuscito.' }, 500);
  }
};

export const POST: APIRoute = async (context) => {
  const { user } = await requireLocalUser(context);
  if (!user) return json({ success: false, error: 'Sessione richiesta.' }, 401);

  const body = await context.request.json().catch(() => ({}));
  const action = cleanText(body.action, 80);

  try {
    if (action === 'save_pet') {
      const pet = petPayload(body.pet || {});
      if (!pet.name) return json({ success: false, error: 'Nome animale richiesto.' }, 422);

      const id = cleanText(body.pet?.id, 80);
      const params = [
        user.id,
        pet.name,
        pet.species,
        pet.breed,
        pet.sex,
        pet.birth_date,
        pet.weight_kg,
        pet.photo_url,
        pet.microchip,
        pet.neutered,
        pet.allergies,
        pet.conditions,
        pet.medications,
        pet.nutrition_notes,
        pet.behavior_notes,
      ];

      const result = id
        ? await query(
            `update public.pet_profiles
             set name = $2, species = $3, breed = $4, sex = $5, birth_date = $6,
                 weight_kg = $7, photo_url = $8, microchip = $9, neutered = $10,
                 allergies = $11, conditions = $12, medications = $13,
                 nutrition_notes = $14, behavior_notes = $15, updated_at = now()
             where id::text = $16 and owner_id = $1
             returning id::text`,
            [...params, id]
          )
        : await query(
            `insert into public.pet_profiles (
               owner_id, name, species, breed, sex, birth_date, weight_kg, photo_url,
               microchip, neutered, allergies, conditions, medications, nutrition_notes,
               behavior_notes
             )
             values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             returning id::text`,
            params
          );

      if (!result.rows[0]) return json({ success: false, error: 'Animale non trovato.' }, 404);
      return json({ success: true, data: await loadDashboard(user.id) });
    }

    if (action === 'delete_pet') {
      const id = cleanText(body.id, 80);
      await query(`delete from public.pet_profiles where id::text = $1 and owner_id = $2`, [id, user.id]);
      return json({ success: true, data: await loadDashboard(user.id) });
    }

    if (action === 'save_reminder') {
      const reminder = body.reminder || {};
      const petId = cleanText(reminder.pet_id, 80);
      const title = cleanText(reminder.title, 160);
      const dueDate = cleanDate(reminder.due_date);
      if (!petId || !title || !dueDate) return json({ success: false, error: 'Animale, titolo e data sono obbligatori.' }, 422);

      const ownsPet = await query(`select 1 from public.pet_profiles where id::text = $1 and owner_id = $2`, [petId, user.id]);
      if (!ownsPet.rows[0]) return json({ success: false, error: 'Animale non trovato.' }, 404);

      await query(
        `insert into public.pet_health_reminders (
           owner_id, pet_id, reminder_type, title, due_date, repeat_rule, notes
         )
         values ($1, $2::uuid, $3, $4, $5::date, $6, $7)`,
        [
          user.id,
          petId,
          cleanText(reminder.reminder_type, 60) || 'altro',
          title,
          dueDate,
          cleanText(reminder.repeat_rule, 60) || null,
          cleanText(reminder.notes, 1000) || null,
        ]
      );
      return json({ success: true, data: await loadDashboard(user.id) });
    }

    if (action === 'toggle_reminder') {
      const id = cleanText(body.id, 80);
      const completed = body.completed === true;
      await query(
        `update public.pet_health_reminders
         set completed_at = case when $3::boolean then now() else null end, updated_at = now()
         where id::text = $1 and owner_id = $2`,
        [id, user.id, completed]
      );
      return json({ success: true, data: await loadDashboard(user.id) });
    }

    if (action === 'save_expense') {
      const expense = body.expense || {};
      const spentOn = cleanDate(expense.spent_on);
      const amount = cleanNumber(expense.amount);
      if (!spentOn || !amount || amount <= 0) return json({ success: false, error: 'Data e importo sono obbligatori.' }, 422);
      const petId = cleanText(expense.pet_id, 80) || null;

      await query(
        `insert into public.pet_expenses (
           owner_id, pet_id, spent_on, amount, category, vendor, document_url, notes
         )
         values ($1, nullif($2, '')::uuid, $3::date, $4, $5, $6, $7, $8)`,
        [
          user.id,
          petId || '',
          spentOn,
          amount,
          cleanText(expense.category, 60) || 'visita',
          cleanText(expense.vendor, 160) || null,
          cleanText(expense.document_url, 1000) || null,
          cleanText(expense.notes, 1000) || null,
        ]
      );
      return json({ success: true, data: await loadDashboard(user.id) });
    }

    if (action === 'save_fiscal_profile') {
      const fiscalCode = cleanText(body.fiscal_code, 32).toUpperCase() || null;
      const billingName = cleanText(body.billing_name, 160) || null;
      await query(
        `insert into public.pet_owner_fiscal_profiles (owner_id, fiscal_code, billing_name, updated_at)
         values ($1, $2, $3, now())
         on conflict (owner_id) do update set
           fiscal_code = excluded.fiscal_code,
           billing_name = excluded.billing_name,
           updated_at = now()`,
        [user.id, fiscalCode, billingName]
      );
      return json({ success: true, data: await loadDashboard(user.id) });
    }

    if (action === 'create_share_link') {
      const petId = cleanText(body.pet_id, 80);
      const scopes = Array.isArray(body.scopes)
        ? body.scopes.map((scope: unknown) => cleanText(scope, 40)).filter(Boolean)
        : ['base'];
      const ownsPet = await query(`select 1 from public.pet_profiles where id::text = $1 and owner_id = $2`, [petId, user.id]);
      if (!ownsPet.rows[0]) return json({ success: false, error: 'Animale non trovato.' }, 404);

      const token = randomBytes(24).toString('base64url');
      await query(
        `insert into public.pet_share_links (token, owner_id, pet_id, scopes, expires_at)
         values ($1, $2, $3::uuid, $4::text[], now() + interval '14 days')`,
        [token, user.id, petId, scopes.length ? scopes : ['base']]
      );
      return json({ success: true, data: await loadDashboard(user.id), token });
    }

    if (action === 'revoke_share_link') {
      const id = cleanText(body.id, 80);
      await query(`update public.pet_share_links set revoked_at = now() where id::text = $1 and owner_id = $2`, [id, user.id]);
      return json({ success: true, data: await loadDashboard(user.id) });
    }

    if (action === 'toggle_favorite_clinic') {
      const clinicId = cleanText(body.clinic_id, 80);
      const clinic = await query(`select id from public.clinics where id::text = $1 limit 1`, [clinicId]);
      if (!clinic.rows[0]) return json({ success: false, error: 'Scheda veterinario non trovata.' }, 404);

      const existing = await query(
        `select id::text from public.pet_favorite_clinics where owner_id = $1 and clinic_id::text = $2 limit 1`,
        [user.id, clinicId]
      );

      let favorited = false;
      if (existing.rows[0]) {
        await query(`delete from public.pet_favorite_clinics where owner_id = $1 and clinic_id::text = $2`, [user.id, clinicId]);
      } else {
        await query(
          `insert into public.pet_favorite_clinics (owner_id, clinic_id)
           values ($1, $2::uuid)
           on conflict (owner_id, clinic_id) do nothing`,
          [user.id, clinicId]
        );
        favorited = true;
      }

      const count = await query(`select count(*)::int as total from public.pet_favorite_clinics where clinic_id::text = $1`, [clinicId]);
      return json({ success: true, data: await loadDashboard(user.id), favorited, favorite_count: count.rows[0]?.total || 0 });
    }

    return json({ success: false, error: 'Azione non valida.' }, 400);
  } catch (error: any) {
    return json({ success: false, error: error?.message || 'Operazione non riuscita.' }, 500);
  }
};
