'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faMagnifyingGlass, faSeedling, faSliders } from '@fortawesome/free-solid-svg-icons';
import { useCatalog } from './CatalogProvider';
import { categoryContains, productImage, productHref } from './catalog';
import ProductPurchase from './ProductPurchase';
import './CategoriesPage.css';

const pageSize = 12;
const number = new Intl.NumberFormat('fa-IR');

function normalize(value) {
  return value.toLowerCase()
    .replace(/ي/g, 'ی').replace(/ك/g, 'ک')
    .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[\s\u200c-]+/g, '');
}

function CatalogCard({ product, categoryName, onMessage }) {
  const href = productHref(product);

  return (
    <li className="catalog-card">
      <div className="catalog-card-media">
        <Link href={href} className="catalog-card-image-link">
          <Image src={productImage(product)} alt={product.name} width={152} height={152} unoptimized />
        </Link>
      </div>
      <ProductPurchase product={product} className="catalog-card-info" onMessage={onMessage}>
        <p className="catalog-card-category">{[categoryName, product.brand, product.form].filter(Boolean).join(' · ')}</p>
        <h3><Link href={href}>{product.name}</Link></h3>
        <p className="catalog-card-detail">{product.detail}</p>
      </ProductPurchase>
    </li>
  );
}

export default function CategoriesPage({ initialCategory = 'all', initialDetail = '' }) {
  const { catalog, categories, brands, unavailable: backendUnavailable } = useCatalog();
  const [brand, setBrand] = useState('');
  const products = catalog;
  const units = [...new Set(products.flatMap(product => [product.unit, ...product.saleUnits.map(option => option.name)]))];
  const lowestPrice = products.reduce((min, product) => Math.min(min, product.price.min), products[0]?.price.min ?? 0);
  const highestPrice = products.reduce((max, product) => Math.max(max, product.price.max), 0);
  const forms = [...new Set(products.map(product => product.form).filter(Boolean))];

  const pricePosition = value => 100 * (value - lowestPrice) / (highestPrice - lowestPrice || 1);
  const withinPriceBounds = value => Math.min(highestPrice, Math.max(lowestPrice, value));
  const categoryOptions = [['all', 'همه محصولات'], ...Object.entries(categories).map(([id, category]) => [id, category.name])];
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState('');
  const [unit, setUnit] = useState('');
  const [minimum, setMinimum] = useState('');
  const [maximum, setMaximum] = useState('');
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState('');
  const resultsHeading = useRef(null);
  const [form, setForm] = useState('');
  const [detail, setDetail] = useState(initialDetail);
  const [sort, setSort] = useState('default');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categoryProducts = products.filter(product => category === 'all' || categoryContains(categories, category, product.category));
  const details = [...new Set(categoryProducts.map(product => product.detail))];
  const search = normalize(query);
  const invalidPrice = minimum !== '' && maximum !== '' && Number(minimum) > Number(maximum);
  const results = categoryProducts.filter(product =>
    !invalidPrice &&
    (!brand || product.brandId === brand) &&
    (!unit || product.unit === unit || product.saleUnits.some(option => option.name === unit)) &&
    (!minimum || product.price.max >= Number(minimum)) &&
    (!maximum || product.price.min <= Number(maximum)) &&
    (!form || product.form === form) &&
    (!detail || product.detail === detail) &&
    [product.name, product.code, product.brand, categories[product.category].name].some(value => normalize(value).includes(search))
  );
  if (sort === 'lowest') results.sort((a, b) => a.price.min - b.price.min || a.price.max - b.price.max);
  if (sort === 'highest') results.sort((a, b) => b.price.max - a.price.max || b.price.min - a.price.min);

  const pageCount = Math.ceil(results.length / pageSize);
  const visibleProducts = results.slice((page - 1) * pageSize, page * pageSize);

  const sliderMaximum = withinPriceBounds(Number(maximum || highestPrice));
  const sliderMinimum = Math.min(sliderMaximum, withinPriceBounds(Number(minimum || lowestPrice)));

  function changeFilter(setter, value) {
    setter(value);
    setPage(1);
    setMessage('');
  }

  function changePrice(setter, value) {
    const input = normalize(value).replace(/٫/g, '.').replace(/[٬,]/g, '');
    if (/^\d{0,7}(?:\.\d{0,6})?$/.test(input) && input !== '.') changeFilter(setter, input);
  }

  function chooseCategory(id) {
    changeFilter(setCategory, id);
    setDetail('');
  }

  function reset() {
    chooseCategory('all');
    setQuery('');
    setBrand('');
    setUnit('');
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

              <div className="catalog-filter-group catalog-detail">
                <label htmlFor="catalog-brand">برند</label>
                <select id="catalog-brand" value={brand} onChange={event => changeFilter(setBrand, event.target.value)}>
                  <option value="">همه برندها</option>
                  {brands.map(item => <option key={item._id} value={item._id}>{item.name}</option>)}
                </select>
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
                {[['', 'همه'], ...forms.map(value => [value, value])].map(([value, label]) => (
                  <label key={value}>
                    <input type="radio" name="catalog-form" checked={form === value} onChange={() => changeFilter(setForm, value)} />
                    {label}
                  </label>
                ))}
              </fieldset>

              <fieldset className="catalog-filter-group">
                <legend>بازهٔ قیمت (کارسا)</legend>
                <div className="catalog-price-slider" dir="ltr" style={{
                  '--price-start': `${pricePosition(sliderMinimum)}%`,
                  '--price-end': `${pricePosition(sliderMaximum)}%`,
                }}>
                  <input type="range" min={lowestPrice} max={highestPrice} step="0.000001" disabled={lowestPrice === highestPrice} value={sliderMinimum}
                    className={sliderMinimum === highestPrice ? 'is-uppermost' : undefined}
                    aria-label="انتخاب حداقل قیمت" aria-valuetext={`${number.format(sliderMinimum)} کارسا`}
                    onChange={event => changeFilter(setMinimum, String(Math.min(Number(event.target.value), sliderMaximum)))} />
                  <input type="range" min={lowestPrice} max={highestPrice} step="0.000001" disabled={lowestPrice === highestPrice} value={sliderMaximum}
                    aria-label="انتخاب حداکثر قیمت" aria-valuetext={`${number.format(sliderMaximum)} کارسا`}
                    onChange={event => changeFilter(setMaximum, String(Math.max(Number(event.target.value), sliderMinimum)))} />
                </div>
                <div className="catalog-price-range">
                  <label>از<input inputMode="decimal" value={minimum} placeholder="حداقل" aria-invalid={invalidPrice}
                    onChange={event => changePrice(setMinimum, event.target.value)} /></label>
                  <label>تا<input inputMode="decimal" value={maximum} placeholder="حداکثر" aria-invalid={invalidPrice}
                    onChange={event => changePrice(setMaximum, event.target.value)} /></label>
                </div>
                {invalidPrice && <p role="alert">حداکثر باید برابر یا بیشتر از حداقل باشد.</p>}
              </fieldset>
              <div className="catalog-filter-group catalog-detail">
                <label htmlFor="catalog-unit">واحد فروش</label>
                <select id="catalog-unit" value={unit} onChange={event => changeFilter(setUnit, event.target.value)}>
                  <option value="">همه واحدهای فروش</option>
                  {units.map(value => <option key={value} value={value}>{value}</option>)}
                </select>
              </div>
            </div>
          </aside>

          <div className="catalog-results">
            {backendUnavailable && <p role="alert">ارتباط با کاتالوگ بک‌اند برقرار نشد.</p>}
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
                  <CatalogCard key={product.id} categoryName={categories[product.category].name} product={product} onMessage={setMessage} />
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
    </div>
  );
}
