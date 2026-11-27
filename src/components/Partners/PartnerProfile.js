'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBasketShopping } from '@fortawesome/free-solid-svg-icons';
import '../Products/CategoriesPage.css';
import './PartnerProfile.css';
import AccountUpgradeCenter from './AccountUpgradeCenter';
import LocationMap from './LocationMap';

const buyers = { consumer: 'خریدار نهایی', retailer: 'مغازه‌دار', wholesaler: 'خریدار عمده', other: 'سایر' };

async function request(path, options = {}) {
  const timeout = AbortSignal.timeout(12000);
  const result = await fetch('/web/' + path, {
    method: options.method,
    signal: options.signal ? AbortSignal.any([options.signal, timeout]) : timeout,
    cache: 'no-store',
    ...(options.body && { body: JSON.stringify(options.body), headers: { 'Content-Type': 'application/json' } }),
  });
  const data = await result.json();
  if (!result.ok) throw Object.assign(new Error(typeof data.message === 'string' ? data.message : ''), { status: result.status });
  return data;
}

function SelectOptions({ options }) {
  return Object.entries(options).map(([value, label]) => <option key={value} value={value}>{label}</option>);
}

export function ProfileLocation({ profile, required = false }) {
  const [provinces, setProvinces] = useState([]);
  const [province, setProvince] = useState(profile.provinceCode || '');
  const [city, setCity] = useState(profile.cityCode || '');
  const [cities, setCities] = useState(null);
  const [edited, setEdited] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    request('provinces', { signal: controller.signal }).then(setProvinces).catch(() => {
      if (!controller.signal.aborted) setError(true);
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!province) return;
    const controller = new AbortController();
    setCities(null);
    setError(false);
    void (async () => {
      try {
        const rows = [];
        let page = 1;
        while (!controller.signal.aborted) {
          const data = await request(`cities?provinceCode=${encodeURIComponent(province)}&page=${page}&limit=100`, { signal: controller.signal });
          rows.push(...data.items);
          if (!data.items.length || rows.length >= data.total) break;
          page++;
        }
        if (!controller.signal.aborted) setCities(rows);
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    })();
    return () => controller.abort();
  }, [province]);

  return (
    <>
      <label>استان<select aria-label="استان" value={province} required={required} onChange={event => {
        setProvince(event.target.value); setCity(''); setEdited(true);
      }}>
        <option value="">{profile.province && !profile.provinceCode ? `${profile.province} (ثبت قبلی)` : 'انتخاب استان'}</option>
        {provinces.map(row => <option value={row.code} key={row.code}>{row.name}</option>)}
      </select></label>
      <label>شهر<select aria-label="شهر" value={city} required={required} disabled={!province || !cities} onChange={event => { setCity(event.target.value); setEdited(true); }}>
        <option value="">{profile.city && !profile.cityCode && !edited ? `${profile.city} (ثبت قبلی)`
          : province && !cities && !error ? 'در حال دریافت…' : 'انتخاب شهر'}</option>
        {cities?.map(row => <option key={row.code} value={row.code}>{row.name}</option>)}
      </select></label>
      {(required || edited) && <><input type="hidden" name="provinceCode" value={province} /><input type="hidden" name="cityCode" value={city} /></>}
      {error && <p className="partner-wide" role="status">دریافت فهرست موقعیت انجام نشد.</p>}
    </>
  );
}

