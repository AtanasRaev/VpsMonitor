import { NextResponse } from 'next/server';
import { getCronLogs } from '@/lib/cron-log-reader';

export async function GET() {
  try {
    const data = await getCronLogs();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
