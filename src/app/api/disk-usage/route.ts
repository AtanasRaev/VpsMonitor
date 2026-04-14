import { NextRequest, NextResponse } from 'next/server';
import { getDiskUsage, resolvePath } from '@/lib/disk-usage';
import type { DiskTarget } from '@/types';

const VALID_TARGETS: DiskTarget[] = ['myteam', 'checkin_app', 'checkin_media'];

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const target = searchParams.get('target');
  const details = searchParams.get('details') === 'true';

  if (!target || !VALID_TARGETS.includes(target as DiskTarget)) {
    return NextResponse.json({ error: 'Invalid or missing target' }, { status: 400 });
  }

  // resolvePath double-checks the whitelist — belt-and-suspenders
  const resolvedPath = resolvePath(target);
  if (!resolvedPath) {
    return NextResponse.json({ error: 'Invalid target' }, { status: 400 });
  }

  try {
    const data = await getDiskUsage(target as DiskTarget, details);
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    if (message.toLowerCase().includes('permission denied')) {
      return NextResponse.json({ error: 'Permission denied reading folder' }, { status: 500 });
    }
    if (message.toLowerCase().includes('timed out') || message.toLowerCase().includes('killed')) {
      return NextResponse.json({ error: 'Command timed out' }, { status: 500 });
    }
    if (message.toLowerCase().includes('no such file')) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 500 });
    }

    return NextResponse.json({ error: 'Failed to read disk usage' }, { status: 500 });
  }
}
