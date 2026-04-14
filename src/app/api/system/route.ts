import { NextResponse } from 'next/server';
import { getSystemMetrics } from '@/lib/system-metrics';

export async function GET() {
  try {
    const metrics = await getSystemMetrics();
    return NextResponse.json(metrics);
  } catch {
    return NextResponse.json({ error: 'Failed to read system metrics' }, { status: 500 });
  }
}
