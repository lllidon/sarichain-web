import { cache, Suspense } from 'react';
import { readAccountCart } from '../../lib/accountCart';
import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faAppleWhole, faArrowLeft, faBasketShopping, faBox, faLeaf, faMagnifyingGlass,
  faSeedling, faStore, faUser, faWheatAwn,
} from '@fortawesome/free-solid-svg-icons';
import { readCatalog } from '../../components/Products/catalog-data';
import { cheapestVariant, productHref, productImage } from '../../components/Products/catalog';
import { cartCookie, parseCart } from '../../components/Products/cartData';
import { formatPrice } from '../../components/Products/price';
import { partnerBackend, partnerSessionCookie } from '../../lib/partnerBackend';
import './home.css';
import '../../components/Navbar.css';
import ProductMegaMenu from '../../components/Products/ProductMegaMenu';
import SolutionsMegaMenu from '../../components/SolutionsMegaMenu';
import { CatalogProvider } from '../../components/Products/CatalogProvider';

const number = new Intl.NumberFormat('fa-IR');
const catalogIcons = [faAppleWhole, faWheatAwn, faSeedling, faLeaf, faBox, faStore];
const examples = [
  { name: 'بیوبوست', image: '/img/catalog/bio-boost.webp', detail: 'محرک رشد' },
  { name: 'هیومیک اسید', image: '/img/catalog/humic-acid.webp', detail: 'بهبود خاک' },
  { name: 'کلسیم و بور', image: '/img/catalog/cal-bor.webp', detail: 'تغذیهٔ گیاه' },
  { name: 'عصارهٔ جلبک', image: '/img/catalog/kelp.webp', detail: 'تغذیهٔ گیاه' },
];

const getProfile = cache(async () => {
  const token = (await cookies()).get(partnerSessionCookie)?.value;
  if (!token) return null;
  try {
    const response = await partnerBackend('/web/profile', { token, signal: AbortSignal.timeout(1600) });
    if (response.ok) return await response.json();
  } catch {
    // The storefront remains accessible while account data is unavailable.
  }
  return null;
});

function AccountLink({ profile }) {
  return <Link href={profile ? '/partners' : '/login'} prefetch={false} className="market-home-account">
    <FontAwesomeIcon icon={faUser} /><span>{profile ? 'حساب من' : 'ورود'}</span>
  </Link>;
}

async function HomeActions() {
  const jar = await cookies();
  const token = jar.get(partnerSessionCookie)?.value;
  const cart = token ? await readAccountCart(token) : null;
  const items = (cart?.items ?? parseCart(jar.get(cartCookie)?.value)).reduce((total, item) => total + item.quantity, 0);
  return <div className="market-home-actions">
    <Link href="/cart" prefetch={false} aria-label={items ? `سبد خرید، ${number.format(items)} قلم` : 'سبد خرید'}>
      <FontAwesomeIcon icon={faBasketShopping} />{items > 0 && <span className="market-home-count">{number.format(items)}</span>}
    </Link>
    <Suspense fallback={<AccountLink />}><PersonalizedAccount /></Suspense>
  </div>;
}

async function PersonalizedAccount() {
  return <AccountLink profile={await getProfile()} />;
}

function HomeHeader({ catalogData }) {
  return <CatalogProvider value={{ ...catalogData, brands: [], unavailable: false }}>
    <header className="market-home-header">
      <div className="market-home-shell market-home-header-grid">
        <Link className="market-home-logo" href="/" aria-label="ساری‌چین، صفحهٔ اول">
          <img src="/img/sarichain-logo.svg" alt="ساری‌چین" width="132" height="44" />
        </Link>
        <nav aria-label="منوی اصلی" className="market-home-nav">
          <ul className="nav-menu">
            <ProductMegaMenu />
            <li className="nav-item"><Link href="/weekly-basket" className="nav-link">سبد هفتگی</Link></li>
            <li className="nav-item"><Link href="/quick-order" className="nav-link">سفارش سریع</Link></li>
            <li className="nav-item"><Link href="/pilot" className="nav-link">پیش‌نمایش پایلوت</Link></li>
            <SolutionsMegaMenu />
            <li className="nav-item"><Link href="/blog" className="nav-link">وبلاگ</Link></li>
            <li className="nav-item"><Link href="/support" className="nav-link">پشتیبانی</Link></li>
          </ul>
        </nav>
        <Suspense fallback={<div className="market-home-actions"><Link href="/cart" aria-label="سبد خرید"><FontAwesomeIcon icon={faBasketShopping} /></Link><AccountLink /></div>}>
          <HomeActions />
        </Suspense>
      </div>
    </header>
  </CatalogProvider>;
}

