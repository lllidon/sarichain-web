export const partnerSessionCookie = 'sarichain-member-session';

export function partnerBackend(path, { method, token, body, query } = {}) {
  const url = new URL(path, process.env.BACKEND_URL || 'http://127.0.0.1:3001');
  if (query) url.search = query;
  return fetch(url, {
    method,
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(10000),
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(body !== undefined && { 'Content-Type': 'application/json' }),
    },
    body,
  });
}
