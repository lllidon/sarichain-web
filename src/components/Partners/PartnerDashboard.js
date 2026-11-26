import { formatPrice } from '../Products/price';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBorderAll, faBox, faBullhorn, faClipboardList, faLeaf, faMessage, faTruck, faUserPen } from '@fortawesome/free-solid-svg-icons';
import { leaveWorkspace, saveWorkspaceEntry } from '../../app/(workspace)/partners/actions';
import { locationTypes, partnerHref, sections } from './workspaceSections';
import ProductOfferForm from './ProductOfferForm';
import WorkspaceLocationForm from './WorkspaceLocationForm';
import TransportVehicleForm from './TransportVehicleForm';
import TransportOrderForm from './TransportOrderForm';
import { acceptTransportOrder } from '../../app/(workspace)/partners/actions';

const icons = {
  grid: faBorderAll, orders: faClipboardList, products: faBox, transport: faTruck,
  bulletin: faBullhorn, orchards: faLeaf, advisory: faMessage, profile: faUserPen,
};
const feedback = {
  saved: 'رکورد ثبت شد.', accepted: 'سفارش حمل با موفقیت پذیرفته شد.', removed: 'رکورد حذف شد.',
  invalid: 'لطفاً اطلاعات فرم را بررسی کنید.', error: 'عملیات انجام نشد. دوباره تلاش کنید.',
};
const statuses = { pending: 'در انتظار بررسی', confirmed: 'تأیید شده', processing: 'در حال آماده‌سازی', shipped: 'ارسال شده' };
const number = new Intl.NumberFormat('fa-IR');
const offerPrice = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 4 });
const date = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeZone: 'Asia/Tehran' });

function Orders({ items }) {
  if (!items.length) return <div className="partner-empty"><p>سفارش جاری ندارید.</p><Link href="/quick-order">ثبت سفارش</Link></div>;
  return <ul className="partner-records">
    {items.map(order => <li key={order._id}>
      <div className="partner-record-heading">
        <div><strong>سفارش <bdi title={order._id}>{order._id.slice(0, 12)}</bdi></strong><small>{date.format(new Date(order.createdAt))}</small></div>
        <span className="partner-status">{statuses[order.status] || 'ثبت شده'}</span>
      </div>
      <ul>{order.items.map(item => <li key={item.productId + ':' + (item.unitId ?? 'unit') + ':' + (item.offerId ?? '')}>{item.name} <span>× {number.format(item.quantity)} {item.unitName}</span>{item.sellerName && <small>{item.sellerName}</small>}</li>)}</ul>
      {order.delivery && <p>{order.delivery.label} · تحویل برآوردی {date.format(new Date(order.delivery.date + 'T12:00:00Z'))} · بازهٔ ارسال {order.delivery.slotLabel}</p>}
      <strong>{order.price ? formatPrice(order.price) : `${number.format(order.total)} ${order.currency === 'IRR' ? 'ریال' : order.currency}`}</strong>
    </li>)}
  </ul>;
}


const transportStatusLabels = {
  pending_review: 'در انتظار بررسی مدیریت', approved: 'آماده دریافت پیشنهاد',
  rejected: 'رد شده', assigned: 'به راننده واگذار شد',
  in_transit: 'در حال حمل', delivered: 'تحویل شده', cancelled: 'لغو شده',
};
const transportCategoryLabels = { intracity: 'درون‌شهری', intercity: 'بین‌شهری', interprovincial: 'بین‌استانی' };

