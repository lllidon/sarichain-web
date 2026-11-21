'use client';

import { useSyncExternalStore } from 'react';
import { catalog, productImage, productPackages } from '../Products/catalog';
import { marketplaceOffer } from '../Products/marketplace';

const storageKey = 'sarichain-catalog-cart';
const empty = [];
const listeners = new Set();
let savedCart;

function getCart() {
  if (savedCart) return savedCart;
  try {
    const value = JSON.parse(window.localStorage.getItem(storageKey));
    savedCart = Array.isArray(value) ? value : empty;
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

export function addCatalogItem(product, pack, offer) {
  const items = getCart();
  const baseId = `${product.code}-${pack.id}`;
  const id = offer ? `${baseId}-${offer.sellerId}-${offer.qualityId}` : baseId;
  const existing = items.find(item => item.id === id);
  const line = {
    id,
    code: product.code,
    packId: pack.id,
    ...(offer && { sellerId: offer.sellerId, qualityId: offer.qualityId }),
    quantity: (existing?.quantity ?? 0) + 1,
  };
  return updateCatalogItem(items, line);
}

function updateCatalogItem(items, line) {
  const others = items.filter(item => item.id !== line.id);
  if (line.quantity === 0) {
    saveCart(others);
    return true;
  }
  const product = catalog.find(product => product.code === line.code);
  const pack = product && productPackages(product).find(pack => pack.id === line.packId);
  if (!pack) return false;
  const offer = line.sellerId ? marketplaceOffer(product, line.sellerId, line.qualityId) : null;
  if (line.sellerId && !offer) return false;
  const used = others.filter(item => item.code === line.code)
    .reduce((total, item) => total + item.amount * item.quantity, 0);
  if (used + pack.amount * line.quantity > product.stock) return false;

  const updated = {
    ...line,
    name: product.name,
    image: productImage(product),
    price: offer ? offer.unitPrice * pack.amount : pack.price,
    ...(offer && { sellerName: offer.sellerName, qualityName: offer.qualityName }),
    amount: pack.amount,
    unit: product.unit,
    packName: pack.name,
  };
  saveCart(items.some(item => item.id === line.id)
    ? items.map(item => item.id === line.id ? updated : item)
    : [...items, updated]);
  return true;
}

export function setCatalogQuantity(item, quantity) {
  return updateCatalogItem(getCart(), { ...item, quantity });
}
