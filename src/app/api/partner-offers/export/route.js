import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { partnerBackend, partnerSessionCookie } from '../../../../lib/partnerBackend';

export async function GET() {
  const token = (await cookies()).get(partnerSessionCookie)?.value;
  if (!token) return new NextResponse('Unauthorized', { status: 401 });
  let response;
  try {
    response = await partnerBackend('/web/workspace/products?page=1&limit=1000', { token });
  } catch {
    return new NextResponse('Service unavailable', { status: 503 });
  }
  if (!response.ok) return new NextResponse('Could not export offers', { status: response.status });
  const data = await response.json();
  const quote = value => '"' + String(value ?? '').replace(/"/g, '""') + '"';
  const rows = [['id','productId','title','sku','price','stock'],
    ...(data.items || []).filter(item => item.offer).map(item => [
      item.id, item.offer.productId, item.title, item.offer.sku, item.offer.price, item.offer.stock,
    ])];
  const csv = '\\uFEFF' + rows.map(row => row.map(quote).join(',')).join('\\r\\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="sarichain-my-offers.csv"',
      'Cache-Control': 'private, no-store',
    },
  });
}
