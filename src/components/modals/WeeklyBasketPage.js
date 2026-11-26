'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faCalendarDays, faCheck, faChevronDown, faChevronUp,
  faLeaf, faMinus, faPlus, faShoppingBasket, faSparkles, faStar,
  faTag, faTrash, faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';
import { useCatalog } from '../Products/CatalogProvider';
import { productHref, productImage, productPackages } from '../Products/catalog';
import { formatPrice } from '../Products/price';
import { useCartCommands } from './cartStore';
import { useAccountWeeklyBasket } from './AccountWeeklyBasketProvider';
import './cart.css';

const number = new Intl.NumberFormat('fa-IR');

function WeeklyProductCard({ item, selected, onSelect, onQuantity, onRemove, onAddToCart, busy }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const product = item.product;
  const price = product?.price;
  const orderable = Boolean(product?.orderable);
  const packageInfo = product ? productPackages(product)[0] : null;

  return (
    <article className={`weekly-product-card ${selected ? 'is-selected' : ''}`}>
      <div className="weekly-product-media">
        <label className="weekly-select-control">
          <input type="checkbox" checked={selected} onChange={event => onSelect(item.productId, event.target.checked)}
            aria-label={`انتخاب ${product?.name || 'محصول'} برای افزودن به سبد خرید`} />
          <span><FontAwesomeIcon icon={faCheck}/></span>
        </label>
        <Link href={product ? productHref(product) : '/categories'} className="weekly-product-image">
          <Image src={product ? productImage(product) : '/img/catalog/field.webp'}
            alt={product?.name || 'محصول حذف‌شده'} width={260} height={220} unoptimized />
        </Link>
        <span className={`weekly-stock-pill ${orderable ? 'is-available' : 'is-unavailable'}`}>
          {orderable ? 'قابل سفارش' : 'نیازمند بررسی موجودی'}
        </span>
      </div>

      <div className="weekly-product-body">
        <div className="weekly-product-heading">
          <div>
            <p className="weekly-product-eyebrow">{product ? product.categoryName || 'محصول کشاورزی' : 'محصول ناموجود'}</p>
            <h2>{product ? <Link href={productHref(product)}>{product.name}</Link> : 'این محصول دیگر در فهرست محصولات نیست'}</h2>
            <p className="weekly-product-code">کد کالا: {product?.code || item.productId}</p>
          </div>
          <button type="button" className="weekly-product-remove" aria-label="حذف از سبد هفتگی"
            disabled={busy} onClick={() => onRemove(item)}><FontAwesomeIcon icon={faTrash}/></button>
        </div>

        <div className="weekly-product-price">
          <span>قیمت روز</span>
          <strong>{price && orderable ? formatPrice(price) : 'استعلام قیمت'}</strong>
          {product?.offer?.stock > 0 && <small>موجودی فروشنده: {number.format(product.offer.stock)} {product.unit}</small>}
        </div>

        <div className="weekly-product-footer">
          <div className="weekly-product-quantity" aria-label="تعداد موردنیاز">
            <button type="button" aria-label="افزایش تعداد" disabled={busy || item.quantity >= 9999}
              onClick={() => onQuantity(item, item.quantity + 1)}><FontAwesomeIcon icon={faPlus}/></button>
            <output>{number.format(item.quantity)}</output>
            <button type="button" aria-label="کاهش تعداد" disabled={busy}
              onClick={() => onQuantity(item, item.quantity - 1)}><FontAwesomeIcon icon={item.quantity === 1 ? faTrash : faMinus}/></button>
          </div>
          <button type="button" className="weekly-add-single" disabled={busy || !orderable}
            onClick={() => onAddToCart(item)}>
            <FontAwesomeIcon icon={faShoppingBasket}/> افزودن به سبد خرید
          </button>
        </div>

        {product && <>
          <button type="button" className="weekly-details-toggle" aria-expanded={detailsOpen}
            onClick={() => setDetailsOpen(value => !value)}>
            جزئیات و مشخصات محصول <FontAwesomeIcon icon={detailsOpen ? faChevronUp : faChevronDown}/>
          </button>
          {detailsOpen && <div className="weekly-product-details">
            <p>{product.description || product.detail || 'توضیحات تکمیلی برای این محصول ثبت نشده است.'}</p>
            {product.brand && <span>برند: {product.brand}</span>}
            {packageInfo && <span>واحد فروش: {packageInfo.name}</span>}
            {product.options?.length > 0 && product.options.map(option =>
              <span key={option.name}>{option.name}: {option.value}</span>)}
          </div>}
        </>}
      </div>
    </article>
  );
}

