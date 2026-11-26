'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { partnerBackend, partnerSessionCookie } from '../../../lib/partnerBackend';
import { partnerHref, sections } from '../../../components/Partners/workspaceSections';

export async function saveWorkspaceEntry(section, formData) {
  const settings = Object.hasOwn(sections, section) ? sections[section] : null;
  if (!settings?.entry) return;
  const token = (await cookies()).get(partnerSessionCookie)?.value;
  if (!token) redirect('/partners');

  const href = partnerHref(section);
  const id = formData.get('id');
  const removing = id !== null;
  const title = formData.get('title');
  const details = formData.get('details');
  if (removing ? typeof id !== 'string' || !/^[a-f0-9]{24}$/i.test(id) :
    typeof title !== 'string' || !title.trim() || title.length > 120 ||
    typeof details !== 'string' || !details.trim() || details.length > 1000) redirect(href + '&result=invalid');

  let result;
  try {
    result = await partnerBackend('/web/workspace/' + section + (removing ? '/' + id : ''), {
      token, method: removing ? 'DELETE' : 'POST',
      body: removing ? undefined : JSON.stringify({ title, details }),
    });
  } catch {
    redirect(href + '&result=error');
  }
  if (result.status === 401) redirect('/partners');
  redirect(href + '&result=' + (result.ok ? removing ? 'removed' : 'saved' : 'error'));
}

export async function leaveWorkspace() {
  (await cookies()).delete(partnerSessionCookie);
  redirect('/partners');
}

function decimal(value, places) {
  if (typeof value !== 'string') return NaN;
  const normalized = value.trim().replace(/[۰-۹٠-٩]/g, digit => String(digit.charCodeAt(0) & 15)).replace('٫', '.');
  return new RegExp('^\\d+(?:\\.\\d{1,' + places + '})?$').test(normalized) ? Number(normalized) : NaN;
}

export async function saveProductOffer(_state, formData) {
  const token = (await cookies()).get(partnerSessionCookie)?.value;
  if (!token) redirect('/partners');
  const productId = formData.get('productId');
  const price = decimal(formData.get('price'), 4);
  const stock = decimal(formData.get('stock'), 3);
  const harvestDate = formData.get('harvestDate');
  const notes = formData.get('notes');
  const locationId = formData.get('locationId');
  const invalid = 'محصول، قیمت، موجودی و تاریخ برداشت را بررسی کنید.';
  if (typeof productId !== 'string' || !/^[a-f0-9]{24}$/.test(productId) ||
      !Number.isFinite(price) || price < 0.0001 || price > 1_000_000 ||
      !Number.isFinite(stock) || stock < 0 || stock > 1_000_000_000 ||
      typeof harvestDate !== 'string' || (harvestDate && !/^\d{4}-\d{2}-\d{2}$/.test(harvestDate)) ||
      typeof notes !== 'string' || notes.length > 1000 ||
      (locationId && (typeof locationId !== 'string' || !/^[a-f0-9]{24}$/.test(locationId)))) return invalid;
  let result;
  try {
    result = await partnerBackend('/web/workspace/products/offers', {
      token, method: 'POST', body: JSON.stringify({ productId, price, stock, harvestDate: harvestDate || undefined, notes, locationId: locationId || undefined }),
    });
  } catch {
    return 'ارتباط با سرور برقرار نشد. دوباره تلاش کنید.';
  }
  if (result.status === 401) redirect('/partners');
  if (result.status === 403) return 'ثبت عرضه برای حساب دارای نقش تولیدکننده فعال است.';
  if (result.status === 400) return invalid;
  if (!result.ok) return 'ثبت عرضه انجام نشد. دوباره تلاش کنید.';
  redirect(partnerHref('products') + '&result=saved');
}

export async function saveWorkspaceLocation(_state, formData) {
  const token = (await cookies()).get(partnerSessionCookie)?.value;
  if (!token) redirect('/partners');
  const body = new FormData();
  for (const field of ['title', 'type', 'provinceCode', 'cityCode', 'latitude', 'longitude', 'details']) {
    const value = formData.get(field);
    if (typeof value !== 'string') return 'اطلاعات موقعیت را بررسی کنید.';
    body.set(field, value);
  }
  if (!body.get('provinceCode') || !body.get('cityCode')) return 'استان و شهر را انتخاب کنید.';
  if (!body.get('latitude') || !body.get('longitude')) return 'نقطه را روی نقشه انتخاب کنید یا مختصات را وارد کنید.';
  const image = formData.get('image');
  if (image instanceof File && image.size) {
    if (image.size > 2 * 1024 * 1024) return 'حجم تصویر باید حداکثر ۲ مگابایت باشد.';
    body.set('image', image);
  }
  let response;
  try {
    response = await partnerBackend('/web/workspace/orchards/locations', { token, method: 'POST', body });
  } catch {
    return 'ارتباط با سرور برقرار نشد. دوباره تلاش کنید.';
  }
  if (response.status === 401) redirect('/partners');
  if (response.status === 400) {
    const problem = await response.json().catch(() => null);
    return typeof problem?.message === 'string' ? problem.message : 'نام، نوع، شهر و مختصات موقعیت را بررسی کنید.';
  }
  if (!response.ok) return 'موقعیت ذخیره نشد. دوباره تلاش کنید.';
  redirect(partnerHref('orchards') + '&result=saved');
}

