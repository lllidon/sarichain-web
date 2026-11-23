import { cache } from 'react';

const empty = { catalog: [], categories: {}, brands: [], unavailable: true };

async function readList(resource) {
  const items = [];
  for (let page = 1; ; page++) {
    const url = new URL('/web/' + resource, process.env.BACKEND_URL || 'http://127.0.0.1:3001');
    url.search = new URLSearchParams({ limit: 100, page });
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Catalog request failed');
    const result = await response.json();
    items.push(...result.items);
    if (!result.items.length || items.length >= result.total) return items;
  }
}

export const readCatalog = cache(async () => {
  try {
    const [products, categoryRows, brands] = await Promise.all(['products', 'categories', 'brands'].map(readList));
    const categories = Object.fromEntries(categoryRows.map(row => [row._id, {
      name: row.name, parentId: row.parentId, filter: 'کاربرد',
    }]));
    const brandNames = new Map(brands.map(brand => [brand._id, brand.name]));
    const catalog = products.filter(product => categories[product.categoryId]).map(product => {
      const [form, detail] = (product.shortDescription || '').split(' · ');
      return {
        id: product._id, code: product.sku, name: product.name, category: product.categoryId,
        price: product.basePrice?.currency === 'IRR' ? product.basePrice.amount / 10 : null,
        orderable: product.kind === 'master' && product.basePrice?.currency === 'IRR',
        detail: detail || product.shortDescription || '', form: detail ? form : '',
        description: product.description || '',
        unit: product.description?.match(/هر (لیتر|کیلوگرم)/)?.[1] || 'واحد',
        brandId: product.brandId, brand: brandNames.get(product.brandId) || '',
        image: product.thumbnailUrl || product.imageUrl || '',
        fullImage: product.imageUrl || '',
      };
    });
    return { catalog, categories, brands, unavailable: false };
  } catch {
    return empty;
  }
});
