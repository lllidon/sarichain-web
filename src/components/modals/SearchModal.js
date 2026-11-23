'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCatalog } from '../Products/CatalogProvider';
import { productHref, productImage } from '../Products/catalog';
import './Modal.css';

export default function SearchModal({ isOpen, onClose }) {
  const { catalog, categories, unavailable } = useCatalog();
  const [input, setInput] = useState('');
  const query = input.trim().toLowerCase();
  const results = query ? catalog.filter(product =>
    [product.name, product.code, product.brand, categories[product.category].name]
      .some(value => value.toLowerCase().includes(query))
  ).slice(0, 12) : [];

  if (!isOpen) return null;
  return <div className="modal-overlay" onClick={onClose}>
    <section className="modal-container search-modal" dir="rtl" onClick={event => event.stopPropagation()}>
      <div className="modal-header">
        <h3>جستجوی محصولات</h3>
        <button className="modal-close" onClick={onClose} aria-label="بستن">×</button>
      </div>
      <div className="search-input-wrapper">
        <input type="search" aria-label="نام یا کد محصول" placeholder="نام یا کد محصول"
          value={input} onChange={event => setInput(event.target.value)} autoFocus />
      </div>
      <div className="search-results">
        {unavailable ? <p role="alert">کاتالوگ در دسترس نیست.</p> :
          query && !results.length ? <p>محصولی پیدا نشد.</p> :
          results.map(product => <Link className="search-result-item" key={product.id} href={productHref(product)} onClick={onClose}>
            <Image src={productImage(product)} alt="" width={80} height={60} unoptimized />
            <span>{product.name}{product.brand && ' · ' + product.brand}</span>
          </Link>)}
      </div>
    </section>
  </div>;
}
