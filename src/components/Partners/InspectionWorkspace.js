'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import LocationMap from './LocationMap';
import './InspectionWorkspace.css';

const specialtyOptions = [
  ['all-crops', 'همه محصولات کشاورزی'],
  ['orchard', 'باغ و محصولات باغی'],
  ['farmland', 'زمین و کشت زراعی'],
  ['greenhouse', 'گلخانه'],
  ['nursery', 'نهالستان'],
  ['crop_quality', 'ارزیابی کیفیت محصول'],
];
const statusLabels = {
  awaiting_inspector: 'در انتظار تخصیص ناظر', offered: 'در انتظار پاسخ ناظر',
  scheduled: 'زمان بازدید تأیید شد', pending_review: 'در انتظار بررسی گزارش',
  completed: 'نظارت تکمیل شد', revision_required: 'نیازمند اصلاح گزارش',
  accepted: 'پذیرفته‌شده', declined: 'ردشده', expired: 'مهلت پاسخ تمام شد',
  report_submitted: 'گزارش ارسال شد',
};
const number = new Intl.NumberFormat('fa-IR');
const dateTime = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeZone: 'Asia/Tehran' });

async function api(path, options = {}) {
  const isForm = options.body instanceof FormData;
  const response = await fetch('/api/inspections/' + path, {
    method: options.method || 'GET', cache: 'no-store',
    headers: options.body && !isForm ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? (isForm ? options.body : JSON.stringify(options.body)) : undefined,
  });
  const data = response.headers.get('content-type')?.includes('application/json')
    ? await response.json().catch(() => ({})) : {};
  if (!response.ok) throw new Error(typeof data.message === 'string' ? data.message : 'درخواست انجام نشد.');
  return data;
}

function Notice({ error, message }) {
  return <>{error && <p className="inspection-alert error" role="alert">{error}</p>}
    {message && <p className="inspection-alert success" role="status">{message}</p>}</>;
}

function InspectorApplication({ current, onSubmitted }) {
  const [selected, setSelected] = useState(current?.specialties || ['all-crops']);
  const [latitude, setLatitude] = useState(current?.baseLocation?.latitude ?? '');
  const [longitude, setLongitude] = useState(current?.baseLocation?.longitude ?? '');
  const [radius, setRadius] = useState(current?.serviceRadiusKm ?? 40);
  const [biography, setBiography] = useState(current?.biography || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const pickBaseLocation = useCallback(point => {
    setLatitude(point.latitude); setLongitude(point.longitude);
  }, []);
  function toggle(value) {
    setSelected(items => items.includes(value)
      ? items.filter(item => item !== value)
      : value === 'all-crops' ? ['all-crops'] : [...items.filter(item => item !== 'all-crops'), value]);
  }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      await api('applications', { method: 'POST', body: {
        specialties: selected, latitude: Number(latitude), longitude: Number(longitude),
        serviceRadiusKm: Number(radius), biography,
      } });
      setMessage('درخواست ناظر شدن رایگان ثبت شد و برای فعال‌سازی به مدیریت ارسال شد.');
      onSubmitted();
    } catch (failure) { setError(failure.message || 'ثبت درخواست انجام نشد.'); }
    finally { setBusy(false); }
  }
  return <section className="inspection-card">
    <header><div><span className="inspection-eyebrow">همکاری با ساری‌چین</span><h2>درخواست فعالیت به‌عنوان ناظر</h2>
      <p>برای نظارت عادی باغ، زمین کشاورزی، گلخانه و نهالستان نیازی به مجوز تخصصی نیست. ثبت‌نام رایگان است؛ فعال‌سازی پس از بررسی اطلاعات توسط مدیریت انجام می‌شود.</p></div>
      <span className="inspection-icon">♧</span></header>
    {current?.status === 'pending' && <div className="inspection-status pending">درخواست شما در انتظار بررسی مدیریت است.</div>}
    {current?.status === 'rejected' && <div className="inspection-status rejected">درخواست قبلی نیازمند اصلاح است: {current.reviewNote || 'اطلاعات را بازبینی و دوباره ارسال کنید.'}</div>}
    <form onSubmit={submit} className="inspection-form">
      <fieldset><legend>حوزه‌های قابل نظارت</legend>
        <div className="inspection-specialties">{specialtyOptions.map(([value, label]) => <label key={value}>
          <input type="checkbox" checked={selected.includes(value)} onChange={() => toggle(value)}/>{label}
        </label>)}</div>
      </fieldset>
      <div className="inspection-form-grid">
        <label>عرض جغرافیایی پایگاه فعالیت
          <input required type="number" min="-90" max="90" step="any" value={latitude} onChange={e => setLatitude(e.target.value)} placeholder="مثلاً 36.5659"/>
        </label>
        <label>طول جغرافیایی پایگاه فعالیت
          <input required type="number" min="-180" max="180" step="any" value={longitude} onChange={e => setLongitude(e.target.value)} placeholder="مثلاً 53.0586"/>
        </label>
        <label>شعاع فعالیت (کیلومتر)
          <input required type="number" min="1" max="300" value={radius} onChange={e => setRadius(e.target.value)}/>
        </label>
      </div>
      <div className="inspection-map-picker"><strong>انتخاب موقعیت پایگاه فعالیت روی نقشه</strong>
        <LocationMap point={{ latitude: String(latitude), longitude: String(longitude) }} onPick={pickBaseLocation}/>
      </div>
      <label>معرفی کوتاه و تجربه کاری
        <textarea rows="3" maxLength="1000" value={biography} onChange={e => setBiography(e.target.value)} placeholder="سابقه فعالیت، شناخت محصولات و مهارت‌های خود را بنویسید."/>
      </label>
      <Notice error={error} message={message}/>
      <button className="inspection-primary" disabled={busy || !selected.length}>{busy ? 'در حال ارسال…' : current?.status === 'rejected' ? 'ارسال مجدد درخواست رایگان' : 'ثبت درخواست رایگان ناظر'}</button>
    </form>
  </section>;
}

