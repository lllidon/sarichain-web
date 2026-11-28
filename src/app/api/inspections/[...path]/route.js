import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { partnerBackend, partnerSessionCookie } from '../../../../../lib/partnerBackend';

export const runtime = 'nodejs';

async function forward(request, { params }) {
  const { path = [] } = await params;
  if (!Array.isArray(path) || !path.length || path.some(part => !/^[a-zA-Z0-9-]+$/.test(part))) {
    return NextResponse.json({ message: 'مسیر درخواست معتبر نیست.' }, { status: 404 });
  }
  if (request.method !== 'GET') {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host') ?? request.nextUrl.host;
    try {
      if (request.headers.get('sec-fetch-site') === 'cross-site' || (origin && new URL(origin).host !== host)) {
        return NextResponse.json({ message: 'درخواست غیرمجاز است.' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ message: 'درخواست غیرمجاز است.' }, { status: 403 });
    }
  }
  const token = (await cookies()).get(partnerSessionCookie)?.value;
  if (!token) return NextResponse.json({ message: 'برای ادامه وارد حساب شوید.' }, { status: 401 });
  const contentType = request.headers.get('content-type')?.split(';')[0].trim();
  if (request.method !== 'GET' && contentType !== 'application/json' && contentType !== 'multipart/form-data') {
    return NextResponse.json({ message: 'نوع محتوای درخواست معتبر نیست.' }, { status: 415 });
  }
  try {
    const body = request.method === 'GET' ? undefined :
      contentType === 'multipart/form-data' ? await request.formData() : await request.text();
    const result = await partnerBackend('/web/inspections/' + path.join('/'), {
      method: request.method, token, body, query: request.nextUrl.search,
    });
    const type = result.headers.get('content-type') || 'application/json';
    if (type.startsWith('image/')) {
      return new NextResponse(await result.arrayBuffer(), {
        status: result.status, headers: { 'Content-Type': type, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' },
      });
    }
    const data = await result.json().catch(() => ({}));
    return NextResponse.json(data, { status: result.status, headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ message: 'ارتباط با سرور برقرار نشد.' }, { status: 502 });
  }
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
