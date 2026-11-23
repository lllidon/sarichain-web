export async function GET(request, { params }) {
  const { asset } = await params;
  if (!/^[a-z0-9][a-z0-9-]*\.webp$/i.test(asset)) return new Response(null, { status: 404 });
  const url = new URL('/web/catalog-demo/' + asset, process.env.BACKEND_URL || 'http://127.0.0.1:3001');
  try {
    const image = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(8000) });
    if (!image.ok) return new Response(null, { status: image.status });
    return new Response(image.body, { headers: { 'Content-Type': 'image/webp' } });
  } catch {
    return new Response(null, { status: 502 });
  }
}
