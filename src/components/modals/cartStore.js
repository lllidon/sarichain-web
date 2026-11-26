'use client';

import { useSyncExternalStore } from 'react';
import { productImage, productPackages } from '../Products/catalog';
import { useCatalog } from '../Products/CatalogProvider';
import { useAccountCart } from './AccountCartProvider';
import { cartCookie, cartFitsCookie, cartLineId, catalogQuantityLimit, parseCart, serializeCart } from '../Products/cartData';

export { catalogQuantityLimit };

const storageKey = 'sarichain-catalog-cart';
const empty = [];
const neverSubscribe = () => () => {};
const emptyCart = () => empty;
const listeners = new Set();
let savedCart;

function readCookie() {
  const entry = document.cookie.split('; ').find(value => value.startsWith(cartCookie + '='));
  return entry?.slice(cartCookie.length + 1);
}

function writeCookie(items) {
  if (!cartFitsCookie(items)) return;
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = cartCookie + '=' + serializeCart(items) + '; Path=/; Max-Age=2592000; SameSite=Lax' + secure;
}

function getCart() {
  if (savedCart) return savedCart;
  try {
    const cookie = readCookie();
    if (cookie !== undefined) {
      savedCart = parseCart(cookie);
      return savedCart;
    }
    const value = JSON.parse(window.localStorage.getItem(storageKey));
    const legacy = Array.isArray(value) ? value : empty;
    const lines = new Map();
    for (const item of legacy) {
      if (!item || typeof item.productId !== 'string' || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.sellerId) continue;
      const packId = item.unitId || 'unit';
      const id = cartLineId(item.productId, packId);
      const quantity = item.unitId ? item.quantity : (item.amount || 1) * item.quantity;
      const accumulated = Math.min(Number.MAX_SAFE_INTEGER, (lines.get(id)?.quantity ?? 0) + quantity);
      const [line] = parseCart(serializeCart([{ ...item, packId, quantity: accumulated }]));
      if (line) lines.set(id, line);
    }
    savedCart = [...lines.values()];
  } catch {
    savedCart = empty;
  }
  return savedCart;
}

function notify() {
  listeners.forEach(listener => listener());
}

function syncCart(event) {
  if (event.type === 'focus' || event.key === storageKey || event.key === null) {
    savedCart = undefined;
    notify();
  }
}

function subscribe(listener) {
  if (!listeners.size) {
    const items = getCart();
    if (items.length && readCookie() === undefined) writeCookie(items);
    window.addEventListener('storage', syncCart);
    window.addEventListener('focus', syncCart);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      window.removeEventListener('storage', syncCart);
      window.removeEventListener('focus', syncCart);
    }
  };
}

function saveCart(items) {
  savedCart = items;
  writeCookie(items);
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  } catch {
    // Keep the cart usable for the current session.
  }
  notify();
}

export function useCatalogCart() {
  const { initialCart = empty } = useCatalog();
  const account = useAccountCart();
  const guest = useSyncExternalStore(account ? neverSubscribe : subscribe, account ? emptyCart : getCart, () => initialCart);
  return account ? account.items : guest;
}

export function useCartCommands() {
  const account = useAccountCart();
  const { catalog } = useCatalog();
  return {
    account,
    add(product, pack) {
      return account ? account.request('POST', 'items', {
        operation: 'add', productId: product.id, offerId: product.offer?.id, unitId: pack.id,
      }) : Promise.resolve(addCatalogItem(product, pack, catalog));
    },
    change(item, quantity, product) {
      return account ? account.request('POST', 'items', {
        operation: quantity === 0 ? 'set' : quantity > item.quantity ? 'add' : 'reduce',
        key: item.key, productId: item.productId, unitId: item.unitId, ...(quantity === 0 && { quantity }),
      }) : Promise.resolve(setCatalogQuantity(item, quantity, product, catalog));
    },
    clear() {
      if (account) return account.request('DELETE');
      clearCatalogCart();
      return Promise.resolve();
    },
  };
}

export function addCatalogItem(product, pack, catalog) {
  const items = getCart();
  const offerId = product.offer?.id;
  const id = cartLineId(product.id, pack.id, offerId);
  const existing = items.find(item => item.id === id);
  const line = {
    id,
    productId: product.id,
    offerId,
    code: product.code,
    packId: pack.id,
    unitId: pack.id,
    quantity: (existing?.quantity ?? 0) + 1,
  };
  return updateCatalogItem(items, line, product, catalog);
}

function updateCatalogItem(items, line, product, catalog) {
  const others = items.filter(item => item.id !== line.id);
  if (line.quantity === 0) {
    saveCart(others);
    return true;
  }
  const pack = product && productPackages(product).find(pack => pack.id === line.packId);
  if (!pack || !product.orderable) return false;
  if (line.sellerId) return false;
  const existing = items.find(item => item.id === line.id);
  if (!Number.isSafeInteger(line.quantity) || line.quantity < 1 ||
      (line.quantity > (existing?.quantity ?? 0) && line.quantity > catalogQuantityLimit(items, product, pack, catalog, line.offerId ?? null))) return false;

  const updated = {
    ...line,
    productId: product.id,
    name: product.name,
    image: productImage(product),
    amount: pack.amount,
    unit: product.unit,
    packName: pack.name,
  };
  const next = existing
    ? items.map(item => item.id === line.id ? updated : item)
    : [...items, updated];
  if (!cartFitsCookie(next)) return false;
  saveCart(next);
  return true;
}

export function setCatalogQuantity(item, quantity, product, catalog) {
  return updateCatalogItem(getCart(), { ...item, quantity }, product, catalog);
}

export function clearCatalogCart() {
  if (!getCart().length) return;
  saveCart([]);
}
