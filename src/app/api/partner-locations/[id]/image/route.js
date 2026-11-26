import { partnerBackend, partnerSessionCookie } from '../../../../../lib/partnerBackend';

export async function GET(request, { params }) {
  const { id } = await params;
  const token = request.cookies.get(partnerSessionCookie)?.value;
  if (!token) return new Response(null, { status: 401 });
  if (!/^[a-f0-9]{24}$/.test(id)) return new Response(null, { status: 404 });
  try {
    const response = await partnerBackend('/web/workspace/orchards/' + id + '/image', { token });
    if (!response.ok) return new Response(null, { status: response.status });
    return new Response(response.body, { headers: {
      'Content-Type': response.headers.get('content-type'),
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    } });
  } catch {
    return new Response(null, { status: 502 });
  }
}
