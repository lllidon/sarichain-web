import { partnerBackend } from '../../../../lib/partnerBackend';

export async function GET(_request, { params }) {
  const { id } = await params;
  if (!/^[a-f0-9]{64}$/.test(id)) return new Response(null, { status: 404 });
  try {
    const source = await partnerBackend('/web/catalog-images/' + id);
    if (!source.ok) return new Response(null, { status: source.status });
    return new Response(source.body, {
      headers: {
        'Content-Type': source.headers.get('content-type') || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