export async function saveTransportOrder(formData) {
  const token = (await cookies()).get(partnerSessionCookie)?.value;
  if (!token) redirect('/partners');
  const invalid = partnerHref('bulletin') + '&result=invalid';
  const rawStops = formData.get('stops');
  const goodsType = formData.get('goodsType');
  const weightKg = decimal(formData.get('weightKg'), 2);
  const volumeM3 = decimal(formData.get('volumeM3'), 2);
  const urgency = formData.get('urgency');
  const deadlineText = formData.get('deadline');
  const description = formData.get('description');
  if (typeof rawStops !== 'string' || rawStops.length > 20000 ||
      typeof goodsType !== 'string' || goodsType.trim().length < 2 || goodsType.length > 120 ||
      !Number.isFinite(weightKg) || weightKg < 0.1 || weightKg > 100000 ||
      !Number.isFinite(volumeM3) || volumeM3 < 0.01 || volumeM3 > 10000 ||
      !['hourly', 'daily', 'multiday'].includes(urgency) ||
      typeof deadlineText !== 'string' || !Number.isFinite(Date.parse(deadlineText)) ||
      Date.parse(deadlineText) <= Date.now() ||
      typeof description !== 'string' || description.length > 1000) redirect(invalid);
  let stops;
  try { stops = JSON.parse(rawStops); } catch { redirect(invalid); }
  if (!Array.isArray(stops) || stops.length < 2 || stops.length > 20 ||
      !stops.some(stop => stop?.kind === 'pickup') || !stops.some(stop => stop?.kind === 'dropoff')) redirect(invalid);
  const normalized = stops.map(stop => {
    if (!stop || typeof stop !== 'object' || Array.isArray(stop)) return null;
    const latitude = Number(stop.latitude);
    const longitude = Number(stop.longitude);
    if (!['pickup', 'dropoff'].includes(stop.kind) ||
        typeof stop.latitude !== 'string' || !stop.latitude.trim() || typeof stop.longitude !== 'string' || !stop.longitude.trim() ||
        ![stop.label, stop.province, stop.city, stop.address].every(value => typeof value === 'string' && value.trim()) ||
        stop.label.length > 100 || stop.province.length > 100 || stop.city.length > 100 || stop.address.length > 240 ||
        !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
        !Number.isFinite(longitude) || longitude < -180 || longitude > 180) return null;
    return { kind: stop.kind, label: stop.label.trim(), province: stop.province.trim(), city: stop.city.trim(),
      address: stop.address.trim(), latitude, longitude };
  });
  if (normalized.some(stop => !stop)) redirect(invalid);
  let response;
  try {
    response = await partnerBackend('/web/transport-orders', {
      token, method: 'POST',
      body: JSON.stringify({ stops: normalized, goodsType: goodsType.trim(), weightKg, volumeM3, urgency,
        deadline: new Date(deadlineText).toISOString(), description: description.trim() }),
    });
  } catch { redirect(partnerHref('bulletin') + '&result=error'); }
  if (response.status === 401) redirect('/partners');
  if (response.status === 400) redirect(invalid);
  if (!response.ok) redirect(partnerHref('bulletin') + '&result=error');
  redirect(partnerHref('bulletin') + '&result=saved');
}

export async function acceptTransportOrder(formData) {
  const token = (await cookies()).get(partnerSessionCookie)?.value;
  if (!token) redirect('/partners');
  const id = formData.get('id');
  if (typeof id !== 'string' || !/^[a-f0-9]{24}$/i.test(id)) redirect(partnerHref('bulletin') + '&result=invalid');
  let response;
  try {
    response = await partnerBackend('/web/transport-orders/' + id + '/accept', { token, method: 'PATCH' });
  } catch { redirect(partnerHref('bulletin') + '&result=error'); }
  if (response.status === 401) redirect('/partners');
  redirect(partnerHref('bulletin') + '&result=' + (response.ok ? 'accepted' : 'error'));
}

export async function importProductOffers(formData) {
  const token = (await cookies()).get(partnerSessionCookie)?.value;
  if (!token) redirect('/partners');
  const file = formData.get('file');
  const href = partnerHref('products');
  if (!(file instanceof File) || !file.size || file.size > 2 * 1024 * 1024) redirect(href + '&result=invalid');
  const text = (await file.text()).replace(/^\\uFEFF/, '');
  const lines = text.split(/\\r?\\n/).filter(line => line.trim());
  const parse = line => {
    const values = []; let value = '', quoted = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (quoted && char === '"' && line[i + 1] === '"') { value += '"'; i++; }
      else if (char === '"') quoted = !quoted;
      else if (char === ',' && !quoted) { values.push(value); value = ''; }
      else value += char;
    }
    values.push(value);
    return values;
  };
  if (lines.length < 2 || lines.length > 1001) redirect(href + '&result=invalid');
  const headers = parse(lines[0]).map(value => value.trim());
  const idIndex = headers.indexOf('id'), priceIndex = headers.indexOf('price'), stockIndex = headers.indexOf('stock');
  if ([idIndex, priceIndex, stockIndex].some(index => index < 0)) redirect(href + '&result=invalid');
  const rows = lines.slice(1).map(line => {
    const values = parse(line);
    return { id: values[idIndex]?.trim(), price: decimal(values[priceIndex], 4), stock: decimal(values[stockIndex], 3) };
  });
  if (rows.some(row => !/^[a-f0-9]{24}$/i.test(row.id || '') || !Number.isFinite(row.price) || !Number.isFinite(row.stock))) {
    redirect(href + '&result=invalid');
  }
  let response;
  try {
    response = await partnerBackend('/web/workspace/products/offers/import', {
      token, method: 'POST', body: JSON.stringify({ rows }),
    });
  } catch { redirect(href + '&result=error'); }
  if (response.status === 401) redirect('/partners');
  if (!response.ok) redirect(href + '&result=error');
  const result = await response.json();
  redirect(href + '&result=' + (result.updated === result.total ? 'saved' : 'partial'));
}
