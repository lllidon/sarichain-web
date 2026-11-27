import { formatPrice } from '../Products/price';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBorderAll, faBox, faBullhorn, faClipboardList, faLeaf, faMessage, faUserPen } from '@fortawesome/free-solid-svg-icons';
import { importProductOffers, leaveWorkspace, saveProductOfferLocation, saveWorkspaceEntry } from '../../app/(workspace)/partners/actions';
import { locationTypes, partnerHref, sections } from './workspaceSections';
import ProductOfferForm from './ProductOfferForm';
import WorkspaceLocationForm from './WorkspaceLocationForm';
import TransportBulletin from './TransportBulletin';
import PartnerOfferExcelActions from './PartnerOfferExcelActions';
import './PartnerDashboard.css';

const icons = {
  grid: faBorderAll, orders: faClipboardList, products: faBox,
  bulletin: faBullhorn, orchards: faLeaf, advisory: faMessage, profile: faUserPen,
};
const feedback = {
  saved: 'رکورد ثبت شد.', locationSaved: 'موقعیت بارگیری عرضه به‌روزرسانی شد.', locationError: 'به‌روزرسانی موقعیت بارگیری انجام نشد.', partial: 'بخشی از ردیف‌ها به‌روزرسانی شد؛ ردیف‌های نامعتبر را بررسی کنید.', accepted: 'سفارش حمل با موفقیت پذیرفته شد.', removed: 'رکورد حذف شد.',
  invalid: 'لطفاً اطلاعات فرم را بررسی کنید.', error: 'عملیات انجام نشد. دوباره تلاش کنید.',
};
const statuses = { pending: 'در انتظار بررسی', confirmed: 'تأیید شده', processing: 'در حال آماده‌سازی', shipped: 'ارسال شده' };
const number = new Intl.NumberFormat('fa-IR');
const offerPrice = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 4 });
const date = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeZone: 'Asia/Tehran' });
const dateTime = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Tehran' });

const orderStatusLabels = {
  pending: 'ثبت سفارش',
  confirmed: 'تأیید شده',
  awaiting_inventory: 'در انتظار تأمین کالا',
  processing: 'در حال آماده‌سازی',
  shipped: 'ارسال شده',
  in_transit: 'در مسیر تحویل',
  awaiting_delivery: 'آماده تحویل',
  completed: 'تحویل شده',
  returned: 'مرجوع شده',
  refunded: 'مبلغ برگشت داده شده',
  cancelled: 'لغو شده',
  canceled: 'لغو شده',
};
const orderStatusTone = status => ['completed'].includes(status) ? 'done'
  : ['cancelled', 'canceled', 'returned', 'refunded'].includes(status) ? 'stopped'
  : ['shipped', 'in_transit', 'awaiting_delivery'].includes(status) ? 'shipping' : 'active';
const orderProgress = status => ({
  pending: 12, confirmed: 28, awaiting_inventory: 42, processing: 62,
  shipped: 82, in_transit: 91, awaiting_delivery: 96, completed: 100,
}[status] ?? 8);
const money = value => formatPrice({ min: Number(value || 0), max: Number(value || 0) });
const orderDateTime = value => value ? dateTime.format(new Date(value)) : '—';
const orderSubStatusLabels = {
  pending: 'در انتظار بررسی', unselected: 'انتخاب نشده', not_requested: 'درخواستی ثبت نشده',
  not_reserved: 'هنوز تأمین نشده', staged: 'تأمین و به انبار واسط منتقل شده',
  posted_to_accounting: 'در حسابداری ثبت شده', synced: 'همگام‌سازی شده',
  released: 'رزرو آزاد شده', delivered: 'تحویل شده', in_transit: 'در مسیر تحویل',
};
const orderEventLabels = {
  'order.created': 'سفارش ثبت شد',
  'checkout.request.received': 'درخواست سفارش دریافت شد',
  'checkout.products.validated': 'محصولات و موجودی بررسی شد',
  'checkout.order.persisted': 'سفارش در سامانه ثبت شد',
  'inventory.seller_stock_reservation.started': 'آغاز تأمین از فروشنده',
  'inventory.seller_stock_reservation.completed': 'تأمین کالا و انتقال به انبار واسط انجام شد',
  'accounting.posting.started': 'ثبت حسابداری آغاز شد',
  'inventory.reservation_release.completed': 'رزرو موجودی آزاد شد',
};