function TransportBulletin({ items, profile }) {
  const own = items.filter(item => item.kind === 'own');
  const jobs = items.filter(item => item.kind === 'job');
  return <div className="transport-bulletin">
    {profile.customerType ? <TransportOrderForm /> : <div className="partner-empty"><p>برای ثبت درخواست حمل، ابتدا نوع مشتری را در پروفایل خود تکمیل کنید.</p><Link href={partnerHref('profile')}>تکمیل پروفایل</Link></div>}
    <section className="transport-bulletin-list">
      <div className="transport-bulletin-heading"><h2>درخواست‌های من و بارهای پیشنهادی</h2><p>بارهای تأییدشده متناسب با ظرفیت وسیله نقلیه شما در این بخش نمایش داده می‌شوند.</p></div>
      {!own.length && !jobs.length ? <div className="partner-empty"><p>هنوز درخواست یا بار پیشنهادی برای نمایش وجود ندارد.</p></div> :
        <ul className="partner-records">{[...own, ...jobs].map(order => <li key={String(order._id)}>
          <div className="partner-record-heading">
            <div><strong>{order.kind === 'job' ? 'بار پیشنهادی' : 'درخواست حمل'} · <bdi>{String(order._id).slice(-8)}</bdi></strong>
              <small>{date.format(new Date(order.createdAt))} · {transportCategoryLabels[order.quote?.category] || 'در انتظار دسته‌بندی'}</small></div>
            <span className="partner-status">{order.kind === 'job' && order.status === 'approved' && order.special ? 'پیشنهاد ویژه' : transportStatusLabels[order.status] || 'ثبت‌شده'}</span>
          </div>
          <dl className="transport-order-summary">
            <div><dt>نوع بار</dt><dd>{order.goodsType}</dd></div>
            <div><dt>وزن</dt><dd>{number.format(order.weightKg)} کیلوگرم</dd></div>
            <div><dt>حجم</dt><dd>{number.format(order.volumeM3)} مترمکعب</dd></div>
            <div><dt>تحویل</dt><dd>{{ hourly: 'ساعتی', daily: 'روزانه', multiday: 'چندروزه' }[order.urgency] || '—'}</dd></div>
            <div><dt>مسافت تخمینی</dt><dd>{number.format(order.quote?.distanceKm || 0)} کیلومتر</dd></div>
            <div><dt>کارسا</dt><dd>{number.format(order.acceptedRateKar ?? (order.kind === 'job' && order.acceptedRateKar ?? (order.special ? order.quote?.specialKar || 0 : order.quote?.standardKar || 0)))}</dd></div>
          </dl>
          <div className="transport-order-stops">
            {order.stops?.map((stop, index) => <div key={index}>
              <span className={stop.kind === 'pickup' ? 'transport-stop-dot pickup' : 'transport-stop-dot dropoff'} />
              <span><strong>{stop.kind === 'pickup' ? 'بارگیری' : 'تخلیه'}: {stop.label}</strong><small>{stop.province}، {stop.city} · {stop.address}</small></span>
              <a href={'https://www.openstreetmap.org/?mlat=' + stop.latitude + '&mlon=' + stop.longitude + '#map=14/' + stop.latitude + '/' + stop.longitude} target="_blank" rel="noopener noreferrer">نقشه</a>
            </div>)}
          </div>
          {order.description && <p>{order.description}</p>}
          {order.kind === 'job' && order.status === 'approved' && <form className="transport-accept-form" action={acceptTransportOrder}>
            <input type="hidden" name="id" value={String(order._id)} />
            <button className="partner-primary" type="submit">پذیرش حمل با {number.format(order.special ? order.quote?.specialKar || 0 : order.quote?.standardKar || 0)} کارسا</button>
          </form>}
        </li>)}</ul>}
    </section>
  </div>;
}

function WorkspaceEntries({ section, items, offerCatalog, locations, profile, result }) {
  const { entry, placeholder, help } = sections[section];
  const action = saveWorkspaceEntry.bind(null, section);
  const isLocation = section === 'orchards';
  const isTransport = section === 'transport';
  const formKey = result === 'saved' ? items[0]?.id : undefined;
  return <div className={isLocation ? 'partner-entry-layout partner-location-layout' : 'partner-entry-layout'}>
    {isTransport ? <TransportVehicleForm profile={profile} /> : isLocation ? <WorkspaceLocationForm key={formKey} profile={profile} /> :
      section === 'products' ? offerCatalog && !offerCatalog.unavailable ?
      <ProductOfferForm key={formKey} locations={locations} categories={offerCatalog.categories} brands={offerCatalog.brands}
        products={offerCatalog.catalog.flatMap(product => [product, ...product.variants])
          .map(({ id, name, code, brand, brandId, category, unit }) => ({ id, name, code, brand, brandId, category, unit }))} /> :
      <div className="partner-empty"><p>{offerCatalog ? 'کاتالوگ موقتاً در دسترس نیست.' : 'برای ثبت عرضه باید نقش تولیدکننده در پروفایل شما فعال باشد.'}</p>
        <Link href={partnerHref(offerCatalog ? 'products' : 'profile')}>{offerCatalog ? 'تلاش دوباره' : 'ویرایش پروفایل'}</Link>
      </div> : <form className="partner-entry-form" action={action}>
      <h3>ثبت {entry}</h3>
      <p>{help}</p>
      <label>عنوان<input name="title" maxLength={120} required /></label>
      <label>جزئیات<textarea name="details" rows={4} maxLength={1000} placeholder={placeholder} required /></label>
      <button className="partner-primary" type="submit">{section === 'bulletin' ? 'انتشار آگهی' : 'ثبت'}</button>
    </form>}
    <div>
      {!items.length ? <div className="partner-empty"><p>هنوز موردی در این بخش ثبت نشده است.</p></div> :
        <ul className={isLocation ? 'partner-records partner-location-records' : 'partner-records'}>
          {items.map(item => <li key={item.id}>
            {isLocation && item.hasPhoto && <img className="partner-location-photo" src={'/api/partner-locations/' + item.id + '/image'}
              alt={item.title} loading="lazy" />}
            <div className="partner-record-heading">
              <div><strong>{item.title}</strong><small>{item.location ? locationTypes[item.location.type] : date.format(new Date(item.createdAt))}</small></div>
              {item.owned && <form action={action}>
                <input type="hidden" name="id" value={item.id} />
                <button className="partner-remove" aria-label={`حذف ${item.title}`}>حذف</button>
              </form>}
            </div>
            {item.offer && <dl className="partner-offer-summary">
              <div><dt>قیمت هر {item.offer.unit}</dt><dd>{offerPrice.format(item.offer.price)} کارسا</dd></div>
              <div><dt>موجودی تقریبی</dt><dd>{number.format(item.offer.stock)} {item.offer.unit}</dd></div>
              {item.offer.harvestDate && <div><dt>برداشت تقریبی</dt><dd>{date.format(new Date(item.offer.harvestDate + 'T12:00:00Z'))}</dd></div>}
              <div><dt>کد محصول</dt><dd><bdi>{item.offer.sku}</bdi></dd></div>
              {item.offer.locationTitle && <div><dt>موقعیت مکانی</dt><dd>{item.offer.locationTitle}</dd></div>}
            </dl>}
            {item.location && <div className="partner-location-address">
              <span>{[item.location.province, item.location.city].join('، ')}</span>
              <a className="partner-location-link" href={`https://www.openstreetmap.org/?mlat=${item.location.latitude}&mlon=${item.location.longitude}#map=15/${item.location.latitude}/${item.location.longitude}`}
                target="_blank" rel="noopener noreferrer">مشاهده روی نقشه</a>
            </div>}
            {item.details && <p>{item.details}</p>}
          </li>)}
        </ul>}
    </div>
  </div>;
}

