import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
const cookieName = 'sarichain-member-session';
const routes = {
  login: { POST: '/marketplace/login' },
  profile: { GET: '/marketplace/profile', PATCH: '/marketplace/profile' },
  provinces: { GET: '/locations/provinces' },
  cities: { GET: '/locations/cities' },
};

function response(data, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

async function forward(request, { params }) {
  const { resource } = await params;
  const method = request.method;
  let caller;
  if (method !== 'GET') {
    const origin = request.headers.get('origin');
    try {
      caller = origin ? new URL(origin) : undefined;
    } catch {
      return response({}, 403);
    }
    const host = request.headers.get('host') ?? request.nextUrl.host;
    if (request.headers.get('sec-fetch-site') === 'cross-site' ||
        (caller && (caller.host !== host || !['http:', 'https:'].includes(caller.protocol)))) {
      return response({}, 403);
    }
  }

  if (resource === 'logout' && method === 'POST') {
    const result = response({ ok: true });
    result.cookies.delete({ name: cookieName, path: '/api/partners' });
    return result;
  }

  const route = Object.hasOwn(routes, resource) && routes[resource][method];
  if (!route) return response({}, 404);
  const token = request.cookies.get(cookieName)?.value;
  if (resource === 'profile' && !token) return response({}, 401);
  if (method !== 'GET' && !request.headers.get('content-type')?.startsWith('application/json')) return response({}, 415);
  try {
    const upstream = new URL(route, process.env.BACKEND_URL || 'http://127.0.0.1:3001');
    upstream.search = request.nextUrl.search;
    const result = await fetch(upstream, {
      method, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000),
      headers: {
        ...(resource === 'profile' && { Authorization: `Bearer ${token}` }),
        ...(method !== 'GET' && { 'Content-Type': 'application/json' }),
      },
      ...(method !== 'GET' && { body: await request.text() }),
    });
    const data = await result.json();
    if (resource === 'login' && result.ok) {
      const session = response({ ok: true });
      session.cookies.set(cookieName, data.accessToken, {
        httpOnly: true, sameSite: 'lax', secure: (caller?.protocol ?? request.nextUrl.protocol) === 'https:',
        path: '/api/partners', maxAge: data.expiresIn,
      });
      return session;
    }
    return response(data, result.status);
  } catch {
    return response({ message: 'ارتباط با بک‌اند برقرار نشد.' }, 502);
  }
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