function OrderStatus({ status }) {
  return <span className={'partner-order-status ' + orderStatusTone(status)}>
    {orderStatusLabels[status] || 'در حال پیگیری'}
  </span>;
}

function OrderItems({ items, compact = false }) {
  return <ul className={compact ? 'partner-order-items compact' : 'partner-order-items'}>
    {items.map((item, index) => <li key={item._id || item.productId + ':' + item.unitId + ':' + index}>
      {item.image ? <img src={item.image} alt="" loading="lazy" /> : <span className="partner-order-item-placeholder">🌱</span>}
      <div className="partner-order-item-copy">
        <strong>{item.name}</strong>
        <small>{item.sku ? 'کد کالا: ' + item.sku + ' · ' : ''}{number.format(item.quantity)} {item.unitName || 'واحد'}</small>
        {!compact && item.specifications?.length > 0 && <span>{item.specifications.map(option => option.name + ': ' + option.value).join(' · ')}</span>}
      </div>
      <strong className="partner-order-item-price">{money(item.lineSubtotal?.max ?? item.unitPrice?.max * item.baseQuantity)}</strong>
    </li>)}
  </ul>;
}

function Orders({ items, counts = {}, selectedStatus = 'current', selectedOrder = '', orderDetail }) {
  const tabs = [
    ['current', 'جاری', counts.current || 0],
    ['completed', 'تحویل‌شده', counts.completed || 0],
    ['returned', 'مرجوع‌شده', counts.returned || 0],
    ['cancelled', 'لغوشده', counts.cancelled || 0],
  ];
  if (selectedOrder && !orderDetail) return <div className="partner-empty" role="alert"><p>دریافت جزئیات سفارش انجام نشد یا سفارش در دسترس نیست.</p><Link href={partnerHref('orders') + '&status=' + selectedStatus}>بازگشت به سفارش‌ها</Link></div>;
  if (orderDetail) {
    const status = orderDetail.status;
    const events = [...(orderDetail.events || []).map(event => ({
      label: orderEventLabels[event.type] || orderStatusLabels[event.toStatus] || event.type,
      at: event.occurredAt,
    })), ...(orderDetail.timeline || []).map(event => ({
      label: orderEventLabels[event.stage] || event.stage.replaceAll('.', ' · '),
      at: event.occurredAt,
    }))].sort((a, b) => new Date(a.at || 0) - new Date(b.at || 0));
    const delivery = orderDetail.delivery || {};
    return <section className="partner-order-detail">
      <Link className="partner-order-back" href={partnerHref('orders') + '&status=' + selectedStatus}>← بازگشت به سفارش‌ها</Link>
      <header className="partner-order-detail-head">
        <div><span>جزئیات سفارش</span><h2><bdi>{orderDetail.orderNumber || orderDetail._id}</bdi></h2>
          <small>تاریخ ثبت: {orderDateTime(orderDetail.createdAt)}</small></div>
        <OrderStatus status={status} />
      </header>
      <section className="partner-order-progress">
        <div className="partner-order-progress-label"><strong>وضعیت فعلی سفارش</strong><b>{orderStatusLabels[status] || 'در حال پیگیری'}</b></div>
        <div className="partner-order-progress-track"><span style={{ width: orderProgress(status) + '%' }} /></div>
        <small>آخرین به‌روزرسانی: {orderDateTime(orderDetail.updatedAt)}</small>
      </section>
      <section className="partner-order-detail-section">
        <h3>اقلام سفارش ({number.format(orderDetail.items?.length || 0)})</h3>
        <OrderItems items={orderDetail.items || []} />
      </section>
      <section className="partner-order-detail-section partner-order-facts">
        <h3>اطلاعات ارسال و پرداخت</h3>
        <dl>
          <div><dt>روش ارسال</dt><dd>{delivery.label || delivery.method || 'ثبت نشده'}</dd></div>
          <div><dt>نشانی تحویل</dt><dd>{delivery.addressSnapshot?.address || delivery.addressSnapshot?.title || 'در سفارش ثبت نشده'}</dd></div>
          <div><dt>وضعیت ارسال</dt><dd>{orderStatusLabels[orderDetail.meta?.shipping?.status] || orderSubStatusLabels[orderDetail.meta?.shipping?.status] || orderDetail.meta?.shipping?.status || 'در انتظار تعیین'}</dd></div>
          <div><dt>وضعیت تأمین کالا</dt><dd>{orderSubStatusLabels[orderDetail.meta?.inventory?.status || orderDetail.inventoryStatus] || orderDetail.meta?.inventory?.status || orderDetail.inventoryStatus || 'در انتظار تأمین'}</dd></div>
          <div><dt>وضعیت پرداخت</dt><dd>{orderSubStatusLabels[orderDetail.meta?.payment?.status] || orderDetail.meta?.payment?.status || 'در انتظار پرداخت'}</dd></div>
        </dl>
      </section>
      <section className="partner-order-detail-section">
        <h3>تاریخچه سفارش</h3>
        {events.length ? <ol className="partner-order-timeline">
          {events.map((event, index) => <li key={index}><span className="partner-order-timeline-dot" />
            <div><strong>{event.label}</strong><small>{orderDateTime(event.at)}</small></div>
          </li>)}
        </ol> : <p className="partner-order-muted">هنوز رویداد جدیدی برای این سفارش ثبت نشده است.</p>}
      </section>
      <section className="partner-order-total"><span>مبلغ نهایی سفارش</span><strong>{money(orderDetail.total)}</strong></section>
    </section>;
  }
  return <section className="partner-orders">
    <nav className="partner-order-tabs" aria-label="دسته‌بندی سفارش‌ها">
      {tabs.map(([key, label, count]) => <Link key={key}
        className={selectedStatus === key ? 'is-active' : ''}
        aria-current={selectedStatus === key ? 'page' : undefined}
        href={partnerHref('orders') + '&status=' + key}>
        <span>{label}</span><b>{number.format(count)}</b>
      </Link>)}
    </nav>
    {!items?.length ? <div className="partner-empty"><p>در این گروه سفارشی وجود ندارد.</p><Link href="/categories">مشاهده محصولات</Link></div> :
      <ul className="partner-order-list">
        {items.map(order => <li key={order._id} className="partner-order-card">
          <header className="partner-order-card-head">
            <div><span>شماره سفارش</span><strong><bdi>{order.orderNumber || order._id?.slice(0, 14)}</bdi></strong>
              <small>{orderDateTime(order.createdAt)}</small></div>
            <OrderStatus status={order.status} />
          </header>
          <div className="partner-order-card-meta">
            <span>مبلغ سفارش <strong>{money(order.total)}</strong></span>
            <span>{number.format(order.items?.length || order.itemCount || 0)} قلم کالا</span>
          </div>
          <OrderItems items={(order.items || []).slice(0, 3)} compact />
          {(order.items?.length || 0) > 3 && <small className="partner-order-more">و {number.format(order.items.length - 3)} قلم کالای دیگر</small>}
          <div className="partner-order-card-progress">
            <div className="partner-order-progress-track"><span style={{ width: orderProgress(order.status) + '%' }} /></div>
            <span>{orderStatusLabels[order.status] || 'در حال پیگیری'}</span>
          </div>
          <footer><Link href={partnerHref('orders') + '&status=' + selectedStatus + '&order=' + order._id}>مشاهده جزئیات سفارش ←</Link></footer>
        </li>)}
      </ul>}
  </section>;
}


