import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import pg from 'pg';

const { Client } = pg;

const APPLY = process.argv.includes('--apply');
const LIMIT = Number(process.env.LIMIT || process.argv.find((arg) => arg.startsWith('--limit='))?.split('=')[1] || 0);
const MAX_PER_CLINIC = Number(process.env.MAX_PER_CLINIC || 2);
const MIN_BYTES = Number(process.env.MIN_CLINIC_IMAGE_BYTES || 8_000);
const MIN_WIDTH = Number(process.env.MIN_CLINIC_IMAGE_WIDTH || 300);
const MIN_HEIGHT = Number(process.env.MIN_CLINIC_IMAGE_HEIGHT || 180);
const MIN_AREA = Number(process.env.MIN_CLINIC_IMAGE_AREA || 100_000);
const MEDIA_PREFIX = '/media/gallery/clinics/';
const PUBLIC_DIR = join(process.cwd(), 'public');
const GALLERY_DIR = join(PUBLIC_DIR, 'media', 'gallery', 'clinics');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL mancante.');
  process.exit(1);
}

function isGooglePlaceImage(image) {
  return typeof image === 'string' && /lh3\.googleusercontent\.com\/places\//i.test(image);
}

function isLocalGalleryImage(image) {
  return typeof image === 'string' && (
    image.startsWith(MEDIA_PREFIX) ||
    /^https?:\/\/(?:www\.)?(?:baumicio\.it|veterinari\.org)\/media\/gallery\/clinics\//i.test(image)
  );
}

function safeSlug(value) {
  return String(value || 'clinica')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90) || 'clinica';
}

function extensionFromContentType(contentType) {
  const value = String(contentType || '').toLowerCase();
  if (value.includes('png')) return 'png';
  if (value.includes('webp')) return 'webp';
  return 'jpg';
}

function imageDimensionsFromBuffer(buffer) {
  if (buffer.length < 32) return null;

  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  if (buffer.subarray(0, 3).toString('ascii') === 'GIF') {
    return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
  }

  if (buffer.subarray(0, 2).equals(Buffer.from([0xff, 0xd8]))) {
    let offset = 2;
    while (offset < buffer.length - 9) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
      }
      offset += 2 + length;
    }
  }

  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
    const chunk = buffer.subarray(12, 16).toString('ascii');
    if (chunk === 'VP8X' && buffer.length >= 30) return { width: 1 + buffer.readUIntLE(24, 3), height: 1 + buffer.readUIntLE(27, 3) };
    if (chunk === 'VP8 ' && buffer.length >= 30) return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
    if (chunk === 'VP8L' && buffer.length >= 25) {
      const bits = buffer.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
  }

  return null;
}

function imageQuality(buffer) {
  if (buffer.length < MIN_BYTES) return { ok: false, reason: `${buffer.length} bytes` };
  const dimensions = imageDimensionsFromBuffer(buffer);
  if (!dimensions) return { ok: false, reason: 'dimensioni non riconosciute' };
  const area = dimensions.width * dimensions.height;
  if (dimensions.width < MIN_WIDTH || dimensions.height < MIN_HEIGHT || area < MIN_AREA) {
    return { ok: false, reason: `${dimensions.width}x${dimensions.height}, ${buffer.length} bytes` };
  }
  return { ok: true, reason: `${dimensions.width}x${dimensions.height}, ${buffer.length} bytes` };
}

function readExistingQuality(path) {
  const stat = statSync(path);
  const buffer = readFileSync(path);
  const quality = imageQuality(buffer);
  return { ...quality, reason: quality.reason || `${stat.size} bytes` };
}

async function downloadImage(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; VeterinariOrgImageLocalizer/1.0)',
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('image/')) throw new Error(`content-type ${contentType || 'n/a'}`);
  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    extension: extensionFromContentType(contentType),
  };
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
mkdirSync(GALLERY_DIR, { recursive: true });

const limitSql = LIMIT > 0 ? `limit ${LIMIT}` : '';
const { rows } = await client.query(`
  select id, name, slug, gallery_images
  from public.clinics
  where gallery_images is not null
    and cardinality(gallery_images) > 0
    and exists (
      select 1
      from unnest(gallery_images) as image
      where image ~* 'lh3\\.googleusercontent\\.com/places/'
    )
  order by slug nulls last, name
  ${limitSql}
`);

let clinicsChanged = 0;
let imagesDownloaded = 0;
let imagesSkipped = 0;
let imagesFailed = 0;

for (const row of rows) {
  const images = Array.isArray(row.gallery_images) ? row.gallery_images : [];
  const googleImages = images.filter(isGooglePlaceImage).slice(0, MAX_PER_CLINIC);
  if (!googleImages.length) continue;

  const localImages = images.filter(isLocalGalleryImage);
  const nextImages = [...localImages];
  const results = [];

  let index = 1;
  for (const image of googleImages) {
    const baseName = `${safeSlug(row.slug || row.name)}_${String(row.id).slice(0, 8)}_google_${index}`;
    index += 1;

    try {
      const downloaded = await downloadImage(image);
      const fileName = `${baseName}.${downloaded.extension}`;
      const filePath = join(GALLERY_DIR, fileName);
      const publicPath = `${MEDIA_PREFIX}${fileName}`;
      const quality = imageQuality(downloaded.buffer);

      if (!quality.ok) {
        imagesSkipped += 1;
        results.push(`skip ${quality.reason}: ${image}`);
        continue;
      }

      if (APPLY) {
        writeFileSync(filePath, downloaded.buffer);
        const existingQuality = readExistingQuality(filePath);
        if (!existingQuality.ok) throw new Error(`file non valido dopo salvataggio: ${existingQuality.reason}`);
      }

      nextImages.push(publicPath);
      imagesDownloaded += 1;
      results.push(`${APPLY ? 'saved' : 'would save'} ${quality.reason}: ${publicPath}`);
    } catch (error) {
      imagesFailed += 1;
      results.push(`fail ${error.message}: ${image}`);
    }
  }

  const remaining = images.filter((image) => !isGooglePlaceImage(image));
  const updatedImages = unique([...nextImages, ...remaining.filter((image) => !isLocalGalleryImage(image))]);
  const changed = updatedImages.join('\n') !== images.join('\n');

  if (changed && APPLY) {
    await client.query('update public.clinics set gallery_images = $1::text[], updated_at = now() where id = $2', [updatedImages, row.id]);
    clinicsChanged += 1;
  } else if (changed) {
    clinicsChanged += 1;
  }

  if (results.length) {
    console.log(`\n${row.slug || row.id} - ${row.name}`);
    for (const result of results) console.log(`  ${result}`);
  }
}

await client.end();

console.log('\n--- SUMMARY ---');
console.log(`Cliniche analizzate: ${rows.length}`);
console.log(`Cliniche ${APPLY ? 'aggiornate' : 'da aggiornare'}: ${clinicsChanged}`);
console.log(`Immagini ${APPLY ? 'salvate' : 'valide'}: ${imagesDownloaded}`);
console.log(`Immagini scartate per qualita: ${imagesSkipped}`);
console.log(`Immagini fallite: ${imagesFailed}`);
console.log(APPLY ? 'Aggiornamento applicato.' : 'Dry-run: aggiungi --apply per salvare file e DB.');
