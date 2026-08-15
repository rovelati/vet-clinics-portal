import pg from 'pg';

const { Pool } = pg;
const cohort = 'gsc-2026-08-05-pilot';

const pilot = [
  {
    slug: 'ambulatorio-associato-bellunese-piccoli-animali-dr-mazzoncini-dr-sogne-trichiana',
    title: 'Ambulatorio Associato Bellunese a Trichiana (BL)',
    description: 'Orari, telefono, indirizzo e servizi dell\'Ambulatorio Associato Bellunese a Trichiana. Verifica l\'apertura e contatta la struttura.',
  },
  {
    slug: 'ambulatorio-veterinario-dott-cusinato-isacco-pove-del-grappa',
    title: 'Dott. Isacco Cusinato, veterinario a Pove del Grappa',
    description: 'Orari, telefono, indirizzo e servizi del Dott. Isacco Cusinato a Pove del Grappa. Verifica l\'apertura e contatta l\'ambulatorio.',
  },
  {
    slug: 'ambulatorio-veterinario-currado-alba',
    title: 'Ambulatorio Veterinario Currado ad Alba (CN)',
    description: 'Trova orari, telefono, indirizzo e servizi dell\'Ambulatorio Veterinario Currado ad Alba. Verifica l\'apertura e contatta la struttura.',
  },
  {
    slug: 'ambulatorio-veterinario-gamberini-costabissara',
    title: 'Veterinario Gamberini a Costabissara (VI)',
    description: 'Orari, telefono, indirizzo e servizi dell\'Ambulatorio Veterinario Gamberini a Costabissara. Verifica l\'apertura e contatta la struttura.',
  },
  {
    slug: 'almbulatori-veterinari-associati-zagarolo',
    title: 'Clinica Veterinaria Ca\' Zampa a Zagarolo (RM)',
    description: 'Orari, telefono, indirizzo e servizi della Clinica Veterinaria Ca\' Zampa a Zagarolo. Verifica l\'apertura e contatta la struttura.',
  },
  {
    slug: 'clinica-veterinaria-pet-vet-san-vincenzo',
    title: 'Clinica Veterinaria Pet Vet a San Vincenzo (LI)',
    description: 'Orari, telefono, indirizzo e servizi della Clinica Veterinaria Pet Vet a San Vincenzo. Verifica l\'apertura e contatta la struttura.',
  },
  {
    slug: 'ambulatorio-veterinario-pet-vet-tavagnacco',
    title: 'Ambulatorio PET&VET a Tavagnacco (UD)',
    description: 'Orari, telefono, indirizzo e servizi dell\'Ambulatorio PET&VET a Tavagnacco. Verifica l\'apertura e contatta direttamente la struttura.',
  },
  {
    slug: 'ambulatorio-veterinario-dott-ssa-tamara-crescenzio-ospedaletto-euganeo',
    title: 'Dott.ssa Tamara Crescenzio a Ospedaletto Euganeo',
    description: 'Orari, telefono, indirizzo e servizi della Dott.ssa Tamara Crescenzio a Ospedaletto Euganeo. Verifica l\'apertura e contatta l\'ambulatorio.',
  },
  {
    slug: 'ambulatorio-veterinario-dr-leonardo-panciera-limana',
    title: 'Clinica Veterinaria Panciera a Limana (BL)',
    description: 'Orari, telefono, indirizzo e servizi della Clinica Veterinaria del Dott. Leonardo Panciera a Limana. Verifica l\'apertura e contatta la struttura.',
  },
  {
    slug: 'ambulatorio-veterinario-ares-ciro-marina',
    title: 'Ambulatorio Veterinario Ares a Ciro Marina (KR)',
    description: 'Orari, telefono, indirizzo e servizi dell\'Ambulatorio Veterinario Ares a Ciro Marina. Verifica l\'apertura e contatta la struttura.',
  },
  {
    slug: 'dr-ssa-seghesio-cinzia-fubine-monferrato',
    title: 'Dott.ssa Cinzia Seghesio a Fubine Monferrato',
    description: 'Orari, telefono, indirizzo e servizi della Dott.ssa Cinzia Seghesio a Fubine Monferrato. Verifica l\'apertura e contatta l\'ambulatorio.',
  },
  {
    slug: 'ambulatorio-associato-dott-recla-dott-ssa-piz-rovereto',
    title: 'Ambulatorio Recla e Piz a Rovereto (TN)',
    description: 'Orari, telefono, indirizzo e servizi dell\'Ambulatorio Veterinario Recla e Piz a Rovereto. Verifica l\'apertura e contatta la struttura.',
  },
  {
    slug: 'ambulatorio-veterinario-dott-ssa-veller-cristina-quinto-vicentino',
    title: 'Dott.ssa Cristina Veller a Quinto Vicentino (VI)',
    description: 'Orari, telefono, indirizzo e servizi della Dott.ssa Cristina Veller a Quinto Vicentino. Verifica l\'apertura e contatta l\'ambulatorio.',
  },
  {
    slug: 'ambulatorio-veterinario-dr-magni-e-dr-giombetti-cesenatico',
    title: 'Centro Veterinario Ad Novas a Cesenatico (FC)',
    description: 'Orari, telefono, indirizzo e servizi del Centro Veterinario Ad Novas a Cesenatico. Verifica l\'apertura e contatta direttamente la struttura.',
  },
  {
    slug: 'ambulatorio-veterinario-saline-citta-sant-angelo',
    title: 'Clinica Veterinaria Saline: pronto soccorso H24',
    description: 'Pronto soccorso veterinario H24 a Citta Sant\'Angelo. Consulta telefono, indirizzo, servizi e indicazioni della Clinica Veterinaria Saline.',
  },
  {
    slug: 'ambulatorio-veterinario-gravallese-dott-tommaso-terracina',
    title: 'Clinica Veterinaria Gravallese a Terracina (LT)',
    description: 'Orari, telefono, indirizzo e servizi della Clinica Veterinaria Gravallese a Terracina. Verifica l\'apertura e contatta la struttura.',
  },
  {
    slug: 'dottore-giuseppe-canevari-landriano',
    title: 'Ambulatorio Veterinario Canevari a Landriano (PV)',
    description: 'Orari, telefono, indirizzo e servizi dell\'Ambulatorio Veterinario Canevari a Landriano. Verifica l\'apertura e contatta la struttura.',
  },
  {
    slug: 'clinica-veterinaria-dr-andrea-urizzi-san-michele-al-tagliamento',
    title: 'Clinica Veterinaria Urizzi a San Michele (VE)',
    description: 'Orari, telefono, indirizzo e servizi della Clinica Veterinaria Urizzi a San Michele al Tagliamento. Verifica l\'apertura e contatta la struttura.',
  },
  {
    slug: 'clinica-veterinaria-di-oleggio-oleggio',
    title: 'Clinica Veterinaria di Oleggio (NO): orari e contatti',
    description: 'Trova orari, telefono, indirizzo e servizi della Clinica Veterinaria di Oleggio. Verifica l\'apertura e contatta direttamente la struttura.',
  },
  {
    slug: 'ambulatorio-veterinario-associato-dott-giuseppe-balbi-e-giovanni-balbi-moio-della-civitella',
    title: 'Ambulatorio Veterinario Balbi a Moio (SA)',
    description: 'Orari, telefono, indirizzo e servizi dell\'Ambulatorio Veterinario Balbi a Moio della Civitella. Verifica l\'apertura e contatta la struttura.',
  },
];

