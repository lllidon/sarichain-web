import { NextResponse } from 'next/server';
import { readCatalog } from '../../../components/Products/catalog-data';
import { cartCookie, cartFitsCookie, cartLineId, catalogQuantityLimit, parseCart, serializeCart } from '../../../components/Products/cartData';
import { productHref, productPackages, withOffer } from '../../../components/Products/catalog';

function redirect(location) {
  return new NextResponse(null, { status: 303, headers: { Location: location, 'Cache-Control': 'no-store' } });
}

export async function POST(request) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host') || request.nextUrl.host;
  if (request.headers.get('sec-fetch-site') === 'cross-site' ||
      (origin && !['http://' + host, 'https://' + host].includes(origin))) {
    return redirect('/cart?notice=rejected');
  }
  let input;
  try {
    input = await request.formData();
  } catch {
    return redirect('/cart?notice=rejected');
  }
  const { catalog, unavailable } = await readCatalog();
  if (unavailable) return redirect('/cart?notice=unavailable');
  const id = input.get('productId');
  const item = catalog.flatMap(item => [item, ...item.variants]).find(item => item.id === id);
  if (!item) return redirect('/cart?notice=unavailable');
  const requestedOffer = input.get('offerId');
  const offer = requestedOffer === null ? item.offer : item.offers.find(option => option.id === requestedOffer);
  const product = withOffer(item, offer);
  if (!product.orderable) return redirect('/cart?notice=unavailable');
  const pack = productPackages(product).find(item => item.id === (input.get('unitId') || 'unit'));
  const operation = input.get('operation');
  if (!pack || !['add', 'reduce'].includes(operation)) return redirect('/cart?notice=rejected');

  const items = parseCart(request.cookies.get(cartCookie)?.value);
  const key = cartLineId(product.id, pack.id, offer.id);
  const current = items.find(item => item.id === key)?.quantity ?? 0;
  const quantity = operation === 'add' ? current + 1 : Math.max(0, current - 1);
  if (operation === 'add' && quantity > catalogQuantityLimit(items, product, pack, catalog)) return redirect('/cart?notice=limit');

  const updated = items.filter(item => item.id !== key);
  if (quantity) updated.push({ productId: product.id, packId: pack.id, quantity, offerId: offer.id });
  if (!cartFitsCookie(updated)) return redirect('/cart?notice=limit');
  const params = new URLSearchParams({ unit: pack.id, offer: offer.id });
  if (product.parentCode) params.set('variant', product.code);
  const result = redirect(productHref(product) + '?' + params);
  result.cookies.set(cartCookie, serializeCart(updated), {
    path: '/', sameSite: 'lax', maxAge: 2592000, secure: origin ? origin.startsWith('https://') : request.nextUrl.protocol === 'https:',
  });
  return result;
}
