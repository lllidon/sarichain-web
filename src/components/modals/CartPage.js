'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBasketShopping, faCalendarDays, faMinus, faPlus, faTrash, faTruck } from '@fortawesome/free-solid-svg-icons';
import { formatPrice, scalePrice, sumPrices } from '../Products/price';
import { productHref, productImage } from '../Products/catalog';
import { useCatalog } from '../Products/CatalogProvider';
import { submitOrder } from '../Products/submitOrder';
import { useCartCommands, useCatalogCart } from './cartStore';
import { displayCart } from './cartPresentation';
import CartNotices from './CartNotices';
import LocationMap from '../Partners/LocationMap';
import { useAccountWeeklyBasket } from './AccountWeeklyBasketProvider';
import './cart.css';

const number = new Intl.NumberFormat('fa-IR');
const calendar = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'full', timeZone: 'Asia/Tehran' });
const showDate = date => calendar.format(new Date(date + 'T12:00:00Z'));
const cost = fee => ({ min: fee, max: fee });

function CartLines({ items, busy, update, add }) {
  return <ul className="checkout-lines">
    {items.map(item => {
      const { product, pack, quantity } = item;
      const name = product?.name ?? item.name ?? 'محصول ناموجود';
      return <li key={item.id} className="checkout-line">
        <Image src={product ? productImage(product) : item.image || '/img/catalog/field.webp'}
          alt="" width={80} height={80} unoptimized />
        <div className="checkout-line-body">
          <div className="checkout-line-title">
            {product ? <Link href={productHref(product)}>{name}</Link> : <strong>{name}</strong>}
            <button type="button" className="checkout-icon checkout-remove" disabled={busy}
              aria-label={`حذف ${name}، ${pack?.name ?? item.packName ?? 'واحد'}`} onClick={() => update(item, 0)}>
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
          {pack ? <>
            <p className="checkout-unit">
              <strong>{pack.name}</strong>
              {pack.amount > 1 && <span>هر {pack.name} = {number.format(pack.amount)} {product?.unit ?? 'واحد'}</span>}
              <span>{formatPrice(pack.price)} برای هر {pack.name}</span>
              {(item.sellerName || product?.offer?.name) && <span>فروشنده: {item.sellerName || product.offer.name}</span>}
            </p>
            <div className="checkout-line-footer">
              <div className="checkout-quantity" aria-label={`تعداد ${pack.name} ${name}`}>
                <button type="button" className="checkout-icon" disabled={busy || quantity <= 1}
                  aria-label={`کاهش تعداد ${pack.name} ${name}`} onClick={() => update(item, quantity - 1)}>
                  <FontAwesomeIcon icon={faMinus} />
                </button>
                <output aria-live="polite">{number.format(quantity)}</output>
                <button type="button" className="checkout-icon" disabled={busy || quantity >= item.maxQuantity}
                  aria-label={`افزایش تعداد ${pack.name} ${name}`} onClick={() => update(item, quantity + 1)}>
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              </div>
              <strong>{formatPrice(scalePrice(pack.price, quantity))}</strong>
            </div>
            {!!item.availableUnits.length && <label className="checkout-add-unit">
              <span>افزودن واحد دیگر</span>
              <select aria-label={`افزودن واحد دیگر برای ${name}`} value="" disabled={busy}
                onChange={event => {
                  const unit = item.availableUnits.find(option => option.id === event.target.value);
                  if (unit) add(product, unit);
                }}>
                <option value="">انتخاب واحد</option>
                {item.availableUnits.map(unit => <option key={unit.id} value={unit.id}>
                  {unit.name}{unit.amount > 1 ? ` · هر ${unit.name} ${number.format(unit.amount)} ${product.unit}` : ' · واحد اصلی'}
                </option>)}
              </select>
            </label>}
          </> : <p className="checkout-warning">این محصول یا واحد فروش دیگر در دسترس نیست.</p>}
        </div>
      </li>;
    })}
  </ul>;
}

