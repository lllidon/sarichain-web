'use client';

import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faChevronLeft, faChevronRight, faMagnifyingGlass, faMinus, faPlus, faSeedling, faSliders } from '@fortawesome/free-solid-svg-icons';
import { useCatalog } from './CatalogProvider';
import { categoryContains, cheapestVariant, normalizeCatalogSearch as normalize, productImage, productHref } from './catalog';
import ProductPurchase from './ProductPurchase';
import ProductWeeklyToggle from './ProductWeeklyToggle';
import './CategoriesPage.css';

const pageSize = 12;
const number = new Intl.NumberFormat('fa-IR');

function paginationItems(current, total) {
  if (total <= 5) return Array.from({ length: total }, (_, index) => index + 1);
  if (current <= 3) return [1, 2, 3, 4, 'ellipsis-end', total];
  if (current >= total - 2) return [1, 'ellipsis-start', total - 3, total - 2, total - 1, total];
  return [1, 'ellipsis-start', current - 1, current, current + 1, 'ellipsis-end', total];
}

function CategoryTreeItem({ node, depth = 0, expandedPath, selected, counts, onSelect, onToggle }) {
  const isExpanded = expandedPath[depth] === node.id;
  const hasChildren = node.children.length > 0;
  const nextPath = [...expandedPath.slice(0, depth), node.id];
  return (
    <li className={`catalog-category-node depth-${depth}`}>
      <div className={selected === node.id ? 'catalog-category-row is-selected' : 'catalog-category-row'}>
        {hasChildren ? <button type="button" className="catalog-category-expand" aria-label={isExpanded ? 'بستن زیرمجموعه‌ها' : 'باز کردن زیرمجموعه‌ها'}
          aria-expanded={isExpanded} onClick={() => onToggle(nextPath)}><FontAwesomeIcon icon={isExpanded ? faMinus : faPlus} /></button>
          : <span className="catalog-category-expand-placeholder" aria-hidden="true" />}
        <label><input type="radio" name="catalog-category" checked={selected === node.id} onChange={() => onSelect(node, nextPath)} /><span>{node.name}</span></label>
        <small>{counts.get(node.id) || 0}</small>
      </div>
      {hasChildren && isExpanded && <ul className="catalog-category-children">{node.children.map(child =>
        <CategoryTreeItem key={child.id} node={child} depth={depth + 1} expandedPath={expandedPath} selected={selected}
          counts={counts} onSelect={onSelect} onToggle={onToggle} />)}</ul>}
    </li>
  );
}

function makeCategoryTree(categories) {
  const nodes = Object.entries(categories).map(([id, category]) => ({ id, ...category, children: [] }));
  const byId = new Map(nodes.map(node => [node.id, node]));
  const roots = [];
  for (const node of nodes) { const parent = node.parentId ? byId.get(String(node.parentId)) : null; if (parent) parent.children.push(node); else roots.push(node); }
  const sort = items => { items.sort((a, b) => a.name.localeCompare(b.name, 'fa')); items.forEach(item => sort(item.children)); };
  sort(roots);
  return roots;
}

function categoryPath(roots, selected) {
  if (!selected || selected === 'all') return [];
  const find = (nodes, path = []) => {
    for (const node of nodes) { const next = [...path, node.id]; if (node.id === selected) return next; const nested = find(node.children, next); if (nested) return nested; }
    return null;
  };
  return find(roots) || [];
}
function CatalogCard({ product, categoryName, onMessage }) {
  const href = productHref(product);

  return (
    <li className="catalog-card">
      <div className="catalog-card-media">
        <Link href={href} className="catalog-card-image-link">
          <Image src={productImage(product)} alt={product.name} width={152} height={152} unoptimized />
        </Link>
        <ProductWeeklyToggle productId={product.listing.id} productIds={[product.id, ...product.variants.map(variant => variant.id)]} productName={product.name} />
      </div>
      <ProductPurchase product={product.listing} className="catalog-card-info" onMessage={onMessage}>
        <p className="catalog-card-category">{[categoryName, product.brand, product.form].filter(Boolean).join(' · ')}</p>
        <h3><Link href={href}>{product.name}</Link></h3>
        <p className="catalog-card-detail">{product.detail}</p>
      </ProductPurchase>
    </li>
  );
}