function HomeHero() {
  return <section className="market-home-hero" aria-labelledby="market-home-title">
    <div className="market-home-hero-copy">
      <h1 id="market-home-title">خرید از تولیدکننده،<br /><span>برای سفره و کسب‌وکار</span></h1>
      <p>محصول و نهادهٔ کشاورزی را پیدا کنید، قیمت عرضه‌ها را مقایسه کنید و فروشندهٔ مناسب را انتخاب کنید.</p>
      <form action="/categories" method="get" role="search" className="market-home-search">
        <label className="market-home-visually-hidden" htmlFor="home-search">نام محصول، برند یا دسته</label>
        <input type="search" id="home-search" name="q" placeholder="نام محصول، برند یا دسته" maxLength={80} />
        <button type="submit" aria-label="جستجوی محصولات"><FontAwesomeIcon icon={faMagnifyingGlass} /></button>
      </form>
      <Link className="market-home-text-link" href="/categories" prefetch={false}>مشاهدهٔ همهٔ محصولات <FontAwesomeIcon icon={faArrowLeft} /></Link>
    </div>
    <div className="market-home-hero-image">
      <picture>
        <source media="(max-width: 640px)" srcSet="/img/home/seasonal-market-mobile.webp" />
        <img src="/img/home/seasonal-market.webp" alt="" width="960" height="680" fetchPriority="high" />
      </picture>
    </div>
  </section>;
}

function WeeklyBasket() {
  return <section id="weekly-basket" className="market-home-weekly" aria-labelledby="market-weekly-title">
    <div className="market-home-weekly-icon"><FontAwesomeIcon icon={faBasketShopping} /></div>
    <div>
      <h2 id="market-weekly-title">سبد خرید هفتگی</h2>
      <p>پیش‌نمایش سبد خانوار برای مرور ترکیب فصلی، مقدار اقلام و زمان تحویل.</p>
    </div>
    <Link href="/pilot" prefetch={false} className="market-home-button">پیش‌نمایش سبد <FontAwesomeIcon icon={faArrowLeft} /></Link>
  </section>;
}

async function AccountSection() {
  const profile = await getProfile();
  const firstName = profile?.fullName?.trim().split(/\s+/)[0];
  return <aside className="market-home-member" aria-labelledby="market-home-member-title">
    <div className="market-home-member-icon"><FontAwesomeIcon icon={profile ? faBox : faUser} /></div>
    <div>
      <h2 id="market-home-member-title">{profile ? firstName ? `${firstName}، خوش آمدید` : 'حساب خرید شما' : 'خرید و سفارش‌های شما'}</h2>
      <p>{profile ? 'سفارش‌های جاری را پیگیری کنید یا خریدتان را ادامه دهید.' : 'محصولات را مرور کنید. برای ثبت و پیگیری سفارش وارد حساب شوید.'}</p>
    </div>
    <Link href={profile ? '/partners?section=orders' : '/login'} prefetch={false} className="market-home-text-link">
      {profile ? 'سفارش‌های من' : 'ورود به حساب'} <FontAwesomeIcon icon={faArrowLeft} />
    </Link>
    {profile && <Link href="/cart" prefetch={false} className="market-home-text-link">
      ادامهٔ خرید <FontAwesomeIcon icon={faArrowLeft} />
    </Link>}
  </aside>;
}

function CategoryList({ categories }) {
  const roots = Object.entries(categories).filter(([, row]) => !row.parentId).slice(0, 6);
  const links = roots.length ? roots.map(([id, row]) => ({ name: row.name, href: '/categories?category=' + id }))
    : ['محصولات باغی', 'تغذیهٔ گیاه', 'بهبود خاک', 'نهاده‌های کشاورزی'].map(name => ({
      name, href: '/categories?q=' + encodeURIComponent(name),
    }));
  return <section className="market-home-section" aria-labelledby="market-category-title">
    <div className="market-home-section-heading">
      <div><h2 id="market-category-title">دسته‌بندی محصولات</h2>{!roots.length && <p>دسته‌بندی‌های نمونه</p>}</div>
      <Link className="market-home-text-link" href="/categories" prefetch={false}>همهٔ دسته‌ها <FontAwesomeIcon icon={faArrowLeft} /></Link>
    </div>
    <ul className="market-home-categories">
      {links.map(({ name, href }, index) => <li key={href}>
        <Link href={href} prefetch={false}>
          <span><FontAwesomeIcon icon={catalogIcons[index]} /></span><strong>{name}</strong><FontAwesomeIcon icon={faArrowLeft} />
        </Link>
      </li>)}
    </ul>
  </section>;
}

