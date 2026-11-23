import CategoriesPage from '../../../components/Products/CategoriesPage';
import { categoryContains } from '../../../components/Products/catalog';
import { readCatalog } from '../../../components/Products/catalog-data';

export const metadata = { title: 'دسته‌بندی محصولات' };

export default async function Page({ searchParams }) {
  const { catalog, categories } = await readCatalog();
  const { category, detail } = await searchParams;
  const initialCategory = typeof category === 'string' && Object.hasOwn(categories, category) ? category : 'all';
  const initialDetail = catalog.some(product => typeof detail === 'string' && (initialCategory === 'all' || categoryContains(categories, initialCategory, product.category)) && product.detail === detail)
    ? detail
    : '';
  return <CategoriesPage key={JSON.stringify([initialCategory, initialDetail])}
    initialCategory={initialCategory} initialDetail={initialDetail} />;
}
