export const partnerSessionCookie = 'sarichain-member-session';

export function partnerBackend(path, { method, token, body, query, signal } = {}) {
  const url = new URL(path, process.env.BACKEND_URL || 'http://127.0.0.1:3001');
  if (query) url.search = query;
  return fetch(url, {
    method,
    cache: 'no-store',
    redirect: 'error',
    signal: signal ?? AbortSignal.timeout(10000),
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(typeof body === 'string' && { 'Content-Type': 'application/json' }),
    },
    body,
  });
}
