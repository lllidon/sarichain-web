export async function submitOrder(items, request) {
  const signature = JSON.stringify(items);
  if (request.current?.signature !== signature) request.current = { signature, id: crypto.randomUUID() };
  const response = await fetch('/web/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, requestId: request.current.id }),
  });
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401) throw new Error('برای ثبت سفارش از صفحه همکاران وارد شوید.');
    throw new Error(typeof result.message === 'string' ? result.message : 'ثبت سفارش انجام نشد.');
  }
  request.current = null;
  return result;
}
