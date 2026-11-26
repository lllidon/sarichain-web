'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBasketShopping, faBox, faCalendarDays, faCircleCheck, faLeaf, faPlus, faShieldHalved, faStore, faTruck, faUsers } from '@fortawesome/free-solid-svg-icons';
import { scenario } from './pilotData';
import { useCatalog } from '../Products/CatalogProvider';
import { cheapestVariant } from '../Products/catalog';
import { formatPrice, scalePrice, sumPrices } from '../Products/price';
import './pilot.css';

const number = new Intl.NumberFormat('fa-IR');
const sampleBasket = [
  { id: 'sample-orange', name: 'پرتقال فصلی', unit: 'کیلوگرم', price: { min: 1.2, max: 1.2 } },
  { id: 'sample-apple', name: 'سیب باغی', unit: 'کیلوگرم', price: { min: 1.6, max: 1.6 } },
  { id: 'sample-herbs', name: 'سبزی تازه', unit: 'بسته', price: { min: 0.8, max: 0.8 } },
  { id: 'sample-tomato', name: 'گوجه‌فرنگی', unit: 'کیلوگرم', price: { min: 1, max: 1 } },
];
const sections = [
  ['basket', 'سبد هفتگی', faBasketShopping], ['market', 'بازار خانوار و تجاری', faStore],
  ['production', 'عرضه و پیشنهاد کشت', faLeaf], ['inputs', 'خرید تجمیعی نهاده', faBox],
  ['quality', 'نظارت و کیفیت', faShieldHalved], ['transport', 'بولتن حمل شناور', faTruck],
  ['roles', 'حساب چندنقشی', faUsers],
];

function Basket({ products, sample }) {
  const initialBasket = products.slice(0, 3).map((product, index) => ({ ...product, quantity: index === 0 ? 2 : 1 }));
  const suggested = products[3];
  const [items, setItems] = useState(initialBasket);
  const [basketType, setBasketType] = useState('routine');
  const [paused, pause] = useState(false);
  const [suggestion, setSuggestion] = useState('pending');
  const [confirmed, confirm] = useState(false);
  const total = sumPrices(items.map(item => scalePrice(item.price, item.quantity)));
  const hasItems = items.some(item => item.quantity > 0);

  function chooseBasket(value) {
    setBasketType(value);
    setItems(value === 'routine' ? initialBasket : initialBasket.map(item => ({
      ...item, quantity: value === 'seasonal' ? 1 : 0,
    })));
    setSuggestion('pending');
    confirm(false);
  }

  function adjust(id, value) {
    setItems(previous => previous.map(item => item.id === id ? { ...item, quantity: Math.max(0, Math.min(10, value)) } : item));
    confirm(false);
  }

  return <div className="review-basket">
    <section className="review-box">
      <h2>سبد هفتگی خانوار</h2>
      <label className="review-basket-type">نوع سبد
        <select value={basketType} disabled={paused} onChange={event => chooseBasket(event.target.value)}>
          <option value="routine">روتین شخصی</option>
          <option value="seasonal">اقتصادی و فصلی</option>
          <option value="custom">کاملاً انتخابی</option>
        </select>
      </label>
      <p className="review-muted"><FontAwesomeIcon icon={faCalendarDays} /> تحویل نمونه شنبه، زون ساری</p>
      {sample && <p className="review-muted">اقلام و قیمت‌های این سبد نمونه هستند.</p>}
      <ul className="review-items">
        {items.map(item => <li key={item.id}>
          <div><strong>{item.name}</strong><small>{formatPrice(item.price)} برای هر {item.unit}</small></div>
          <div className="review-quantity">
            <button type="button" aria-label={'کاهش ' + item.name} disabled={paused || !item.quantity} onClick={() => adjust(item.id, item.quantity - 1)}>−</button>
            <b>{number.format(item.quantity)}</b>
            <button type="button" aria-label={'افزایش ' + item.name} disabled={paused || item.quantity === 10} onClick={() => adjust(item.id, item.quantity + 1)}>+</button>
          </div>
        </li>)}
      </ul>
      {suggested && <div className="review-suggestion">
        <strong>پیشنهاد تکمیلی نمونه</strong>
        <p>{suggested.name} را از کاتالوگ به سبد اضافه کنید.</p>
        {suggestion === 'pending' ? <div className="review-actions">
          <button type="button" className="review-primary" disabled={paused} onClick={() => {
            setItems(previous => [...previous, { ...suggested, quantity: 1 }]); setSuggestion('added'); confirm(false);
          }}><FontAwesomeIcon icon={faPlus} /> افزودن به سبد</button>
          <button type="button" onClick={() => setSuggestion('dismissed')}>رد پیشنهاد</button>
        </div> : <small role="status">{suggestion === 'added' ? 'محصول به سبد نمونه اضافه شد.' : 'پیشنهاد رد شد.'}</small>}
      </div>}
    </section>
    <aside className="review-box review-breakdown">
      <h2>خلاصهٔ سفارش</h2>
      <dl>
        <div><dt>بازهٔ قیمت کالاها</dt><dd>{formatPrice(total)}</dd></div>
      </dl>
      <button type="button" className="review-primary" disabled={paused || !hasItems} onClick={() => confirm(true)}>مرور تأیید سبد</button>
      <button type="button" onClick={() => { pause(!paused); confirm(false); }}>{paused ? 'ادامهٔ سبد' : 'توقف برای این هفته'}</button>
      {paused && <p role="status">این چرخه در ماک متوقف شد.</p>}
      {confirmed && <p role="status">پیش‌نمایش تأیید آماده است. سفارش یا پرداختی ثبت نمی‌شود.</p>}
    </aside>
  </div>;
}

