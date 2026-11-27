'use client';

import { useEffect, useState } from 'react';

const documentLabels = {
  nationalId: 'تصویر کارت ملی',
  driverLicense: 'تصویر گواهینامه',
  vehicleCard: 'تصویر کارت خودرو',
  productionProof: 'مدرک مالکیت یا فعالیت تولیدی',
};
const requestLabels = { transport: 'حمل‌ونقل', producer: 'تولیدکننده' };
const statusLabels = { pending: 'در انتظار بررسی', approved: 'تأیید شده', rejected: 'نیازمند اصلاح / رد شده' };
const vehicleTypes = { motorcycle: 'موتورسیکلت', car: 'خودروی شخصی', pickup: 'وانت', van: 'ون', truckette: 'کامیونت', truck: 'کامیون' };

async function api(path, options = {}) {
  const response = await fetch('/web/' + path, {
    method: options.method || 'GET', cache: 'no-store',
    headers: options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? (options.body instanceof FormData ? options.body : JSON.stringify(options.body)) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.message === 'string' ? data.message : 'درخواست انجام نشد.');
  return data;
}

function UpgradeForm({ kind, categories, onSubmitted }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [producerType, setProducerType] = useState('orchard');
  const requiredDocs = kind === 'transport' ? ['nationalId', 'driverLicense', 'vehicleCard'] : ['nationalId', 'productionProof'];

  async function submit(event) {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const body = new FormData();
      body.append('kind', kind);
      for (const type of requiredDocs) {
        const file = form.get(type);
        if (!(file instanceof File) || !file.size) throw new Error('همه مدارک الزامی را انتخاب کنید.');
        if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type) || file.size > 2 * 1024 * 1024) {
          throw new Error('هر مدرک باید JPG، PNG، WEBP یا PDF و حداکثر ۲ مگابایت باشد.');
        }
        body.append(type, file, file.name);
      }
      if (kind === 'transport') {
        body.append('vehicle', JSON.stringify({
          type: form.get('vehicleType'), model: String(form.get('model') || '').trim(),
          year: Number(form.get('year')), capacityKg: Number(form.get('capacityKg')),
          capacityM3: Number(form.get('capacityM3')) || undefined,
          plate: String(form.get('plate') || '').trim(), license: String(form.get('license') || '').trim(),
        }));
      } else {
        body.append('producerType', producerType);
        body.append('requestedCategoryIds', JSON.stringify(selectedCategories));
        if (!selectedCategories.length) throw new Error('حداقل یک دسته‌بندی محصول را انتخاب کنید.');
      }
      await api('account-upgrades', { method: 'POST', body });
      setMessage('درخواست ارتقای حساب با موفقیت برای بررسی مدیریت ارسال شد.');
      formElement.reset();
      onSubmitted();
    } catch (failure) { setError(failure.message || 'ثبت درخواست انجام نشد.'); }
    finally { setBusy(false); }
  }

  return <form className="account-upgrade-form" onSubmit={submit}>
    <h4>{kind === 'transport' ? 'درخواست فعال‌سازی حمل‌ونقل' : 'درخواست تأیید تولیدکننده'}</h4>
    <p>{kind === 'transport' ? 'پس از تأیید مدارک و وسیله نقلیه، امکان مشاهده و پذیرش بارهای متناسب در پنل شما فعال می‌شود.' : 'پس از تأیید ناظر، امکان ثبت عرضه فقط در دسته‌بندی‌های تأییدشده برای شما فعال می‌شود.'}</p>
    {kind === 'transport' ? <div className="account-upgrade-grid">
      <label>نوع وسیله<select name="vehicleType" required>{Object.entries(vehicleTypes).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>مدل و تیپ<input name="model" required minLength={2} maxLength={100} /></label>
      <label>سال ساخت<input name="year" type="number" min="1300" max="1500" required /></label>
      <label>ظرفیت حمل (کیلوگرم)<input name="capacityKg" type="number" min="1" max="100000" required /></label>
      <label>ظرفیت حجمی (مترمکعب)<input name="capacityM3" type="number" min="0.01" step="0.01" /></label>
      <label>پلاک<input name="plate" required minLength={3} maxLength={40} /></label>
      <label>شماره گواهینامه<input name="license" required minLength={3} maxLength={80} /></label>
    </div> : <>
      <label>نوع فعالیت<select value={producerType} onChange={event => setProducerType(event.target.value)}>
        <option value="orchard">باغدار</option><option value="farm">کشاورز</option><option value="dairy">دامدار / گاودار</option><option value="greenhouse">گلخانه‌دار</option><option value="other">سایر</option>
      </select></label>
      <fieldset className="account-upgrade-categories"><legend>دسته‌بندی‌هایی که قصد عرضه محصول در آن‌ها را دارید</legend>
        {categories.map(category => <label key={category._id}>
          <input type="checkbox" checked={selectedCategories.includes(category._id)}
            onChange={event => setSelectedCategories(current => event.target.checked ? [...current, category._id] : current.filter(id => id !== category._id))}/>
          {category.name}
        </label>)}
        {!categories.length && <small>دسته‌بندی‌ها در دسترس نیستند؛ بعداً دوباره تلاش کنید.</small>}
      </fieldset>
    </>}
    <div className="account-upgrade-docs"><strong>مدارک الزامی</strong>
      {requiredDocs.map(type => <label key={type}>{documentLabels[type]}
        <input type="file" name={type} accept="image/jpeg,image/png,image/webp,application/pdf" required />
      </label>)}
      <small>تصاویر و فایل‌ها فقط برای بررسی درخواست استفاده می‌شوند. حداکثر حجم هر فایل ۲ مگابایت است.</small>
    </div>
    {error && <p className="partner-error" role="alert">{error}</p>}
    {message && <p className="partner-message" role="status">{message}</p>}
    <button className="partner-primary" disabled={busy || (kind === 'producer' && !categories.length)}>{busy ? 'در حال ارسال…' : 'ارسال درخواست رایگان'}</button>
  </form>;
}

