'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faMagnifyingGlass, faSeedling, faSliders } from '@fortawesome/free-solid-svg-icons';
import { catalog, categories, productImage } from './catalog';
import './CategoriesPage.css';

const products = catalog.filter(product => product.image);
const categoryOptions = [['all', 'همه محصولات'], ...Object.entries(categories).map(([id, category]) => [id, category.name])];
const number = new Intl.NumberFormat('fa-IR');

function normalize(value) {
  return value.toLowerCase()
    .replace(/ي/g, 'ی').replace(/ك/g, 'ک')
    .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[\s\u200c-]+/g, '');
}

export default function CategoriesPage() {
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [inStock, setInStock] = useState(false);
  const [form, setForm] = useState('');
  const [detail, setDetail] = useState('');
  const [sort, setSort] = useState('default');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const categoryProducts = products.filter(product => category === 'all' || product.category === category);
  const details = [...new Set(categoryProducts.map(product => product.detail))];
  const search = normalize(query);
  const results = categoryProducts.filter(product =>
    (!inStock || product.stock > 0) &&
    (!form || product.form === form) &&
    (!detail || product.detail === detail) &&
    [product.name, product.code, categories[product.category].name].some(value => normalize(value).includes(search))
  );
  if (sort === 'lowest') results.sort((a, b) => a.price - b.price);
  if (sort === 'highest') results.sort((a, b) => b.price - a.price);

  function chooseCategory(id) {
    setCategory(id);
    setDetail('');
  }

  function reset() {
    chooseCategory('all');
    setQuery('');
    setInStock(false);
    setForm('');
    setSort('default');
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
                  <select id="catalog-detail" value={detail} onChange={event => setDetail(event.target.value)}>
                    <option value="">همه گزینه‌ها</option>
                    {details.map(value => <option key={value}>{value}</option>)}
                  </select>
                </div>
              )}

              <fieldset className="catalog-filter-group">
                <legend>شکل محصول</legend>
                {[['', 'همه'], ['مایع', 'مایع'], ['پودری', 'پودری']].map(([value, label]) => (
                  <label key={value}>
                    <input type="radio" name="catalog-form" checked={form === value} onChange={() => setForm(value)} />
                    {label}
                  </label>
                ))}
              </fieldset>

              <div className="catalog-filter-group catalog-stock-filter">
                <label><input type="checkbox" checked={inStock} onChange={event => setInStock(event.target.checked)} /> فقط محصولات موجود</label>
              </div>
            </div>
          </aside>

          <div className="catalog-results">
            <div className="catalog-toolbar">
              <label className="catalog-search">
                <FontAwesomeIcon icon={faMagnifyingGlass} />
                <input type="search" aria-label="جستجوی محصولات" placeholder="جستجو با نام یا کد محصول" value={query} onChange={event => setQuery(event.target.value)} />
              </label>
              <label className="catalog-sort">
                <span>مرتب‌سازی</span>
                <select aria-label="مرتب‌سازی" value={sort} onChange={event => setSort(event.target.value)}>
                  <option value="default">پیش‌فرض</option>
                  <option value="lowest">ارزان‌ترین</option>
                  <option value="highest">گران‌ترین</option>
                </select>
              </label>
            </div>
            <div className="catalog-results-heading">
              <h2>{category === 'all' ? 'همه محصولات' : categories[category].name}</h2>
              <span role="status">{number.format(results.length)} محصول</span>
            </div>

            {results.length > 0 ? (
              <ul className="catalog-grid">
                {results.map(product => (
                  <li key={product.id} className="catalog-card">
                    <div className="catalog-card-media">
                      <Image src={productImage(product)} alt={product.name} width={152} height={152} unoptimized />
                      <span className={product.stock ? 'catalog-stock' : 'catalog-stock is-unavailable'}>
                        {product.stock ? 'موجود' : 'ناموجود'}
                      </span>
                    </div>
                    <div className="catalog-card-info">
                      <p className="catalog-card-category">{categories[product.category].name} · {product.form}</p>
                      <h3>{product.name}</h3>
                      <p className="catalog-card-detail">{product.detail}</p>
                      <div className="catalog-card-price">
                        {product.stock > 0 && (
                          <><strong>{number.format(product.price)}</strong> <small>تومان / {product.unit}</small></>
                        )}
                      </div>
                      {product.stock > 0 ? (
                        <Link className="catalog-order" href={`/quick-order?product=${product.code}`} aria-label={`ثبت سفارش ${product.name}`}>
                          ثبت سفارش <FontAwesomeIcon icon={faArrowLeft} />
                        </Link>
                      ) : <button className="catalog-order" type="button" disabled>ثبت سفارش</button>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="catalog-empty">
                <p>محصولی با این جستجو یا فیلتر پیدا نشد.</p>
                <button type="button" onClick={reset}>نمایش همه محصولات</button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
