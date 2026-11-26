'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { saveWorkspaceLocation } from '../../app/(workspace)/partners/actions';
import { ProfileLocation } from './PartnerProfile';
import LocationMap from './LocationMap';
import { locationTypes } from './workspaceSections';

export default function WorkspaceLocationForm({ profile }) {
  const [error, action, pending] = useActionState(saveWorkspaceLocation, null);
  const [fields, setFields] = useState({ title: '', type: '', details: '' });
  const [point, setPoint] = useState({ latitude: '', longitude: '' });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [imageError, setImageError] = useState('');
  const fileInput = useRef(null);
  const change = event => setFields({ ...fields, [event.target.name]: event.target.value });

  useEffect(() => {
    if (!image) { setPreview(''); return; }
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  function pickImage(event) {
    const file = event.target.files[0];
    const tooLarge = file?.size > 2 * 1024 * 1024;
    setImageError(tooLarge ? 'حجم تصویر باید حداکثر ۲ مگابایت باشد.' : '');
    setImage(tooLarge ? null : file ?? null);
    if (tooLarge) event.target.value = '';
  }

  function clearImage() {
    fileInput.current.value = '';
    setImage(null);
    setImageError('');
  }

  return <form className="partner-entry-form partner-location-form" action={formData => {
    if (image) formData.set('image', image);
    else formData.delete('image');
    action(formData);
  }}>
    <h3>ثبت موقعیت مکانی</h3>
    <div className="partner-offer-filters">
      <label>نام موقعیت<input name="title" value={fields.title} onChange={change} placeholder="مثلاً باغ شمالی" maxLength={120} required /></label>
      <label>نوع موقعیت<select name="type" value={fields.type} onChange={change} required>
        <option value="">انتخاب نوع</option>
        {Object.entries(locationTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <ProfileLocation profile={profile} required />
    </div>
    <LocationMap point={point} onPick={setPoint} />
    <div className="partner-offer-filters">
      <label>عرض جغرافیایی<input type="number" name="latitude" dir="ltr" min="-90" max="90" step="0.000001" required value={point.latitude}
        onChange={event => setPoint({ ...point, latitude: event.target.value })} /></label>
      <label>طول جغرافیایی<input type="number" name="longitude" dir="ltr" min="-180" max="180" step="0.000001" required value={point.longitude}
        onChange={event => setPoint({ ...point, longitude: event.target.value })} /></label>
    </div>
    <div className="partner-location-upload">
      {preview && <img src={preview} alt="پیش‌نمایش تصویر موقعیت" />}
      <label>تصویر موقعیت (اختیاری)
        <input ref={fileInput} type="file" name="image" accept="image/jpeg,image/png,image/webp" onChange={pickImage} />
      </label>
      <p>JPEG، PNG یا WebP تا ۲ مگابایت</p>
      {(image || imageError) && <button type="button" className="partner-secondary" onClick={clearImage}>برداشتن تصویر</button>}
      {imageError && <p role="alert">{imageError}</p>}
    </div>
    <label>یادداشت (اختیاری)<textarea name="details" value={fields.details} onChange={change} rows={3} maxLength={1000}
      placeholder="مثلاً مساحت یا راه دسترسی" /></label>
    {error && <p className="partner-dash-feedback" role="alert">{error}</p>}
    <button type="submit" className="partner-primary" disabled={pending || Boolean(imageError)}>{pending ? 'در حال ذخیره…' : 'ذخیرهٔ موقعیت'}</button>
  </form>;
}
