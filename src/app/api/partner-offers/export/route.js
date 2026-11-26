import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { partnerBackend, partnerSessionCookie } from '../../../../lib/partnerBackend';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = (await cookies()).get(partnerSessionCookie)?.value;
  if (!token) return new NextResponse('Unauthorized', { status: 401 });

  const rows = [['id', 'productId', 'title', 'sku', 'price', 'stock']];
  try {
    let page = 1;
    let total = 0;
    do {
      const query = new URLSearchParams({ page: String(page), limit: '100' }).toString();
      const response = await partnerBackend('/web/workspace/products', { token, query });
      if (response.status === 401) return new NextResponse('Unauthorized', { status: 401 });
      if (response.status === 403) return new NextResponse('Forbidden', { status: 403 });
      if (!response.ok) return new NextResponse('Could not export offers', { status: response.status });
      const data = await response.json();
      if (!Array.isArray(data.items)) return new NextResponse('Invalid offers response', { status: 502 });
      total = Number(data.total) || 0;
      for (const item of data.items) {
        if (!item.offer) continue;
        rows.push([
          item.id, item.offer.productId, item.title, item.offer.sku,
          item.offer.price, item.offer.stock,
        ]);
      }
      page++;
      if (!data.items.length || page > 10000) break;
    } while ((page - 1) * 100 < total);
  } catch {
    return new NextResponse('Service unavailable', { status: 503 });
  }

  const quote = value => '"' + String(value ?? '').replace(/"/g, '""') + '"';
  const csv = '\uFEFF' + rows.map(row => row.map(quote).join(',')).join('\r\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="sarichain-my-offers.csv"',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
