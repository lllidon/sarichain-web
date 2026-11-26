'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

const groups = [
  { title: 'راهکارهای کشاورزی', links: [
    ['تغذیه و سلامت گیاه', '/categories?q=تغذیه'],
    ['بهبود خاک و ریشه', '/categories?q=خاک'],
    ['مدیریت تنش‌های محیطی', '/categories?q=تنش'],
    ['افزایش عملکرد محصول', '/categories?q=عملکرد'],
  ]},
  { title: 'بر اساس نوع فعالیت', links: [
    ['باغداری و محصولات باغی', '/categories?q=باغداری'],
    ['زراعت و محصولات زراعی', '/categories?q=زراعت'],
    ['گلخانه و کشت‌های کنترل‌شده', '/categories?q=گلخانه'],
    ['تأمین نهاده‌های کشاورزی', '/categories'],
  ]},
  { title: 'دانش و تجربه', links: [
    ['راهنماهای کاربردی', '/pilot'],
    ['مقالات و آموزش‌ها', '/pilot'],
    ['تجربه تولیدکنندگان', '/suppliers'],
    ['پرسش‌های متداول', '/support'],
  ]},
];

export default function SolutionsMegaMenu() {
  const root = useRef(null);
  const timer = useRef(null);
  const [open, setOpen] = useState(false);

  function show() {
    if (timer.current) clearTimeout(timer.current);
    if (window.innerWidth > 992) setOpen(true);
  }
  function hide() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), 220);
  }
  function toggle() {
    if (timer.current) clearTimeout(timer.current);
    setOpen(value => !value);
  }

  useEffect(() => {
    function outside(event) { if (!root.current?.contains(event.target)) setOpen(false); }
    function escape(event) { if (event.key === 'Escape') setOpen(false); }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <li ref={root} className={`nav-item mega-menu nav-solutions ${open ? 'is-open' : ''}`}
      onMouseEnter={show} onMouseLeave={hide} onFocus={show}>
      <button type="button" className="nav-link nav-mega-trigger" aria-expanded={open}
        aria-controls="nav-solutions-panel" onClick={toggle}>
        راهکارها <FontAwesomeIcon icon={faChevronDown} className="dropdown-icon" />
      </button>
      {open && <div id="nav-solutions-panel" className="mega-menu-content nav-solutions-panel"
        onMouseEnter={show} onMouseLeave={hide}>
        <div className="mega-menu-grid nav-solutions-grid">
          {groups.map(group => <section className="mega-col" key={group.title}>
            <h4>{group.title}</h4>
            <ul>{group.links.map(([label, href]) => <li key={label}><Link href={href} onClick={() => setOpen(false)}>{label}</Link></li>)}</ul>
          </section>)}
          <section className="nav-mega-feature">
            <span>ساری‌چین</span>
            <strong>راهکار مناسب کسب‌وکار کشاورزی‌ات را پیدا کن</strong>
            <p>محصولات و خدمات موردنیاز را بر اساس نوع فعالیت و نیازت بررسی کن.</p>
            <Link href="/categories" onClick={() => setOpen(false)}>مشاهده محصولات</Link>
          </section>
        </div>
      </div>}
    </li>
  );
}
