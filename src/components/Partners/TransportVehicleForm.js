'use client';

import { useEffect, useState } from 'react';

const vehicleKinds = [
  { value: 'motorcycle', label: 'موتورسیکلت', group: 'سبک', capacity: 'حداکثر بار مجاز (کیلوگرم)' },
  { value: 'car', label: 'خودروی سواری', group: 'سبک', capacity: 'حداکثر بار مجاز (کیلوگرم)' },
  { value: 'pickup', label: 'وانت', group: 'نیمه‌سنگین', capacity: 'ظرفیت حمل بار (کیلوگرم)' },
  { value: 'van', label: 'ون باری', group: 'نیمه‌سنگین', capacity: 'ظرفیت حمل بار (کیلوگرم)' },
  { value: 'truckette', label: 'کامیونت', group: 'سنگین', capacity: 'ظرفیت حمل بار (کیلوگرم)' },
  { value: 'truck', label: 'کامیون', group: 'سنگین', capacity: 'ظرفیت حمل بار (کیلوگرم)' },
];

async function saveVehicle(payload) {
  const response = await fetch('/web/vehicle', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify(payload.vehicle),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'ذخیره مشخصات وسیله نقلیه انجام نشد.');
  return data;
}

export default function TransportVehicleForm({ profile }) {
  const [saved, setSaved] = useState(profile.vehicle || {});
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    fetch('/web/vehicle', { cache: 'no-store' }).then(response => {
      if (!response.ok) throw new Error('دریافت مشخصات خودرو ناموفق بود.');
      return response.json();
    }).then(data => { if (active) { const vehicle = data.vehicle || {}; setSaved(vehicle); setKind(vehicle.type || 'pickup'); setClassName(vehicle.className || ''); } })
      .catch(failure => { if (active) setError(failure.message); })
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, []);
  const [kind, setKind] = useState(saved.type || 'pickup');
  const [className, setClassName] = useState(saved.className || (saved.type === 'truck' ? 'کامیونت' : ''));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isTruck = kind === 'truck' || kind === 'truckette';

  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    const form = new FormData(event.currentTarget);
    const value = name => String(form.get(name) || '').trim();
    const normalizeDigits = input => input.replace(/[۰-۹٠-٩]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit) >= 0 ? '۰۱۲۳۴۵۶۷۸۹'.indexOf(digit) : '٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
    const yearText = normalizeDigits(value('year'));
    const year = Number(yearText);
    const capacity = Number(value('capacityKg'));
    const capacityM3Text = value('capacityM3');
    const capacityM3 = capacityM3Text ? Number(capacityM3Text) : undefined;
    if (!value('model') || !/^\d{4}$/.test(yearText) || year < 1350 || year > 1500 ||
        !Number.isFinite(capacity) || capacity <= 0 || (capacityM3Text && (!Number.isFinite(capacityM3) || capacityM3 <= 0 || capacityM3 > 10000)) || !value('plate') || !value('license')) {
      setError('مدل، سال ساخت، ظرفیت، پلاک و شماره گواهینامه را کامل و صحیح وارد کنید.');
      setBusy(false); return;
    }
    const vehicle = {
      type: kind,
      className: isTruck ? className : '',
      model: value('model'),
      year,
      capacityKg: capacity,
      ...(capacityM3 !== undefined && { capacityM3 }),
      plate: value('plate'),
      license: value('license'),
      licenseClass: value('licenseClass'),
      bodyType: value('bodyType'),
      insuranceExpiry: value('insuranceExpiry'),
      technicalInspectionExpiry: value('technicalInspectionExpiry'),
      description: value('description'),
    };
    try {
      const result = await saveVehicle({ vehicle });
      setSaved(result.vehicle || vehicle);
      setMessage('مشخصات وسیله نقلیه با موفقیت ذخیره شد.');
    } catch (failure) {
      setError(failure.message || 'ارتباط با سرور برقرار نشد.');
    } finally { setBusy(false); }
  }

  return (
    <div className="transport-vehicle">
      <header className="transport-intro">
        <span className="transport-kicker">پرونده ناوگان همکاران</span>
        <h2>وسیله نقلیه من</h2>
        <p>مشخصات وسیله‌ای را که برای حمل محصولات ساری‌چین استفاده می‌کنید ثبت کنید تا اطلاعات آن در پرونده همکاری شما نگهداری شود.</p>
        <div className="transport-steps"><span>۱. انتخاب وسیله</span><span>۲. مشخصات فنی</span><span>۳. مدارک و شناسایی</span></div>
      </header>

      <form key={loaded ? 'vehicle-loaded' : 'vehicle-initial'} className="transport-form" onSubmit={submit}>
        <section className="transport-panel">
          <div className="transport-panel-title"><span>01</span><div><h3>نوع وسیله نقلیه</h3><p>دسته وسیله‌ای را که در اختیار دارید انتخاب کنید.</p></div></div>
          <div className="transport-kind-grid">
            {vehicleKinds.map((item, index) => (
              <label className={kind === item.value ? 'transport-kind selected' : 'transport-kind'} key={item.label}>
                <input type="radio" name="vehicleKind" checked={kind === item.value} onChange={() => { setKind(item.value); if (item.value === 'truck' || item.value === 'truckette') setClassName(item.label); }} />
                <span className="transport-kind-icon">{['🏍️','🚙','🛻','🚐','🚚','🚛'][index]}</span>
                <strong>{item.label}</strong><small>{item.group}</small>
              </label>
            ))}
          </div>
          {isTruck && <label className="transport-field">رده خودرو<select value={className} onChange={event => setClassName(event.target.value)}><option value="کامیونت">کامیونت</option><option value="کامیون">کامیون</option></select></label>}
        </section>

        <section className="transport-panel">
          <div className="transport-panel-title"><span>02</span><div><h3>مشخصات فنی خودرو</h3><p>اطلاعات را مطابق کارت خودرو وارد کنید.</p></div></div>
          <div className="transport-fields">
            <label className="transport-field">برند و مدل خودرو<input name="model" defaultValue={saved.model || ''} placeholder="مثلاً نیسان زامیاد، ایسوزو NPR" required maxLength={100} /></label>
            <label className="transport-field">سال ساخت<input name="year" defaultValue={saved.year || ''} inputMode="numeric" placeholder="مثلاً ۱۴۰۱" required /></label>
            <label className="transport-field">ظرفیت مجاز حمل (کیلوگرم)<input name="capacityKg" defaultValue={saved.capacityKg || ''} type="number" min="1" max="100000" placeholder="مثلاً ۲۰۰۰" required /></label>
            <label className="transport-field">ظرفیت حجمی اتاق (مترمکعب)<input name="capacityM3" defaultValue={saved.capacityM3 || ''} type="number" min="0.01" max="10000" step="0.01" placeholder="در صورت اطلاع، مثلاً ۱۲" /></label>
            <label className="transport-field">نوع اتاق / کاربری<select name="bodyType" defaultValue={saved.bodyType || ''}><option value="">انتخاب کنید</option><option>روباز</option><option>مسقف</option><option>یخچال‌دار</option><option>کمپرسی</option><option>چادری</option><option>کفی</option><option>مخزن‌دار</option><option>سایر</option></select></label>
          </div>
        </section>

        <section className="transport-panel">
          <div className="transport-panel-title"><span>03</span><div><h3>اطلاعات شناسایی و مدارک</h3><p>اطلاعات هویتی وسیله و راننده را ثبت کنید.</p></div></div>
          <div className="transport-fields">
            <label className="transport-field">شماره پلاک<input name="plate" defaultValue={saved.plate || ''} placeholder="مطابق کارت خودرو" required maxLength={40} /></label>
            <label className="transport-field">شماره گواهینامه راننده<input name="license" defaultValue={saved.license || ''} placeholder="شماره گواهینامه" required maxLength={80} /></label>
            <label className="transport-field">پایه گواهینامه<select name="licenseClass" defaultValue={saved.licenseClass || ''}><option value="">انتخاب کنید</option><option>پایه ۳</option><option>پایه ۲</option><option>پایه ۱</option><option>موتورسیکلت</option></select></label>
            <label className="transport-field">اعتبار بیمه شخص ثالث<input name="insuranceExpiry" type="text" defaultValue={saved.insuranceExpiry || ''} placeholder="تاریخ انقضا (مثلاً ۱۴۰۵/۰۸/۲۰)" /></label>
            <label className="transport-field">اعتبار معاینه فنی<input name="technicalInspectionExpiry" type="text" defaultValue={saved.technicalInspectionExpiry || ''} placeholder="تاریخ انقضا" /></label>
          </div>
        </section>

        <section className="transport-panel">
          <div className="transport-panel-title"><span>04</span><div><h3>توضیحات تکمیلی</h3><p>امکانات ویژه یا محدودیت‌های وسیله را بنویسید.</p></div></div>
          <label className="transport-field">توضیحات<textarea name="description" rows={3} maxLength={500} defaultValue={saved.description || ''} placeholder="مثلاً مجهز به چادر، مناسب حمل بار حساس یا محدودیت تردد..." /></label>
        </section>

        {error && <p className="transport-feedback error" role="alert">{error}</p>}
        {message && <p className="transport-feedback success" role="status">{message}</p>}
        <div className="transport-submit"><p>اطلاعات ثبت‌شده در پرونده همکاری شما نگهداری می‌شود.</p><button className="partner-primary" type="submit" disabled={busy}>{busy ? 'در حال ذخیره…' : 'ذخیره مشخصات وسیله نقلیه'}</button></div>
      </form>
    </div>
  );
}
