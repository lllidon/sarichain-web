import { NextResponse } from 'next/server';
import { loginMessages, loginProblem } from '../../../lib/loginMessages';
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

function loginRedirect(error, returnToCart = false) {
  const params = new URLSearchParams();
  if (error) params.set('login', error);
  if (returnToCart) params.set('returnTo', 'cart');
  const location = error ? '/partners?' + params : returnToCart ? '/cart' : '/partners';
  return new NextResponse(null, {
    status: 303,
    headers: {
      Location: location,
      'Cache-Control': 'private, no-store',
    },
  });
}

async function forward(request, { params }) {
  const { resource } = await params;
  const method = request.method;
  const contentType = request.headers.get('content-type')?.split(';')[0].trim();
  const formLogin = resource === 'login' && method === 'POST' && contentType === 'application/x-www-form-urlencoded';
  const forbidden = () => formLogin ? loginRedirect('rejected') : response({ message: loginMessages.rejected }, 403);
  let caller;
  let returnToCart = false;
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
      returnToCart = form.get('returnTo') === 'cart';
      const phone = form.get('phone');
      const password = form.get('password');
      if (typeof phone !== 'string' || typeof password !== 'string' || !phone.trim() || !password ||
          phone.length > 32 || password.length > 128) return loginRedirect('invalid', returnToCart);
      body = JSON.stringify({ phone: phone.trim(), password });
    } else if (method !== 'GET') {
      body = await request.text();
    }
    const result = await partnerBackend(route, {
      method, query: request.nextUrl.search,
      token: requiresSession ? token : undefined,
      body,
    });
    if (resource === 'login' && !result.ok) {
      const code = loginProblem(result.status);
      return formLogin ? loginRedirect(code, returnToCart) : response({ message: loginMessages[code] }, result.status);
    }
    const data = await result.json();
    if (resource === 'login' && result.ok) {
      if (typeof data?.accessToken !== 'string' || !data.accessToken || !Number.isSafeInteger(data.expiresIn) || data.expiresIn <= 0) {
        return formLogin ? loginRedirect('unavailable', returnToCart) : response({ message: loginMessages.unavailable }, 502);
      }
      const session = formLogin ? loginRedirect(undefined, returnToCart) : response({ ok: true });
      session.cookies.set(partnerSessionCookie, data.accessToken, {
        httpOnly: true, sameSite: 'lax', secure: (caller?.protocol ?? request.nextUrl.protocol) === 'https:',
        path: '/', maxAge: data.expiresIn,
      });
      session.headers.append('Set-Cookie', `${partnerSessionCookie}=; Path=/web; Max-Age=0; HttpOnly; SameSite=Lax`);
      return session;
    }
    return response(data, result.status);
  } catch {
    return formLogin ? loginRedirect('unavailable', returnToCart) : response({ message: 'ارتباط با بک‌اند برقرار نشد.' }, 502);
  }
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