export default function CategoriesPage({ initialCategory = 'all', initialDetail = '', initialQuery = '', initialBrand = '' }) {
  const { catalog, categories, brands, unavailable: backendUnavailable } = useCatalog();
  const [brand, setBrand] = useState(initialBrand);
  const products = catalog.map(product => ({ ...product, listing: cheapestVariant(product) }));
  const priced = products.filter(product => product.listing.offer);
  const units = [...new Set(products.flatMap(product => [product.unit, ...product.saleUnits.map(option => option.name)]))];
  const lowestPrice = priced.reduce((min, product) => Math.min(min, product.listing.price.min), priced[0]?.listing.price.min ?? 0);
  const highestPrice = priced.reduce((max, product) => Math.max(max, product.listing.price.max), 0);
  const forms = [...new Set(products.map(product => product.form).filter(Boolean))];

  const pricePosition = value => 100 * (value - lowestPrice) / (highestPrice - lowestPrice || 1);
  const withinPriceBounds = value => Math.min(highestPrice, Math.max(lowestPrice, value));
  const categoryTree = useMemo(() => makeCategoryTree(categories), [categories]);
  const [category, setCategory] = useState(initialCategory);
  const [expandedPath, setExpandedPath] = useState(() => categoryPath(categoryTree, initialCategory));
  const categoryCounts = useMemo(() => new Map(Object.keys(categories).map(id => [id, products.filter(product => categoryContains(categories, id, product.category)).length])), [categories, products]);
  const [query, setQuery] = useState(initialQuery);
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
    (!minimum || (product.listing.offer && product.listing.price.max >= Number(minimum))) &&
    (!maximum || (product.listing.offer && product.listing.price.min <= Number(maximum))) &&
    (!form || product.form === form) &&
    (!detail || product.detail === detail) &&
    [product.name, product.code, product.brand, categories[product.category]?.name || 'سایر محصولات'].some(value => normalize(value).includes(search))
  );
  if (sort === 'lowest' || sort === 'highest') {
    const direction = sort === 'lowest' ? 1 : -1;
    results.sort((a, b) => Number(Boolean(b.listing.offer)) - Number(Boolean(a.listing.offer))
      || direction * (a.listing.price.min - b.listing.price.min));
  }

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

  function chooseCategory(id, path = []) {
    changeFilter(setCategory, id);
    setExpandedPath(path);
    setDetail('');
  }

  function toggleCategoryPath(path) {
    setExpandedPath(current => current.length === path.length && current.every((id, index) => id === path[index]) ? path.slice(0, -1) : path);
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
              <fieldset className="catalog-filter-group catalog-category-filter">
                <legend>دسته‌بندی</legend>
                <div className={category === 'all' ? 'catalog-category-row is-selected' : 'catalog-category-row'}>
                  <span className="catalog-category-expand-placeholder" aria-hidden="true" />
                  <label><input type="radio" name="catalog-category" checked={category === 'all'} onChange={() => chooseCategory('all', [])} /><span>همه محصولات</span></label>
                  <small>{number.format(products.length)}</small>
                </div>
                <ul className="catalog-category-tree">
                  {categoryTree.map(node => <CategoryTreeItem key={node.id} node={node} expandedPath={expandedPath} selected={category}
                    counts={categoryCounts} onSelect={(item, path) => chooseCategory(item.id, item.children.length ? path : path.slice(0, -1))}
                    onToggle={toggleCategoryPath} />)}
                </ul>
              </fieldset>

              {category !== 'all' && (
                <div className="catalog-filter-group catalog-detail">
                  <label htmlFor="catalog-detail">{categories[category]?.filter || 'کاربرد'}</label>
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
              <h2>{category === 'all' ? 'همه محصولات' : categories[category]?.name || 'سایر محصولات'}</h2>
              <span role="status">{number.format(results.length)} محصول</span>
            </div>

            <div role="status" className={message ? 'catalog-feedback' : undefined}>{message}</div>

            {results.length > 0 ? (
              <ul className="catalog-grid">
                {visibleProducts.map(product => (
                  <CatalogCard key={product.id} categoryName={categories[product.category]?.name || 'سایر محصولات'} product={product} onMessage={setMessage} />
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
                <button className="catalog-pagination-step" type="button" disabled={page <= 1}
                  aria-label="رفتن به صفحه قبلی" onClick={() => changePage(Math.max(1, page - 1))}>
                  <FontAwesomeIcon icon={faChevronRight} /> قبلی
                </button>
                <div className="catalog-pagination-pages" aria-label="شماره صفحات">
                  {paginationItems(page, pageCount).map(value => typeof value === 'number' ? (
                    <button key={value} className="catalog-pagination-page" type="button"
                      aria-label={`رفتن به صفحه ${number.format(value)}`}
                      aria-current={value === page ? 'page' : undefined} onClick={() => changePage(value)}>
                      {number.format(value)}
                    </button>
                  ) : (
                    <span key={value} className="catalog-pagination-ellipsis" aria-hidden="true">…</span>
                  ))}
                </div>
                <button className="catalog-pagination-step" type="button" disabled={page >= pageCount}
                  aria-label="رفتن به صفحه بعدی" onClick={() => changePage(Math.min(pageCount, page + 1))}>
                  بعدی <FontAwesomeIcon icon={faChevronLeft} />
                </button>
              </nav>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
