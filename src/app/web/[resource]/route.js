import { NextResponse } from 'next/server';
import { partnerBackend, partnerSessionCookie } from '../../../lib/partnerBackend';

export const runtime = 'nodejs';
const routes = {
  login: { POST: '/web/login' },
  orders: { POST: '/web/orders' },
  'delivery-options': { GET: '/web/delivery-options' },
  profile: { GET: '/web/profile', PATCH: '/web/profile' },
  provinces: { GET: '/web/locations/provinces' },
  cities: { GET: '/web/locations/cities' },
};

function response(data, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

function loginRedirect(error) {
  return new NextResponse(null, {
    status: 303,
    headers: {
      Location: error ? '/partners?login=' + error : '/partners',
      'Cache-Control': 'private, no-store',
    },
  });
}

async function forward(request, { params }) {
  const { resource } = await params;
  const method = request.method;
  const contentType = request.headers.get('content-type')?.split(';')[0].trim();
  const formLogin = resource === 'login' && method === 'POST' && contentType === 'application/x-www-form-urlencoded';
  const forbidden = () => formLogin ? loginRedirect('rejected') : response({}, 403);
  let caller;
  if (method !== 'GET') {
    const origin = request.headers.get('origin');
    try {
      caller = origin ? new URL(origin) : undefined;
    } catch {
      return forbidden();
    }
    const host = request.headers.get('host') ?? request.nextUrl.host;
    if (request.headers.get('sec-fetch-site') === 'cross-site' ||
        (caller && (caller.host !== host || !['http:', 'https:'].includes(caller.protocol)))) {
      return forbidden();
    }
  }

  if (resource === 'logout' && method === 'POST') {
    const result = response({ ok: true });
    const expired = [`/web`, `/`].map(path =>
      `${partnerSessionCookie}=; Path=${path}; Max-Age=0; HttpOnly; SameSite=Lax`);
    for (const cookie of expired) result.headers.append('Set-Cookie', cookie);
    return result;
  }

  const route = Object.hasOwn(routes, resource) && routes[resource][method];
  if (!route) return response({}, 404);
  const token = request.cookies.get(partnerSessionCookie)?.value;
  const requiresSession = resource === 'profile' || resource === 'orders';
  if (requiresSession && !token) return response({}, 401);
  if (method !== 'GET' && contentType !== 'application/json' && !formLogin) return response({}, 415);
  try {
    let body;
    if (formLogin) {
      const form = await request.formData();
      const phone = form.get('phone');
      const password = form.get('password');
      if (typeof phone !== 'string' || typeof password !== 'string' || !phone.trim() || !password ||
          phone.length > 32 || password.length > 128) return loginRedirect('credentials');
      body = JSON.stringify({ phone: phone.trim(), password });
    } else if (method !== 'GET') {
      body = await request.text();
    }
    const result = await partnerBackend(route, {
      method, query: request.nextUrl.search,
      token: requiresSession ? token : undefined,
      body,
    });
    if (formLogin && !result.ok) {
      return loginRedirect(result.status === 401 || result.status === 400 ? 'credentials'
        : result.status === 429 ? 'rate-limit' : 'unavailable');
    }
    const data = await result.json();
    if (resource === 'login' && result.ok) {
      const session = formLogin ? loginRedirect() : response({ ok: true });
      session.cookies.set(partnerSessionCookie, data.accessToken, {
        httpOnly: true, sameSite: 'lax', secure: (caller?.protocol ?? request.nextUrl.protocol) === 'https:',
        path: '/', maxAge: data.expiresIn,
      });
      session.headers.append('Set-Cookie', `${partnerSessionCookie}=; Path=/web; Max-Age=0; HttpOnly; SameSite=Lax`);
      return session;
    }
    return response(data, result.status);
  } catch {
    return formLogin ? loginRedirect('unavailable') : response({ message: 'ارتباط با بک‌اند برقرار نشد.' }, 502);
  }
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
