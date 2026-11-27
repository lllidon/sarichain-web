import { NextResponse } from 'next/server';
import { partnerBackend, partnerSessionCookie } from '../../../../lib/partnerBackend';

export const runtime = 'nodejs';

export async function POST(request) {
  const contentType = request.headers.get('content-type')?.split(';')[0].trim();
  if (contentType !== 'application/json') {
    return NextResponse.json({}, { status: 415, headers: { 'Cache-Control': 'private, no-store' } });
  }

  const origin = request.headers.get('origin');
  const host = request.headers.get('host') ?? request.nextUrl.host;
  try {
    const caller = origin ? new URL(origin) : undefined;
    if (request.headers.get('sec-fetch-site') === 'cross-site' ||
        (caller && (caller.host !== host || !['http:', 'https:'].includes(caller.protocol)))) {
      return NextResponse.json({ message: 'درخواست معتبر نیست.' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ message: 'درخواست معتبر نیست.' }, { status: 403 });
  }

  const token = request.cookies.get(partnerSessionCookie)?.value;
  if (!token) {
    return NextResponse.json({}, { status: 401, headers: { 'Cache-Control': 'private, no-store' } });
  }

  try {
    const body = await request.text();
    const result = await partnerBackend('/web/account-upgrades/producer-categories', {
      method: 'POST',
      token,
      body,
    });
    const data = await result.json().catch(() => ({}));
    return NextResponse.json(data, {
      status: result.status,
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch {
    return NextResponse.json(
      { message: 'ارتباط با بک‌اند برقرار نشد.' },
      { status: 502, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }
}
