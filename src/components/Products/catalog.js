import { scalePrice } from './price';

export function productImage(product) {
  const image = product.image || '/img/catalog/field.webp';
  return image.startsWith('/catalog-demo/') ? '/web' + image : image;
}

export function productPackages(product) {
  return [
    { id: 'unit', name: product.unit, amount: 1, price: product.price },
    ...(product.saleUnits ?? []).map(unit => ({
      id: unit.code, name: unit.name, amount: unit.quantity, price: scalePrice(product.price, unit.quantity),
    })),
  ];
}

export function defaultOffer(product) {
  return product.offers.find(offer => offer.stock >= 1) ?? product.offers[0];
}

export function withOffer(product, offer) {
  return { ...product, offer, orderable: Boolean(offer && offer.stock >= 1),
    price: offer ? { min: offer.price, max: offer.price } : { min: 0, max: 0 } };
}

export function cheapestVariant(product) {
  return [product, ...product.variants].filter(item => item.offer)
    .sort((a, b) => Number(b.orderable) - Number(a.orderable) || a.price.min - b.price.min)[0] ?? product;
}

export function productHref(product) {
  return `/products/${encodeURIComponent(product.parentCode || product.code)}`;
}

export function categoryContains(categories, parent, current) {
  for (let level = 0; current && level < 3; level++, current = categories[current]?.parentId) {
    if (current === parent) return true;
  }
  return false;
}

export function normalizeCatalogSearch(value) {
  return value.toLowerCase()
    .replace(/ي/g, 'ی').replace(/ك/g, 'ک')
    .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[\s\u200c-]+/g, '');
}
