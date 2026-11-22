'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAddressBook, faLocationDot, faPhone } from '@fortawesome/free-solid-svg-icons';
import '../Products/CategoriesPage.css';
import './SuppliersDirectory.css';

const sessionKey = 'sarichain-directory-token';
const number = new Intl.NumberFormat('fa-IR');

async function request(resource, { token, query, body, signal } = {}) {
  const response = await fetch(`/api/directory/${resource}${query ? '?' + new URLSearchParams(query) : ''}`, {
    signal, cache: 'no-store',
    ...(body && { method: 'POST', body: JSON.stringify(body) }),
    headers: {
      ...(body && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!response.ok) throw Object.assign(new Error('Request failed'), { status: response.status });
  return response.json();
}

export default function SuppliersDirectory() {
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [filters, setFilters] = useState({});
  const [tagSearch, setTagSearch] = useState('');
  const [tag, setTag] = useState(null);
  const [tags, setTags] = useState([]);
  const [tagError, setTagError] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [retry, setRetry] = useState(0);
  const lastPage = data ? Math.min(10000, Math.max(1, Math.ceil(data.total / data.limit))) : 1;

  useEffect(() => {
    try { setToken(sessionStorage.getItem(sessionKey)); }
    finally { setReady(true); }
  }, []);

  function signOut() {
    sessionStorage.removeItem(sessionKey);
    setToken(null);
    setNotice('');
    setData(null);
    setTags([]);
    setTag(null);
    setTagSearch('');
    setPage(1);
    setFilters({});
  }

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setNotice('');
    setData(null);
    request('suppliers', { token, query: { ...filters, ...(tag && { tagId: tag._id }), page, limit: 12 }, signal: controller.signal })
      .then(body => { if (!controller.signal.aborted) setData(body); }).catch(error => {
        if (controller.signal.aborted) return;
        if (error.status === 401) signOut();
        else setNotice('فهرست تأمین‌کنندگان دریافت نشد.');
      });
    return () => controller.abort();
  }, [token, filters, tag, page, retry]);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setTagError('');
      request('tags', { token, query: { search: tagSearch.trim(), limit: 15 }, signal: controller.signal })
        .then(body => { if (!controller.signal.aborted) setTags(body.items); }).catch(error => {
          if (controller.signal.aborted) return;
          if (error.status === 401) signOut();
          else setTagError('تگ‌ها دریافت نشدند.');
        });
    }, 180);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [token, tagSearch]);

  async function login(event) {
    event.preventDefault();
    setBusy(true);
    setNotice('');
    const values = new FormData(event.currentTarget);
    const identifier = String(values.get('identifier')).trim();
    const identity = /^[a-z]/i.test(identifier) ? { username: identifier } : { phone: identifier };
    try {
      const { accessToken } = await request('login', { body: { ...identity, password: values.get('password') } });
      sessionStorage.setItem(sessionKey, accessToken);
      setToken(accessToken);
    } catch (error) {
      setNotice(error.status === 401 || error.status === 400 ? 'شناسه ورود یا رمز عبور صحیح نیست.'
        : error.status === 429 ? 'تلاش‌ها بیش از حد مجاز است. کمی بعد دوباره امتحان کنید.' : 'ارتباط با سامانه ورود برقرار نشد.');
    } finally { setBusy(false); }
  }

  function search(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setPage(1);
    setFilters(Object.fromEntries([...values].map(([key, value]) => [key, String(value).trim()])));
  }

  return (
    <div className="catalog-page directory-page">
      <div className="catalog-wrap">
        <nav className="catalog-breadcrumb" aria-label="مسیر صفحه"><Link href="/">صفحه اصلی</Link><span aria-hidden="true">/</span><span aria-current="page">مواد اولیه</span></nav>
        <header className="directory-heading">
          <div><h1><FontAwesomeIcon icon={faAddressBook} /> تأمین‌کنندگان مواد اولیه</h1>
            <p>تأمین‌کننده را در محدوده خود پیدا کنید و مستقیم با او تماس بگیرید.</p></div>
          {token && <button type="button" onClick={signOut}>خروج از دفترچه</button>}
        </header>
        {!ready ? null : !token ? (
          <form className="directory-login" onSubmit={login}>
            <h2>ورود اعضا</h2>
            <label>نام کاربری یا شماره موبایل<input name="identifier" dir="ltr" autoComplete="username" required /></label>
            <label>رمز عبور<input name="password" type="password" dir="ltr" autoComplete="current-password" required /></label>
            {notice && <p role="alert">{notice}</p>}
            <button type="submit" disabled={busy}>ورود و مشاهده شماره‌ها</button>
          </form>
        ) : (
          <>
            <form className="directory-search" onSubmit={search}>
              <label>نام یا حوزه تأمین<input name="search" type="search" maxLength={100} placeholder="مثلاً کود زیستی" /></label>
              <label>استان<input name="province" maxLength={100} placeholder="مثلاً مازندران" /></label>
              <label>شهر<input name="city" maxLength={100} placeholder="مثلاً ساری" /></label>
              <button type="submit">جستجو</button>
            </form>
            <div className="directory-tags">
              <label>جستجوی تگ<input value={tagSearch} onChange={event => setTagSearch(event.target.value)} maxLength={60} /></label>
              <label>تگ محصول<select aria-label="تگ محصول" value={tag?._id ?? ''} onChange={event => {
                const next = tags.find(item => item._id === event.target.value);
                setTag(next ?? null);
                setPage(1);
              }}>
                <option value="">همه تگ‌ها</option>
                {tag && !tags.some(item => item._id === tag._id) && <option value={tag._id}>{tag.name}</option>}
                {tags.map(item => <option key={item._id} value={item._id}>{item.name}</option>)}
              </select></label>
              {tagError && <span role="status">{tagError}</span>}
            </div>
            {notice ? <p className="directory-state" role="alert">{notice} <button type="button" onClick={() => setRetry(value => value + 1)}>تلاش دوباره</button></p>
              : !data ? <p className="directory-state" role="status">در حال دریافت…</p>
              : !data.items.length ? <p className="directory-state">تأمین‌کننده‌ای با این مشخصات پیدا نشد.</p>
              : (
                <>
                  <p className="directory-count" role="status">{number.format(data.total)} تأمین‌کننده</p>
                  <ul className="directory-grid">
                    {data.items.map(item => (
                      <li key={item._id} className="directory-card">
                        <h2>{item.name}</h2>
                        <p><FontAwesomeIcon icon={faLocationDot} /> {item.city}، {item.province}</p>
                        {item.description && <p>{item.description}</p>}
                        {item.tagIds?.length > 0 && <ul className="directory-card-tags">{item.tagIds.map(tagItem => <li key={tagItem._id}>{tagItem.name}</li>)}</ul>}
                        {item.contactName && <p>رابط تماس <strong>{item.contactName}</strong></p>}
                        {item.address && <p>{item.address}</p>}
                        {item.hours && <p>ساعت پاسخ‌گویی {item.hours}</p>}
                        <div className="directory-contacts">
                          <a href={`tel:${item.phone}`}><FontAwesomeIcon icon={faPhone} /> <bdi>{item.phone}</bdi></a>
                          {item.alternatePhone && <a href={`tel:${item.alternatePhone}`}><bdi>{item.alternatePhone}</bdi></a>}
                          {item.email && <a href={`mailto:${item.email}`}>ایمیل</a>}
                          {item.website && <a href={item.website} rel="noreferrer" target="_blank">وب‌سایت</a>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            {lastPage > 1 && <nav className="catalog-pagination" aria-label="صفحه‌بندی">
              <button type="button" onClick={() => setPage(page - 1)} disabled={page <= 1}>قبلی</button>
              <span>{number.format(page)} از {number.format(lastPage)}</span>
              <button type="button" onClick={() => setPage(page + 1)} disabled={page >= lastPage}>بعدی</button>
            </nav>}
          </>
        )}
      </div>
    </div>
  );
}