function ProducerRequestForm({ locations, onSubmitted }) {
  const eligibleLocations = locations.filter(item => ['orchard', 'farmland', 'greenhouse', 'nursery'].includes(item.type));
  const [locationId, setLocationId] = useState(eligibleLocations[0]?.id || '');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('17:00');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const selectedLocation = eligibleLocations.find(item => item.id === locationId);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await api('requests', { method: 'POST', body: {
        locationId, inspectionType: selectedLocation?.type, acreage: Number(form.get('acreage')),
        cropType: form.get('cropType'), varieties: form.get('varieties'),
        expectedProductionKg: form.get('expectedProductionKg'), previousProductionKg: form.get('previousProductionKg'),
        pesticideNotes: form.get('pesticideNotes'), fertilizerNotes: form.get('fertilizerNotes'), notes: form.get('notes'),
        availability: [{ date, startTime, endTime }],
      } });
      formElement.reset();
      setError('');
      onSubmitted();
    } catch (failure) { setError(failure.message || 'ثبت درخواست نظارت انجام نشد.'); }
    finally { setBusy(false); }
  }
  return <section className="inspection-card">
    <header><div><span className="inspection-eyebrow">پایش محل تولید</span><h2>درخواست نظارت جدید</h2>
      <p>محل تولید، اطلاعات محصول و بازه زمانی مناسب بازدید را مشخص کنید. سامانه ناظر واجد شرایط و نزدیک را انتخاب می‌کند.</p></div></header>
    {!eligibleLocations.length ? <div className="inspection-empty">برای ثبت درخواست، ابتدا باغ یا زمین دارای مختصات را از بخش «موقعیت‌های مکانی من» ثبت کنید.</div> :
      <form className="inspection-form" onSubmit={submit}>
        <div className="inspection-form-grid">
          <label>محل تولید
            <select required value={locationId} onChange={e => setLocationId(e.target.value)}>
              {eligibleLocations.map(item => <option key={item.id} value={item.id}>{item.title} · {item.city || 'بدون شهر'}</option>)}
            </select>
          </label>
          <label>مساحت (هکتار)<input required name="acreage" type="number" min="0.01" max="100000" step="0.01"/></label>
          <label>نوع محصول<input name="cropType" maxLength="100" placeholder="مثلاً مرکبات، برنج، سیب"/></label>
          <label>رقم یا گونه محصول<input name="varieties" maxLength="300" placeholder="مثلاً تامسون، هاشمی"/></label>
          <label>برآورد تولید امسال (کیلوگرم)<input name="expectedProductionKg" type="number" min="0" step="1"/></label>
          <label>میزان تولید سال قبل (کیلوگرم)<input name="previousProductionKg" type="number" min="0" step="1"/></label>
        </div>
        <div className="inspection-time-window">
          <strong>زمان‌های پیشنهادی بازدید</strong>
          <div className="inspection-form-grid">
            <label>تاریخ بازدید<input required type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={e => setDate(e.target.value)}/></label>
            <label>از ساعت<input required type="time" value={startTime} onChange={e => setStartTime(e.target.value)}/></label>
            <label>تا ساعت<input required type="time" value={endTime} onChange={e => setEndTime(e.target.value)}/></label>
          </div>
        </div>
        <label>سابقه مصرف سم و آفت‌کش<textarea name="pesticideNotes" rows="2" maxLength="1000" placeholder="نام نهاده، زمان و مقدار تقریبی مصرف؛ در صورت اطلاع"/></label>
        <label>سابقه مصرف کود و تغذیه<textarea name="fertilizerNotes" rows="2" maxLength="1000" placeholder="نوع کود، مقدار و زمان مصرف"/></label>
        <label>توضیحات تکمیلی<textarea name="notes" rows="2" maxLength="1500" placeholder="مشکلات فعلی یا نکاتی که ناظر باید بداند"/></label>
        {error && <Notice error={error}/>}
        <button className="inspection-primary" disabled={busy || !locationId || !date || endTime <= startTime}>{busy ? 'در حال ثبت…' : 'ثبت درخواست و تخصیص ناظر'}</button>
      </form>}
  </section>;
}

