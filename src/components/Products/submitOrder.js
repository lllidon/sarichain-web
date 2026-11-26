function orderId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
}

export async function submitOrder(items, request, delivery, cartRevision) {
  const payload = { items, ...(delivery && { delivery }), ...(cartRevision !== undefined && { cartRevision }) };
  const signature = JSON.stringify(payload);
  if (request.current?.signature !== signature) request.current = { signature, id: orderId() };
  const response = await fetch('/web/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, requestId: request.current.id }),
  });
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401) throw Object.assign(new Error('برای ثبت سفارش از صفحه همکاران وارد شوید.'), { status: 401 });
    throw Object.assign(new Error(typeof result.message === 'string' ? result.message : 'ثبت سفارش انجام نشد.'), { status: response.status });
  }
  request.current = null;
  return result;
}
