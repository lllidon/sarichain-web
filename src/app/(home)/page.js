import { Suspense } from 'react';
import { readAccountCart } from '../../lib/accountCart';
import { readAccountWeeklyBasket } from '../../lib/accountWeeklyBasket';
import { readAccountMenu } from '../../lib/accountMenu';
import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faAppleWhole, faArrowLeft, faBasketShopping, faBox, faLeaf, faMagnifyingGlass,
  faSeedling, faStore, faUser, faWheatAwn, faTractor, faTruckFast, faShieldHalved, faHandshake,
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
import { AccountCartProvider } from '../../components/modals/AccountCartProvider';
import NavQuickActions from '../../components/NavQuickActions';
import HomeHeroCarousel from '../../components/HomeHeroCarousel';
import SafeCategoryImage from '../../components/SafeCategoryImage';

const number = new Intl.NumberFormat('fa-IR');
const catalogIcons = [faAppleWhole, faWheatAwn, faSeedling, faLeaf, faBox, faStore];
const examples = [
  { name: 'بیوبوست', image: '/img/catalog/bio-boost.webp', detail: 'محرک رشد' },
  { name: 'هیومیک اسید', image: '/img/catalog/humic-acid.webp', detail: 'بهبود خاک' },
  { name: 'کلسیم و بور', image: '/img/catalog/cal-bor.webp', detail: 'تغذیهٔ گیاه' },
  { name: 'عصارهٔ جلبک', image: '/img/catalog/kelp.webp', detail: 'تغذیهٔ گیاه' },
];

function HomeHeader({ catalogData, initialCart, accountCart, accountMenu }) {
  const profile = accountMenu?.profile ?? null;
  return <CatalogProvider value={{ ...catalogData, initialCart, brands: [], unavailable: false }}>
    <AccountCartProvider initial={accountCart}>
      <header className="market-home-header">
        <div className="market-home-shell">
          <div className="market-home-header-top">
            <Link className="market-home-logo" href="/" aria-label="ساری‌چین، صفحهٔ اول">
              <img src="/img/sarichain-logo.svg" alt="ساری‌چین" width="132" height="44" />
            </Link>
            <form action="/categories" method="get" role="search" className="market-home-header-search">
              <label className="market-home-visually-hidden" htmlFor="home-header-search">جستجوی محصولات و تولیدکنندگان</label>
              <FontAwesomeIcon icon={faMagnifyingGlass}/>
              <input id="home-header-search" name="q" type="search" placeholder="جستجوی محصول، دسته‌بندی یا تولیدکننده…" maxLength={80}/>
              <button type="submit">جستجو</button>
            </form>
            <div className="market-home-actions">
              <NavQuickActions session={Boolean(profile)} profile={profile} wallet={accountMenu?.wallet} />
            </div>
          </div>
          <nav aria-label="منوی اصلی" className="market-home-nav">
            <ul className="nav-menu">
              <ProductMegaMenu />
              <SolutionsMegaMenu />
              <li className="nav-item"><Link href="/categories" className="nav-link">بازار محصولات</Link></li>
              <li className="nav-item"><Link href="/suppliers" className="nav-link">تولیدکنندگان</Link></li>
              <li className="nav-item"><Link href="/pilot" className="nav-link">راهنما و آموزش</Link></li>
            </ul>
          </nav>
        </div>
      </header>
    </AccountCartProvider>
  </CatalogProvider>;
}

