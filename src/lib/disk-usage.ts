import { basename } from 'path';
import { runCommand } from './run-command';
import type { DiskTarget, DiskUsageTotal, DiskUsageDetails, DiskSubfolder } from '@/types';

// ── Whitelist ─────────────────────────────────────────────────────────────────
// Closed map — user input is ONLY used as a key lookup, never shell-interpolated.

const WHITELIST: Record<DiskTarget, string> = {
  myteam: '/var/www/MyTeam',
  checkin_app: '/var/www/checkin/CheckIn',
  checkin_media: '/var/www/checkin/media',
};

export function resolvePath(key: string): string | null {
  if (Object.prototype.hasOwnProperty.call(WHITELIST, key)) {
    return WHITELIST[key as DiskTarget];
  }
  return null;
}

// ── Cache ─────────────────────────────────────────────────────────────────────

type CacheEntry = { data: DiskUsageTotal | DiskUsageDetails; ts: number };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000;

function getCached(key: string): DiskUsageTotal | DiskUsageDetails | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key: string, data: DiskUsageTotal | DiskUsageDetails): void {
  cache.set(key, { data, ts: Date.now() });
}

// ── Parsing ───────────────────────────────────────────────────────────────────

function parseDuLine(line: string): { size: string; path: string } | null {
  if (!line.trim()) return null;
  const tabIdx = line.indexOf('\t');
  if (tabIdx === -1) return null;
  return {
    size: line.slice(0, tabIdx).trim(),
    path: line.slice(tabIdx + 1).trim(),
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getDiskUsage(
  target: DiskTarget,
  details: boolean,
): Promise<DiskUsageTotal | DiskUsageDetails> {
  const targetPath = WHITELIST[target];
  const cacheKey = `${target}:${details}`;

  const cached = getCached(cacheKey);
  if (cached) return cached;

  let result: DiskUsageTotal | DiskUsageDetails;

  if (!details) {
    const raw = await runCommand(`du -sh ${targetPath}`);
    const parsed = parseDuLine(raw.split('\n')[0]);
    const totalSize = parsed ? parsed.size : raw.split(/\s+/)[0];

    result = { target, path: targetPath, totalSize } satisfies DiskUsageTotal;
  } else {
    const raw = await runCommand(`du -h --max-depth=1 ${targetPath}`);

    const subfolders: DiskSubfolder[] = raw
      .split('\n')
      .map(parseDuLine)
      .filter(
        (entry): entry is { size: string; path: string } =>
          entry !== null && entry.path !== targetPath,
      )
      .map(({ size, path }) => ({
        size,
        path,
        name: basename(path),
      }));

    result = { target, path: targetPath, subfolders } satisfies DiskUsageDetails;
  }

  setCached(cacheKey, result);
  return result;
}
