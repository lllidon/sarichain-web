'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBasketShopping, faSeedling, faTruck } from '@fortawesome/free-solid-svg-icons';
import '../Products/CategoriesPage.css';
import './PartnerProfile.css';

const buyers = { consumer: 'خریدار نهایی', retailer: 'مغازه‌دار', wholesaler: 'خریدار عمده', other: 'سایر' };
const producers = { orchard: 'باغدار', farm: 'کشاورز', dairy: 'دامداری / گاوداری', greenhouse: 'گلخانه‌دار', other: 'سایر' };
const services = { driver: 'حمل‌ونقل', warehouse: 'انبارداری', harvest: 'برداشت محصول', labor: 'نیروی کار', supervisor: 'نظارت', quality: 'کنترل کیفیت', other: 'سایر خدمات' };
const vehicles = { motorcycle: 'موتورسیکلت', car: 'خودرو', pickup: 'وانت', van: 'ون', truck: 'کامیون' };
const statuses = { pending: 'در انتظار بررسی', approved: 'تأییدشده', rejected: 'ردشده' };

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

function ReviewStatus({ status }) {
  return <span className={status === 'approved' ? 'partner-status approved' : 'partner-status'}>{statuses[status] || 'نیازمند بررسی'}</span>;
}

function ProfileLocation({ profile }) {
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
      <label>استان<select aria-label="استان" value={province} onChange={event => {
        setProvince(event.target.value); setCity(''); setEdited(true);
      }}>
        <option value="">{profile.province && !profile.provinceCode ? `${profile.province} (ثبت قبلی)` : 'انتخاب استان'}</option>
        {provinces.map(row => <option value={row.code} key={row.code}>{row.name}</option>)}
      </select></label>
      <label>شهر<select aria-label="شهر" value={city} disabled={!province || !cities} onChange={event => { setCity(event.target.value); setEdited(true); }}>
        <option value="">{profile.city && !profile.cityCode && !edited ? `${profile.city} (ثبت قبلی)`
          : province && !cities && !error ? 'در حال دریافت…' : 'انتخاب شهر'}</option>
        {cities?.map(row => <option key={row.code} value={row.code}>{row.name}</option>)}
      </select></label>
      {edited && <><input type="hidden" name="provinceCode" value={province} /><input type="hidden" name="cityCode" value={city} /></>}
      {error && <p className="partner-wide" role="status">دریافت فهرست موقعیت انجام نشد.</p>}
    </>
  );
}

function ProfileForm({ profile, onSaved, onExpired }) {
  const [producer, setProducer] = useState(profile.producerType ?? '');
  const [selected, setSelected] = useState(profile.serviceTypes ?? []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const driver = selected.includes('driver');
  const specialist = selected.some(type => type === 'supervisor' || type === 'quality');

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
      producerType: producer,
      serviceTypes: selected,
      ...(driver && { vehicle: { type: value('vehicleType'), plate: value('plate'), license: value('license') } }),
      ...(specialist && { serviceCredential: value('serviceCredential') }),
    };
    try {
      onSaved(await request('profile', { method: 'PATCH', body: data }));
    } catch (failure) {
      if (failure.status === 401) onExpired();
      else setError(failure.message || 'ذخیره پروفایل انجام نشد.');
    } finally { setBusy(false); }
  }

  return (
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

      <fieldset disabled={busy} className="partner-fields">
        <legend><FontAwesomeIcon icon={faSeedling} /> تولید و فروش</legend>
        <label>نوع فعالیت تولیدی<select name="producerType" value={producer} onChange={event => setProducer(event.target.value)}>
          <option value="">درخواست فروشندگی ندارم</option><SelectOptions options={producers} />
        </select></label>
        {producer && <>
          <label>محصولات یا زمینه فعالیت<input name="productionActivity" defaultValue={profile.productionActivity} maxLength={180} /></label>
          <div className="partner-wide"><ReviewStatus status={profile.sellerStatus} /></div>
        </>}
      </fieldset>

      <fieldset disabled={busy} className="partner-fields">
        <legend><FontAwesomeIcon icon={faTruck} /> خدمات و حمل‌ونقل</legend>
        <div className="partner-options partner-wide">
          {Object.entries(services).map(([type, title]) => (
            <label key={type}><input type="checkbox" checked={selected.includes(type)} onChange={event => setSelected(values =>
              event.target.checked ? [...values, type] : values.filter(item => item !== type))} /> {title}</label>
          ))}
        </div>
        {selected.length > 0 && <label className="partner-wide">محدوده خدمت<input name="serviceArea" defaultValue={profile.serviceArea} maxLength={180} /></label>}
        {driver && (
          <>
            <label>نوع وسیله<select name="vehicleType" defaultValue={profile.vehicle?.type ?? ''} required>
              <option value="">انتخاب وسیله</option><SelectOptions options={vehicles} />
            </select></label>
            <label>پلاک<input name="plate" defaultValue={profile.vehicle?.plate} maxLength={40} required minLength={2} /></label>
            <label>شماره یا مرجع گواهینامه<input name="license" defaultValue={profile.vehicle?.license} maxLength={80} required minLength={2} /></label>
            <div><ReviewStatus status={profile.driverStatus} /></div>
          </>
        )}
        {specialist && <>
          <label>شماره یا مرجع مدرک تخصصی<input name="serviceCredential" defaultValue={profile.serviceCredential} maxLength={120} required /></label>
          <div><ReviewStatus status={profile.specialistStatus} /></div>
        </>}
      </fieldset>
      {error && <p className="partner-message partner-error" role="alert">{error}</p>}
      <button className="partner-primary" disabled={busy} type="submit">{busy ? 'در حال ذخیره…' : 'ذخیره پروفایل'}</button>
    </form>
  );
}

export function PartnerProfileEditor({ initialProfile }) {
  const [profile, setProfile] = useState(initialProfile);
  const [message, setMessage] = useState('');
  const [revision, setRevision] = useState(0);
  return <>
    {message && <p className="partner-message" role="status">{message}</p>}
    {profile ? <ProfileForm key={revision} profile={profile} onExpired={() => {
      setProfile(null);
      setMessage('نشست پایان یافته است. دوباره وارد شوید.');
    }} onSaved={updated => {
      setProfile(updated);
      setRevision(value => value + 1);
      setMessage('پروفایل ذخیره شد.');
    }} /> : <Link href="/partners">ورود دوباره</Link>}
  </>;
}

export default function PartnerProfile({ initialMessage = '' }) {
  return (
    <div className="catalog-page partners-page" dir="rtl">
      <div className="catalog-wrap">
        <nav className="catalog-breadcrumb" aria-label="مسیر صفحه"><Link href="/">صفحه اصلی</Link><span aria-hidden="true">/</span><span aria-current="page">همکاران</span></nav>
        <header className="partner-header">
          <h1>پنل همکاران ساری‌چین</h1>
        </header>
        <form className="partner-login" action="/web/login" method="post">
          <h2>ورود به حساب همکاری</h2>
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