function WeeklyBasket({ basket, catalog = [] }) {
  const selected = (basket?.items || []).map(item =>
    catalog.find(product => String(product.id) === String(item.productId))
  ).filter(Boolean);
  const fallback = catalog.filter(product => product.image).slice(0, 3);
  const products = (selected.length ? selected : fallback).slice(0, 3);
  const remaining = selected.length ? Math.max(0, (basket?.items?.length || selected.length) - 3) : 0;

  return <section id="weekly-basket" className="market-home-weekly" aria-labelledby="market-weekly-title">
    <div className="market-home-weekly-icon"><FontAwesomeIcon icon={faBasketShopping} /></div>
    <div className="market-home-weekly-copy">
      <h2 id="market-weekly-title">سبد خرید هفتگی</h2>
      <p>پیش‌نمایش سبد خانوار برای مرور ترکیب فصلی، مقدار اقلام و زمان تحویل.</p>
    </div>
    <div className="market-home-weekly-products" aria-label={products.length ? `${number.format(products.length)} تصویر از محصولات سبد هفتگی` : 'تصاویر محصولات سبد هفتگی'}>
      {products.map((product, index) => <span className="market-home-weekly-product" key={product.id || index}
        style={{ zIndex: products.length - index }}>
        <img src={productImage(product)} alt="" loading="lazy" />
      </span>)}
      {remaining > 0 && <span className="market-home-weekly-more">+{number.format(remaining)}</span>}
    </div>
    <Link href="/pilot" prefetch={false} className="market-home-button">پیش‌نمایش سبد <FontAwesomeIcon icon={faArrowLeft} /></Link>
  </section>;
}

