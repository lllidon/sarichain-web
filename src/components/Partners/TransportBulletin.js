'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faMapMarkerAlt, faPackage, faRoute, faWeightHanging } from '@fortawesome/free-solid-svg-icons';
import { acceptTransportOrder } from '../../app/(workspace)/partners/actions';
import { partnerHref } from './workspaceSections';
import { demoTransportOrders } from './demoTransportOrders';
import TransportStopsMap from './TransportStopsMap';

const number = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 });
const dateTime = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tehran' });
const urgency = { hourly: 'ساعتی و فوری', daily: 'روزانه', multiday: 'چندروزه' };
const tabs = [
  { id: 'intracity', label: 'درون‌شهری' },
  { id: 'intercity', label: 'بین‌شهری تا ۵۰ کیلومتر' },
  { id: 'interprovincial', label: 'بین‌استانی' },
];

function OrderCard({ order }) {
  const isDemo = Boolean(order.isDemo);
  return <article className="transport-bulletin-card">
    <header className="transport-bulletin-card-heading">
      <div><strong>{order.goodsType}</strong><small>{order.kind === 'own' ? 'درخواست ثبت‌شده شما' : 'فرصت حمل بار'} · {order._id ? String(order._id).slice(-7) : ''}</small></div>
      {isDemo && <span className="transport-demo-chip">نمونه</span>}
    </header>
    <div className="transport-bulletin-facts">
      <span><FontAwesomeIcon icon={faWeightHanging}/> {number.format(order.weightKg)} کیلوگرم</span>
      <span><FontAwesomeIcon icon={faPackage}/> {number.format(order.volumeM3)} مترمکعب</span>
      <span><FontAwesomeIcon icon={faClock}/> {urgency[order.urgency] || '—'}</span>
      <span><FontAwesomeIcon icon={faRoute}/> {number.format(order.quote?.distanceKm || 0)} کیلومتر مستقیم تخمینی</span>
    </div>
    <div className="transport-bulletin-stops">
      <span>{number.format(order.stops?.filter(stop => stop.kind === 'pickup').length || 0)} مبدأ</span>
      <span>{number.format(order.stops?.filter(stop => stop.kind === 'dropoff').length || 0)} مقصد</span>
      <span>مهلت: {order.deadline ? dateTime.format(new Date(order.deadline)) : '—'}</span>
    </div>
    <div className="transport-bulletin-quote">
      <span>عادی: <b>{number.format(order.quote?.standardKar || 0)} کارسا</b></span>
      <span>ویژه: <b>{number.format(order.quote?.specialKar || 0)} کارسا</b></span>
    </div>
    <ol className="transport-bulletin-stop-list">
      {order.stops?.map((stop, index) => <li key={index}>
        <i className={stop.kind === 'pickup' ? 'pickup' : 'dropoff'} />
        <span><b>{stop.kind === 'pickup' ? 'مبدأ' : 'مقصد'} {number.format(index + 1)}: {stop.label}</b><small>{stop.province}، {stop.city} · {stop.address}</small></span>
      </li>)}
    </ol>
    {!isDemo && order.kind === 'job' && order.status === 'approved' && <form className="transport-accept-form" action={acceptTransportOrder}>
      <input type="hidden" name="id" value={String(order._id)} />
      <button className="partner-primary" type="submit">پذیرش حمل با {number.format(order.special ? order.quote?.specialKar || 0 : order.quote?.standardKar || 0)} کارسا</button>
    </form>}
  </article>;
}

export default function TransportBulletin({ items = [] }) {
  const [active, setActive] = useState('intracity');
  const realByCategory = useMemo(() => ({
    intracity: items.filter(order => order.quote?.category === 'intracity'),
    intercity: items.filter(order => order.quote?.category === 'intercity' && Number(order.quote?.distanceKm) <= 50),
    interprovincial: items.filter(order => order.quote?.category === 'interprovincial'),
  }), [items]);
  const realCount = items.length;
  const selectedReal = realByCategory[active];
  const isDemo = selectedReal.length === 0;
  const visible = isDemo ? demoTransportOrders[active] : selectedReal;
  const allStops = useMemo(() => visible.flatMap(order => order.stops || []), [visible]);
  const routes = useMemo(() => visible.map(order => order.stops || []), [visible]);
  return <div className="transport-bulletin">
    <header className="transport-bulletin-intro">
      <div><span>بازار فرصت‌های حمل ساری‌چین</span><h2>بارهای پیشنهادی متناسب با مسیر و ظرفیت شما</h2>
        <p>مبدأها و مقصدهای چندگانه را روی نقشه ببینید و بار مناسب مسیر خود را انتخاب کنید. مسافت‌ها تخمینی و مستقیم‌اند، نه مسافت جاده‌ای.</p></div>
      <Link href={partnerHref('profile')}>تنظیم فعالیت حمل‌ونقل</Link>
    </header>
    {isDemo && <div className="transport-demo-notice" role="status"><b>داده تستی</b><span>{realCount ? 'برای این دسته مسیر هنوز سفارش واقعی ثبت نشده است؛ نمونه‌ها فقط جهت نمایش رابط کاربری هستند.' : 'در حال حاضر سفارش حمل واقعی برای نمایش وجود ندارد؛ نمونه‌های زیر صرفاً داده نمایشی هستند و قابل پذیرش یا واگذاری نیستند.'}</span></div>}
    <nav className="transport-route-tabs" aria-label="دسته‌بندی مسیرها">
      {tabs.map(tab => <button key={tab.id} type="button" className={active === tab.id ? 'active' : ''} aria-pressed={active === tab.id} onClick={() => setActive(tab.id)}>
        {tab.label}<span>{number.format(realByCategory[tab.id].length || demoTransportOrders[tab.id].length)}</span>
      </button>)}
    </nav>
    <section className="transport-demo-map-section">
      <div><h3>نقشه مسیرها</h3><p>سبز: مبدأ بارگیری · آبی: مقصد تخلیه</p></div>
      <TransportStopsMap stops={allStops} routes={routes} />
    </section>
    <div className="transport-bulletin-heading"><h2>{tabs.find(tab => tab.id === active)?.label}</h2><p>{number.format(visible.length)} سفارش {isDemo ? 'نمونه' : 'واقعی'}</p></div>
    <div className="transport-bulletin-cards">{visible.map(order => <OrderCard key={String(order._id)} order={order} />)}</div>
  </div>;
}
