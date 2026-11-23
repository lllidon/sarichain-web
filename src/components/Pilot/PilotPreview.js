'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBasketShopping, faBox, faCalendarDays, faCircleCheck, faLeaf, faPlus, faShieldHalved, faStore, faTruck, faUsers } from '@fortawesome/free-solid-svg-icons';
import { initialBasket, basketSuggestion, scenario } from './pilotData';
import './pilot.css';

const number = new Intl.NumberFormat('fa-IR');
const currency = value => number.format(value) + ' تومان';
const sections = [
  ['basket', 'سبد هفتگی', faBasketShopping], ['market', 'بازار خانوار و تجاری', faStore],
  ['production', 'عرضه و پیشنهاد کشت', faLeaf], ['inputs', 'خرید تجمیعی نهاده', faBox],
  ['quality', 'نظارت و کیفیت', faShieldHalved], ['transport', 'بولتن حمل شناور', faTruck],
  ['roles', 'حساب چندنقشی', faUsers],
];

function Basket() {
  const [items, setItems] = useState(initialBasket);
  const [basketType, setBasketType] = useState('routine');
  const [paused, pause] = useState(false);
  const [suggestion, setSuggestion] = useState('pending');
  const [confirmed, confirm] = useState(false);
  const subtotal = items.reduce((total, item) => total + item.quantity * item.price, 0);
  const delivery = subtotal ? 25000 : 0;

  function chooseBasket(value) {
    setBasketType(value);
    setItems(value === 'routine' ? initialBasket : initialBasket.map(item => ({
      ...item, quantity: value === 'seasonal' && item.id !== 'eggs' ? 1 : 0,
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
      <ul className="review-items">
        {items.map(item => <li key={item.id}>
          <div><strong>{item.name}</strong><small>{currency(item.price)} برای هر {item.unit}</small></div>
          <div className="review-quantity">
            <button type="button" aria-label={'کاهش ' + item.name} disabled={paused || !item.quantity} onClick={() => adjust(item.id, item.quantity - 1)}>−</button>
            <b>{number.format(item.quantity)}</b>
            <button type="button" aria-label={'افزایش ' + item.name} disabled={paused || item.quantity === 10} onClick={() => adjust(item.id, item.quantity + 1)}>+</button>
          </div>
        </li>)}
      </ul>
      <div className="review-suggestion">
        <strong>پیشنهاد فصلی نمونه</strong>
        <p>سیب فصل را به دلیل عرضهٔ محلی می‌توانید به سبد اضافه کنید.</p>
        {suggestion === 'pending' ? <div className="review-actions">
          <button type="button" className="review-primary" disabled={paused} onClick={() => {
            setItems(previous => [...previous, basketSuggestion]); setSuggestion('added'); confirm(false);
          }}><FontAwesomeIcon icon={faPlus} /> افزودن سیب</button>
          <button type="button" onClick={() => setSuggestion('dismissed')}>رد پیشنهاد</button>
        </div> : <small role="status">{suggestion === 'added' ? 'سیب به سبد نمونه اضافه شد.' : 'پیشنهاد رد شد.'}</small>}
      </div>
    </section>
    <aside className="review-box review-breakdown">
      <h2>خلاصهٔ سفارش</h2>
      <dl>
        <div><dt>جمع کالا</dt><dd>{currency(subtotal)}</dd></div>
        <div><dt>هزینهٔ تحویل نمونه</dt><dd>{currency(delivery)}</dd></div>
        <div><dt>مبلغ نمونه</dt><dd>{currency(subtotal + delivery)}</dd></div>
      </dl>
      <button type="button" className="review-primary" disabled={paused || !subtotal} onClick={() => confirm(true)}>مرور تأیید سبد</button>
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
      <div hidden={section !== 'basket'}><Basket /></div>
      {section !== 'basket' && <Scenario section={section} key={section} />}
    </div>
  </div>;
}