function InspectorAssignment({ assignment, onChanged }) {
  const [availabilityIndex, setAvailabilityIndex] = useState('0');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [reportError, setReportError] = useState('');
  const [reportBusy, setReportBusy] = useState(false);
  const [reportMessage, setReportMessage] = useState('');
  const request = assignment.request;
  async function decide(decision) {
    setBusy(true); setError(''); setMessage('');
    try {
      await api('assignments/' + assignment.id + '/decision', { method: 'PATCH', body: { decision, availabilityIndex: Number(availabilityIndex) } });
      setMessage(decision === 'accept' ? 'مأموریت پذیرفته شد.' : 'مأموریت رد شد و به ناظر دیگری ارجاع می‌شود.');
      onChanged();
    } catch (failure) { setError(failure.message || 'ثبت تصمیم انجام نشد.'); }
    finally { setBusy(false); }
  }
  async function submitReport(event) {
    event.preventDefault(); setReportBusy(true); setReportError(''); setReportMessage('');
    try {
      const form = new FormData(event.currentTarget);
      await api('assignments/' + assignment.id + '/report', { method: 'POST', body: form });
      setReportMessage('گزارش و تصاویر برای بررسی مدیریت ارسال شد.');
      onChanged();
    } catch (failure) { setReportError(failure.message || 'ارسال گزارش انجام نشد.'); }
    finally { setReportBusy(false); }
  }
  return <article className="inspection-assignment">
    <header><div><strong>{request?.locationTitle || 'مأموریت نظارت'}</strong><small>{request?.cropType || request?.inspectionType || 'محصول کشاورزی'} · {request?.acreage ? number.format(request.acreage) + ' هکتار' : ''}</small></div>
      <span className={'inspection-status ' + assignment.status}>{statusLabels[assignment.status] || assignment.status}</span></header>
    <div className="inspection-facts">
      <span>پاداش: <b>{number.format(request?.rewardKarsha || 0)} کارسا</b></span>
      <span>تولید برآوردی: <b>{request?.expectedProductionKg ? number.format(request.expectedProductionKg) + ' کیلوگرم' : 'ثبت نشده'}</b></span>
    </div>
    {request?.producer && <p className="inspection-assignment-contact">تولیدکننده: <b>{request.producer.fullName || 'عضو ساری‌چین'}</b>{request.producer.phone ? ' · ' + request.producer.phone : ''}</p>}
    {request?.locationDetails && <p className="inspection-assignment-contact">راهنمای محل: {request.locationDetails}</p>}
    {request?.location?.latitude != null && request?.location?.longitude != null &&
      <a className="inspection-map-link" href={'https://www.openstreetmap.org/?mlat=' + request.location.latitude + '&mlon=' + request.location.longitude + '#map=16/' + request.location.latitude + '/' + request.location.longitude}
        target="_blank" rel="noopener noreferrer">مشاهده محل تولید روی نقشه ←</a>}
    {assignment.status === 'accepted' && request?.scheduledVisit &&
      <p className="inspection-assignment-contact">زمان قطعی بازدید: <b>{request.scheduledVisit.date} · {request.scheduledVisit.startTime} تا {request.scheduledVisit.endTime}</b></p>}
    {assignment.status === 'offered' && <>
      <label className="inspection-inline-label">زمان بازدید را انتخاب کنید
        <select value={availabilityIndex} onChange={e => setAvailabilityIndex(e.target.value)}>
          {(request?.availability || []).map((slot, index) => <option key={index} value={index}>{slot.date} · {slot.startTime} تا {slot.endTime}</option>)}
        </select>
      </label>
      <div className="inspection-actions">
        <button type="button" className="inspection-primary" disabled={busy} onClick={() => decide('accept')}>پذیرش مأموریت</button>
        <button type="button" className="inspection-secondary" disabled={busy} onClick={() => decide('decline')}>عدم پذیرش</button>
      </div>
    </>}
    {assignment.status === 'accepted' && <form className="inspection-report-form" onSubmit={submitReport}>
      <h3>ثبت گزارش بازدید</h3>
      <div className="inspection-form-grid">
        <label>درجه کیفیت<select name="qualityGrade" defaultValue="B"><option value="A">ممتاز (A)</option><option value="B">خوب (B)</option><option value="C">متوسط (C)</option><option value="reject">نامنطبق (رد کیفیت)</option></select></label>
        <label>امتیاز کیفیت (۱ تا ۵)<input name="qualityScore" type="number" min="1" max="5" defaultValue="4" required/></label>
        <label>برآورد تولید (کیلوگرم)<input name="estimatedYieldKg" type="number" min="0" step="1"/></label>
      </div>
      <label>مشاهدات و وضعیت باغ<textarea name="observations" rows="3" maxLength="2000" required/></label>
      <label>ارزیابی سم و آفت‌کش<textarea name="pesticideAssessment" rows="2" maxLength="1500"/></label>
      <label>ارزیابی کود و تغذیه<textarea name="fertilizerAssessment" rows="2" maxLength="1500"/></label>
      <label>پیشنهادها و اقدامات اصلاحی<textarea name="recommendations" rows="2" maxLength="2000"/></label>
      <label>تصاویر مستند بازدید (حداکثر ۸ تصویر)
        <input type="file" name="photos" accept="image/jpeg,image/png,image/webp" multiple/>
      </label>
      {reportError && <Notice error={reportError}/>}
      {reportMessage && <Notice message={reportMessage}/>}
      <button className="inspection-primary" disabled={reportBusy}>{reportBusy ? 'در حال ارسال گزارش…' : 'ارسال گزارش برای بررسی'}</button>
    </form>}
    {error && <Notice error={error}/>}
    {message && <Notice message={message}/>}
  </article>;
}