function DeliveryOptions({ options, selected, setSelected, date, setDate, slot, setSlot, busy }) {
  const fastest = options.find(option => option.id === 'urgent') ?? options[options.length - 1];
  const currentWindow = selected.windows.find(window => window.dispatchDate === date) ?? selected.windows[0];
  return <div className="checkout-shipping">
    <fieldset disabled={busy}>
      <legend><FontAwesomeIcon icon={faTruck} /> روش ارسال</legend>
      {options.map(method => {
        const saving = Math.round((fastest.fee - method.fee) * 1e6) / 1e6;
        return <label key={method.id} className="checkout-method">
          <input type="radio" name="cart-delivery-method" checked={method.id === selected.id}
            onChange={() => { setSelected(method.id); setDate(''); setSlot(''); }} />
          <span><strong>{method.label}</strong><small>تحویل برآوردی {showDate((method.windows.find(window => window.dispatchDate === date) ?? method.windows[0]).deliveryDate)}</small><small>زمان تخمینی است و پس از تأیید ظرفیت حمل قطعی می‌شود.</small><small>{method.routeLabel} · حدود {number.format(method.distanceKm)} کیلومتر</small><small>{method.routingPending ? 'فاصله تخمینی؛ مسیریابی جاده‌ای در دسترس نیست' : 'برآورد بر اساس مسیر جاده‌ای'}</small>
            <small>حمل: {formatPrice(cost(method.breakdown.transportKar))}{method.breakdown.coldChainKar > 0 ? ` · زنجیره سرد: ${formatPrice(cost(method.breakdown.coldChainKar))}` : ''}{method.breakdown.handlingKar > 0 ? ` · تجمیع: ${formatPrice(cost(method.breakdown.handlingKar))}` : ''}{method.fragile ? ' · بار حساس' : ''}</small>
            {saving > 0 && <small className="checkout-savings">{formatPrice(cost(saving))} صرفه‌جویی نسبت به ارسال سریع</small>}
          </span>
          <b>{formatPrice(cost(method.fee))}</b>
        </label>;
      })}
    </fieldset>
    <fieldset className="checkout-dates" disabled={busy}>
      <legend><FontAwesomeIcon icon={faCalendarDays} /> زمان دلخواه ارسال</legend>
      <label>روز ارسال<select value={date} onChange={event => setDate(event.target.value)}>
        {selected.windows.map(({ dispatchDate }) => <option key={dispatchDate} value={dispatchDate}>{showDate(dispatchDate)}</option>)}
      </select></label>
      <label>بازهٔ زمانی ارسال<select value={slot ?? ''} onChange={event => setSlot(event.target.value)}>
        {!currentWindow?.slots.length && <option value="">برای این روز بازه‌ای باقی نمانده</option>}
        {currentWindow?.slots.map(time => <option key={time.id} value={time.id}>{time.label}</option>)}
      </select></label>
    </fieldset>
  </div>;
}

