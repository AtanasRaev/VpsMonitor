import { NextResponse } from 'next/server';
import { getProcesses } from '@/lib/processes';

export async function GET() {
  try {
    const data = await getProcesses();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to read process info' }, { status: 500 });
  }
}
