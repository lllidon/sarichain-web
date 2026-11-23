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
  const invalid = 'محصول، قیمت، موجودی و تاریخ برداشت را بررسی کنید.';
  if (typeof productId !== 'string' || !/^[a-f0-9]{24}$/.test(productId) ||
      !Number.isFinite(price) || price < 0.0001 || price > 1_000_000 ||
      !Number.isFinite(stock) || stock < 0 || stock > 1_000_000_000 ||
      typeof harvestDate !== 'string' || (harvestDate && !/^\d{4}-\d{2}-\d{2}$/.test(harvestDate)) ||
      typeof notes !== 'string' || notes.length > 1000) return invalid;
  let result;
  try {
    result = await partnerBackend('/web/workspace/products/offers', {
      token, method: 'POST', body: JSON.stringify({ productId, price, stock, harvestDate: harvestDate || undefined, notes }),
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