function WorkspaceEntries({ section, items, offerCatalog, locations, profile, result }) {
  const { entry, placeholder, help } = sections[section];
  const action = saveWorkspaceEntry.bind(null, section);
  const isLocation = section === 'orchards';
  const formKey = result === 'saved' ? items[0]?.id : undefined;
  return <div className={isLocation ? 'partner-entry-layout partner-location-layout' : 'partner-entry-layout'}>
    {isLocation ? <WorkspaceLocationForm key={formKey} profile={profile} /> :
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
            {item.offer && !item.offer.locationTitle && <form className="partner-offer-location-form" action={saveProductOfferLocation}>
              <input type="hidden" name="offerId" value={item.id} />
              <label>تعیین موقعیت بارگیری برای محاسبه خودکار حمل
                <select name="locationId" required disabled={!locations?.length}>
                  <option value="">{locations?.length ? 'انتخاب باغ، مزرعه یا انبار' : 'ابتدا یک موقعیت مکانی ثبت کنید'}</option>
                  {locations?.map(location => <option key={location.id} value={location.id}>{location.title}{location.city ? ' · ' + location.city : ''}</option>)}
                </select>
              </label>
              {!locations?.length && <Link className="partner-location-link" href={partnerHref('orchards')}>ثبت موقعیت مکانی</Link>}
              <button className="partner-secondary" type="submit" disabled={!locations?.length}>ذخیره موقعیت بارگیری</button>
            </form>}
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

export default function PartnerDashboard({ profile, section, result, data, dataError, unavailable, page, offerCatalog, locations, selectedStatus, selectedOrder, orderDetail, children }) {
  const info = sections[section];
  const visibleSections = Object.entries(sections).filter(([key]) => key !== 'products' || profile.capabilities?.sell)
    .filter(([key]) => key !== 'bulletin' || profile.capabilities?.drive);
  const message = result === 'saved' && section === 'bulletin' ? 'درخواست حمل برای بررسی مدیریت ثبت شد.'
    : typeof result === 'string' && Object.hasOwn(feedback, result) ? feedback[result] : '';
  return <div className="catalog-page partners-page partner-dashboard" dir="rtl">
    <div className="catalog-wrap">
      <div className="partner-dash-shell">
        <aside className="partner-dash-sidebar">
          <div className="partner-dash-identity">
            <span className="partner-avatar" aria-hidden="true">{profile.fullName?.trim().slice(0, 1) || 'س'}</span>
            <div><strong>{profile.fullName || 'همکار ساری‌چین'}</strong><small>حساب ساری‌چین</small></div>
          </div>
          <div className="partner-kar-balance">
            <span>مانده کارسای مشتری</span>
            <strong>{number.format(profile.karshaBalance ?? 0)} کارسا</strong>
            {profile.onboardingKarshaAwarded
              ? <small>هدیه تکمیل و تأیید مدارک به اعتبار شما افزوده شده است.</small>
              : <small>با تکمیل مدارک و تأیید اولین درخواست، ۱ کارسا هدیه دریافت می‌کنید.</small>}
            {!profile.onboardingKarshaAwarded && <Link href={partnerHref('profile')}>تکمیل مدارک و دریافت هدیه ←</Link>}
          </div>
          <nav aria-label="منوی پنل همکاران">
            {visibleSections.map(([key, item]) => <Link key={key} href={partnerHref(key)}
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
            {section === 'products' && profile.capabilities?.sell && <PartnerOfferExcelActions importAction={importProductOffers} />}
          </header>
          {message && <p className="partner-dash-feedback" role={result === 'error' || result === 'invalid' ? 'alert' : 'status'}>{message}</p>}
          {section === 'overview' && <div className="partner-dash-grid">
            {visibleSections.filter(([key]) => key !== 'overview').map(([key, item]) => <Link key={key} href={partnerHref(key)} prefetch={false}>
              <span><FontAwesomeIcon icon={icons[item.icon]} /></span>
              <strong>{item.label}</strong><FontAwesomeIcon icon={faArrowLeft} />
            </Link>)}
          </div>}
          {section === 'profile' && children}
          {unavailable && <div className="partner-empty" role="alert"><p>دریافت اطلاعات انجام نشد.</p>{dataError && <p>{dataError}</p>}<Link href={partnerHref(section)}>تلاش دوباره</Link></div>}
          {section === 'bulletin' ? <TransportBulletin items={data?.items || []} /> : data && (section === 'orders' ? <Orders items={data.items} counts={data.counts} selectedStatus={selectedStatus || 'current'} selectedOrder={selectedOrder} orderDetail={orderDetail} /> :
            <WorkspaceEntries section={section} items={data.items} offerCatalog={offerCatalog} locations={locations} profile={profile} result={result} />)}
          {data && (page > 1 || page * data.limit < data.total) &&
            <nav className="partner-pagination" aria-label="صفحه‌بندی">
              {page > 1 && <Link href={partnerHref(section) + (section === 'orders' ? '&status=' + (selectedStatus || 'current') : '') + '&page=' + (page - 1)}>صفحهٔ قبل</Link>}
              <span>{number.format(page)}</span>
              {page * data.limit < data.total && <Link href={partnerHref(section) + (section === 'orders' ? '&status=' + (selectedStatus || 'current') : '') + '&page=' + (page + 1)}>صفحهٔ بعد</Link>}
            </nav>}
        </section>
      </div>
    </div>
  </div>;
}
