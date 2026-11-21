'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faMagnifyingGlass, faSeedling, faSliders, faBasketShopping } from '@fortawesome/free-solid-svg-icons';
import { catalog, categories, productImage, productPackages } from './catalog';
import { addCatalogItem } from '../modals/cartStore';
import './CategoriesPage.css';

const products = catalog.filter(product => product.image).map(product => ({
  ...product,
  packages: productPackages(product),
}));
const packageOptions = new Map(products.flatMap(product => product.packages.map(pack => [pack.id, pack.name])));
const pageSize = 12;
const lowestPrice = Math.min(...products.map(product => product.price));
const highestPrice = Math.max(...products.map(product => product.price));

const pricePosition = value => 100 * (value - lowestPrice) / Math.max(1, highestPrice - lowestPrice);
const withinPriceBounds = value => Math.min(highestPrice, Math.max(lowestPrice, value));
const categoryOptions = [['all', 'همه محصولات'], ...Object.entries(categories).map(([id, category]) => [id, category.name])];
const number = new Intl.NumberFormat('fa-IR');

function normalize(value) {
  return value.toLowerCase()
    .replace(/ي/g, 'ی').replace(/ك/g, 'ک')
    .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[\s\u200c-]+/g, '');
}

function CatalogCard({ product, onRequest, onMessage }) {
  const [packId, setPackId] = useState('');
  const pack = product.packages.find(pack => pack.id === packId);

  function addToCart(event) {
    event.preventDefault();
    if (!pack) return;
    const added = addCatalogItem(product, pack);
    onMessage(added
      ? `${pack.name} ${product.name} به سبد خرید اضافه شد.`
      : 'مقدار این بسته بیشتر از موجودی قابل خرید است.');
  }

  return (
    <li className="catalog-card">
      <div className="catalog-card-media">
        <Image src={productImage(product)} alt={product.name} width={152} height={152} unoptimized />
        {product.stock === 0 && <span className="catalog-stock is-unavailable">ناموجود</span>}
      </div>
      <form className="catalog-card-info" onSubmit={addToCart}>
        <p className="catalog-card-category">{categories[product.category].name} · {product.form}</p>
        <h3>{product.name}</h3>
        <p className="catalog-card-detail">{product.detail}</p>
        {product.stock > 0 && (
          <>
            <select className="catalog-package-choice" required value={packId}
              aria-label={`واحد خرید ${product.name}`} onChange={event => setPackId(event.target.value)}>
              <option value="">انتخاب واحد خرید</option>
              {product.packages.map(option => (
                <option key={option.id} value={option.id} disabled={option.amount > product.stock}>
                  {option.name} {number.format(option.amount)} {product.unit}
                </option>
              ))}
            </select>
            <div className="catalog-card-price">
              <strong>{number.format(pack?.price ?? product.price)}</strong>{' '}
              <small>تومان / {pack?.name ?? product.unit}</small>
            </div>
          </>
        )}
        {product.stock > 0 ? (
          <button className="catalog-order" type="submit" disabled={!pack} aria-label={`افزودن به سبد خرید ${product.name}`}>
            افزودن به سبد خرید <FontAwesomeIcon icon={faBasketShopping} />
          </button>
        ) : (
          <button className="catalog-order catalog-request" type="button" onClick={() => onRequest(product)}
            aria-label={`ثبت سفارش ${product.name}`}>ثبت سفارش</button>
        )}
      </form>
    </li>
  );
}

