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
