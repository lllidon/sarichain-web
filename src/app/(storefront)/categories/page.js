import CategoriesPage from '../../../components/Products/CategoriesPage';
import { categoryContains } from '../../../components/Products/catalog';
import { readCatalog } from '../../../components/Products/catalog-data';

export const metadata = { title: 'دسته‌بندی محصولات' };

export default async function Page({ searchParams }) {
  const { catalog, categories, brands } = await readCatalog();
  const { category, detail, q, brand } = await searchParams;
  const initialQuery = typeof q === 'string' ? q.trim().slice(0, 80) : '';
  const initialCategory = typeof category === 'string' && Object.hasOwn(categories, category) ? category : 'all';
  const initialBrand = typeof brand === 'string' && brands.some(item => item._id === brand) ? brand : '';
  const initialDetail = catalog.some(product => typeof detail === 'string' && (initialCategory === 'all' || categoryContains(categories, initialCategory, product.category)) && product.detail === detail)
    ? detail
    : '';
  return <CategoriesPage key={JSON.stringify([initialCategory, initialDetail, initialQuery, initialBrand])}
    initialCategory={initialCategory} initialDetail={initialDetail} initialQuery={initialQuery} initialBrand={initialBrand} />;
}
