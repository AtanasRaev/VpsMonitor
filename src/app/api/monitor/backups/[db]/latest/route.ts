import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import type { BackupInfo } from '@/types';

const BACKUP_DIR = '/var/backups/postgres';
const ALLOWED_DBS = ['myteam', 'checkin'] as const;
type DbName = (typeof ALLOWED_DBS)[number];

function formatSize(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function findLatestBackup(db: DbName): { filePath: string; filename: string; stat: fs.Stats } | null {
  const entries = fs.readdirSync(BACKUP_DIR);
  const prefix = `${db}_`;
  const matches = entries
    .filter((f) => f.startsWith(prefix) && f.endsWith('.dump'))
    .map((f) => {
      const filePath = path.join(BACKUP_DIR, f);
      const stat = fs.statSync(filePath);
      return { filename: f, filePath, stat };
    })
    .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);

  return matches[0] ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ db: string }> }
) {
  const { db } = await params;

  if (!(ALLOWED_DBS as readonly string[]).includes(db)) {
    return NextResponse.json({ error: `Unknown database: ${db}` }, { status: 400 });
  }

  const dbName = db as DbName;
  let match: ReturnType<typeof findLatestBackup>;

  try {
    match = findLatestBackup(dbName);
  } catch {
    return NextResponse.json({ error: 'Could not read backup directory' }, { status: 500 });
  }

  if (!match) {
    return NextResponse.json({ error: `No backup found for ${dbName}` }, { status: 404 });
  }

  const { filePath, filename, stat } = match;
  const infoOnly = request.nextUrl.searchParams.get('info') === 'true';

  if (infoOnly) {
    const info: BackupInfo = {
      filename,
      sizeBytes: stat.size,
      sizePretty: formatSize(stat.size),
      lastModified: stat.mtime.toISOString(),
    };
    return NextResponse.json(info);
  }

  const stream = fs.createReadStream(filePath);
  const body = Readable.toWeb(stream) as ReadableStream;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(stat.size),
    },
  });
}
