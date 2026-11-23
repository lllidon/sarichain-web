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
      if (existing) existing.quantity = Math.min(1000, existing.quantity + quantity);
      else lines.push({ ...item, id, unitId: packId, packId, amount: item.unitId ? item.amount : 1, quantity: Math.min(1000, quantity) });
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

export function addCatalogItem(product, pack) {
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
  return updateCatalogItem(items, line, product);
}

function updateCatalogItem(items, line, product) {
  const others = items.filter(item => item.id !== line.id);
  if (line.quantity === 0) {
    saveCart(others);
    return true;
  }
  const pack = product && productPackages(product).find(pack => pack.id === line.packId);
  if (!pack || !product.orderable) return false;
  if (line.sellerId) return false;
  const used = others.filter(item => item.code === line.code)
    .reduce((total, item) => {
      const current = productPackages(product).find(option => option.id === item.packId);
      return total + (current?.amount ?? 0) * item.quantity;
    }, 0);
  if (used + pack.amount * line.quantity > 1000) return false;

  const updated = {
    ...line,
    productId: product.id,
    name: product.name,
    image: productImage(product),
    amount: pack.amount,
    unit: product.unit,
    packName: pack.name,
  };
  saveCart(items.some(item => item.id === line.id)
    ? items.map(item => item.id === line.id ? updated : item)
    : [...items, updated]);
  return true;
}

export function setCatalogQuantity(item, quantity, product) {
  return updateCatalogItem(getCart(), { ...item, quantity }, product);
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
