import { cleanText } from '@/lib/local-db';

export function normalizeEmail(value: unknown) {
  const raw = cleanText(value);
  if (!raw) return '';

  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw.replace(/%20/gi, ' ');
  }

  const prepared = decoded
    .replace(/^mailto:/i, '')
    .replace(/&[#a-z0-9-]+;/gi, ' ')
    .replace(/(@[a-z0-9.-]+),(com|it|net|org|eu)\b/gi, '$1.$2')
    .replace(/^\d+\s*mail/i, '')
    .replace(/\.(it|com|net|org|eu)(p\.?\s*iva|telefono|indirizzo|privacy|pec|dir)/gi, '.$1 $2')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/^["'<(]+|[>"').,;:]+$/g, ' ')
    .toLowerCase();

  const match = prepared.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,24}\b/i);
  return match ? match[0] : prepared.replace(/\s+/g, '');
}

export function validEmail(value: string) {
  return /^[^\s@<>()[\],;:]+@[^\s@<>()[\],;:]+\.[^\s@<>()[\],;:]+$/.test(value);
}
