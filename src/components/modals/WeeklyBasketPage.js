'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCalendarDays, faMinus, faPlus, faTrash, faBasketShopping } from '@fortawesome/free-solid-svg-icons';
import { useCatalog } from '../Products/CatalogProvider';
import { productHref, productImage } from '../Products/catalog';
import { useAccountWeeklyBasket } from './AccountWeeklyBasketProvider';
import './cart.css';

const number = new Intl.NumberFormat('fa-IR');

export default function WeeklyBasketPage() {
  const { catalog } = useCatalog();
  const weekly = useAccountWeeklyBasket();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');

  const products = useMemo(() => catalog.flatMap(product => [product, ...(product.variants || [])]), [catalog]);
  const items = (weekly?.items || []).map(line => ({
    ...line, product: products.find(product => product.id === line.productId),
  }));

  async function change(item, quantity) {
    setBusy(item.productId);
    setMessage('');
    try {
      if (quantity <= 0) await weekly.remove(item.productId);
      else await weekly.set(item.productId, quantity);
    } catch (error) {
      setMessage(error.message || 'تغییر سبد هفتگی انجام نشد.');
    } finally {
      setBusy('');
    }
  }

  async function clear() {
    setBusy('all');
    setMessage('');
    try { await weekly.clear(); }
    catch (error) { setMessage(error.message || 'خالی کردن سبد هفتگی انجام نشد.'); }
    finally { setBusy(''); }
  }

  if (!weekly) return <div className="weekly-page" dir="rtl">
    <header className="weekly-header"><div><h1><FontAwesomeIcon icon={faCalendarDays}/> سبد هفتگی من</h1>
      <p>فهرست محصولات و تعداد موردنیازتان برای خریدهای هفتگی</p></div></header>
    <section className="weekly-empty"><FontAwesomeIcon icon={faCalendarDays}/>
      <h2>برای استفاده از سبد هفتگی وارد حساب شوید</h2>
      <p>سبد هفتگی به حساب کاربری شما متصل است و در مراجعات بعدی باقی می‌ماند.</p>
      <Link className="checkout-submit" href="/login?returnTo=%2Fweekly-basket">ورود به حساب</Link>
    </section>
  </div>;

  return <div className="weekly-page" dir="rtl">
    <header className="weekly-header">
      <div><h1><FontAwesomeIcon icon={faCalendarDays}/> سبد هفتگی من</h1>
        <p>{number.format(items.length)} قلم محصول · فهرست خرید قابل ویرایش شما</p></div>
      <div className="weekly-actions">
        <Link className="weekly-action-link" href="/categories">ادامه خرید <FontAwesomeIcon icon={faArrowLeft}/></Link>
        {!!items.length && <button type="button" className="weekly-clear" disabled={!!busy || weekly.pending} onClick={clear}>
          <FontAwesomeIcon icon={faTrash}/> خالی کردن سبد
        </button>}
      </div>
    </header>
    {message && <p className="weekly-status" role="status">{message}</p>}
    {weekly.failed && <p className="checkout-warning" role="alert">ارتباط با سبد هفتگی برقرار نشد. صفحه را تازه‌سازی کنید.</p>}
    {items.length ? <ul className="weekly-list">
      {items.map(item => <li className="weekly-item" key={item.productId}>
        <Image src={item.product ? productImage(item.product) : '/img/catalog/field.webp'}
          alt={item.product?.name || 'محصول حذف‌شده'} width={76} height={76} unoptimized/>
        <div>
          <h2>{item.product ? <Link href={productHref(item.product)}>{item.product.name}</Link> : 'محصول دیگر در دسترس نیست'}</h2>
          <p>{item.product ? `کد کالا: ${item.product.code}` : item.productId}</p>
        </div>
        <div className="weekly-item-controls">
          <div className="weekly-stepper" aria-label={`تعداد ${item.product?.name || 'محصول'}`}>
            <button type="button" aria-label="افزایش تعداد" disabled={!!busy || weekly.pending || item.quantity >= 9999}
              onClick={() => change(item, item.quantity + 1)}><FontAwesomeIcon icon={faPlus}/></button>
            <output aria-live="polite">{number.format(item.quantity)}</output>
            <button type="button" aria-label="کاهش تعداد" disabled={!!busy || weekly.pending}
              onClick={() => change(item, item.quantity - 1)}><FontAwesomeIcon icon={item.quantity === 1 ? faTrash : faMinus}/></button>
          </div>
          <button type="button" className="weekly-remove" aria-label="حذف از سبد هفتگی"
            disabled={!!busy || weekly.pending} onClick={() => change(item, 0)}><FontAwesomeIcon icon={faTrash}/></button>
        </div>
      </li>)}
    </ul> : <section className="weekly-empty">
      <FontAwesomeIcon icon={faBasketShopping}/>
      <h2>سبد هفتگی شما خالی است</h2>
      <p>از صفحه محصولات، با آیکون تقویم هر کالا را به فهرست هفتگی اضافه کنید.</p>
      <Link className="checkout-submit" href="/categories">مشاهده محصولات</Link>
    </section>}
  </div>;
}
