import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { partnerBackend, partnerSessionCookie } from '../../../../lib/partnerBackend';

export const runtime = 'nodejs';

export async function GET() {
  const token = (await cookies()).get(partnerSessionCookie)?.value;
  if (!token) return NextResponse.json({ message: 'برای ادامه وارد حساب شوید.' }, { status: 401 });
  try {
    const result = await partnerBackend('/web/inspections', { method: 'GET', token });
    const data = await result.json().catch(() => ({}));
    return NextResponse.json(data, { status: result.status, headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ message: 'ارتباط با سرور برقرار نشد.' }, { status: 502 });
  }
}
