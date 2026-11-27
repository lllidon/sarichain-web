import { cache } from 'react';
import { defaultOffer, withOffer } from './catalog';

const empty = { catalog: [], categories: {}, brands: [], unavailable: true };

async function readList(resource, home) {
  const items = [];
  const limit = home && resource === 'products' ? 12 : 100;
  for (let page = 1; ; page++) {
    const url = new URL('/web/' + resource, process.env.BACKEND_URL || 'http://127.0.0.1:3001');
    url.search = new URLSearchParams({ limit, page });
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(home ? 2500 : 8000) });
    if (!response.ok) throw new Error('Catalog request failed');
    const result = await response.json();
    items.push(...result.items);
    if ((home && resource === 'products') || !result.items.length || items.length >= result.total) return items;
  }
}

export const readCatalog = cache(async (mode) => {
  try {
    const [products, categoryRows, brands] = await Promise.all(['products', 'categories', 'brands'].map(resource => readList(resource, mode === 'home')));
    const categories = Object.fromEntries(categoryRows.map(row => [row._id, {
      name: row.name, parentId: row.parentId, level: row.level, image: row.thumbnailUrl || row.imageUrl || '/img/catalog/field.webp', filter: 'کاربرد',
    }]));
    const brandNames = new Map(brands.map(brand => [brand._id, brand.name]));
    function mapProduct(product, parent) {
      const [form, detail] = (product.shortDescription || '').split(' · ');
      const gallery = product.gallery || [];
      const item = {
        id: product._id, code: product.sku, name: product.name, category: categories[product.categoryId] ? product.categoryId : (parent?.category || 'uncategorized'),
        offers: product.offers ?? [],
        isVariant: product.kind === 'variant',
        parentCode: parent?.code,
        maxOrderQuantity: product.maxOrderQuantity ?? null,
        familyMaxOrderQuantity: parent ? parent.maxOrderQuantity : product.maxOrderQuantity ?? null,
        options: product.options || [],
        physical: product.physical || parent?.physical || null,
        detail: detail || product.shortDescription || '', form: detail ? form : '',
        description: product.description || '',
        unit: product.saleUnit || parent?.unit || product.description?.match(/هر (لیتر|کیلوگرم)/)?.[1] || 'واحد',
        saleUnits: product.saleUnits?.length ? product.saleUnits : parent?.saleUnits || [],
        brandId: product.brandId, brand: brandNames.get(product.brandId) || '',
        image: gallery[0] || product.thumbnailUrl || product.imageUrl || parent?.image || '/img/catalog/field.webp',
        fullImage: gallery[0] || product.imageUrl || parent?.fullImage || '',
        gallery,
      };
      return withOffer(item, defaultOffer(item));
    }
    const hasUncategorized = products.some(product => !categories[product.categoryId]);
    if (hasUncategorized) categories.uncategorized = { name: 'سایر محصولات', parentId: null, level: 1, image: '/img/catalog/field.webp', filter: 'کاربرد' };
    const catalog = products.filter(product => product.kind === 'master').map(row => {
      const product = mapProduct(row);
      return { ...product, variants: (row.variants || []).map(variant => mapProduct(variant, product)) };
    });
    return { catalog, categories, brands, unavailable: false };
  } catch {
    return empty;
  }
});