function ProducerCategoryEditor({ profile, categories, onSubmitted, pending }) {
  const current = profile?.allowedProductCategoryIds || [];
  const [selected, setSelected] = useState(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const changed = selected.length !== current.length || selected.some(id => !current.includes(id));

  async function submit(event) {
    event.preventDefault();
    if (!selected.length) { setError('حداقل یک دسته‌بندی باید فعال بماند.'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      await api('account-upgrades/producer-categories', {
        method: 'POST', body: { requestedCategoryIds: selected },
      });
      setMessage('درخواست تغییر دسته‌بندی‌ها برای تأیید مدیریت ارسال شد. تا زمان تأیید، مجوزهای فعلی شما فعال می‌مانند.');
      onSubmitted();
    } catch (failure) { setError(failure.message || 'ارسال درخواست انجام نشد.'); }
    finally { setBusy(false); }
  }

  return <form className="account-upgrade-form" onSubmit={submit}>
    <h4>مدیریت دسته‌بندی‌های مجاز عرضه</h4>
    <p>دسته‌بندی‌های موردنظر را انتخاب کنید. اضافه یا حذف آن‌ها پس از تأیید مدیریت اعمال می‌شود و تا آن زمان مجوزهای فعلی شما تغییر نمی‌کند.</p>
    <fieldset className="account-upgrade-categories">
      <legend>دسته‌بندی‌های درخواستی</legend>
      {categories.map(category => <label key={category._id}>
        <input type="checkbox" checked={selected.includes(category._id)}
          onChange={event => setSelected(currentIds => event.target.checked
            ? [...currentIds, category._id]
            : currentIds.filter(id => id !== category._id))}/>
        {category.name}
        {current.includes(category._id) && <small> · مجاز فعلی</small>}
      </label>)}
    </fieldset>
    {error && <p className="partner-error" role="alert">{error}</p>}
    {message && <p className="partner-message" role="status">{message}</p>}
    {pending
      ? <p className="partner-status">درخواست تغییر دسته‌بندی در انتظار بررسی مدیریت است.</p>
      : <button className="partner-primary" disabled={busy || !changed}>
        {busy ? 'در حال ارسال…' : 'ارسال تغییرات برای تأیید'}
      </button>}
  </form>;
}

export default function AccountUpgradeCenter({ profile, categories = [] }) {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const requestData = await api('account-upgrades');
        if (active) setRequests(requestData.items || []);
      } catch (failure) { if (active) setError(failure.message); }
    }
    load();
    return () => { active = false; };
  }, [revision]);
  const pending = kind => requests.some(item => item.kind === kind && item.status === 'pending');
  const categoryChangePending = pending('producer_categories');
  const approved = kind => kind === 'transport' ? profile?.capabilities?.drive : profile?.capabilities?.sell;
  return <section className="account-upgrade-center">
    <header><h3>ارتقای سطح حساب</h3><p>حساب پایه رایگان است. برای فعال‌سازی فعالیت‌های تخصصی، درخواست خود را همراه مدارک ارسال کنید. بررسی و تأیید توسط مدیریت انجام می‌شود.</p></header>
    {error && <p className="partner-error" role="alert">{error}</p>}
    <div className="account-upgrade-grid">
      <div className="account-upgrade-card">
        {approved('transport') ? <p className="partner-status approved">صلاحیت حمل‌ونقل شما تأیید شده است و بخش حمل‌ونقل در پنل فعال است.</p> : pending('transport') ? <p>درخواست حمل‌ونقل شما در انتظار بررسی است.</p> : <UpgradeForm key={'transport-' + revision} kind="transport" categories={categories} onSubmitted={() => setRevision(x => x + 1)} />}
      </div>
      <div className="account-upgrade-card">
        {approved('producer')
          ? <><p className="partner-status approved">صلاحیت تولیدکنندگی شما تأیید شده است.</p>
              <ProducerCategoryEditor profile={profile} categories={categories}
                pending={categoryChangePending} onSubmitted={() => setRevision(x => x + 1)} /></>
          : pending('producer') ? <p>درخواست تولیدکنندگی شما در انتظار بررسی است.</p>
          : <UpgradeForm key={'producer-' + revision} kind="producer" categories={categories} onSubmitted={() => setRevision(x => x + 1)} />}
      </div>
    </div>
    {requests.length > 0 && <div className="account-upgrade-history"><h4>وضعیت درخواست‌های من</h4>
      {requests.map(item => <article key={item._id}><strong>{requestLabels[item.kind] || item.kind}</strong>
        <span className={'partner-status ' + (item.status === 'approved' ? 'approved' : '')}>{statusLabels[item.status] || item.status}</span>
        {item.reviewNote && <p>{item.reviewNote}</p>}
      </article>)}
    </div>}
  </section>;
}