export default function PartnerDashboard({ profile, section, result, data, unavailable, page, offerCatalog, locations, children }) {
  const info = sections[section];
  const message = typeof result === 'string' && Object.hasOwn(feedback, result) ? feedback[result] : '';
  return <div className="catalog-page partners-page partner-dashboard" dir="rtl">
    <div className="catalog-wrap">
      <div className="partner-dash-shell">
        <aside className="partner-dash-sidebar">
          <div className="partner-dash-identity">
            <span className="partner-avatar" aria-hidden="true">{profile.fullName?.trim().slice(0, 1) || 'س'}</span>
            <div><strong>{profile.fullName || 'همکار ساری‌چین'}</strong><small>حساب همکاری ساری‌چین</small></div>
          </div>
          <nav aria-label="منوی پنل همکاران">
            {Object.entries(sections).map(([key, item]) => <Link key={key} href={partnerHref(key)}
              aria-current={key === section ? 'page' : undefined} prefetch={false}>
              <FontAwesomeIcon icon={icons[item.icon]} /><span>{item.label}</span>
            </Link>)}
          </nav>
          <form action={leaveWorkspace}><button className="partner-secondary">خروج از حساب</button></form>
        </aside>
        <section className="partner-dash-content" aria-labelledby="partner-section-title">
          <header className="partner-dash-heading">
            <div><h1 id="partner-section-title">{info.label}</h1>
              {section === 'overview' && <p>{profile.fullName ? `${profile.fullName}، خوش آمدید.` : 'به پنل همکاران خوش آمدید.'}</p>}
            </div>
          </header>
          {message && <p className="partner-dash-feedback" role={result === 'error' || result === 'invalid' ? 'alert' : 'status'}>{message}</p>}
          {section === 'overview' && <div className="partner-dash-grid">
            {Object.entries(sections).filter(([key]) => key !== 'overview').map(([key, item]) => <Link key={key} href={partnerHref(key)} prefetch={false}>
              <span><FontAwesomeIcon icon={icons[item.icon]} /></span>
              <strong>{item.label}</strong><FontAwesomeIcon icon={faArrowLeft} />
            </Link>)}
          </div>}
          {section === 'profile' && children}
          {unavailable && <div className="partner-empty" role="alert">دریافت اطلاعات انجام نشد. <Link href={partnerHref(section)}>تلاش دوباره</Link></div>}
          {data && (section === 'orders' ? <Orders items={data.items} /> : section === 'bulletin' ? <TransportBulletin items={data.items} profile={profile} /> :
            <WorkspaceEntries section={section} items={data.items} offerCatalog={offerCatalog} locations={locations} profile={profile} result={result} />)}
          {data && (page > 1 || page * data.limit < data.total) &&
            <nav className="partner-pagination" aria-label="صفحه‌بندی">
              {page > 1 && <Link href={partnerHref(section) + '&page=' + (page - 1)}>صفحهٔ قبل</Link>}
              <span>{number.format(page)}</span>
              {page * data.limit < data.total && <Link href={partnerHref(section) + '&page=' + (page + 1)}>صفحهٔ بعد</Link>}
            </nav>}
        </section>
      </div>
    </div>
  </div>;
}
