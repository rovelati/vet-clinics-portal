import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

/** Root della vecchia codebase (contiene SPIDER/). */
export function resolveToolsRoot(): string {
  const fromEnv = process.env.ADMIN_TOOLS_ROOT || import.meta.env.ADMIN_TOOLS_ROOT;
  if (fromEnv && typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim();
  }
  return path.resolve(process.cwd(), '..', 'codebase');
}

/**
 * Carica variabili utili agli script SPIDER da file .env locali
 * (senza sovrascrivere valori già presenti in process.env).
 */
export function loadSpiderEnv(toolsRoot: string): Record<string, string> {
  const out: Record<string, string> = {};
  const candidates = [
    path.join(toolsRoot, 'SPIDER', '.env'),
    path.join(toolsRoot, '.supabase_env.sh'),
    path.join(toolsRoot, '.env'),
  ];

  for (const file of candidates) {
    if (!existsSync(file)) continue;
    let text = '';
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    for (const rawLine of text.split('\n')) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const exportMatch = line.match(/^export\s+([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      const plainMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      const match = exportMatch || plainMatch;
      if (!match) continue;
      const key = match[1];
      let value = match[2].trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in out) && !(key in process.env)) {
        out[key] = value;
      }
    }
  }

  // Default media dir per veterinari.org se non già impostato
  if (!out.VETERINARI_MEDIA_DIR && !process.env.VETERINARI_MEDIA_DIR) {
    const mediaCandidates = [
      '/var/www/veterinari-org/public/media/gallery/clinics',
      path.resolve(process.cwd(), 'public/media/gallery/clinics'),
    ];
    for (const dir of mediaCandidates) {
      if (existsSync(path.dirname(dir)) || existsSync(dir)) {
        out.VETERINARI_MEDIA_DIR = dir;
        break;
      }
    }
  }

  return out;
}
