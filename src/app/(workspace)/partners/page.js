import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import PartnerProfile, { PartnerProfileEditor } from '../../../components/Partners/PartnerProfile';
import PartnerDashboard from '../../../components/Partners/PartnerDashboard';
import { sections } from '../../../components/Partners/workspaceSections';
import { loginMessages } from '../../../lib/loginMessages';
import { partnerBackend, partnerSessionCookie } from '../../../lib/partnerBackend';
import { readCatalog } from '../../../components/Products/catalog-data';

export const metadata = { title: 'فروشندگان و همکاران ساری‌چین', robots: { index: false, follow: true } };

export default async function PartnersPage({ searchParams }) {
  const { login, returnTo, section: selected, page: requestedPage, result: feedback, status: selectedStatus, order: selectedOrder } = await searchParams;
  const returnToCart = returnTo === 'cart';
  const section = typeof selected === 'string' && Object.hasOwn(sections, selected) ? selected : 'overview';
  const page = typeof requestedPage === 'string' && /^[1-9]\d{0,3}$/.test(requestedPage) ? Number(requestedPage) : 1;
  const status = ['current', 'completed', 'returned', 'cancelled'].includes(selectedStatus) ? selectedStatus : 'current';
  const orderId = typeof selectedOrder === 'string' && /^[a-f0-9]{64}$/.test(selectedOrder) ? selectedOrder : '';
  if (typeof login === 'string' && Object.hasOwn(loginMessages, login)) {
    return <PartnerProfile returnToCart={returnToCart} initialMessage={loginMessages[login]} />;
  }
  const token = (await cookies()).get(partnerSessionCookie)?.value;
  if (!token) return <PartnerProfile returnToCart={returnToCart} />;

  let profile;
  try {
    const result = await partnerBackend('/web/profile', { token });
    if (result.status === 401) return <PartnerProfile returnToCart={returnToCart} initialMessage="نشست پایان یافته است. دوباره وارد شوید." />;
    if (result.ok) profile = await result.json();
  } catch {
    // The login form offers a way to retry when the backend is unavailable.
  }
  if (!profile) return <PartnerProfile returnToCart={returnToCart} initialMessage="دریافت پروفایل انجام نشد. دوباره تلاش کنید." />;

  if (returnToCart) redirect('/cart');

  let data;
  let dataError = '';
  let overviewData = null;
  const canOffer = section === 'products' && profile.capabilities?.sell === true;
  if (section === 'bulletin' && !profile.capabilities?.drive) redirect('/partners?section=profile');
  if (section === 'products' && !profile.capabilities?.sell) redirect('/partners?section=profile');
  const offerCatalog = canOffer ? await readCatalog() : null;
  const upgradeCatalog = section === 'profile' ? await readCatalog() : null;
  const upgradeCategories = upgradeCatalog ? Object.entries(upgradeCatalog.categories)
    .filter(([, category]) => category.parentId)
    .map(([id, category]) => ({ _id: id, name: category.name, parentId: category.parentId })) : [];
  const allowedCategoryIds = new Set(profile.allowedProductCategoryIds || []);
  const producerCategories = offerCatalog ? Object.fromEntries(Object.entries(offerCatalog.categories)
    .filter(([id]) => allowedCategoryIds.has(id))) : {};
  const producerProducts = offerCatalog ? offerCatalog.catalog.flatMap(product => [product, ...product.variants])
    .filter(product => allowedCategoryIds.has(product.category))
    .map(({ id, name, code, brand, brandId, category, unit }) => ({ id, name, code, brand, brandId, category, unit })) : [];
  const locations = canOffer ? partnerBackend('/web/workspace/orchards/options', { token })
    .then(response => response.ok ? response.json() : null).catch(() => null) : null;
  const isList = section !== 'overview' && section !== 'profile';
  if (isList) {
    try {
      const path = section === 'orders' ? '/web/orders' : section === 'bulletin' ? '/web/transport-orders' : section === 'wallet' ? '/web/karsha' : section === 'fulfillment' ? '/web/workspace/seller-orders' : '/web/workspace/' + section;
      const query = new URLSearchParams({ page, limit: 10, ...(section === 'orders' && { status }), ...(section === 'fulfillment' && { status: 'active' }) });
      const result = await partnerBackend(path, { token, query: query.toString() });
      if (result.status === 401) return <PartnerProfile returnToCart={returnToCart} initialMessage="نشست پایان یافته است. دوباره وارد شوید." />;
      if (result.ok) {
        data = await result.json();
      } else {
        const problem = await result.json().catch(() => null);
        dataError = typeof problem?.message === 'string'
          ? problem.message
          : `دریافت اطلاعات از سرور ناموفق بود (HTTP ${result.status}).`;
      }
    } catch (failure) {
      console.error('[partners] Failed to load section:', section, failure);
      dataError = failure?.name === 'TimeoutError' || failure?.name === 'AbortError'
        ? 'پاسخ سرور بیش از زمان مجاز طول کشید. وضعیت اجرای بک‌اند را بررسی کنید.'
        : 'ارتباط با بک‌اند برقرار نشد. آدرس BACKEND_URL و روشن بودن سرویس بک‌اند را بررسی کنید.';
    }
  }
  if (section === 'overview') {
    const requests = [
      partnerBackend('/web/workspace/seller-orders', { token, query: 'page=1&limit=100&status=active' }),
      profile.producerType ? partnerBackend('/web/workspace/products', { token, query: 'page=1&limit=100' }) : Promise.resolve(null),
      profile.producerType ? partnerBackend('/web/workspace/orchards', { token, query: 'page=1&limit=100' }) : Promise.resolve(null),
      profile.serviceTypes?.includes('driver') ? partnerBackend('/web/workspace/transport/vehicle', { token }) : Promise.resolve(null),
    ];
    const [sellerResult, offersResult, locationsResult, vehicleResult] = await Promise.all(requests.map(p => p.catch(() => null)));
    overviewData = {
      sellerOrders: sellerResult?.ok ? await sellerResult.json() : { items: [], total: 0, counts: {} },
      offers: offersResult?.ok ? await offersResult.json() : null,
      locations: locationsResult?.ok ? await locationsResult.json() : null,
      vehicle: vehicleResult?.ok ? await vehicleResult.json() : null,
    };
  }
  let orderDetail;
  if (section === 'orders' && orderId) {
    try {
      const detail = await partnerBackend('/web/orders/' + orderId, { token });
      if (detail.ok) orderDetail = await detail.json();
    } catch {
      orderDetail = null;
    }
  }
  return <PartnerDashboard profile={profile} section={section} data={data} dataError={dataError} page={page} result={feedback}
    selectedStatus={status} selectedOrder={orderId} orderDetail={orderDetail} locations={await locations} overviewData={overviewData} unavailable={isList && !data}>
    {section === 'profile' && <PartnerProfileEditor initialProfile={profile} categories={upgradeCategories} />}
  </PartnerDashboard>;
}
