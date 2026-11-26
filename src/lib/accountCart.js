import 'server-only';
import { cache } from 'react';
import { parseCart } from '../components/Products/cartData';
import { partnerBackend } from './partnerBackend';

export const readAccountCart = cache(async token => {
  try {
    const response = await partnerBackend('/web/cart', { token, signal: AbortSignal.timeout(3500) });
    if (response.ok) return await response.json();
    if (response.status === 401) return null;
  } catch {
    // Keep account carts separate from guest carts during a backend outage.
  }
  return { items: [], revision: -1 };
});

export async function mergeGuestCart(token, cookie) {
  const items = parseCart(cookie).map(({ productId, unitId, offerId, quantity }) => ({ productId, unitId, offerId, quantity }));
  if (!items.length) return partnerBackend('/web/cart', { token });
  return partnerBackend('/web/cart/merge', { token, method: 'POST', body: JSON.stringify({ items }) });
}