export default function InspectionWorkspace() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const refresh = () => setRevision(value => value + 1);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    fetch('/api/inspections', { cache: 'no-store', signal: controller.signal })
      .then(async response => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || 'دریافت اطلاعات نظارت انجام نشد.');
        return result;
      }).then(result => { if (!controller.signal.aborted) setData(result); })
      .catch(failure => { if (!controller.signal.aborted) setError(failure.message || 'ارتباط با سرور برقرار نشد.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);
  const profile = data?.inspectorProfile;
  const assignments = data?.assignments || [];
  const requests = data?.requests || [];
  const pendingAssignments = useMemo(() => assignments.filter(item => ['offered', 'accepted', 'report_submitted'].includes(item.status)), [assignments]);
  return <div className="inspection-workspace">
    <div className="inspection-intro">
      <div><span className="inspection-eyebrow">پایش زنجیره تولید</span><h2>نظارت هوشمند ساری‌چین</h2>
        <p>درخواست بازدید، تخصیص ناظر نزدیک، مستندسازی کیفیت و پرداخت پاداش از طریق کیف پول کارسا.</p></div>
      <button type="button" className="inspection-refresh" onClick={refresh}>به‌روزرسانی</button>
    </div>
    {error && <Notice error={error}/>}
    {loading ? <div className="inspection-empty">در حال دریافت اطلاعات…</div> : <>
      <div className="inspection-overview-stats">
        <div><strong>{number.format(requests.length)}</strong><span>درخواست‌های من</span></div>
        <div><strong>{number.format(pendingAssignments.length)}</strong><span>مأموریت‌های ناظر</span></div>
        <div><strong>{profile?.status === 'approved' ? 'فعال' : profile?.status === 'pending' ? 'در انتظار' : 'ثبت‌نشده'}</strong><span>وضعیت ناظر</span></div>
      </div>
      <div className="inspection-layout">
        <div className="inspection-main-column">
          <ProducerRequestForm locations={data?.locations || []} onSubmitted={refresh}/>
          <section className="inspection-card">
            <header><div><span className="inspection-eyebrow">سوابق</span><h2>درخواست‌های نظارت من</h2></div></header>
            {!requests.length ? <div className="inspection-empty">هنوز درخواست نظارتی ثبت نکرده‌اید.</div> :
              <div className="inspection-request-list">{requests.map(item => <article key={item.id}>
                <div><strong>{item.locationTitle}</strong><small>{item.cropType || 'محصول کشاورزی'} · {dateTime.format(new Date(item.createdAt))}</small></div>
                <div className="inspection-request-meta"><span className={'inspection-status ' + item.status}>{statusLabels[item.status] || item.status}</span><b>{number.format(item.rewardKarsha)} کارسا</b></div>
                {item.reviewNote && <p>{item.reviewNote}</p>}
              </article>)}</div>}
          </section>
        </div>
        <div className="inspection-side-column">
          {profile?.status !== 'approved' && <InspectorApplication key={profile?.status || 'new'} current={profile} onSubmitted={refresh}/>}
          {profile?.status === 'approved' && <section className="inspection-card inspection-approved">
            <span className="inspection-status approved">ناظر تأییدشده</span><h2>آماده دریافت مأموریت هستید</h2>
            <p>حوزه‌های شما: {(profile.specialties || []).map(item => specialtyOptions.find(option => option[0] === item)?.[1] || item).join('، ')}</p>
            <small>شعاع فعالیت: {number.format(profile.serviceRadiusKm)} کیلومتر</small>
          </section>}
          <section className="inspection-card">
            <header><div><span className="inspection-eyebrow">فعالیت ناظر</span><h2>مأموریت‌های من</h2></div></header>
            {!assignments.length ? <div className="inspection-empty">در حال حاضر مأموریتی به شما تخصیص داده نشده است.</div> :
              <div className="inspection-assignment-list">{assignments.map(item => <InspectorAssignment key={item.id} assignment={item} onChanged={refresh}/>)}</div>}
          </section>
        </div>
      </div>
    </>}
  </div>;
}
