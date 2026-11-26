'use client';

import { useCallback, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faPlus, faTrash, faTruckFast } from '@fortawesome/free-solid-svg-icons';
import LocationMap from './LocationMap';
import { saveTransportOrder } from '../../app/(workspace)/partners/actions';

const blankStop = kind => ({ label: kind === 'pickup' ? 'مبدأ جدید' : 'مقصد جدید', province: '', city: '', address: '', latitude: '', longitude: '' });
const digits = new Intl.NumberFormat('fa-IR');

function StopGroup({ kind, items, title, active, onSelect, onAdd, onRemove, onChange }) {
  return <section className="transport-stop-group">
    <div className="transport-stop-heading"><h4>{title}</h4><button type="button" className="transport-add-stop" onClick={() => onAdd(kind)} disabled={items.length >= 10}><FontAwesomeIcon icon={faPlus} /> افزودن {kind === 'pickup' ? 'مبدأ' : 'مقصد'}</button></div>
    {items.map((stop, index) => <div className={active.kind === kind && active.index === index ? 'transport-stop-card active' : 'transport-stop-card'} key={kind + index}>
      <div className="transport-stop-card-heading"><strong>{title} {digits.format(index + 1)}</strong><div>
        <button type="button" onClick={() => onSelect({ kind, index })}><FontAwesomeIcon icon={faMapMarkerAlt} /> انتخاب روی نقشه</button>
        {items.length > 1 && <button type="button" className="transport-icon-danger" aria-label="حذف نقطه" onClick={() => onRemove(kind, index)}><FontAwesomeIcon icon={faTrash} /></button>}
      </div></div>
      <div className="transport-stop-fields">
        <label>عنوان نقطه<input value={stop.label} maxLength={100} onChange={e => onChange(kind, index, 'label', e.target.value)} required /></label>
        <label>استان<input value={stop.province} maxLength={100} onChange={e => onChange(kind, index, 'province', e.target.value)} placeholder="مثلاً گیلان" required /></label>
        <label>شهر<input value={stop.city} maxLength={100} onChange={e => onChange(kind, index, 'city', e.target.value)} placeholder="مثلاً رشت" required /></label>
        <label className="transport-stop-wide">نشانی بارگیری / تخلیه<input value={stop.address} maxLength={240} onChange={e => onChange(kind, index, 'address', e.target.value)} required /></label>
        <label>عرض جغرافیایی<input value={stop.latitude} readOnly placeholder="از نقشه انتخاب کنید" required /></label>
        <label>طول جغرافیایی<input value={stop.longitude} readOnly placeholder="از نقشه انتخاب کنید" required /></label>
      </div>
    </div>)}
  </section>;
}

export default function TransportOrderForm() {
  const [origins, setOrigins] = useState([blankStop('pickup')]);
  const [destinations, setDestinations] = useState([blankStop('dropoff')]);
  const [active, setActive] = useState({ kind: 'pickup', index: 0 });
  const selected = active.kind === 'pickup' ? origins[active.index] : destinations[active.index];
  const stops = useMemo(() => [
    ...origins.map(stop => ({ ...stop, kind: 'pickup' })),
    ...destinations.map(stop => ({ ...stop, kind: 'dropoff' })),
  ], [origins, destinations]);
  const onPick = useCallback(({ latitude, longitude }) => {
    const setter = active.kind === 'pickup' ? setOrigins : setDestinations;
    setter(current => current.map((stop, index) => index === active.index ? { ...stop, latitude, longitude } : stop));
  }, [active]);
  const changeStop = (kind, index, field, value) => {
    const setter = kind === 'pickup' ? setOrigins : setDestinations;
    setter(current => current.map((stop, i) => i === index ? { ...stop, [field]: value } : stop));
  };
  const addStop = kind => {
    const currentLength = kind === 'pickup' ? origins.length : destinations.length;
    if (currentLength >= 10) return;
    const setter = kind === 'pickup' ? setOrigins : setDestinations;
    setter(current => [...current, blankStop(kind)]);
    setActive({ kind, index: currentLength });
  };
  const removeStop = (kind, index) => {
    const currentLength = kind === 'pickup' ? origins.length : destinations.length;
    if (currentLength <= 1) return;
    const setter = kind === 'pickup' ? setOrigins : setDestinations;
    setter(current => current.filter((_, i) => i !== index));
    setActive(current => current.kind === kind
      ? { kind, index: Math.max(0, current.index > index ? current.index - 1 : Math.min(current.index, currentLength - 2)) }
      : current);
  };

  return <form className="transport-order-form" action={saveTransportOrder}>
    <header className="transport-order-intro">
      <span className="transport-order-kicker"><FontAwesomeIcon icon={faTruckFast} /> سامانه ثبت درخواست حمل</span>
      <h2>درخواست حمل بار جدید</h2>
      <p>مبدأ و مقصدها را مشخص کنید؛ پس از بررسی، پیشنهادهای حمل متناسب با بار و زمان تحویل برای همکاران واجد شرایط ارسال می‌شود.</p>
    </header>
    <input type="hidden" name="stops" value={JSON.stringify(stops)} />
    <div className="transport-order-panel">
      <div className="transport-order-section-title"><span>۱</span><div><h3>مسیر و نقاط بارگیری</h3><p>می‌توانید چند مبدأ و چند مقصد ثبت کنید.</p></div></div>
      <StopGroup kind="pickup" items={origins} title="مبدأ" active={active} onSelect={setActive} onAdd={addStop} onRemove={removeStop} onChange={changeStop} />
      <StopGroup kind="dropoff" items={destinations} title="مقصد" active={active} onSelect={setActive} onAdd={addStop} onRemove={removeStop} onChange={changeStop} />
      <div className="transport-order-map">
        <div className="transport-order-map-heading"><strong>نقشه انتخاب موقعیت</strong><small>{selected?.label || 'نقطه انتخابی'}</small></div>
        <LocationMap point={selected || blankStop(active.kind)} onPick={onPick} />
      </div>
    </div>
    <div className="transport-order-panel">
      <div className="transport-order-section-title"><span>۲</span><div><h3>مشخصات بار</h3><p>اطلاعات دقیق‌تر باعث پیشنهاد خودروی مناسب‌تر می‌شود.</p></div></div>
      <div className="transport-order-fields">
        <label>نوع بار<input name="goodsType" maxLength={120} placeholder="مثلاً مواد غذایی، مصالح، محصولات کشاورزی" required /></label>
        <label>وزن بار (کیلوگرم)<input name="weightKg" type="number" min="0.1" max="100000" step="0.01" required /></label>
        <label>حجم بار (متر مکعب)<input name="volumeM3" type="number" min="0.01" max="10000" step="0.01" required /></label>
        <label>سرعت تحویل<select name="urgency" defaultValue="daily"><option value="hourly">ساعتی – فوری</option><option value="daily">روزانه</option><option value="multiday">چندروزه</option></select></label>
        <label>مهلت نهایی تحویل<input name="deadline" type="datetime-local" required /></label>
        <label className="transport-order-wide">توضیحات تکمیلی<textarea name="description" rows={3} maxLength={1000} placeholder="شرایط بارگیری، نوع بسته‌بندی، محدودیت‌های مسیر و..." /></label>
      </div>
    </div>
    <div className="transport-order-submit">
      <p>هزینه نهایی بر اساس نوع مسیر، مسافت، وزن، حجم و زمان تحویل محاسبه و پس از بررسی مدیریت اعلام می‌شود.</p>
      <button type="submit" className="partner-primary">ثبت درخواست برای بررسی</button>
    </div>
  </form>;
}