function Scenario({ section }) {
  const [selected, pick] = useState(0);
  const view = scenario[section];
  const item = view.items[selected];
  return <section className="review-box">
    <h2>{view.title}</h2>
    <fieldset className="review-scenario-choices">
      <legend>{view.action}</legend>
      {view.items.map((entry, index) => <label key={entry.title}>
        <input type="radio" name="pilot-scenario" checked={selected === index} onChange={() => pick(index)} />
        <strong>{entry.title}</strong><small>{entry.tag}</small>
      </label>)}
    </fieldset>
    <div className="review-suggestion" aria-live="polite">
      <strong><FontAwesomeIcon icon={faCircleCheck} /> {item.title}</strong><p>{item.detail}</p>
    </div>
  </section>;
}

export default function PilotPreview() {
  const [section, select] = useState('basket');
  const { catalog } = useCatalog();
  const orderable = catalog.map(cheapestVariant).filter(product => product.orderable);
  return <div className="review-page" dir="rtl">
    <div className="review-wrap">
      <header className="review-hero">
        <Image src="/img/catalog/field.webp" alt="" fill priority sizes="(max-width: 700px) 100vw, 1200px" />
        <div>
          <span>پیش‌نمایش با دادهٔ نمونه</span>
          <h1>پایلوت زنجیره تأمین ساری‌چین</h1>
          <p>از سبد هفتگی خانوار تا هماهنگی تأمین، بازدید کیفیت و تحویل در زون ساری.</p>
        </div>
      </header>
      <nav className="review-nav" aria-label="بخش‌های پیش‌نمایش">
        {sections.map(([id, label, icon]) => <button key={id} type="button" aria-current={id === section ? 'page' : undefined}
          onClick={() => select(id)}><FontAwesomeIcon icon={icon} /><span>{label}</span></button>)}
      </nav>
      <div hidden={section !== 'basket'}><Basket products={orderable.length ? orderable : sampleBasket} sample={!orderable.length} /></div>
      {section !== 'basket' && <Scenario section={section} key={section} />}
    </div>
  </div>;
}
