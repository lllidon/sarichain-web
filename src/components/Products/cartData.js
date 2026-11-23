import { productPackages } from './catalog';

export const cartCookie = 'sarichain-cart';
export const cartLineLimit = 50;

export function cartLineId(productId, packId) {
  return JSON.stringify([productId, packId]);
}

export function parseCart(value) {
  const items = new Map();
  let compact;
  try {
    compact = decodeURIComponent((value || '').slice(0, 6200));
  } catch {
    return [];
  }
  for (const entry of compact.split('|').slice(0, cartLineLimit)) {
    const [productId, packId, rawQuantity, extra] = entry.split(':');
    const quantity = Number(rawQuantity);
    if (extra !== undefined || !/^[a-f0-9]{24}$/.test(productId) ||
        !/^[a-z0-9][a-z0-9-]{0,29}$/.test(packId || '') ||
        !/^\d+$/.test(rawQuantity || '') || !Number.isSafeInteger(quantity) || quantity < 1) continue;
    const id = cartLineId(productId, packId);
    items.set(id, { id, productId, packId, unitId: packId, quantity });
  }
  return [...items.values()];
}

export function serializeCart(items) {
  return items.map(item => [item.productId, item.packId, item.quantity].join(':')).join('|');
}

export function isCartProduct(line, product) {
  return line.productId ? line.productId === product.id : line.code === product.code;
}

export function catalogQuantityLimit(items, product, pack, catalog) {
  const familyCode = product.parentCode ?? product.code;
  const family = catalog.find(item => item.code === familyCode);
  const products = family ? [family, ...family.variants] : [product];
  let used = 0;
  let familyUsed = 0;
  for (const line of items) {
    if (isCartProduct(line, product) && line.packId === pack.id) continue;
    const match = products.find(item => isCartProduct(line, item));
    if (!match) continue;
    const units = productPackages(match).find(option => option.id === line.packId)?.amount ?? 0;
    const quantity = units * line.quantity;
    familyUsed += quantity;
    if (match.id === product.id) used += quantity;
  }
  const skuRemaining = (product.maxOrderQuantity ?? Number.MAX_SAFE_INTEGER) - used;
  const familyRemaining = (product.familyMaxOrderQuantity ?? Number.MAX_SAFE_INTEGER) - familyUsed;
  return Math.max(0, Math.floor(Math.min(skuRemaining, familyRemaining) / pack.amount));
}
