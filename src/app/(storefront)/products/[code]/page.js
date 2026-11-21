import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductPurchase from '../../../../components/Products/ProductPurchase';
import { catalog, categories, productHref, productImage, productPackages } from '../../../../components/Products/catalog';
import '../../../../components/Products/CategoriesPage.css';
import '../../../../components/Products/ProductDetails.css';

const number = new Intl.NumberFormat('fa-IR');

export const dynamicParams = false;

export function generateStaticParams() {
  return catalog.map(({ code }) => ({ code }));
}

function findProduct(code) {
  const product = catalog.find(product => product.code === code);
  if (!product) notFound();
  return product;
}

function describe(product) {
  return `${product.name}، ${categories[product.category].name} ${product.form} با کاربرد ${product.detail}.`;
}

export async function generateMetadata({ params }) {
  const product = findProduct((await params).code);
  return { title: product.name, description: describe(product) };
}

export default async function ProductPage({ params }) {
  const product = findProduct((await params).code);
  const category = categories[product.category];
  const categoryHref = { pathname: '/categories', query: { category: product.category } };
  const related = catalog.filter(item => item.category === product.category && item.code !== product.code && item.stock > 0).slice(0, 3);

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

        <article className="product-overview" aria-labelledby="product-title">
          <figure className="product-packshot">
            <Image src={productImage(product)} alt={product.name} width={320} height={320} preload unoptimized />
          </figure>
          <div className="product-overview-info">
            <Link className="product-category" href={categoryHref}>{category.name}</Link>
            <h1 id="product-title">{product.name}</h1>
            <p className="product-code">کد کالا <bdi>{product.code}</bdi></p>
            <p className="product-description">{describe(product)}</p>
            {product.stock === 0 && <span className="product-unavailable">ناموجود</span>}
            <ProductPurchase product={product} className="product-purchase" />
          </div>
        </article>

        <section className="product-specifications" aria-labelledby="product-specifications">
          <h2 id="product-specifications">مشخصات محصول</h2>
          <dl>
            <div><dt>شکل محصول</dt><dd>{product.form}</dd></div>
            <div><dt>{category.filter}</dt><dd>{product.detail}</dd></div>
            <div><dt>واحد پایه</dt><dd>{product.unit}</dd></div>
            <div>
              <dt>بسته‌بندی</dt>
              <dd>{productPackages(product).map(pack => `${pack.name} ${number.format(pack.amount)} ${product.unit}`).join('، ')}</dd>
            </div>
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