export default function CartPage({ initialMessage = '' }) {
  const { catalog } = useCatalog();
  const cart = useCatalogCart();
  const commands = useCartCommands();
  const weeklyBasket = useAccountWeeklyBasket();
  const { account } = commands;
  const orderRequest = useRef(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(initialMessage);
  const [loginNeeded, setLoginNeeded] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [options, setOptions] = useState(null);
  const [failed, setFailed] = useState(false);
  const [revision, retry] = useState(0);
  const [method, setMethod] = useState('standard');
  const [requestedDate, setDate] = useState('');
  const [requestedSlot, setSlot] = useState('');
  const [destination, setDestination] = useState({ latitude: '', longitude: '' });
  const [quoteError, setQuoteError] = useState('');
  const pickDestination = useCallback(point => setDestination(point), []);

  const hasItems = cart.length > 0;
  const quoteLines = cart.map(item => ({
    productId: item.productId, quantity: item.quantity, unitId: item.unitId ?? item.packId ?? 'unit',
    ...(item.offerId && { offerId: item.offerId }),
  }));
  const quoteSignature = JSON.stringify(quoteLines);
  useEffect(() => {
    if (!hasItems) return;
    if (!destination.latitude || !destination.longitude) {
      setOptions(null); setFailed(false); setQuoteError('برای محاسبه مسیر و هزینه، مقصد را روی نقشه انتخاب کنید.');
      return;
    }
    const controller = new AbortController();
    setOptions(null); setFailed(false); setQuoteError('');
    fetch('/web/delivery-options', {
      method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: JSON.parse(quoteSignature), destination: { latitude: Number(destination.latitude), longitude: Number(destination.longitude) } }),
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]),
    }).then(async response => {
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw Error(Array.isArray(result.message) ? result.message.join('، ') : result.message || 'محاسبه هزینه حمل انجام نشد.');
      return result;
    }).then(({ methods }) => {
      if (!methods?.length) throw Error('برای این سبد گزینه حمل قابل محاسبه نیست. مشخصات فیزیکی کالا و موقعیت بارگیری تولیدکنندگان را بررسی کنید.');
      if (!controller.signal.aborted) setOptions(methods);
    }).catch(error => {
      if (!controller.signal.aborted) { setFailed(true); setQuoteError(error.message || 'محاسبه هزینه حمل انجام نشد.'); }
    });
    return () => controller.abort();
  }, [hasItems, revision, quoteSignature, destination.latitude, destination.longitude]);

  const items = displayCart(cart, catalog, account);
  const changes = cart.filter(item => item.notice);
  const loadingCart = account?.revision === -1;
  const cartBusy = busy || account?.pending;
  const subtotal = sumPrices(items.map(item => scalePrice(item.pack?.price, item.quantity)));
  const containsInactive = items.some(item => !item.pack);
  const exceedsLimit = items.some(item => item.pack && item.quantity > item.maxQuantity);
  const selected = options?.find(option => option.id === method) ?? options?.[0];
  const window = selected?.windows.find(item => item.dispatchDate === requestedDate) ?? selected?.windows[0];
  const date = window?.dispatchDate;
  const slot = window?.slots.some(time => time.id === requestedSlot) ? requestedSlot : window?.slots[0]?.id;
  const total = selected ? sumPrices([subtotal, cost(selected.fee)]) : subtotal;

  async function update(item, quantity) {
    try { setMessage(await commands.change(item, quantity, item.product) ? '' : 'این تعداد برای محصول قابل سفارش نیست.'); }
    catch (error) { setMessage(error.message); }
  }

  async function add(product, unit) {
    try { setMessage(await commands.add(product, unit) ? '' : 'این تعداد برای محصول قابل سفارش نیست.'); }
    catch (error) { setMessage(error.message); }
  }

  async function clear() {
    try {
      await commands.clear();
      setConfirmClear(false);
      setMessage('سبد خرید خالی شد.');
    } catch (error) { setMessage(error.message); }
  }

  async function acknowledge(ids) {
    try { await account.request('POST', 'acknowledge', { ids }); }
    catch (error) { setMessage(error.message); }
  }

  async function checkout() {
    if (!account || cartBusy || changes.length || containsInactive || exceedsLimit || !items.length || !selected || !date || !slot) return;
    setBusy(true);
    setMessage('');
    setLoginNeeded(false);
    try {
      const result = await submitOrder(items.map(item => ({
        productId: item.productId, quantity: item.quantity, unitId: item.pack.id, offerId: item.offerId,
      })), orderRequest, {
        method: selected.id, dispatchDate: date, slot,
        destination: { latitude: Number(destination.latitude), longitude: Number(destination.longitude) },
        quotedFee: selected.fee, quotedRouteMode: selected.routeMode, quotedDistanceKm: selected.distanceKm,
      }, account.revision);
      setMessage('درخواست ثبت شد. کد پیگیری ' + result.id);
      await account.request().catch(() => {});
    } catch (error) {
      setLoginNeeded(error.status === 401);
      if (error.status === 400 || error.status === 409) { retry(value => value + 1); await account.request().catch(() => {}); }
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return <div className="checkout-page" dir="rtl">
    <header className="checkout-header">
      <div><FontAwesomeIcon icon={faBasketShopping} /><h1 id="checkout-title">سبد خرید</h1>
        {hasItems && <span>{number.format(cart.length)} قلم</span>}
      </div>
      <div className="checkout-header-actions"><Link className="checkout-weekly-link" href="/weekly-basket"><FontAwesomeIcon icon={faCalendarDays} /> نمایش سبد هفتگی {weeklyBasket?.items?.length ? <b>{number.format(weeklyBasket.items.length)}</b> : null}</Link><Link className="checkout-continue" href="/categories">ادامهٔ خرید <FontAwesomeIcon icon={faArrowLeft} /></Link></div>
    </header>
    {message && <p className="checkout-message" role="status">{message}</p>}
    <CartNotices changes={changes} busy={cartBusy} acknowledge={acknowledge} />
    {loadingCart ? <p className="checkout-warning" role="status">{account.failed ? 'دریافت سبد حساب انجام نشد.' : 'در حال دریافت سبد حساب…'}
      {account.failed && <button type="button" disabled={cartBusy} onClick={() => account.request().catch(() => {})}>تلاش دوباره</button>}
    </p> : hasItems ? <div className="checkout-grid">
      <section className="checkout-card" aria-labelledby="checkout-items-title">
        <div className="checkout-card-heading">
          <h3 id="checkout-items-title">اقلام سبد</h3>
          <button type="button" className="checkout-text-button" disabled={cartBusy || confirmClear} onClick={() => setConfirmClear(true)}>
            <FontAwesomeIcon icon={faTrash} /> حذف کل سبد
          </button>
        </div>
        {confirmClear && <div className="checkout-confirm">
          <span>همهٔ اقلام از سبد حذف شوند؟</span>
          <button type="button" className="checkout-danger" disabled={cartBusy}
            onClick={clear}>تأیید حذف</button>
          <button type="button" onClick={() => setConfirmClear(false)}>انصراف</button>
        </div>}
        <CartLines items={items} busy={cartBusy} update={update} add={add} />
      </section>
      <aside className="checkout-card checkout-summary" aria-labelledby="checkout-summary-title">
        <h3 id="checkout-summary-title">خلاصهٔ سبد و ارسال</h3>
        <section className="checkout-destination">
          <strong>مقصد تحویل سفارش</strong>
          <p>برای محاسبه دقیق مسافت و مقایسه ارسال مستقیم با تجمیع، محل تحویل را روی نقشه مشخص کنید.</p>
          <LocationMap point={destination} onPick={pickDestination} />
          <div className="checkout-destination-coordinates">
            <label>عرض جغرافیایی<input type="number" step="0.000001" value={destination.latitude} onChange={event=>setDestination(current=>({...current,latitude:event.target.value}))}/></label>
            <label>طول جغرافیایی<input type="number" step="0.000001" value={destination.longitude} onChange={event=>setDestination(current=>({...current,longitude:event.target.value}))}/></label>
          </div>
        </section>
        {selected ? <DeliveryOptions options={options} selected={selected} setSelected={setMethod} date={date} setDate={setDate}
          slot={slot} setSlot={setSlot} busy={busy} /> : failed ?
          <div className="checkout-warning" role="alert">{quoteError} <button type="button" onClick={() => retry(value => value + 1)}>تلاش دوباره</button></div> :
          <p role="status">{quoteError || 'در انتظار انتخاب مقصد برای محاسبه هزینه حمل…'}</p>}
        <dl className="checkout-totals">
          <div><dt>جمع کالاها</dt><dd>{formatPrice(subtotal)}</dd></div>
          <div><dt>هزینهٔ ارسال</dt><dd>{selected ? formatPrice(cost(selected.fee)) : '—'}</dd></div>
          <div className="checkout-grand"><dt>جمع برآوردی</dt><dd>{selected ? formatPrice(total) : '—'}</dd></div>
        </dl>
        {window && <p className="checkout-date-note"><strong>تحویل برآوردی</strong><span>{showDate(window.deliveryDate)}</span></p>}
        {exceedsLimit && <p className="checkout-warning">تعداد بعضی اقلام بیشتر از سقف مجاز است. تعداد را کاهش دهید.</p>}
        {containsInactive && <p className="checkout-warning">برای ادامه، اقلام ناموجود را از سبد حذف کنید.</p>}
        {(!account || loginNeeded) ? <Link className="checkout-submit" href="/login?returnTo=cart">ورود به حساب برای ثبت سفارش</Link> :
          <button type="button" className="checkout-submit" disabled={cartBusy || changes.length > 0 || containsInactive || exceedsLimit || !selected || confirmClear} onClick={checkout}>
            {busy ? 'در حال ثبت…' : 'ثبت درخواست سفارش'}<FontAwesomeIcon icon={faArrowLeft} />
          </button>}
      </aside>
    </div> : <div className="checkout-empty">
      <FontAwesomeIcon icon={faBasketShopping} />
      <h3>سبد خرید شما خالی است</h3>
      <Link className="checkout-submit" href="/categories">مشاهدهٔ محصولات</Link>
    </div>}
  </div>;
}
