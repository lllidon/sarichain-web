'use client';

import { useSyncExternalStore } from 'react';
import { productImage, productPackages } from '../Products/catalog';

const storageKey = 'sarichain-catalog-cart';
const empty = [];
const listeners = new Set();
let savedCart;

function getCart() {
  if (savedCart) return savedCart;
  try {
    const value = JSON.parse(window.localStorage.getItem(storageKey));
    savedCart = Array.isArray(value) ? value.reduce((lines, item) => {
      if (!item || typeof item.code !== 'string' || !Number.isSafeInteger(item.quantity) ||
          !Number.isSafeInteger(item.amount) || item.quantity < 1 || item.amount < 1 || item.sellerId) return lines;
      const packId = typeof item.unitId === 'string' ? item.unitId : 'unit';
      const id = JSON.stringify([item.code, packId]);
      const existing = lines.find(line => line.id === id);
      const quantity = item.unitId ? item.quantity : item.amount * item.quantity;
      if (existing) existing.quantity = Math.min(Number.MAX_SAFE_INTEGER, existing.quantity + quantity);
      else lines.push({ ...item, id, unitId: packId, packId, amount: item.unitId ? item.amount : 1, quantity: Math.min(Number.MAX_SAFE_INTEGER, quantity) });
      return lines;
    }, []) : empty;
  } catch {
    savedCart = empty;
  }
  return savedCart;
}

function notify() {
  listeners.forEach(listener => listener());
}

function syncCart(event) {
  if (event.key === storageKey || event.key === null) {
    savedCart = undefined;
    notify();
  }
}

function subscribe(listener) {
  if (!listeners.size) window.addEventListener('storage', syncCart);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) window.removeEventListener('storage', syncCart);
  };
}

function saveCart(items) {
  savedCart = items;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  } catch {
    // Keep the cart usable for the current session.
  }
  notify();
}

export function useCatalogCart() {
  return useSyncExternalStore(subscribe, getCart, () => empty);
}

export function catalogQuantityLimit(items, product, pack, catalog) {
  const familyCode = product.parentCode ?? product.code;
  const family = catalog.find(item => item.code === familyCode);
  const products = family ? [family, ...family.variants] : [product];
  let used = 0;
  let familyUsed = 0;
  for (const line of items) {
    if (line.code === product.code && line.packId === pack.id) continue;
    const match = products.find(item => item.code === line.code);
    if (!match) continue;
    const units = productPackages(match).find(option => option.id === line.packId)?.amount ?? 0;
    const quantity = units * line.quantity;
    familyUsed += quantity;
    if (match.code === product.code) used += quantity;
  }
  const skuRemaining = (product.maxOrderQuantity ?? Number.MAX_SAFE_INTEGER) - used;
  const familyRemaining = (product.familyMaxOrderQuantity ?? Number.MAX_SAFE_INTEGER) - familyUsed;
  return Math.max(0, Math.floor(Math.min(skuRemaining, familyRemaining) / pack.amount));
}

export function addCatalogItem(product, pack, catalog) {
  const items = getCart();
  const id = JSON.stringify([product.code, pack.id]);
  const existing = items.find(item => item.id === id);
  const line = {
    id,
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
      (line.quantity > (existing?.quantity ?? 0) && line.quantity > catalogQuantityLimit(items, product, pack, catalog))) return false;

  const updated = {
    ...line,
    productId: product.id,
    name: product.name,
    image: productImage(product),
    amount: pack.amount,
    unit: product.unit,
    packName: pack.name,
  };
  saveCart(existing
    ? items.map(item => item.id === line.id ? updated : item)
    : [...items, updated]);
  return true;
}

export function setCatalogQuantity(item, quantity, product, catalog) {
  return updateCatalogItem(getCart(), { ...item, quantity }, product, catalog);
}

export function removeOrderedItems(ordered) {
  const quantities = new Map(ordered.map(item => [item.id, item.quantity]));
  saveCart(getCart().flatMap(item => {
    const quantity = item.quantity - (quantities.get(item.id) ?? 0);
    return quantity > 0 ? [{ ...item, quantity }] : [];
  }));
}

export function clearCatalogCart() {
  if (!getCart().length) return;
  saveCart([]);
}
