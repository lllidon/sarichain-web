import { NextResponse } from 'next/server';
import { partnerBackend, partnerSessionCookie } from '../../../lib/partnerBackend';

const paths = { items: '/web/weekly-basket/items' };

function response(data, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

async function forward(request) {
  const token = request.cookies.get(partnerSessionCookie)?.value;
  if (!token) return response({}, 401);
  const method = request.method;
  const origin = request.headers.get('origin');
  const host = request.headers.get('host') ?? request.nextUrl.host;
  if (method !== 'GET' && (request.headers.get('sec-fetch-site') === 'cross-site' ||
      (origin && origin !== 'http://' + host && origin !== 'https://' + host))) return response({}, 403);

  try {
    const operation = request.nextUrl.searchParams.get('op');
    if (method === 'POST' && !Object.hasOwn(paths, operation)) return response({}, 404);
    const target = method === 'POST' ? paths[operation] : '/web/weekly-basket';
    const result = await partnerBackend(target, {
      token, method, body: method === 'POST' ? await request.text() : undefined,
    });
    return response(await result.json(), result.status);
  } catch {
    return response({ message: 'ارتباط با سبد هفتگی برقرار نشد.' }, 502);
  }
}

export const GET = forward;
export const POST = forward;
export const DELETE = forward;
