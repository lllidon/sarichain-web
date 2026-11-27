import { formatPrice } from '../Products/price';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faBorderAll, faBox, faBullhorn, faClipboardList, faLeaf, faMessage, faUserPen, faWallet, faTruckFast, faCircleCheck, faClipboardCheck, faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { importProductOffers, leaveWorkspace, saveProductOfferLocation, saveWorkspaceEntry, updateSellerOrderStatus } from '../../app/(workspace)/partners/actions';
import { locationTypes, partnerHref, sections } from './workspaceSections';
import ProductOfferForm from './ProductOfferForm';
import WorkspaceLocationForm from './WorkspaceLocationForm';
import TransportBulletin from './TransportBulletin';
import PartnerOfferExcelActions from './PartnerOfferExcelActions';
import './PartnerDashboard.css';

const icons = {
  grid: faBorderAll, orders: faClipboardList, fulfillment: faTruckFast, products: faBox, wallet: faWallet,
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


function WorkspaceEntries({ section, items, offerCatalogAvailable, producerCategories, producerProducts, producerBrands, locations, profile, result }) {
  const { entry, placeholder, help } = sections[section];
  const action = saveWorkspaceEntry.bind(null, section);
  const isLocation = section === 'orchards';
  const formKey = result === 'saved' ? items[0]?.id : undefined;
  return <div className={isLocation ? 'partner-entry-layout partner-location-layout' : 'partner-entry-layout'}>
    {isLocation ? <WorkspaceLocationForm key={formKey} profile={profile} /> :
      section === 'products' ? offerCatalogAvailable ?
      <ProductOfferForm key={formKey} locations={locations} categories={producerCategories} brands={producerBrands}
        products={producerProducts} /> :
      <div className="partner-empty"><p>کاتالوگ موقتاً در دسترس نیست.</p>
        <Link href={partnerHref('products')}>تلاش دوباره</Link>
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



const serviceLabels = {
  driver: 'راننده و حمل‌ونقل', warehouse: 'انبارداری', harvest: 'برداشت محصول',
  labor: 'نیروی کار', supervisor: 'ناظر خدمات', quality: 'کنترل کیفیت', other: 'سایر خدمات',
};
const producerLabels = { orchard: 'باغدار', farm: 'کشاورز', dairy: 'دامدار و لبنیات', greenhouse: 'گلخانه‌دار', other: 'تولیدکننده' };
const reviewLabels = { pending: 'در انتظار بررسی', approved: 'تأیید شده', rejected: 'نیازمند اصلاح' };
const sellerSteps = [
  ['pending', 'accepted', 'در انتظار بررسی', 'پذیرفتن سفارش'],
  ['accepted', 'preparing', 'پذیرفته‌شده', 'شروع آماده‌سازی'],
  ['preparing', 'ready', 'در حال آماده‌سازی', 'آماده تحویل به حمل'],
  ['ready', 'handed_over', 'آماده تحویل به حمل', 'ثبت تحویل به حمل‌کننده'],
];
function SellerOrderCard({ order }) {
  const step = sellerSteps.find(row => row[0] === order.status);
  return <article className="seller-order-card">
    <header><div><span>سفارش</span><strong><bdi>{order.orderNumber || order.id.slice(0, 12)}</bdi></strong><small>{orderDateTime(order.createdAt)}</small></div>
      <span className={'seller-fulfillment-state state-' + order.status}>{order.statusLabel}</span></header>
    <div className="seller-order-buyer"><span>مشتری</span><strong>{order.buyer?.name || 'مشتری ساری‌چین'}</strong>
      {(order.buyer?.city || order.buyer?.province) && <small>{[order.buyer.city, order.buyer.province].filter(Boolean).join('، ')}</small>}</div>
    <ul className="seller-order-lines">{(order.items || []).map(line => <li key={line.id}>
      <span>{line.name}</span><strong>{number.format(line.quantity)} {line.unitName || line.unit || 'واحد'}</strong>
    </li>)}</ul>
    <div className="seller-order-foot"><span>{number.format(order.itemCount)} قلم کالا</span><strong>{money(order.total)} کارسا</strong></div>
    {order.delivery?.dispatchDate && <p className="seller-order-delivery">زمان ارسال: {order.delivery.dispatchDate}{order.delivery.slot ? ' · ' + order.delivery.slot : ''}</p>}
    {step && <form action={updateSellerOrderStatus} className="seller-order-action">
      <input type="hidden" name="orderId" value={order.id}/>
      <input type="hidden" name="status" value={step[1]}/>
      <button className="partner-primary" disabled={step[1] === 'preparing' && !order.allowedToPrepare}>
        {step[1] === 'preparing' && !order.allowedToPrepare ? 'در انتظار تأیید سفارش یا پرداخت' : step[2] === 'در انتظار بررسی' ? 'پذیرش سفارش' : step[3]}
      </button>
    </form>}
    {!step && <p className="seller-order-done"><FontAwesomeIcon icon={faCircleCheck}/> تحویل به حمل‌کننده ثبت شده است.</p>}
  </article>;
}
function SellerOrders({ data, selectedStatus = 'active' }) {
  const tabs = [['active','در جریان',data?.counts?.active || 0],['completed','تحویل به حمل',data?.counts?.handed_over || 0]];
  return <section className="seller-fulfillment">
    <div className="seller-fulfillment-intro"><div><h2>سفارش‌هایی که باید آماده و تحویل دهید</h2>
      <p>فقط اقلامی نمایش داده می‌شود که از عرضه‌های ثبت‌شده توسط حساب شما خریداری شده‌اند.</p></div>
      <div className="seller-fulfillment-total"><strong>{number.format(data?.counts?.active || 0)}</strong><span>سفارش فعال</span></div>
    </div>
    <nav className="seller-fulfillment-tabs" aria-label="فیلتر سفارش‌های قابل پردازش">{tabs.map(([key,label,count])=><Link key={key} href={partnerHref('fulfillment') + '&fulfillmentStatus=' + key} className={selectedStatus===key?'active':''} aria-current={selectedStatus===key?'page':undefined}>{label}<b>{number.format(count)}</b></Link>)}</nav>
    {!data?.items?.length ? <div className="partner-empty"><p>{selectedStatus === 'completed' ? 'هنوز سفارشی به حمل‌کننده تحویل نشده است.' : 'در حال حاضر سفارش قابل پردازشی برای عرضه‌های شما ثبت نشده است.'}</p>
      <Link href={partnerHref('products')}>مدیریت عرضه‌های من</Link></div> :
      <div className="seller-order-grid">{data.items.map(order=><SellerOrderCard key={order.id} order={order}/>)}</div>}
  </section>;
}
function DashboardOverview({ profile, overviewData }) {
  const orders = overviewData?.sellerOrders || { items: [], counts: {}, total: 0 };
  const offers = overviewData?.offers?.total ?? 0;
  const locations = overviewData?.locations?.total ?? 0;
  const tasks = [];
  const addTask = (id,title,description,href,priority='normal') => tasks.push({id,title,description,href,priority});
  if (!profile.fullName || !profile.city || !profile.email) addTask('profile','تکمیل اطلاعات پایه','نام، شهر و راه ارتباطی حساب را بررسی کنید.',partnerHref('profile'),'high');
  if (!profile.customerType) addTask('buyer','تعیین نوع مشتری','نوع خرید خود را مشخص کنید تا خدمات متناسب نمایش داده شود.',partnerHref('profile'));
  else if (!profile.deliveryAddresses?.length) addTask('delivery-address','ثبت نشانی تحویل','برای خرید و دریافت سفارش، دست‌کم یک نشانی تحویل ثبت کنید.',partnerHref('profile'));
  if (profile.producerType) {
    if (!profile.productionActivity) addTask('production-activity','تکمیل شرح فعالیت تولیدی','نوع محصول یا فعالیت تولیدی خود را دقیق‌تر معرفی کنید.',partnerHref('profile'));
    if (profile.sellerStatus === 'pending') addTask('seller-review','تأیید نقش تولیدکننده','درخواست تولیدکنندگی در انتظار بررسی مدیریت است.',partnerHref('profile'));
    else if (profile.sellerStatus === 'rejected') addTask('seller-fix','اصلاح مدارک تولیدکننده','درخواست تولیدکنندگی نیازمند اصلاح یا تکمیل اطلاعات است.',partnerHref('profile'),'high');
    else if (profile.sellerStatus === 'approved') {
      if (!locations) addTask('location','ثبت محل تولید یا بارگیری','برای عرضه محصولات، باغ، مزرعه، دامداری یا انبار خود را ثبت کنید.',partnerHref('orchards'),'high');
      if (!offers) addTask('offer','ثبت اولین عرضه محصول','محصول، قیمت و موجودی قابل فروش خود را معرفی کنید.',partnerHref('products'));
      else if ((overviewData?.offers?.items || []).some(item => item.offer && !item.offer.locationTitle)) addTask('offer-location','تعیین محل بارگیری عرضه‌ها','برای عرضه‌های ثبت‌شده، محل بارگیری را مشخص کنید تا هماهنگی حمل دقیق‌تر انجام شود.',partnerHref('products'));
    }
  }
  const services = profile.serviceTypes || [];
  if (services.length) {
    if (!profile.serviceArea) addTask('service-area','تعیین محدوده فعالیت خدماتی','استان‌ها یا شهرهایی را که در آن خدمات ارائه می‌کنید ثبت کنید.',partnerHref('profile'));
    if (services.includes('driver')) {
      if (!overviewData?.vehicle?.vehicle) addTask('vehicle','ثبت مشخصات وسیله نقلیه','اطلاعات خودرو و مدارک رانندگی را تکمیل کنید.',partnerHref('profile'),'high');
      else if (profile.driverStatus === 'pending') addTask('driver-review','تأیید مدارک راننده','مدارک رانندگی در انتظار بررسی است.',partnerHref('profile'));
      else if (profile.driverStatus === 'rejected') addTask('driver-fix','اصلاح مدارک راننده','مدارک رانندگی نیازمند اصلاح است.',partnerHref('profile'),'high');
    }
    if (services.some(type => ['supervisor','quality'].includes(type))) {
      if (!profile.serviceCredential) addTask('specialist-credential','ثبت مدرک یا تخصص','مدرک یا توضیح صلاحیت تخصصی خود را تکمیل کنید.',partnerHref('profile'),'high');
      if (profile.specialistStatus === 'pending') addTask('specialist-review','تأیید صلاحیت تخصصی','مدارک ناظر یا کنترل کیفیت در انتظار بررسی است.',partnerHref('profile'));
      else if (profile.specialistStatus === 'rejected') addTask('specialist-fix','اصلاح مدارک تخصصی','اطلاعات صلاحیت تخصصی را بازبینی کنید.',partnerHref('profile'),'high');
    }
  }
  (orders.items || []).filter(order => order.status !== 'handed_over').slice(0,5).forEach(order => {
    const stage = sellerSteps.find(row=>row[0]===order.status);
    addTask('order-'+order.id, (stage?.[3] || 'پیگیری سفارش') + ' · ' + (order.orderNumber || order.id.slice(0,8)),
      (order.items || []).map(item=>item.name).slice(0,2).join('، '),partnerHref('fulfillment'),'high');
  });
  const roles = [
    profile.customerType && {label:({consumer:'مشتری نهایی',retailer:'خرده‌فروش',wholesaler:'خریدار عمده',other:'مشتری'})[profile.customerType] || 'مشتری',tone:'buyer'},
    profile.producerType && {label:producerLabels[profile.producerType] || 'تولیدکننده',tone:'producer'},
    ...services.map(type=>({label:serviceLabels[type] || type,tone:'service'})),
  ].filter(Boolean);
  const activeOrders = orders.counts?.active || 0;
  return <div className="partner-overview">
    <section className="partner-overview-hero">
      <div><span className="partner-overview-eyebrow">میز کار ساری‌چین</span><h2>{profile.fullName ? profile.fullName + '، خوش آمدید' : 'به پنل ساری‌چین خوش آمدید'}</h2>
        <p>وضعیت فعالیت‌ها، سفارش‌ها و کارهای بعدی شما در یک نگاه.</p>
        <div className="partner-role-chips">{roles.length ? roles.map((role,index)=><span key={index} className={'role-'+role.tone}>{role.label}</span>) : <span>حساب کاربری</span>}</div>
      </div>
      <Link href={partnerHref('profile')} className="partner-overview-edit">ویرایش پروفایل <FontAwesomeIcon icon={faArrowUpRightFromSquare}/></Link>
    </section>
    <section className="partner-overview-stats">
      <Link href={partnerHref('fulfillment')}><span>سفارش‌های در جریان</span><strong>{number.format(activeOrders)}</strong><small>نیازمند اقدام شما</small></Link>
      <Link href={partnerHref('fulfillment')}><span>در انتظار بررسی</span><strong>{number.format(orders.counts?.pending || 0)}</strong><small>سفارش جدید</small></Link>
      <Link href={partnerHref('fulfillment')}><span>در حال آماده‌سازی</span><strong>{number.format(orders.counts?.preparing || 0)}</strong><small>در حال انجام</small></Link>
      {profile.producerType ? <Link href={partnerHref('products')}><span>عرضه‌های فعال</span><strong>{number.format(offers)}</strong><small>محصولات ثبت‌شده</small></Link> : <Link href={partnerHref('profile')}><span>کارهای نیازمند پیگیری</span><strong>{number.format(tasks.length)}</strong><small>پیش‌نیازهای حساب</small></Link>}
    </section>
    <div className="partner-overview-columns">
      <section className="partner-task-panel"><header><div><h3>کارهای بعدی من</h3><p>اقدام‌هایی که برای تکمیل فعالیت یا پیشبرد سفارش لازم است</p></div><span>{number.format(tasks.length)} مورد</span></header>
        {!tasks.length ? <div className="partner-task-empty"><FontAwesomeIcon icon={faCircleCheck}/><strong>همه‌چیز مرتب است</strong><p>در حال حاضر اقدام ضروری ثبت نشده است.</p></div> :
          <ul>{tasks.map(task=><li key={task.id} className={task.priority==='high'?'priority-high':''}>
            <span className="partner-task-marker"><FontAwesomeIcon icon={faClipboardCheck}/></span>
            <div><strong>{task.title}</strong><p>{task.description}</p></div><Link href={task.href}>پیگیری <FontAwesomeIcon icon={faArrowLeft}/></Link>
          </li>)}</ul>}
      </section>
      <section className="partner-role-panel"><header><h3>وضعیت نقش‌ها و پیش‌نیازها</h3><Link href={partnerHref('profile')}>مشاهده پروفایل</Link></header>
        <div className="partner-role-status"><span>خریدار</span><strong>{profile.customerType ? 'فعال' : 'اطلاعات ناقص'}</strong></div>
        {profile.producerType && <div className="partner-role-status"><span>{producerLabels[profile.producerType] || 'تولیدکننده'}</span><strong>{reviewLabels[profile.sellerStatus] || 'در انتظار ثبت درخواست'}</strong></div>}
        {services.map(type=><div className="partner-role-status" key={type}><span>{serviceLabels[type] || type}</span><strong>{type==='driver' ? (reviewLabels[profile.driverStatus] || (overviewData?.vehicle?.vehicle ? 'در انتظار بررسی' : 'نیازمند ثبت وسیله')) : ['supervisor','quality'].includes(type) ? (reviewLabels[profile.specialistStatus] || 'در انتظار بررسی') : 'ثبت‌شده'}</strong></div>)}
        <div className="partner-role-status"><span>اطلاعات پایه</span><strong>{profile.fullName && profile.city ? 'تکمیل' : 'نیازمند تکمیل'}</strong></div>
        <div className="partner-role-status"><span>موقعیت‌های ثبت‌شده</span><strong>{number.format(locations)}</strong></div>
      </section>
    </div>
    <section className="partner-overview-latest"><header><h3>سفارش‌های نیازمند پیگیری</h3><Link href={partnerHref('fulfillment')}>مشاهده همه سفارش‌ها ←</Link></header>
      {orders.items?.length ? <div className="seller-order-grid">{orders.items.slice(0,2).map(order=><SellerOrderCard key={order.id} order={order}/>)}</div> :
        <div className="partner-task-empty"><p>سفارشی برای عرضه‌های شما ثبت نشده است.</p><Link href={partnerHref('products')}>مدیریت عرضه‌ها</Link></div>}
    </section>
  </div>;
}

function KarshaWallet({ wallet }) {
  const precise = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 8 });
  const transactionLabels = {
    credit: 'افزایش کارسا', migration: 'انتقال موجودی قبلی', onboarding: 'هدیه تکمیل مدارک', debit: 'کاهش کارسا',
    purchase: 'پرداخت خرید', conversion: 'تبدیل به تومان', decay: 'کاهش ماهانه',
    admin_adjustment: 'اصلاح مدیریتی', admin_debit: 'کاهش مدیریتی',
  };
  const signed = value => (Number(value) > 0 ? '+' : '') + precise.format(Number(value || 0));
  return <div className="karsha-wallet">
    <section className="karsha-wallet-balance">
      <div><span>موجودی قابل استفاده</span><strong>{precise.format(wallet?.balance ?? 0)} <small>کارسا</small></strong></div>
      <div><span>معادل تومانی با نرخ ثبت‌شده</span><strong>{wallet?.equivalentToman == null ? 'نرخ تعیین نشده' : money(wallet.equivalentToman) + ' تومان'}</strong></div>
    </section>
    <section className="karsha-wallet-stats">
      <article><span>نرخ هر کارسا</span><strong>{wallet?.rateTomanPerKarsha == null ? 'تعیین نشده' : money(wallet.rateTomanPerKarsha) + ' تومان'}</strong></article>
      <article><span>کاهش سالانه</span><strong>۰٫۲٪</strong></article>
      <article><span>کاهش ماهانه مرکب</span><strong>{precise.format((wallet?.monthlyDecayRate ?? 0) * 100)}٪</strong></article>
      <article><span>ماهگرد بعدی</span><strong>{wallet?.nextDecayAt ? dateTime.format(new Date(wallet.nextDecayAt)) : '—'}</strong></article>
    </section>
    <section className="karsha-wallet-lots">
      <header><h3>واریزهای مصرف‌نشده</h3><small>مصرف به ترتیب قدیمی‌ترین واریز (FIFO)</small></header>
      {!wallet?.lots?.length ? <p className="partner-empty">هنوز سهمیه کارسای فعالی ثبت نشده است.</p> :
        <div className="karsha-lot-list">{wallet.lots.map(lot => <article key={String(lot.id)}>
          <div><strong>{lot.source === 'onboarding' ? 'هدیه تکمیل مدارک' : lot.source === 'legacy_migration' ? 'موجودی قبلی' : 'واریز کارسا'}</strong>
            <small>تاریخ واریز: {orderDateTime(lot.createdAt)}</small></div>
          <div><b>{precise.format(lot.remainingAmount)} کارسا</b><small>از {precise.format(lot.originalAmount)} · ماهگرد بعدی: {orderDateTime(lot.nextDecayAt)}</small></div>
        </article>)}</div>}
    </section>
    <section className="karsha-wallet-history">
      <header><h3>تاریخچه افزایش و کاهش کارسا</h3><small>آخرین ۲۰ تراکنش</small></header>
      {!wallet?.transactions?.length ? <p className="partner-empty">تراکنشی ثبت نشده است.</p> :
        <div className="karsha-transaction-list">{wallet.transactions.map(item => <article key={String(item._id)}>
          <div><strong>{transactionLabels[item.type] || item.type}</strong><small>{item.reason || '—'} · {orderDateTime(item.createdAt)}</small></div>
          <div className={Number(item.amount) >= 0 ? 'positive' : 'negative'}><b>{signed(item.amount)} کارسا</b><small>مانده: {precise.format(item.balanceAfter ?? 0)}</small></div>
        </article>)}</div>}
    </section>
    <p className="karsha-wallet-note">کاهش ماهانه فقط از مانده مصرف‌نشده هر واریز و پس از ماهگرد همان واریز محاسبه می‌شود. نرخ تبدیل در زمان هر تراکنش ثبت می‌شود.</p>
  </div>;
}

export default function PartnerDashboard({ profile, section, result, data, dataError, unavailable, page, offerCatalogAvailable, producerCategories, producerProducts, producerBrands, locations, overviewData, selectedStatus, selectedFulfillmentStatus, selectedOrder, orderDetail, children }) {
  const info = sections[section];
  const visibleSections = Object.entries(sections).filter(([key]) => key !== 'products' || profile.capabilities?.sell)
    .filter(([key]) => key !== 'bulletin' || profile.capabilities?.drive);
  const message = result === 'updated' ? 'مرحله سفارش با موفقیت به‌روزرسانی شد.' : result === 'conflict' ? 'این مرحله هنوز قابل انجام نیست؛ وضعیت سفارش یا پرداخت را بررسی کنید.' : result === 'forbidden' ? 'دسترسی لازم برای این عملیات فعال نیست.' : result === 'saved' && section === 'bulletin' ? 'درخواست حمل برای بررسی مدیریت ثبت شد.'
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
            <Link href={partnerHref('wallet')}><span>مانده کارسای مشتری</span></Link>
            <strong>{number.format(profile.karshaBalance ?? 0)} کارسا</strong>
            {profile.onboardingKarshaAwarded
              ? <small>هدیه تکمیل و تأیید مدارک به اعتبار شما افزوده شده است.</small>
              : <small>با تکمیل مدارک و تأیید اولین درخواست، ۱ کارسا هدیه دریافت می‌کنید.</small>}
            {!profile.onboardingKarshaAwarded && <Link href={partnerHref('profile')}>تکمیل مدارک و دریافت هدیه ←</Link>}
          </div>
          <nav aria-label="منوی اصلی پنل ساری‌چین">
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
          {section === 'overview' && <DashboardOverview profile={profile} overviewData={overviewData} />}
          {section === 'profile' && children}
          {section === 'wallet' && <KarshaWallet wallet={data} />}
          {section === 'fulfillment' && <SellerOrders data={data} selectedStatus={selectedFulfillmentStatus} />}
          {unavailable && <div className="partner-empty" role="alert"><p>دریافت اطلاعات انجام نشد.</p>{dataError && <p>{dataError}</p>}<Link href={partnerHref(section)}>تلاش دوباره</Link></div>}
          {section === 'bulletin' ? <TransportBulletin items={data?.items || []} /> : data && !['wallet', 'fulfillment'].includes(section) && (section === 'orders' ? <Orders items={data.items} counts={data.counts} selectedStatus={selectedStatus || 'current'} selectedOrder={selectedOrder} orderDetail={orderDetail} /> :
            <WorkspaceEntries section={section} items={data.items} offerCatalogAvailable={offerCatalogAvailable}
              producerCategories={producerCategories} producerProducts={producerProducts} producerBrands={producerBrands}
              locations={locations} profile={profile} result={result} />)}
          {data && (page > 1 || page * data.limit < data.total) &&
            <nav className="partner-pagination" aria-label="صفحه‌بندی">
              {page > 1 && <Link href={partnerHref(section) + (section === 'orders' ? '&status=' + (selectedStatus || 'current') : section === 'fulfillment' ? '&fulfillmentStatus=' + (selectedFulfillmentStatus || 'active') : '') + '&page=' + (page - 1)}>صفحهٔ قبل</Link>}
              <span>{number.format(page)}</span>
              {page * data.limit < data.total && <Link href={partnerHref(section) + (section === 'orders' ? '&status=' + (selectedStatus || 'current') : '') + '&page=' + (page + 1)}>صفحهٔ بعد</Link>}
            </nav>}
        </section>
      </div>
    </div>
  </div>;
}
