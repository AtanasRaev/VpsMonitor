import { NextResponse } from 'next/server';
import { getDbSizes } from '@/lib/db-monitor';

export async function GET() {
  try {
    const data = await getDbSizes();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