export default function WeeklyBasketPage() {
  const { catalog, categories } = useCatalog();
  const weekly = useAccountWeeklyBasket();
  const commands = useCartCommands();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const products = useMemo(() => catalog.flatMap(product => [
    { ...product, categoryName: categories[product.category]?.name || '' },
    ...(product.variants || []).map(variant => ({
      ...variant, categoryName: categories[variant.category]?.name || categories[product.category]?.name || '',
    })),
  ]), [catalog, categories]);

  const items = (weekly?.items || []).map(line => ({
    ...line, product: products.find(product => product.id === line.productId),
  }));
  const orderableItems = items.filter(item => item.product?.orderable);
  const selectedItems = items.filter(item => selectedIds.includes(item.productId));
  const selectedOrderable = selectedItems.filter(item => item.product?.orderable);
  const readyCount = orderableItems.length;
  const unavailableCount = items.length - readyCount;

  function selectOne(productId, checked) {
    setSelectedIds(current => checked
      ? [...new Set([...current, productId])]
      : current.filter(id => id !== productId));
  }

  function selectAll(checked) {
    setSelectedIds(checked ? orderableItems.map(item => item.productId) : []);
  }

  async function change(item, quantity) {
    setBusy(item.productId);
    setMessage('');
    try {
      if (quantity <= 0) {
        await weekly.remove(item.productId);
        setSelectedIds(current => current.filter(id => id !== item.productId));
      } else await weekly.set(item.productId, quantity);
    } catch (error) {
      setMessage(error.message || 'تغییر سبد هفتگی انجام نشد.');
    } finally {
      setBusy('');
    }
  }

  async function remove(item) {
    await change(item, 0);
  }

  async function clear() {
    setBusy('all');
    setMessage('');
    try {
      await weekly.clear();
      setSelectedIds([]);
    } catch (error) {
      setMessage(error.message || 'خالی کردن سبد هفتگی انجام نشد.');
    } finally {
      setBusy('');
    }
  }

  async function addToCart(item) {
    if (!item.product?.orderable) return;
    setBusy(item.productId);
    setMessage('');
    try {
      const pack = productPackages(item.product)[0];
      for (let i = 0; i < item.quantity; i++) {
        const result = await commands.add(item.product, pack);
        if (result === false) throw new Error(`افزودن ${item.product.name} به دلیل محدودیت موجودی انجام نشد.`);
      }
      setMessage(`${item.product.name} به تعداد ${number.format(item.quantity)} به سبد خرید اضافه شد.`);
    } catch (error) {
      setMessage(error.message || 'افزودن محصول به سبد خرید انجام نشد.');
    } finally {
      setBusy('');
    }
  }

  async function addSelected() {
    if (!selectedOrderable.length) return;
    setBusy('selected');
    setMessage('');
    let added = 0;
    let skipped = selectedItems.length - selectedOrderable.length;
    try {
      for (const item of selectedOrderable) {
        const pack = productPackages(item.product)[0];
        for (let i = 0; i < item.quantity; i++) {
          const result = await commands.add(item.product, pack);
          if (result === false) throw new Error(`افزودن ${item.product.name} به دلیل محدودیت موجودی متوقف شد.`);
        }
        added++;
      }
      setMessage(`${number.format(added)} محصول به سبد خرید اضافه شد.${skipped ? ` ${number.format(skipped)} محصول به دلیل وضعیت موجودی منتقل نشد.` : ''}`);
    } catch (error) {
      setMessage(error.message || 'انتقال محصولات کامل نشد.');
    } finally {
      setBusy('');
    }
  }

  if (!weekly) return <div className="weekly-page" dir="rtl">
    <header className="weekly-header"><div><h1><FontAwesomeIcon icon={faCalendarDays}/> سبد هفتگی من</h1>
      <p>فهرست هوشمند خریدهای هفتگی شما</p></div></header>
    <section className="weekly-empty"><FontAwesomeIcon icon={faCalendarDays}/>
      <h2>برای استفاده از سبد هفتگی وارد حساب شوید</h2>
      <p>سبد هفتگی به حساب کاربری شما متصل است و در مراجعات بعدی باقی می‌ماند.</p>
      <Link className="checkout-submit" href="/login?returnTo=%2Fweekly-basket">ورود به حساب</Link>
    </section>
  </div>;

  return <div className="weekly-page weekly-storefront" dir="rtl">
    <nav className="weekly-breadcrumb" aria-label="مسیر صفحه">
      <Link href="/">صفحه اصلی</Link><span>/</span><span>سبد هفتگی من</span>
    </nav>

    <section className="weekly-hero">
      <div className="weekly-hero-copy">
        <span><FontAwesomeIcon icon={faCalendarDays}/> برنامه‌ریزی خرید</span>
        <h1>سبد هفتگی من</h1>
        <p>محصولات موردنیازت را بررسی کن، قیمت روز را ببین و خریدت را یک‌جا انجام بده.</p>
        <div className="weekly-hero-stats">
          <div><strong>{number.format(items.length)}</strong><span>قلم محصول</span></div>
          <div><strong>{number.format(readyCount)}</strong><span>آماده سفارش</span></div>
          <div><strong>{number.format(unavailableCount)}</strong><span>نیازمند بررسی</span></div>
        </div>
      </div>
      <div className="weekly-hero-art"><FontAwesomeIcon icon={faShoppingBasket}/><span>خرید هفتگی، ساده‌تر از همیشه</span></div>
    </section>

    <section className="weekly-suggestion-section" aria-label="پیشنهادهای خرید">
      <div className="weekly-section-heading"><div><span>انتخاب هوشمند</span><h2>پیشنهادهای خرید</h2></div>
        <p>پیشنهادهای روز، فصل و محصولات ویژه را در این بخش دنبال کن.</p></div>
      <div className="weekly-suggestion-grid">
        <article className="weekly-suggestion-card daily">
          <span className="weekly-suggestion-icon"><FontAwesomeIcon icon={faWandMagicSparkles}/></span>
          <div><small>بر اساس موجودی فعلی</small><h3>پیشنهاد روز</h3><p>{number.format(readyCount)} محصول از فهرست شما در حال حاضر آماده سفارش است.</p></div>
          <a href="#weekly-products">مشاهده محصولات <FontAwesomeIcon icon={faArrowLeft}/></a>
        </article>
        <article className="weekly-suggestion-card seasonal">
          <span className="weekly-suggestion-icon"><FontAwesomeIcon icon={faLeaf}/></span>
          <div><small>متناسب با زمان کشت</small><h3>پیشنهادهای فصلی</h3><p>محصولات متناسب با فصل و نیاز کشت را در این بخش دنبال کنید.</p></div>
          <span className="weekly-coming-soon">به‌زودی</span>
        </article>
        <article className="weekly-suggestion-card special">
          <span className="weekly-suggestion-icon"><FontAwesomeIcon icon={faStar}/></span>
          <div><small>فرصت‌های منتخب</small><h3>پیشنهادهای ویژه</h3><p>منتخب پیشنهادها و فرصت‌های خرید ویژه در این قسمت نمایش داده می‌شود.</p></div>
          <span className="weekly-coming-soon">به‌زودی</span>
        </article>
      </div>
    </section>

    {message && <p className="weekly-status weekly-store-status" role="status">{message}</p>}
    {weekly.failed && <p className="checkout-warning" role="alert">ارتباط با سبد هفتگی برقرار نشد. صفحه را تازه‌سازی کنید.</p>}

    <section id="weekly-products" className="weekly-products-section">
      <div className="weekly-section-heading weekly-products-heading">
        <div><span>فهرست شخصی شما</span><h2>محصولات سبد هفتگی</h2></div>
        <div className="weekly-list-actions">
          <Link className="weekly-action-link" href="/categories">مشاهده همه محصولات <FontAwesomeIcon icon={faArrowLeft}/></Link>
          {!!items.length && <button type="button" className="weekly-clear" disabled={!!busy || weekly.pending} onClick={clear}>
            <FontAwesomeIcon icon={faTrash}/> خالی کردن سبد
          </button>}
        </div>
      </div>

      {!!items.length && <div className="weekly-bulk-toolbar">
        <label><input type="checkbox" checked={orderableItems.length > 0 && selectedOrderable.length === orderableItems.length}
          onChange={event => selectAll(event.target.checked)}/> انتخاب همه محصولات قابل سفارش</label>
        <span>{number.format(selectedIds.length)} محصول انتخاب شده</span>
        <button type="button" disabled={!selectedOrderable.length || !!busy || weekly.pending} onClick={addSelected}>
          <FontAwesomeIcon icon={faShoppingBasket}/> افزودن انتخاب‌شده‌ها به سبد خرید
        </button>
      </div>}

      {items.length ? <div className="weekly-product-grid">
        {items.map(item => <WeeklyProductCard key={item.productId} item={item}
          selected={selectedIds.includes(item.productId)} onSelect={selectOne} onQuantity={change}
          onRemove={remove} onAddToCart={addToCart} busy={Boolean(busy) || weekly.pending}/>)}
      </div> : <section className="weekly-empty">
        <FontAwesomeIcon icon={faShoppingBasket}/>
        <h2>سبد هفتگی شما خالی است</h2>
        <p>از صفحه محصولات، با آیکون سبد هفتگی هر کالا را به فهرست خود اضافه کنید.</p>
        <Link className="checkout-submit" href="/categories">مشاهده محصولات</Link>
      </section>}
    </section>
  </div>;
}