function DeliveryAddresses({ initialAddresses = [], onExpired }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [draft, setDraft] = useState(null);
  const pickPoint = useCallback(point => setDraft(current => ({ ...current, ...point })), []);

  function startNew() {
    setError(''); setMessage('');
    setEditing('new');
    setDraft({ id: crypto.randomUUID(), title: '', recipientName: '', phone: '', address: '', province: '', city: '', postalCode: '', latitude: '', longitude: '' });
  }
  function startEdit(address) {
    setError(''); setMessage('');
    setEditing(address.id);
    setDraft({ ...address, latitude: address.latitude ?? '', longitude: address.longitude ?? '' });
  }
  function change(key, value) { setDraft(current => ({ ...current, [key]: value })); }

  async function save(event) {
    event.preventDefault();
    if (!draft) return;
    if (!draft.latitude || !draft.longitude) {
      setError('برای ذخیره نشانی تحویل، موقعیت جغرافیایی آن را روی نقشه مشخص کنید.');
      return;
    }
    setBusy(true); setError(''); setMessage('');
    const next = editing === 'new' ? [...addresses, draft] : addresses.map(item => item.id === editing ? draft : item);
    try {
      const updated = await request('profile', { method: 'PATCH', body: { deliveryAddresses: next } });
      setAddresses(updated.deliveryAddresses ?? next);
      setEditing(null); setDraft(null); setMessage('نشانی تحویل ذخیره شد.');
    } catch (failure) {
      if (failure.status === 401) onExpired();
      else setError(failure.message || 'ذخیره نشانی انجام نشد.');
    } finally { setBusy(false); }
  }

  async function remove(id) {
    setBusy(true); setError(''); setMessage('');
    try {
      const updated = await request('profile', { method: 'PATCH', body: { deliveryAddresses: addresses.filter(item => item.id !== id) } });
      setAddresses(updated.deliveryAddresses ?? addresses.filter(item => item.id !== id));
      if (editing === id) { setEditing(null); setDraft(null); }
      setMessage('نشانی حذف شد.');
    } catch (failure) {
      if (failure.status === 401) onExpired();
      else setError(failure.message || 'حذف نشانی انجام نشد.');
    } finally { setBusy(false); }
  }

  return <section className="customer-address-book">
    <header><div><h3>نشانی‌های تحویل</h3><p>چند نشانی ذخیره کنید تا هنگام خرید فقط مقصد موردنظر را انتخاب کنید.</p></div>
      <button type="button" className="partner-secondary" disabled={busy || addresses.length >= 20} onClick={startNew}>افزودن نشانی</button>
    </header>
    {message && <p className="partner-message" role="status">{message}</p>}
    {error && <p className="partner-message partner-error" role="alert">{error}</p>}
    {!addresses.length && !draft && <p className="customer-address-empty">هنوز نشانی تحویلی ثبت نشده است.</p>}
    <div className="customer-address-list">
      {addresses.map(address => <article key={address.id} className="customer-address-card">
        <div><strong>{address.title}</strong><span>{address.recipientName}{address.phone ? ' · ' + address.phone : ''}</span>
          <p>{[address.province, address.city, address.address, address.postalCode].filter(Boolean).join('، ')}</p>
          <small>{address.latitude != null && address.longitude != null ? 'موقعیت روی نقشه ثبت شده' : 'موقعیت جغرافیایی ثبت نشده'}</small>
        </div>
        <div className="customer-address-actions">
          <button type="button" className="partner-secondary" disabled={busy} onClick={() => startEdit(address)}>ویرایش و موقعیت</button>
          <button type="button" className="partner-secondary" disabled={busy} onClick={() => remove(address.id)}>حذف</button>
        </div>
      </article>)}
    </div>
    {draft && <form className="customer-address-editor" onSubmit={save}>
      <h4>{editing === 'new' ? 'نشانی جدید' : 'ویرایش نشانی'}</h4>
      <div className="customer-address-fields">
        <label>عنوان نشانی<input value={draft.title} onChange={e => change('title', e.target.value)} required maxLength={80} placeholder="مثلاً منزل، محل کار" /></label>
        <label>نام تحویل‌گیرنده<input value={draft.recipientName} onChange={e => change('recipientName', e.target.value)} required maxLength={160} /></label>
        <label>شماره تماس تحویل‌گیرنده<input dir="ltr" value={draft.phone} onChange={e => change('phone', e.target.value)} maxLength={32} /></label>
        <label>استان<input value={draft.province} onChange={e => change('province', e.target.value)} maxLength={100} /></label>
        <label>شهر<input value={draft.city} onChange={e => change('city', e.target.value)} maxLength={100} /></label>
        <label>کد پستی<input value={draft.postalCode} onChange={e => change('postalCode', e.target.value)} maxLength={20} /></label>
        <label className="customer-address-wide">نشانی کامل و پلاک<input value={draft.address} onChange={e => change('address', e.target.value)} required maxLength={500} /></label>
      </div>
      <div className="customer-address-map">
        <strong>موقعیت جغرافیایی تحویل</strong>
        <p>نقطه دقیق تحویل این نشانی را روی نقشه انتخاب کنید. بدون ثبت موقعیت، این نشانی برای ارسال قابل انتخاب نخواهد بود.</p>
        <LocationMap point={draft} onPick={pickPoint} />
        <div className="customer-address-coordinates">
          <label>عرض جغرافیایی<input value={draft.latitude} readOnly /></label>
          <label>طول جغرافیایی<input value={draft.longitude} readOnly /></label>
        </div>
      </div>
      <div className="customer-address-actions">
        <button type="submit" className="partner-primary" disabled={busy}>{busy ? 'در حال ذخیره…' : 'ذخیره نشانی'}</button>
        <button type="button" className="partner-secondary" disabled={busy} onClick={() => { setEditing(null); setDraft(null); }}>انصراف</button>
      </div>
    </form>}
  </section>;
}

