import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import pg from 'pg';

const { Client } = pg;

const APPLY = process.argv.includes('--apply');
const MIN_BYTES = Number(process.env.MIN_CLINIC_IMAGE_BYTES || 8_000);
const MIN_WIDTH = Number(process.env.MIN_CLINIC_IMAGE_WIDTH || 300);
const MIN_HEIGHT = Number(process.env.MIN_CLINIC_IMAGE_HEIGHT || 180);
const MIN_AREA = Number(process.env.MIN_CLINIC_IMAGE_AREA || 100_000);
const MEDIA_PREFIX = '/media/gallery/clinics/';

function usage() {
  console.log(`Usage: DATABASE_URL=... node scripts/clean-small-clinic-images.mjs [--apply]

Scansiona gallery_images e rimuove dal DB le immagini locali troppo piccole.
Soglie: ${MIN_BYTES} bytes, ${MIN_WIDTH}x${MIN_HEIGHT}, area ${MIN_AREA}.`);
}

if (process.argv.includes('--help')) {
  usage();
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL mancante.');
  process.exit(1);
}

function localPathFromUrl(url) {
  if (typeof url !== 'string') return null;
  const normalized = url.replace(/^https?:\/\/(?:www\.)?(?:baumicio\.it|veterinari\.org)\/media\/gallery\/clinics\//i, MEDIA_PREFIX);
  if (!normalized.startsWith(MEDIA_PREFIX)) return null;
  const relativePath = decodeURIComponent(normalized.replace(/^\//, '').split('?')[0]);
  return join(process.cwd(), 'public', relativePath);
}

function imageDimensions(path) {
  const buffer = readFileSync(path);
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

function isBadLocalImage(url) {
  const path = localPathFromUrl(url);
  if (!path) return { bad: false, reason: 'remote' };

  try {
    const stat = statSync(path);
    if (stat.size < MIN_BYTES) return { bad: true, reason: `${stat.size} bytes` };

    const dimensions = imageDimensions(path);
    if (!dimensions) return { bad: false, reason: 'unknown dimensions' };

    const area = dimensions.width * dimensions.height;
    if (dimensions.width < MIN_WIDTH || dimensions.height < MIN_HEIGHT || area < MIN_AREA) {
      return { bad: true, reason: `${dimensions.width}x${dimensions.height}, ${stat.size} bytes` };
    }
    return { bad: false, reason: `${dimensions.width}x${dimensions.height}, ${stat.size} bytes` };
  } catch (error) {
    return { bad: true, reason: `missing/unreadable: ${error.message}` };
  }
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const { rows } = await client.query(`
  select id, name, slug, gallery_images
  from public.clinics
  where gallery_images is not null and cardinality(gallery_images) > 0
`);

let clinicsChanged = 0;
let imagesRemoved = 0;

for (const row of rows) {
  const images = Array.isArray(row.gallery_images) ? row.gallery_images : [];
  const removed = [];
  const kept = [];

  for (const image of images) {
    const result = isBadLocalImage(image);
    if (result.bad) removed.push({ image, reason: result.reason });
    else kept.push(image);
  }

  if (!removed.length) continue;

  clinicsChanged += 1;
  imagesRemoved += removed.length;
  console.log(`\n${row.slug || row.id} - ${row.name}`);
  for (const item of removed) console.log(`  remove ${item.reason}: ${item.image}`);

  if (APPLY) {
    await client.query('update public.clinics set gallery_images = $1::text[] where id = $2', [kept, row.id]);
  }
}

await client.end();

console.log(`\nCliniche da aggiornare: ${clinicsChanged}`);
console.log(`Immagini da rimuovere: ${imagesRemoved}`);
console.log(APPLY ? 'Pulizia applicata.' : 'Dry-run: aggiungi --apply per aggiornare il DB.');
