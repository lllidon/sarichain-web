'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faList, faMagnifyingGlassPlus, faShareNodes, faStore, faXmark } from '@fortawesome/free-solid-svg-icons';
import ProductPurchase from './ProductPurchase';
import { productImage } from './catalog';

function ProductGallery({ product }) {
  const [favorite, setFavorite] = useState(false);
  const [message, setMessage] = useState('');
  const dialog = useRef(null);
  const favoriteKey = `sarichain-favorite-${product.code}`;
  const image = productImage({ ...product, image: product.fullImage || product.image });

  useEffect(() => {
    try { setFavorite(localStorage.getItem(favoriteKey) === '1'); }
    catch { setFavorite(false); }
  }, [favoriteKey]);

  function toggleFavorite() {
    const next = !favorite;
    setFavorite(next);
    try {
      if (next) localStorage.setItem(favoriteKey, '1');
      else localStorage.removeItem(favoriteKey);
    } catch {
      setMessage('علاقه‌مندی فقط تا زمانی که این صفحه باز است حفظ می‌شود.');
    }
  }

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: product.name, url: location.href });
      else {
        await navigator.clipboard.writeText(location.href);
        setMessage('پیوند محصول کپی شد.');
      }
    } catch (error) {
      if (error.name !== 'AbortError') setMessage('برای اشتراک‌گذاری، نشانی محصول را از نوار مرورگر کپی کنید.');
    }
  }

  return (
    <div className="market-gallery">
      <div className="market-gallery-tools" aria-label="ابزارهای محصول">
        <button type="button" aria-label="علاقه‌مندی" title="علاقه‌مندی" aria-pressed={favorite} onClick={toggleFavorite}><FontAwesomeIcon icon={faHeart} /></button>
        <button type="button" aria-label="اشتراک‌گذاری" title="اشتراک‌گذاری" onClick={share}><FontAwesomeIcon icon={faShareNodes} /></button>
        <button type="button" aria-label="بزرگ‌نمایی تصویر" title="بزرگ‌نمایی تصویر" onClick={() => dialog.current.showModal()}><FontAwesomeIcon icon={faMagnifyingGlassPlus} /></button>
        <a href="#product-sellers" aria-label="فروشندگان" title="فروشندگان"><FontAwesomeIcon icon={faStore} /></a>
        <a href="#product-specifications" aria-label="مشخصات محصول" title="مشخصات محصول"><FontAwesomeIcon icon={faList} /></a>
      </div>
      <div className="market-gallery-content">
        <button type="button" className="product-packshot" aria-label={`بزرگ‌نمایی ${product.name}`} onClick={() => dialog.current.showModal()}>
          <Image src={image} alt={product.name} width={400} height={400} loading="eager" unoptimized />
        </button>
        <div className="market-gallery-status" role="status">{message}</div>
      </div>
      <dialog className="market-photo-dialog" ref={dialog} aria-label="تصویر بزرگ محصول">
        <button type="button" aria-label="بستن تصویر" onClick={() => dialog.current.close()}><FontAwesomeIcon icon={faXmark} /></button>
        <Image src={image} alt={product.name} width={700} height={700} unoptimized />
      </dialog>
    </div>
  );
}

export default function ProductMarketplace({ product, category, categoryHref, description }) {
  return <div className="product-marketplace">
    <article className="product-overview" aria-labelledby="product-title">
      <ProductGallery product={product} />
      <section className="product-overview-info">
        <Link className="product-category" href={categoryHref}>{category.name}</Link>
        <h1 id="product-title">{product.name}</h1>
        {product.brand && <p>برند {product.brand}</p>}
        <p className="product-code">کد کالا <bdi>{product.code}</bdi></p>
        <p className="product-description">{description}</p>
        <ProductPurchase product={product} className="product-purchase" />
      </section>
    </article>
    <section id="product-sellers" className="market-sellers">
      <h2>فروشندگان این محصول</h2>
      <p>پیشنهاد فروشنده‌ای برای این محصول ثبت نشده است.</p>
    </section>
  </div>;
}
