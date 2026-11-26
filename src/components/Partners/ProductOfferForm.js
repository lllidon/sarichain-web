'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { saveProductOffer } from '../../app/(workspace)/partners/actions';
import { categoryContains, normalizeCatalogSearch } from '../Products/catalog';
import { partnerHref } from './workspaceSections';

const resultPageSize = 8;

export default function ProductOfferForm({ products, categories, brands, locations }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [limit, setLimit] = useState(resultPageSize);
  const [selected, setSelected] = useState(null);
  const [fields, setFields] = useState({ price: '', stock: '', harvestDate: '', notes: '', locationId: '' });
  const [error, action, pending] = useActionState(saveProductOffer, null);
  const query = normalizeCatalogSearch(search);
  const matches = products.filter(product =>
    (!category || categoryContains(categories, category, product.category)) &&
    (!brand || product.brandId === brand) &&
    normalizeCatalogSearch([product.name, product.code, product.brand].join(' ')).includes(query));
  const changeFilter = set => event => { set(event.target.value); setLimit(resultPageSize); };
  const changeField = event => setFields({ ...fields, [event.target.name]: event.target.value });
  const categoryName = id => {
    const item = categories[id];
    const parent = categories[item.parentId];
    return parent ? parent.name + ' / ' + item.name : item.name;
  };

  return <form className="partner-entry-form partner-offer-form" action={action}>
    <h3>ثبت عرضهٔ محصول</h3>
    <div className="partner-offer-filters">
      <label className="partner-offer-wide">جستجوی محصول
        <input type="search" value={search} onChange={changeFilter(setSearch)} placeholder="نام یا کد محصول" />
      </label>
      <label>دسته‌بندی
        <select value={category} onChange={changeFilter(setCategory)}>
          <option value="">همهٔ دسته‌ها</option>
          {Object.keys(categories).map(id => <option key={id} value={id}>{categoryName(id)}</option>)}
        </select>
      </label>
      <label>برند
        <select value={brand} onChange={changeFilter(setBrand)}>
          <option value="">همهٔ برندها</option>
          {brands.map(item => <option key={item._id} value={item._id}>{item.name}</option>)}
        </select>
      </label>
    </div>
    <ul className="partner-offer-results" aria-label="محصولات کاتالوگ">
      {matches.slice(0, limit).map(product => <li key={product.id}>
        <button type="button" aria-pressed={selected?.id === product.id}
          onClick={() => setSelected(product)}>
          <strong>{product.name}</strong>
          <small>{[product.code, product.brand, categories[product.category]?.name].filter(Boolean).join(' · ')}</small>
        </button>
      </li>)}
    </ul>
    {!matches.length && <p role="status">محصولی با این فیلترها یافت نشد.</p>}
    {matches.length > limit && <button type="button" className="partner-secondary" onClick={() => setLimit(limit + resultPageSize)}>نمایش محصولات بیشتر</button>}
    <input type="hidden" name="productId" value={selected?.id ?? ''} />
    {selected ? <>
      <p className="partner-offer-selected" role="status"><strong>محصول انتخاب‌شده</strong> {selected.name} · <bdi>{selected.code}</bdi></p>
      <div className="partner-offer-filters">
        <label>قیمت هر {selected.unit} (کارسا)
          <input name="price" type="text" inputMode="decimal" maxLength={16} value={fields.price} onChange={changeField} required />
        </label>
        <label>موجودی تقریبی ({selected.unit})
          <input name="stock" type="text" inputMode="decimal" maxLength={16} value={fields.stock} onChange={changeField} required />
        </label>
        <label className="partner-offer-wide">تاریخ تقریبی برداشت (اختیاری)
          <input type="date" name="harvestDate" lang="fa-IR" value={fields.harvestDate} onChange={changeField} />
        </label>
      </div>
      <label>موقعیت مکانی عرضه (اختیاری)
        <select name="locationId" value={fields.locationId} onChange={changeField} disabled={!locations?.length}>
          <option value="">{locations === null ? 'دریافت موقعیت‌ها ممکن نبود' : 'انتخاب موقعیت'}</option>
          {locations?.map(item => <option key={item.id} value={item.id}>{item.title}{item.city ? ' · ' + item.city : ''}</option>)}
        </select>
      </label>
      <Link className="partner-location-link" href={partnerHref('orchards')}>مدیریت موقعیت‌های مکانی</Link>
      <label>یادداشت (اختیاری)
        <textarea name="notes" maxLength={1000} rows={3} value={fields.notes} onChange={changeField} placeholder="مثلاً رقم یا شرایط تحویل" />
      </label>
    </> : <p>برای ورود مشخصات عرضه، یک محصول انتخاب کنید.</p>}
    {error && <p className="partner-dash-feedback" role="alert">{error}</p>}
    <button type="submit" className="partner-primary" disabled={!selected || pending}>{pending ? 'در حال ثبت…' : 'ثبت عرضه'}</button>
  </form>;
}
