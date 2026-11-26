'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBasketShopping } from '@fortawesome/free-solid-svg-icons';
import '../Products/CategoriesPage.css';
import './PartnerProfile.css';
import AccountUpgradeCenter from './AccountUpgradeCenter';

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
