import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import ProductMarketplace from '../../../../components/Products/ProductMarketplace';
import { readCatalog } from '../../../../components/Products/catalog-data';
import { productHref, productImage, productPackages } from '../../../../components/Products/catalog';
import '../../../../components/Products/CategoriesPage.css';
import '../../../../components/Products/ProductDetails.css';

const number = new Intl.NumberFormat('fa-IR');

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

export default async function ProductPage({ params }) {
  const { catalog, categories, product } = await findProduct((await params).code);
  const category = categories[product.category];
  const categoryHref = { pathname: '/categories', query: { category: product.category } };
  const related = catalog.filter(item => item.category === product.category && item.code !== product.code && item.orderable).slice(0, 3);

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
          categoryHref={categoryHref} description={describe(product)} />

        <section className="product-specifications" aria-labelledby="product-specifications">
          <h2 id="product-specifications">مشخصات محصول</h2>
          <dl>
            <div><dt>شکل محصول</dt><dd>{product.form}</dd></div>
            <div><dt>{category.filter}</dt><dd>{product.detail}</dd></div>
            <div><dt>واحد پایه</dt><dd>{product.unit}</dd></div>
            <div>
              <dt>واحد فروش</dt>
              <dd>{productPackages(product).map(pack => pack.amount === 1 ? pack.name : `هر ${pack.name} = ${number.format(pack.amount)} ${product.unit}`).join('، ')}</dd>
            </div>
            {product.options.map(option => <div key={option.name}><dt>{option.name}</dt><dd>{option.value}</dd></div>)}
          </dl>
        </section>

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
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
