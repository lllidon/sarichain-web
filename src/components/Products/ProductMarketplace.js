'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faHeart, faList, faMagnifyingGlassPlus, faShareNodes, faStore, faXmark } from '@fortawesome/free-solid-svg-icons';
import ProductPurchase from './ProductPurchase';
import { productImage, productPackages } from './catalog';

function ProductGallery({ product, showSellers }) {
  const [activeImage, setActiveImage] = useState(0);
  const [favorite, setFavorite] = useState(false);
  const [message, setMessage] = useState('');
  const dialog = useRef(null);
  const favoriteKey = `sarichain-favorite-${product.code}`;
  const gallery = product.gallery.length ? product.gallery : [product.fullImage || product.image];
  const images = gallery.map(url => productImage({ image: url }));
  const image = images[activeImage] || images[0];

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
        <a href="#product-sellers-tab" aria-label="فروشندگان" title="فروشندگان" onClick={showSellers}><FontAwesomeIcon icon={faStore} /></a>
        <a href="#product-specifications" aria-label="مشخصات محصول" title="مشخصات محصول"><FontAwesomeIcon icon={faList} /></a>
      </div>
      <div className="market-gallery-content">
        <button type="button" className="product-packshot" aria-label={`بزرگ‌نمایی ${product.name}`} onClick={() => dialog.current.showModal()}>
          <Image src={image} alt={product.name} width={400} height={400} loading="eager" unoptimized />
        </button>
        {images.length > 1 && <div className="market-gallery-thumbs" aria-label="گالری محصول">
          {images.map((src, index) => <button key={src} type="button" aria-pressed={activeImage === index}
            aria-label={`نمایش تصویر ${(index + 1).toLocaleString('fa-IR')}`} onClick={() => setActiveImage(index)}>
            <Image src={src} alt="" width={64} height={64} unoptimized />
          </button>)}
        </div>}
        <div className="market-gallery-status" role="status">{message}</div>
      </div>
      <dialog className="market-photo-dialog" ref={dialog} aria-label="تصویر بزرگ محصول">
        <button type="button" aria-label="بستن تصویر" onClick={() => dialog.current.close()}><FontAwesomeIcon icon={faXmark} /></button>
        <Image src={image} alt={product.name} width={700} height={700} unoptimized />
      </dialog>
    </div>
  );
}

const sellerPreview = [
  { name: 'باغداران ساری', location: 'ساری', delivery: 'تحویل در نقطهٔ تجمیع' },
  { name: 'تعاونی محلی بابل', location: 'بابل', delivery: 'زمان تحویل پس از هماهنگی' },
];

function variantLabel(variant) {
  return variant.options.length ? variant.options.map(option => option.value).join(' · ') : variant.name;
}

export default function ProductMarketplace({ product, category, categoryHref, description }) {
  const [variantId, setVariant] = useState(product.id);
  const [tab, setTab] = useState('about');
  const selected = product.variants.find(variant => variant.id === variantId) ?? product;
  const galleryProduct = selected.gallery.length ? { ...selected, code: product.code } : product;
  const units = productPackages(selected);
  const showSellers = () => setTab('sellers');

  return <div className="product-marketplace">
    <article className="product-overview" aria-labelledby="product-title">
      <ProductGallery product={galleryProduct} key={galleryProduct.id} showSellers={showSellers} />
      <section className="product-overview-info">
        <Link className="product-category" href={categoryHref}>{category.name}</Link>
        <h1 id="product-title">{product.name}</h1>
        {product.brand && <p className="product-brand">برند {product.brand}</p>}
        <p className="product-code">کد کالا <bdi>{selected.code}</bdi></p>
        <p className="product-description">{description}</p>
        {!!product.variants.length && <fieldset className="product-variant-picker">
          <legend>{product.variants.some(variant => variant.options.some(option => option.name.includes('کیف'))) ? 'کیفیت و گزینه‌ها' : 'گزینه‌های محصول'}</legend>
          {[product, ...product.variants].map(item => <label key={item.id}>
            <input type="radio" name="product-variant" checked={variantId === item.id} onChange={() => setVariant(item.id)} />
            <span>{item.id === product.id && !item.options.length ? 'محصول اصلی' : variantLabel(item)}</span>
          </label>)}
        </fieldset>}
        {!!selected.options.length && <dl className="product-inline-specs">
          {selected.options.map(({ name, value }) => <div key={name + ':' + value}><dt>{name}</dt><dd>{value}</dd></div>)}
        </dl>}
        <dl className="product-inline-specs">
          <div><dt>واحد اصلی</dt><dd>{selected.unit}</dd></div>
          {units.filter(unit => unit.amount > 1).map(unit =>
            <div key={unit.id}><dt>واحد فرعی</dt><dd>{unit.name} <small>{unit.amount.toLocaleString('fa-IR')} {selected.unit} در هر {unit.name}</small></dd></div>)}
        </dl>
      </section>
      <aside className="market-purchase" aria-label="خرید محصول">
        <h2>خرید محصول</h2>
        <p>{selected.id === product.id ? 'محصول اصلی' : variantLabel(selected)}</p>
        <ProductPurchase key={selected.id} product={selected} className="product-purchase" chooseUnit />
        <Link href="/cart" className="product-cart-link">مشاهدهٔ سبد خرید</Link>
      </aside>
    </article>
    <nav className="market-section-nav" aria-label="بخش‌های صفحه محصول">
      <button id="product-about-tab" type="button" aria-pressed={tab === 'about'} aria-controls="product-about" onClick={() => setTab('about')}>معرفی</button>
      <button id="product-sellers-tab" type="button" aria-pressed={tab === 'sellers'} aria-controls="product-sellers" onClick={showSellers}>فروشندگان</button>
      <a href="#product-specifications">مشخصات</a>
    </nav>
    <section id="product-about" className="market-sellers" aria-labelledby="product-about-tab" hidden={tab !== 'about'}>
      <h2>معرفی محصول</h2><p>{description}</p>
    </section>
    <section id="product-sellers" className="market-sellers" aria-labelledby="product-sellers-tab" hidden={tab !== 'sellers'}>
      <div className="market-sellers-heading"><h2>فروشندگان</h2><span className="product-mock-label">پیش‌نمایش با دادهٔ نمونه</span></div>
      <ul className="product-sellers-preview">{sellerPreview.map(seller => <li key={seller.name}>
        <FontAwesomeIcon icon={faStore} /><div><strong>{seller.name}</strong><small>{seller.location} · {seller.delivery}</small></div>
        <span><FontAwesomeIcon icon={faCheck} /> نمونه</span>
      </li>)}</ul>
    </section>
  </div>;
}
