import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import ProductMarketplace from '../../../../components/Products/ProductMarketplace';
import ProductWeeklyToggle from '../../../../components/Products/ProductWeeklyToggle';
import { readCatalog } from '../../../../components/Products/catalog-data';
import { productHref, productImage } from '../../../../components/Products/catalog';
import { partnerBackend } from '../../../../lib/partnerBackend';
import '../../../../components/Products/CategoriesPage.css';
import '../../../../components/Products/ProductDetails.css';

async function readDelivery() {
  try {
    const response = await partnerBackend('/web/delivery-options');
    if (response.ok) return (await response.json()).methods;
  } catch {
    // Display the labeled example if the estimate service is unavailable.
  }
  return [];
}

async function findProduct(code) {
  const data = await readCatalog();
  const canonical = /^\d+$/.test(code) ? 'SC-' + code : code;
  const product = data.catalog.find(product => product.code === canonical);
  if (!product) {
    const parent = data.catalog.find(item => item.variants.some(variant => variant.code === canonical));
    if (parent) redirect(productHref(parent));
    notFound();
  }
  return { ...data, product };
}

function describe(product) {
  return product.description || product.detail || product.name;
}

export async function generateMetadata({ params }) {
  const { product } = await findProduct((await params).code);
  return { title: product.name, description: describe(product) };
}

export default async function ProductPage({ params, searchParams }) {
  const [{ catalog, categories, product }, delivery] = await Promise.all([
    findProduct((await params).code), readDelivery(),
  ]);
  const query = await searchParams;
  const initialVariant = [product, ...product.variants].find(item => item.code === query.variant || item.offers.some(offer => offer.id === query.offer))?.id;
  const initialUnit = typeof query.unit === 'string' ? query.unit : undefined;
  const category = categories[product.category];
  const categoryHref = { pathname: '/categories', query: { category: product.category } };
  const related = catalog.filter(item => item.category === product.category && item.code !== product.code).slice(0, 3);

  return (
    <div className="catalog-page product-details">
      <div className="catalog-wrap">
        <nav className="catalog-breadcrumb" aria-label="مسیر صفحه">
          <Link href="/">صفحه اصلی</Link>
          <span aria-hidden="true">/</span>
          <Link href="/categories">محصولات</Link>
          <span aria-hidden="true">/</span>
          <Link href={categoryHref}>{category.name}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{product.name}</span>
        </nav>

        <ProductMarketplace key={product.code} product={product} category={category}
          categoryHref={categoryHref} description={describe(product)} delivery={delivery} initialVariant={initialVariant} initialUnit={initialUnit} initialOffer={typeof query.offer === 'string' ? query.offer : undefined} />

        {related.length > 0 && (
          <section className="related-products" aria-labelledby="related-products">
            <div className="related-products-heading">
              <h2 id="related-products">محصولات مرتبط</h2>
              <Link href={categoryHref}>مشاهده دسته</Link>
            </div>
            <ul>
              {related.map(item => (
                <li key={item.code}>
                  <Link href={productHref(item)}>
                    <Image src={productImage(item)} alt="" width={80} height={80} unoptimized />
                    <span>{item.name}</span>
                  </Link>
                  <ProductWeeklyToggle productId={item.id} productIds={[item.id, ...item.variants.map(variant => variant.id)]} productName={item.name} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
