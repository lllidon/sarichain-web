import { NextResponse } from 'next/server';
import { partnerBackend, partnerSessionCookie } from '../../../../lib/partnerBackend';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  const token = request.cookies.get(partnerSessionCookie)?.value;
  if (!token) return NextResponse.json({}, { status: 401, headers: { 'Cache-Control': 'private, no-store' } });
  const { orderId } = await params;
  if (!/^[a-f0-9]{64}$/.test(orderId)) return NextResponse.json({}, { status: 404 });
  try {
    const result = await partnerBackend('/web/orders/' + orderId, { token });
    const data = await result.json();
    return NextResponse.json(data, { status: result.status, headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ message: 'دریافت جزئیات سفارش انجام نشد.' }, { status: 502, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