function validate() {
  const slugs = new Set();
  for (const item of pilot) {
    if (slugs.has(item.slug)) throw new Error(`Slug duplicato: ${item.slug}`);
    slugs.add(item.slug);
    if (item.title.length > 65) throw new Error(`Title troppo lungo (${item.title.length}): ${item.slug}`);
    if (item.description.length > 160) throw new Error(`Description troppo lunga (${item.description.length}): ${item.slug}`);
  }
}

async function main() {
  validate();
  const connectionString = process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL non configurato.');

  const apply = process.argv.includes('--apply');
  const rollback = process.argv.includes('--rollback');
  if (apply && rollback) throw new Error('Usa --apply oppure --rollback, non entrambi.');

  const pool = new Pool({ connectionString, max: 2 });
  const client = await pool.connect();
  try {
    if (rollback) {
      const result = await client.query(
        `UPDATE clinics
         SET raw_import = raw_import #- '{seo}'
         WHERE raw_import #>> '{seo,cohort}' = $1
         RETURNING slug`,
        [cohort],
      );
      console.log(`Rollback completato: ${result.rowCount} schede.`);
      return;
    }

    const slugs = pilot.map((item) => item.slug);
    const { rows } = await client.query(
      `SELECT slug, status, raw_import #> '{seo}' AS current_seo
       FROM clinics
       WHERE slug = ANY($1::text[])
       ORDER BY slug`,
      [slugs],
    );
    const found = new Set(rows.map((row) => row.slug));
    const missing = slugs.filter((slug) => !found.has(slug));
    console.table(rows.map((row) => ({ slug: row.slug, status: row.status, hasSeo: Boolean(row.current_seo) })));
    if (missing.length) throw new Error(`Schede mancanti: ${missing.join(', ')}`);

    console.log(`${apply ? 'Applicazione' : 'Dry run'}: ${pilot.length} schede, cohort ${cohort}.`);
    if (!apply) return;

    await client.query('BEGIN');
    for (const item of pilot) {
      const seo = JSON.stringify({
        title: item.title,
        description: item.description,
        cohort,
        applied_at: new Date().toISOString(),
      });
      await client.query(
        `UPDATE clinics
         SET raw_import = jsonb_set(COALESCE(raw_import, '{}'::jsonb), '{seo}', $2::jsonb, true)
         WHERE slug = $1`,
        [item.slug, seo],
      );
    }
    await client.query('COMMIT');
    console.log(`Pilot applicato a ${pilot.length} schede.`);
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
