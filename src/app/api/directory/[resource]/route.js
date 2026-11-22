export const runtime = 'nodejs';

const routes = {
  login: { method: 'POST', path: '/auth/login' },
  suppliers: { method: 'GET', path: '/directory/material-suppliers' },
  tags: { method: 'GET', path: '/catalog/tags' },
};

async function forward(request, { params }) {
  const { resource } = await params;
  const route = Object.hasOwn(routes, resource) ? routes[resource] : null;
  if (!route || route.method !== request.method) return new Response(null, { status: 404 });

  const headers = new Headers();
  const authorization = request.headers.get('Authorization');
  if (authorization) headers.set('Authorization', authorization);
  if (request.method === 'POST') headers.set('Content-Type', 'application/json');

  try {
    const backend = new URL(route.path, process.env.BACKEND_URL || 'http://127.0.0.1:3001');
    if (request.method === 'GET') backend.search = new URL(request.url).search;
    const response = await fetch(backend, {
      method: route.method, headers, cache: 'no-store', redirect: 'error',
      ...(request.method === 'POST' && { body: await request.text() }),
      signal: AbortSignal.timeout(10000),
    });
    return new Response(response.body, {
      status: response.status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
    });
  } catch {
    return Response.json({ message: 'Backend unavailable' }, { status: 502, headers: { 'Cache-Control': 'no-store' } });
  }
}

export const GET = forward;
export const POST = forward;