export default function CategoriesPage({ initialCategory = 'all', initialDetail = '' }) {
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  const [packaging, setPackaging] = useState('');
  const [minimum, setMinimum] = useState('');
  const [maximum, setMaximum] = useState('');
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState('');
  const [requested, setRequested] = useState(null);
  const requestDialog = useRef(null);
  const resultsHeading = useRef(null);
  const [form, setForm] = useState('');
  const [detail, setDetail] = useState(initialDetail);
  const [sort, setSort] = useState('default');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categoryProducts = products.filter(product => category === 'all' || product.category === category);
  const details = [...new Set(categoryProducts.map(product => product.detail))];
  const search = normalize(query);
  const results = categoryProducts.filter(product =>
    (unavailable ? product.stock === 0 : product.stock > 0) &&
    (!packaging || product.packages.some(pack => pack.id === packaging)) &&
    (!minimum || product.price >= Number(minimum)) &&
    (!maximum || product.price <= Number(maximum)) &&
    (!form || product.form === form) &&
    (!detail || product.detail === detail) &&
    [product.name, product.code, categories[product.category].name].some(value => normalize(value).includes(search))
  );
  if (sort === 'lowest') results.sort((a, b) => a.price - b.price);
  if (sort === 'highest') results.sort((a, b) => b.price - a.price);

  const pageCount = Math.ceil(results.length / pageSize);
  const visibleProducts = results.slice((page - 1) * pageSize, page * pageSize);
  const invalidPrice = minimum !== '' && maximum !== '' && Number(minimum) > Number(maximum);
  const sliderMaximum = withinPriceBounds(Number(maximum || highestPrice));
  const sliderMinimum = Math.min(sliderMaximum, withinPriceBounds(Number(minimum || lowestPrice)));

  function changeFilter(setter, value) {
    setter(value);
    setPage(1);
    setMessage('');
  }

  function changePrice(setter, value) {
    changeFilter(setter, normalize(value).replace(/[^0-9]/g, '').slice(0, 9));
  }

  function chooseCategory(id) {
    changeFilter(setCategory, id);
    setDetail('');
  }

  function reset() {
    chooseCategory('all');
    setQuery('');
    setUnavailable(false);
    setPackaging('');
    setMinimum('');
    setMaximum('');
    setForm('');
    setSort('default');
  }

  function changePage(nextPage) {
    setPage(nextPage);
    setMessage('');
    resultsHeading.current.focus();
    resultsHeading.current.scrollIntoView({ block: 'start' });
  }

  function requestOrder(product) {
    setRequested(product);
    requestDialog.current.showModal();
  }

  function confirmRequest(event) {
    event.preventDefault();
    const key = `sarichain-preorder-${requested.code}`;
    try {
      window.localStorage.setItem(key, new Date().toISOString());
      setMessage(`درخواست آزمایشی سفارش ${requested.name} در این مرورگر ثبت شد.`);
    } catch {
      setMessage('ذخیره درخواست در این مرورگر امکان‌پذیر نیست.');
    }
    requestDialog.current.close();
  }

  return (
    <div className="catalog-page">
      <div className="catalog-wrap">
        <nav className="catalog-breadcrumb" aria-label="مسیر صفحه">
          <Link href="/">صفحه اصلی</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">محصولات</span>
        </nav>

        <section className="catalog-hero" aria-labelledby="catalog-title">
          <Image src="/img/catalog/field.webp" alt="" fill preload unoptimized />
          <div className="catalog-hero-content">
            <span className="catalog-hero-label"><FontAwesomeIcon icon={faSeedling} /> نهاده‌های کشاورزی</span>
            <h1 id="catalog-title">محصولات کشاورزی</h1>
            <p>نهاده مناسب برای تغذیه گیاه و مراقبت از خاک را پیدا کنید.</p>
            <a href="#catalog-products">مشاهده محصولات <FontAwesomeIcon icon={faArrowLeft} /></a>
          </div>
        </section>

        <section id="catalog-products" className="catalog-workspace" aria-label="فهرست محصولات">
          <aside className="catalog-sidebar">
            <button className="catalog-mobile-toggle" type="button" aria-expanded={filtersOpen} aria-controls="catalog-filters" onClick={() => setFiltersOpen(!filtersOpen)}>
              <span><FontAwesomeIcon icon={faSliders} /> فیلتر محصولات</span>
              <span aria-hidden="true">{filtersOpen ? '−' : '+'}</span>
            </button>
            <div id="catalog-filters" className={filtersOpen ? 'catalog-filters is-open' : 'catalog-filters'}>
              <div className="catalog-filter-heading">
                <h2><FontAwesomeIcon icon={faSliders} /> فیلتر محصولات</h2>
                <button type="button" onClick={reset}>پاک کردن</button>
              </div>

              <fieldset className="catalog-filter-group">
                <legend>دسته‌بندی</legend>
                {categoryOptions.map(([id, label]) => (
                  <label key={id} className={category === id ? 'is-selected' : ''}>
                    <input type="radio" name="catalog-category" checked={category === id} onChange={() => chooseCategory(id)} />
                    <span>{label}</span>
                    <small>{number.format(id === 'all' ? products.length : products.filter(product => product.category === id).length)}</small>
                  </label>
                ))}
              </fieldset>

              {category !== 'all' && (
                <div className="catalog-filter-group catalog-detail">
                  <label htmlFor="catalog-detail">{categories[category].filter}</label>
                  <select id="catalog-detail" value={detail} onChange={event => changeFilter(setDetail, event.target.value)}>
                    <option value="">همه گزینه‌ها</option>
                    {details.map(value => <option key={value}>{value}</option>)}
                  </select>
                </div>
              )}

              <fieldset className="catalog-filter-group">
                <legend>شکل محصول</legend>
                {[['', 'همه'], ['مایع', 'مایع'], ['پودری', 'پودری']].map(([value, label]) => (
                  <label key={value}>
                    <input type="radio" name="catalog-form" checked={form === value} onChange={() => changeFilter(setForm, value)} />
                    {label}
                  </label>
                ))}
              </fieldset>

              <fieldset className="catalog-filter-group">
                <legend>قیمت پایه (تومان)</legend>
                <div className="catalog-price-slider" dir="ltr" style={{
                  '--price-start': `${pricePosition(sliderMinimum)}%`,
                  '--price-end': `${pricePosition(sliderMaximum)}%`,
                }}>
                  <input type="range" min={lowestPrice} max={highestPrice} value={sliderMinimum}
                    className={sliderMinimum === highestPrice ? 'is-uppermost' : undefined}
                    aria-label="انتخاب حداقل قیمت پایه" aria-valuetext={`${number.format(sliderMinimum)} تومان`}
                    onChange={event => changeFilter(setMinimum, String(Math.min(Number(event.target.value), sliderMaximum)))} />
                  <input type="range" min={lowestPrice} max={highestPrice} value={sliderMaximum}
                    aria-label="انتخاب حداکثر قیمت پایه" aria-valuetext={`${number.format(sliderMaximum)} تومان`}
                    onChange={event => changeFilter(setMaximum, String(Math.max(Number(event.target.value), sliderMinimum)))} />
                </div>
                <div className="catalog-price-range">
                  <label>از<input inputMode="numeric" value={minimum} placeholder="حداقل" aria-invalid={invalidPrice}
                    onChange={event => changePrice(setMinimum, event.target.value)} /></label>
                  <label>تا<input inputMode="numeric" value={maximum} placeholder="حداکثر" aria-invalid={invalidPrice}
                    onChange={event => changePrice(setMaximum, event.target.value)} /></label>
                </div>
                {invalidPrice && <p role="alert">حداکثر باید برابر یا بیشتر از حداقل باشد.</p>}
              </fieldset>
              <div className="catalog-filter-group catalog-detail">
                <label htmlFor="catalog-packaging">نوع بسته‌بندی</label>
                <select id="catalog-packaging" value={packaging} onChange={event => changeFilter(setPackaging, event.target.value)}>
                  <option value="">همه بسته‌بندی‌ها</option>
                  {[...packageOptions].map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>
              </div>
              <fieldset className="catalog-filter-group">
                <legend>وضعیت کالا</legend>
                <label className="catalog-status-option">
                  <span className={unavailable ? 'catalog-status-text is-unavailable' : 'catalog-status-text'}>
                    {unavailable ? 'ناموجود' : 'موجود'}
                  </span>
                  <input type="checkbox" role="switch" className="catalog-switch"
                    aria-label="نمایش کالاهای ناموجود" checked={unavailable}
                    onChange={event => changeFilter(setUnavailable, event.target.checked)} />
                </label>
              </fieldset>
            </div>
          </aside>

          <div className="catalog-results">
            <div className="catalog-toolbar">
              <label className="catalog-search">
                <FontAwesomeIcon icon={faMagnifyingGlass} />
                <input type="search" aria-label="جستجوی محصولات" placeholder="جستجو با نام یا کد محصول" value={query} onChange={event => changeFilter(setQuery, event.target.value)} />
              </label>
              <label className="catalog-sort">
                <span>مرتب‌سازی</span>
                <select aria-label="مرتب‌سازی" value={sort} onChange={event => changeFilter(setSort, event.target.value)}>
                  <option value="default">پیش‌فرض</option>
                  <option value="lowest">ارزان‌ترین</option>
                  <option value="highest">گران‌ترین</option>
                </select>
              </label>
            </div>
            <div className="catalog-results-heading" ref={resultsHeading} tabIndex={-1}>
              <h2>{category === 'all' ? 'همه محصولات' : categories[category].name}</h2>
              <span role="status">{number.format(results.length)} محصول</span>
            </div>

            <div role="status" className={message ? 'catalog-feedback' : undefined}>{message}</div>

            {results.length > 0 ? (
              <ul className="catalog-grid">
                {visibleProducts.map(product => (
                  <CatalogCard key={product.id} product={product} onRequest={requestOrder} onMessage={setMessage} />
                ))}
              </ul>
            ) : (
              <div className="catalog-empty">
                <p>محصولی با این جستجو یا فیلتر پیدا نشد.</p>
                <button type="button" onClick={reset}>نمایش همه محصولات</button>
              </div>
            )}
            {pageCount > 1 && (
              <nav className="catalog-pagination" aria-label="صفحه‌بندی محصولات">
                <button type="button" disabled={page === 1} onClick={() => changePage(page - 1)}>قبلی</button>
                {Array.from({ length: pageCount }, (_, index) => index + 1).map(value => (
                  <button key={value} type="button" aria-label={`صفحه ${number.format(value)}`}
                    aria-current={value === page ? 'page' : undefined} onClick={() => changePage(value)}>
                    {number.format(value)}
                  </button>
                ))}
                <button type="button" disabled={page === pageCount} onClick={() => changePage(page + 1)}>بعدی</button>
              </nav>
            )}
          </div>
        </section>
      </div>
      <dialog ref={requestDialog} className="catalog-request-dialog" aria-labelledby="catalog-request-title">
        <form onSubmit={confirmRequest}>
          <h2 id="catalog-request-title">درخواست سفارش {requested?.name}</h2>
          <p>این محصول ناموجود است. درخواست آزمایشی در همین مرورگر ذخیره می‌شود.</p>
          <div>
            <button type="button" onClick={() => requestDialog.current.close()}>انصراف</button>
            <button type="submit">ثبت درخواست</button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
