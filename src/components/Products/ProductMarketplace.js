'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown, faHeart, faList, faLocationDot, faMagnifyingGlassPlus, faShareNodes, faStore, faTruck, faXmark } from '@fortawesome/free-solid-svg-icons';
import ProductPurchase from './ProductPurchase';
import { productImage } from './catalog';
import { areas, nearbyOffers, qualities } from './marketplace';

const number = new Intl.NumberFormat('fa-IR');

function ProductGallery({ product }) {
  const [active, setActive] = useState(0);
  const [favorite, setFavorite] = useState(false);
  const [message, setMessage] = useState('');
  const dialog = useRef(null);
  const favoriteKey = `sarichain-favorite-${product.code}`;
  const gallery = [{ src: productImage({ ...product, image: product.fullImage || product.image }), label: 'نمای روبه‌رو' }];
  if (product.code === 'SC-1001') {
    gallery.push(
      { src: '/img/catalog/bio-boost-angle.webp', label: 'نمای سه‌رخ' },
      { src: '/img/catalog/bio-boost-label.webp', label: 'نمای نزدیک برچسب' },
      { src: '/img/catalog/bio-boost-field.webp', label: 'محصول در مزرعه' },
    );
  }

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

  const image = gallery[active] ?? gallery[0];
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
        <button type="button" className="product-packshot" aria-label={`بزرگ‌نمایی ${image.label}`} onClick={() => dialog.current.showModal()}>
          <Image src={image.src} alt={`${product.name}، ${image.label}`} width={400} height={400} loading="eager" unoptimized />
        </button>
        {gallery.length > 1 && (
          <div className="market-gallery-thumbs" aria-label="نماهای محصول">
            {gallery.map((photo, index) => (
              <button type="button" key={photo.src} aria-label={photo.label} aria-pressed={index === active} onClick={() => setActive(index)}>
                <Image src={photo.src} alt="" width={64} height={64} unoptimized />
              </button>
            ))}
          </div>
        )}
        <div className="market-gallery-status" role="status">{message}</div>
      </div>
      <dialog className="market-photo-dialog" ref={dialog} aria-label="تصویر بزرگ محصول">
        <button type="button" aria-label="بستن تصویر" onClick={() => dialog.current.close()}><FontAwesomeIcon icon={faXmark} /></button>
        <Image src={image.src} alt={`${product.name}، ${image.label}`} width={700} height={700} unoptimized />
      </dialog>
    </div>
  );
}

export default function ProductMarketplace({ product, category, categoryHref, description }) {
  const [area, setArea] = useState(areas[0]);
  const [qualityId, setQualityId] = useState('first');
  const [sellerId, setSellerId] = useState(null);
  const purchaseCard = useRef(null);
  const sellers = nearbyOffers(product, area, qualityId);
  const selected = sellers.find(seller => seller.id === sellerId) ?? sellers[0];

  function selectSeller(seller) {
    setSellerId(seller.id);
    purchaseCard.current.focus();
  }

  return (
    <>
      <article className="product-overview" aria-labelledby="product-title">
        <ProductGallery product={product} />
        <div className="product-overview-info">
          <Link className="product-category" href={categoryHref}>{category.name}</Link>
          <h1 id="product-title">{product.name}</h1>
          <p className="product-code">کد کالا <bdi>{product.code}</bdi></p>
          <p className="product-description">{description}</p>
          {product.orderable && (
            <fieldset className="market-quality">
              <legend>درجه کیفی محصول</legend>
              <div>
                {qualities.map(quality => (
                  <label key={quality.id} data-tone={quality.tone}>
                    <input type="radio" name="quality" checked={quality.id === qualityId}
                      onChange={() => { setQualityId(quality.id); setSellerId(null); }} />
                    <span className="market-quality-dot" aria-hidden="true" />
                    {quality.name}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </div>

        <aside className="market-purchase" ref={purchaseCard} tabIndex={-1} aria-labelledby="market-purchase-title">
          <h2 id="market-purchase-title">خرید محصول</h2>
          {selected ? (
            <>
              <label className="market-area">
                <span><FontAwesomeIcon icon={faLocationDot} /> محدوده تحویل آزمایشی</span>
                <select value={area.id} onChange={event => {
                  setArea(areas.find(area => area.id === event.target.value));
                  setSellerId(null);
                }}>
                  {areas.map(area => <option key={area.id} value={area.id}>{area.name}</option>)}
                </select>
              </label>
              <div className="market-seller-summary">
                <strong>{selected.name}</strong>
                {selected === sellers[0] && <span className="market-nearest">نزدیک‌ترین</span>}
                <small>{number.format(selected.distance)} کیلومتر · {selected.delivery}</small>
              </div>
              <ProductPurchase product={product} className="product-purchase" offer={selected.offer} />
              <a className="market-compare-link" href="#product-sellers">مقایسه {number.format(sellers.length)} فروشنده <FontAwesomeIcon icon={faArrowDown} /></a>
            </>
          ) : (
            <>
              <span className="product-unavailable">ناموجود</span>
              <ProductPurchase product={product} className="product-purchase" />
            </>
          )}
        </aside>
      </article>

      <section id="product-sellers" className="market-sellers" aria-labelledby="market-sellers-title">
        <div className="market-sellers-heading">
          <h2 id="market-sellers-title">فروشندگان این محصول</h2>
          {selected && <span>مرتب‌شده بر اساس فاصله تا {area.name}</span>}
        </div>
        {sellers.length ? (
          <ul>
            {sellers.map((seller, index) => (
              <li key={seller.id}>
                <div className="market-list-name">
                  <FontAwesomeIcon icon={faStore} />
                  <div><strong>{seller.name}</strong><small>{seller.location}</small></div>
                </div>
                <div className="market-list-distance">
                  <span><FontAwesomeIcon icon={faLocationDot} /> {number.format(seller.distance)} کیلومتر</span>
                  {index === 0 && <span className="market-nearest">نزدیک‌ترین</span>}
                </div>
                <span className="market-list-delivery"><FontAwesomeIcon icon={faTruck} /> {seller.delivery}</span>
                <span className="market-list-price"><strong>{number.format(seller.offer.unitPrice)}</strong> تومان / {product.unit}</span>
                <button type="button" aria-pressed={seller === selected} onClick={() => selectSeller(seller)}>
                  {seller === selected ? 'فروشنده انتخاب‌شده' : 'انتخاب فروشنده'}
                </button>
              </li>
            ))}
          </ul>
        ) : <p>فعلاً فروشنده‌ای برای این محصول موجود نیست.</p>}
      </section>
    </>
  );
}
