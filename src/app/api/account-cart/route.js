import { NextResponse } from 'next/server';
import { mergeGuestCart } from '../../../lib/accountCart';
import { partnerBackend, partnerSessionCookie } from '../../../lib/partnerBackend';
import { cartCookie } from '../../../components/Products/cartData';

const paths = { items: '/web/cart/items', acknowledge: '/web/cart/acknowledge' };

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
    const merging = method === 'POST' && operation === 'merge';
    if (method === 'POST' && !merging && !Object.hasOwn(paths, operation)) return response({}, 404);
    const target = method === 'POST' && !merging ? paths[operation] : '/web/cart';
    const result = merging ? await mergeGuestCart(token, request.cookies.get(cartCookie)?.value)
      : await partnerBackend(target, { token, method, body: method === 'POST' ? await request.text() : undefined });
    const reply = response(await result.json(), result.status);
    if (merging && result.ok) reply.cookies.delete(cartCookie);
    return reply;
  } catch {
    return response({ message: 'ارتباط با سبد خرید برقرار نشد.' }, 502);
  }
}

export const GET = forward;
export const POST = forward;
export const DELETE = forward;