function ProfileForm({ profile, categories = [], onSaved, onExpired }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const fields = new FormData(event.currentTarget);
    const value = key => String(fields.get(key) ?? '').trim();
    const data = {
      ...Object.fromEntries(['fullName', 'email', 'organization', 'address', 'customerType', 'productionActivity', 'serviceArea']
        .filter(key => fields.has(key) && (key !== 'customerType' || value(key))).map(key => [key, value(key)])),
      ...(fields.has('provinceCode') && { provinceCode: value('provinceCode'), cityCode: value('cityCode') }),
    };
    try {
      onSaved(await request('profile', { method: 'PATCH', body: data }));
    } catch (failure) {
      if (failure.status === 401) onExpired();
      else setError(failure.message || 'ذخیره پروفایل انجام نشد.');
    } finally { setBusy(false); }
  }

  return (
    <>
    <form className="partner-form" onSubmit={submit}>
      <fieldset disabled={busy} className="partner-fields">
        <legend>اطلاعات پایه</legend>
        <label>نام و نام خانوادگی / نام مجموعه<input name="fullName" defaultValue={profile.fullName} required maxLength={160} /></label>
        <label>شماره موبایل<input dir="ltr" value={profile.phone} readOnly /></label>
        <label>ایمیل<input type="email" dir="ltr" name="email" defaultValue={profile.email} maxLength={254} /></label>
        <label>نام کسب‌وکار<input name="organization" defaultValue={profile.organization} maxLength={160} /></label>
        <ProfileLocation profile={profile} />
        <label className="partner-wide">نشانی<textarea name="address" rows={2} defaultValue={profile.address} maxLength={500} /></label>
      </fieldset>

      <fieldset disabled={busy} className="partner-fields">
        <legend><FontAwesomeIcon icon={faBasketShopping} /> خرید</legend>
        <label>نوع خرید<select name="customerType" defaultValue={profile.customerType || ''}><option value="">انتخاب کنید</option><SelectOptions options={buyers} /></select></label>
        <Link href="/categories" className="partner-text-link">مشاهده محصولات</Link>
      </fieldset>

      {error && <p className="partner-message partner-error" role="alert">{error}</p>}
      <button className="partner-primary" disabled={busy} type="submit">{busy ? 'در حال ذخیره…' : 'ذخیره پروفایل'}</button>
    </form>
    <DeliveryAddresses initialAddresses={profile.deliveryAddresses ?? []} onExpired={onExpired} />
    <AccountUpgradeCenter profile={profile} categories={categories} />
    </>
  );
}

export function PartnerProfileEditor({ initialProfile, categories = [] }) {
  const [profile, setProfile] = useState(initialProfile);
  const [message, setMessage] = useState('');
  const [revision, setRevision] = useState(0);
  return <>
    {message && <p className="partner-message" role="status">{message}</p>}
    {profile ? <ProfileForm key={revision} profile={profile} categories={categories} onExpired={() => {
      setProfile(null);
      setMessage('نشست پایان یافته است. دوباره وارد شوید.');
    }} onSaved={updated => {
      setProfile(updated);
      setRevision(value => value + 1);
      setMessage('پروفایل ذخیره شد.');
    }} /> : <Link href="/partners">ورود دوباره</Link>}
  </>;
}

export default function PartnerProfile({ initialMessage = '', returnToCart = false }) {
  return (
    <div className="catalog-page partners-page" dir="rtl">
      <div className="catalog-wrap">
        <nav className="catalog-breadcrumb" aria-label="مسیر صفحه"><Link href="/">صفحه اصلی</Link><span aria-hidden="true">/</span><span aria-current="page">همکاران</span></nav>
        <header className="partner-header">
          <h1>پنل مشتریان و همکاران ساری‌چین</h1>
        </header>
        <form className="partner-login" action="/web/login" method="post">
          <h2>ورود به حساب مشتری و همکار</h2>
          {returnToCart && <input type="hidden" name="returnTo" value="cart" />}
          <label>شماره موبایل<input name="phone" type="tel" dir="ltr" autoComplete="username" maxLength={32} required /></label>
          <label>رمز ورود<input name="password" type="password" dir="ltr" autoComplete="current-password" maxLength={128} required /></label>
          <p>برای دریافت رمز ورود اولیه، با شعبه ساری‌چین هماهنگ کنید.</p>
          {initialMessage && <p className="partner-error" role="alert">{initialMessage}</p>}
          <button className="partner-primary" type="submit">ورود به پنل</button>
        </form>
      </div>
    </div>
  );
}