function CatalogCard({ product, category, sample }) {
  const listing = sample ? null : cheapestVariant(product);
  const href = sample ? '/categories?q=' + encodeURIComponent(product.name) : productHref(product);
  return <li>
    <Link className="market-home-product" href={href} prefetch={false}>
      <div className="market-home-product-image">
        <Image src={sample ? product.image : productImage(product)} alt="" width={250} height={176} unoptimized />
      </div>
      <div className="market-home-product-info">
        <small>{sample ? 'نمونه · ' + product.detail : [category, product.brand].filter(Boolean).join(' · ')}</small>
        <h3>{product.name}</h3>
        {listing?.offer && <span className="market-home-seller"><FontAwesomeIcon icon={faStore} /> {listing.offer.name}</span>}
        <div className="market-home-product-price">
          <div>{listing?.offer ? <><strong>{formatPrice(listing.price)}</strong><small> / {listing.unit}</small>
            {!listing.orderable && <small className="market-home-no-stock">موجودی قابل سفارش نیست</small>}</>
            : <strong>{sample ? 'پیش‌نمایش محصول' : 'قیمت اعلام نشده'}</strong>}</div>
          <span><FontAwesomeIcon icon={faArrowLeft} /></span>
        </div>
      </div>
    </Link>
  </li>;
}

async function HomeCatalog({ catalogData }) {
  const { catalog, categories } = catalogData;
  const live = catalog.length > 0;
  const products = live ? [...catalog].sort((a, b) => Number(cheapestVariant(b).orderable) - Number(cheapestVariant(a).orderable)).slice(0, 4) : examples;
  return <>
    <CategoryList categories={categories} />
    <section className="market-home-section" aria-labelledby="market-products-title">
      <div className="market-home-section-heading">
        <div><h2 id="market-products-title">{live ? 'محصولات بازار' : 'پیش‌نمایش محصولات'}</h2>
          <p>{live ? 'قیمت هر کالا از عرضه‌های ثبت‌شده می‌آید.' : 'کارت‌های نمونه تا زمان دسترسی به کاتالوگ.'}</p></div>
        <Link className="market-home-text-link" href="/categories" prefetch={false}>رفتن به کاتالوگ <FontAwesomeIcon icon={faArrowLeft} /></Link>
      </div>
      <ul className="market-home-products">
        {products.map(product => <CatalogCard key={product.id ?? product.name} product={product} category={categories[product.category]?.name} sample={!live} />)}
      </ul>
    </section>
  </>;
}

function HomeFooter() {
  return <footer className="market-home-footer">
    <div className="market-home-shell">
      <Link className="market-home-logo" href="/" aria-label="ساری‌چین، صفحهٔ اول">
        <img src="/img/sarichain-logo.svg" alt="ساری‌چین" width="106" height="36" />
      </Link>
      <nav aria-label="پایین صفحه">
        <Link href="/categories" prefetch={false}>محصولات</Link>
        <Link href="/pilot" prefetch={false}>سبد هفتگی</Link>
        <Link href="/suppliers" prefetch={false}>دفترچه تأمین‌کنندگان</Link>
        <Link href="/partners" prefetch={false}>پنل همکاران</Link>
      </nav>
    </div>
  </footer>;
}

export const metadata = { description: 'بازار چندفروشندگی ساری‌چین برای خرید محصولات و نهاده‌های کشاورزی از تولیدکنندگان.' };

export default async function HomePage() {
  const catalogData = await readCatalog('home');
  return <div className="market-home">
    <HomeHeader catalogData={catalogData} />
    <main className="market-home-shell">
      <HomeHero />
      <div className="market-home-paths">
        <WeeklyBasket />
        <Suspense fallback={<div className="market-home-member" aria-busy="true" />}><AccountSection /></Suspense>
      </div>
      <Suspense fallback={<p className="market-home-catalog-loading" role="status">در حال دریافت کاتالوگ…</p>}><HomeCatalog catalogData={catalogData} /></Suspense>
    </main>
    <HomeFooter />
  </div>;
}