function AccountSection({ profile }) {
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
  const roots = Object.entries(categories).filter(([, row]) => !row.parentId).slice(0, 8);
  const fallback = [
    { name: 'محصولات باغی', href: '/categories?q=' + encodeURIComponent('محصولات باغی'), image: '/img/catalog/fruit-pro.webp' },
    { name: 'محصولات زراعی', href: '/categories?q=' + encodeURIComponent('محصولات زراعی'), image: '/img/catalog/field.webp' },
    { name: 'دام و طیور', href: '/categories?q=' + encodeURIComponent('دام و طیور'), image: '/img/catalog/compost.webp' },
    { name: 'لبنیات و فرآورده‌ها', href: '/categories?q=' + encodeURIComponent('لبنیات'), image: '/img/catalog/kelp.webp' },
    { name: 'نهاده‌های کشاورزی', href: '/categories?q=' + encodeURIComponent('نهاده کشاورزی'), image: '/img/catalog/bio-boost.webp' },
    { name: 'تجهیزات و ابزار', href: '/categories?q=' + encodeURIComponent('تجهیزات کشاورزی'), image: '/img/catalog/soil-life.webp' },
  ];
  const links = roots.length ? roots.map(([id, row]) => ({ name: row.name, href: '/categories?category=' + id, image: row.image || '/img/catalog/field.webp' })) : fallback;
  const icons = [faAppleWhole, faWheatAwn, faSeedling, faLeaf, faBox, faTractor, faStore, faBasketShopping];
  return <section className="market-home-section market-home-category-section" aria-labelledby="market-category-title">
    <div className="market-home-section-heading">
      <div><span className="market-home-kicker">بازار ساری‌چین</span><h2 id="market-category-title">از چه چیزی شروع کنیم؟</h2>
        <p>دسته موردنظرتان را انتخاب کنید و عرضه‌های موجود را ببینید.</p></div>
      <Link className="market-home-text-link" href="/categories" prefetch={false}>همهٔ دسته‌ها <FontAwesomeIcon icon={faArrowLeft}/></Link>
    </div>
    <ul className="market-home-categories">
      {links.map(({ name, href, image }, index) => <li key={href}>
        <Link href={href} prefetch={false}>
          <span className="market-home-category-image"><SafeCategoryImage src={image}/></span>
          <span className="market-home-category-meta"><strong>{name}</strong><small>مشاهده عرضه‌ها</small></span>
          <i><FontAwesomeIcon icon={icons[index % icons.length]}/></i>
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

function FeaturedProducers({ catalog }) {
  const names = [...new Set(catalog.flatMap(product => (product.offers || []).map(offer => offer.name).filter(Boolean)))].slice(0, 6);
  return <section className="market-home-section market-home-producers" aria-labelledby="market-producers-title">
    <div className="market-home-section-heading">
      <div><span className="market-home-kicker">ارتباط مستقیم با مبدأ تولید</span><h2 id="market-producers-title">تولیدکنندگان و عرضه‌کنندگان</h2>
        <p>محصولات را از عرضه‌کنندگان فعال بازار پیدا کنید.</p></div>
      <Link className="market-home-text-link" href="/suppliers" prefetch={false}>دفترچه تأمین‌کنندگان <FontAwesomeIcon icon={faArrowLeft}/></Link>
    </div>
    {names.length ? <ul className="market-home-producer-list">
      {names.map((name,index)=><li key={name}>
        <span className="market-home-producer-mark"><FontAwesomeIcon icon={[faSeedling,faTractor,faLeaf,faStore,faWheatAwn,faAppleWhole][index % 6]}/></span>
        <span><strong>{name}</strong><small>عرضه‌کننده در بازار ساری‌چین</small></span>
        <FontAwesomeIcon icon={faArrowLeft} className="market-home-producer-arrow"/>
      </li>)}
    </ul> : <div className="market-home-producer-empty"><span><FontAwesomeIcon icon={faHandshake}/></span>
      <div><strong>شبکه تولیدکنندگان ساری‌چین</strong><p>برای آشنایی با تأمین‌کنندگان و ثبت همکاری، به دفترچه تأمین‌کنندگان مراجعه کنید.</p></div>
      <Link href="/suppliers">مشاهده تأمین‌کنندگان <FontAwesomeIcon icon={faArrowLeft}/></Link>
    </div>}
  </section>;
}

function HomeBenefits() {
  const items = [
    [faHandshake,'ارتباط مستقیم','خرید از تولیدکنندگان و عرضه‌کنندگان'],
    [faShieldHalved,'شفافیت در عرضه','مشاهده مشخصات و شرایط هر عرضه'],
    [faTruckFast,'هماهنگی تأمین و حمل','مسیر ساده‌تر برای پیگیری سفارش'],
    [faTractor,'همراه زنجیره تولید','محصول، نهاده و خدمات در یک بازار'],
  ];
  return <section className="market-home-benefits" aria-label="مزیت‌های ساری‌چین">
    {items.map(([icon,title,description])=><article key={title}>
      <span><FontAwesomeIcon icon={icon}/></span><div><strong>{title}</strong><p>{description}</p></div>
    </article>)}
  </section>;
}

function WholesaleBanner() {
  return <section className="market-home-wholesale">
    <div><span className="market-home-kicker">برای تولیدکنندگان و خریداران حرفه‌ای</span>
      <h2>بازار بزرگ‌تری برای محصولاتتان بسازید</h2>
      <p>محصولات خود را عرضه کنید، خریداران را پیدا کنید و ارتباطات تجاری‌تان را توسعه دهید.</p>
    </div>
    <div className="market-home-wholesale-actions">
      <Link href="/partners" className="market-home-button">شروع همکاری <FontAwesomeIcon icon={faArrowLeft}/></Link>
      <Link href="/suppliers" className="market-home-wholesale-link">آشنایی با تأمین‌کنندگان</Link>
    </div>
  </section>;
}

async function HomeCatalog({ catalogData }) {
  const { catalog, categories } = catalogData;
  const live = catalog.length > 0;
  const products = live ? [...catalog].sort((a, b) => Number(cheapestVariant(b).orderable) - Number(cheapestVariant(a).orderable)).slice(0, 8) : examples;
  return <>
    <HomeBenefits/>
    <CategoryList categories={categories}/>
    <section className="market-home-section market-home-product-section" aria-labelledby="market-products-title">
      <div className="market-home-section-heading">
        <div><span className="market-home-kicker">منتخب بازار</span><h2 id="market-products-title">{live ? 'محصولات و عرضه‌های منتخب' : 'پیش‌نمایش محصولات'}</h2>
          <p>{live ? 'قیمت‌ها از عرضه‌های ثبت‌شده در بازار نمایش داده می‌شوند.' : 'نمونه‌هایی از دسته‌های محصول در ساری‌چین.'}</p></div>
        <Link className="market-home-text-link" href="/categories" prefetch={false}>مشاهده همه محصولات <FontAwesomeIcon icon={faArrowLeft}/></Link>
      </div>
      <ul className="market-home-products">
        {products.map(product=><CatalogCard key={product.id ?? product.name} product={product} category={categories[product.category]?.name} sample={!live}/>)}
      </ul>
    </section>
    {live && <FeaturedProducers catalog={catalog}/>}
    <WholesaleBanner/>
  </>;
}

function HomeFooter() {
  return <footer className="market-home-footer">
    <div className="market-home-footer-main market-home-shell">
      <div className="market-home-footer-about">
        <Link className="market-home-logo" href="/" aria-label="ساری‌چین، صفحهٔ اول">
          <img src="/img/sarichain-logo.svg" alt="ساری‌چین" width="126" height="42"/>
        </Link>
        <p>بازار پیونددهنده تولیدکنندگان، تأمین‌کنندگان و خریداران؛ از مزرعه تا بازار و سفره.</p>
        <Link href="/partners" className="market-home-footer-join">همکاری با ساری‌چین <FontAwesomeIcon icon={faArrowLeft}/></Link>
      </div>
      <div className="market-home-footer-col"><h3>بازار محصولات</h3>
        <Link href="/categories">همه محصولات</Link><Link href="/categories">دسته‌بندی‌ها</Link><Link href="/suppliers">تأمین‌کنندگان</Link><Link href="/pilot">سبد خرید هفتگی</Link>
      </div>
      <div className="market-home-footer-col"><h3>همکاری با ما</h3>
        <Link href="/partners">ثبت‌نام و ورود همکاران</Link><Link href="/suppliers">دفترچه تأمین‌کنندگان</Link><Link href="/categories">راهکارهای ساری‌چین</Link>
      </div>
      <div className="market-home-footer-col"><h3>راهنما و پشتیبانی</h3>
        <Link href="/pilot">راهنمای خرید و سفارش</Link><Link href="/partners">همکاری و ارتباط با ساری‌چین</Link>
      </div>
    </div>
    <div className="market-home-footer-bottom"><div className="market-home-shell">
      <span>© ساری‌چین · بازار زنجیره تأمین محصولات کشاورزی</span>
      <span>از تولیدکننده تا مصرف‌کننده</span>
    </div></div>
  </footer>;
}

async function readHomeSlides() {
  try {
    const url = new URL('/web/home-slides', process.env.BACKEND_URL || 'http://127.0.0.1:3001');
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(2500) });
    if (!response.ok) return [];
    const slides = await response.json();
    return Array.isArray(slides) ? slides.filter(slide => slide && slide.isActive !== false && slide.imageUrl && slide.title) : [];
  } catch {
    return [];
  }
}

export const metadata = { description: 'بازار چندفروشندگی ساری‌چین برای خرید محصولات و نهاده‌های کشاورزی از تولیدکنندگان.' };

export default async function HomePage() {
  const jar = await cookies();
  const token = jar.get(partnerSessionCookie)?.value;
  const [catalogData, slides, accountCart, weeklyBasket, accountMenu] = await Promise.all([
    readCatalog('home'),
    readHomeSlides(),
    token ? readAccountCart(token) : null,
    token ? readAccountWeeklyBasket(token) : null,
    token ? readAccountMenu(token) : null,
  ]);
  const initialCart = parseCart(jar.get(cartCookie)?.value);
  return <div className="market-home">
    <HomeHeader catalogData={catalogData} initialCart={initialCart} accountCart={accountCart} accountMenu={accountMenu} />
    <main className="market-home-shell">
      <HomeHeroCarousel slides={slides} />
      <div className="market-home-paths">
        <WeeklyBasket basket={weeklyBasket} catalog={catalogData.catalog} />
        <AccountSection profile={accountMenu?.profile} />
      </div>
      <Suspense fallback={<p className="market-home-catalog-loading" role="status">در حال دریافت کاتالوگ…</p>}><HomeCatalog catalogData={catalogData} /></Suspense>
    </main>
    <HomeFooter />
  </div>;
}
