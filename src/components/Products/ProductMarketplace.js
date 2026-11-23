'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faEllipsis, faHeart, faImage, faList, faMagnifyingGlassPlus, faShareNodes, faShieldHalved, faStar, faStore, faTruck, faXmark } from '@fortawesome/free-solid-svg-icons';
import ProductPurchase from './ProductPurchase';
import { productImage, productPackages } from './catalog';
import { formatPrice } from './price';
import ProductSellers from './ProductSellers';
import ProductSpecifications from './ProductSpecifications';
import { rankSellers, sellerPreview } from './sellerPreview';

const percent = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 });
const date = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeZone: 'Asia/Tehran' });
const displayDate = day => date.format(new Date(day + 'T12:00:00Z'));

function ProductGallery({ product, showTab }) {
  const [activeImage, setActiveImage] = useState(0);
  const [favorite, setFavorite] = useState(false);
  const [message, setMessage] = useState('');
  const dialog = useRef(null);
  const favoriteKey = `sarichain-favorite-${product.code}`;
  const gallery = product.gallery.length ? product.gallery : [product.fullImage || product.image].filter(Boolean);
  const isExample = gallery.length === 0;
  const images = (isExample ? [''] : gallery).map(url => productImage({ image: url }));
  const image = images[activeImage] || images[0];
  const previewLength = 5;
  const hasMore = images.length > previewLength;
  const placeholders = images.length < 3 ? ['نمای بسته‌بندی', 'نمای نزدیک'].slice(0, 3 - images.length) : [];

  function move(step) {
    setActiveImage(index => (index + images.length + step) % images.length);
  }

  function thumbnails(sources) {
    return sources.map((src, index) => <button key={src} type="button" aria-pressed={activeImage === index}
      aria-label={`نمایش تصویر ${percent.format(index + 1)}`} onClick={() => setActiveImage(index)}>
      <Image src={src} alt="" width={72} height={72} unoptimized />
    </button>);
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

  return (
    <div className="market-gallery">
      <div className="market-gallery-tools" aria-label="ابزارهای محصول">
        <button type="button" aria-label="علاقه‌مندی" title="علاقه‌مندی" aria-pressed={favorite} onClick={toggleFavorite}><FontAwesomeIcon icon={faHeart} /></button>
        <button type="button" aria-label="اشتراک‌گذاری" title="اشتراک‌گذاری" onClick={share}><FontAwesomeIcon icon={faShareNodes} /></button>
        <button type="button" aria-label="بزرگ‌نمایی تصویر" title="بزرگ‌نمایی تصویر" onClick={() => dialog.current.showModal()}><FontAwesomeIcon icon={faMagnifyingGlassPlus} /></button>
        <a href="#product-sellers-tab" aria-label="فروشندگان" title="فروشندگان" onClick={() => showTab('sellers')}><FontAwesomeIcon icon={faStore} /></a>
        <a href="#product-spec-tab" aria-label="مشخصات محصول" title="مشخصات محصول" onClick={() => showTab('specs')}><FontAwesomeIcon icon={faList} /></a>
      </div>
      <div className="market-gallery-content">
        <button type="button" className="product-packshot" aria-label={`بزرگ‌نمایی ${product.name}`} onClick={() => dialog.current.showModal()}>
          <Image src={image} alt={isExample ? 'تصویر نمونه' : product.name} width={400} height={400} loading="eager" unoptimized />
          {isExample && <span className="product-example gallery-example">تصویر نمونه</span>}
        </button>
        <div className="market-gallery-thumbs" aria-label="گالری محصول">
          {thumbnails(images.slice(0, previewLength))}
          {placeholders.map(text => <span key={text} className="gallery-placeholder" title={text}>
            <FontAwesomeIcon icon={faImage} /><small>نمونه</small>
          </span>)}
          {hasMore && <button className="gallery-all" type="button" aria-label="مشاهده همه تصاویر"
            onClick={() => dialog.current.showModal()}><FontAwesomeIcon icon={faEllipsis} /><small>{percent.format(images.length)} تصویر</small></button>}
        </div>
        <div className="market-gallery-status" role="status">{message}</div>
      </div>
      <dialog className="market-photo-dialog" ref={dialog} aria-label="تصویر بزرگ محصول">
        <button type="button" aria-label="بستن تصویر" onClick={() => dialog.current.close()}><FontAwesomeIcon icon={faXmark} /></button>
        <Image src={image} alt={isExample ? 'تصویر نمونه' : product.name} width={700} height={700} unoptimized />
        {images.length > 1 && <>
          <div className="gallery-controls">
            <button type="button" aria-label="تصویر قبلی" onClick={() => move(-1)}><FontAwesomeIcon icon={faArrowRight} /></button>
            <span aria-live="polite">{percent.format(activeImage + 1)} از {percent.format(images.length)}</span>
            <button type="button" aria-label="تصویر بعدی" onClick={() => move(1)}><FontAwesomeIcon icon={faArrowLeft} /></button>
          </div>
          <div className="market-gallery-thumbs" aria-label="همه تصاویر">{thumbnails(images)}</div>
        </>}
      </dialog>
    </div>
  );
}

function PurchaseCard({ seller, product, selected, delivery, initialUnit }) {
  return <aside className="market-purchase product-buy-card" id="product-buy-card" aria-label="خرید محصول">
    <div className="product-buy-title"><h2>خرید محصول</h2><span className="product-example">فروشندهٔ نمونه</span></div>
    <div className="product-card-seller">
      <span className="seller-logo"><FontAwesomeIcon icon={faStore} /></span>
      <div><strong>{seller.name}</strong><small>{seller.city} · فاصلهٔ نمونه {percent.format(seller.distance)} کیلومتر</small></div>
    </div>
    <div className="product-card-scores">
      <span><FontAwesomeIcon icon={faStar} /> {percent.format(seller.rating)} از ۵ کاربران</span>
      <span>نظارت {percent.format(seller.oversight)}٪</span>
    </div>
    <div className="product-buy-action">
      <p>{selected.id === product.id ? 'محصول اصلی' : variantLabel(selected)}</p>
      <ProductPurchase key={selected.id} product={selected} className="product-purchase" chooseUnit initialUnit={initialUnit} />
      <details className="product-price-history">
        <summary>سابقهٔ قیمت ۳۰ روزه <span className="product-example">نمونه</span></summary>
        <p>بازهٔ نمونه {formatPrice({ min: 3, max: 4.5 })}</p>
      </details>
    </div>
    <div className="product-quality-promise"><FontAwesomeIcon icon={faShieldHalved} />
      <div><strong>بررسی انطباق با کیفیت اعلام‌شده</strong><span className="product-example">نمونهٔ تعهد</span></div>
    </div>
    <details className="product-delivery-info" open>
      <summary><FontAwesomeIcon icon={faTruck} /> روش‌ها و هزینه‌های ارسال</summary>
      {delivery.length ? <ul>{delivery.map(method => <li key={method.id}>
        <div><strong>{method.label}</strong><small>زودترین تحویل {displayDate(method.windows[0].deliveryDate)}</small></div>
        <b>{formatPrice({ min: method.fee, max: method.fee })}</b>
      </li>)}</ul> : <p>ارسال سریع یا اقتصادی <span className="product-example">نمونه</span></p>}
      <small>انتخاب روز ارسال در سبد خرید</small>
    </details>
  </aside>;
}

function variantLabel(variant) {
  return variant.options.length ? variant.options.map(option => option.value).join(' · ') : variant.name;
}

export default function ProductMarketplace({ product, category, categoryHref, description, delivery = [], initialVariant, initialUnit }) {
  const [variantId, setVariant] = useState(initialVariant ?? product.id);
  const [tab, setTab] = useState('about');
  const [priority, setPriority] = useState('score');
  const [sellerId, selectSeller] = useState(null);
  const seller = sellerPreview.find(item => item.id === sellerId) ?? rankSellers(priority)[0];
  const selected = product.variants.find(variant => variant.id === variantId) ?? product;
  const galleryProduct = selected.gallery.length ? { ...selected, code: product.code } : product;
  const units = productPackages(selected);

  return <div className="product-marketplace">
    <article className="product-overview" aria-labelledby="product-title">
      <ProductGallery product={galleryProduct} key={galleryProduct.id} showTab={setTab} />
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
      <PurchaseCard seller={seller} product={product} selected={selected} delivery={delivery} initialUnit={selected.id === (initialVariant ?? product.id) ? initialUnit : undefined} />
    </article>
    <nav className="market-section-nav" aria-label="بخش‌های صفحه محصول">
      <button id="product-about-tab" type="button" aria-pressed={tab === 'about'} aria-controls="product-about" onClick={() => setTab('about')}>معرفی</button>
      <button id="product-sellers-tab" type="button" aria-pressed={tab === 'sellers'} aria-controls="product-sellers" onClick={() => setTab('sellers')}>فروشندگان</button>
      <button id="product-spec-tab" type="button" aria-pressed={tab === 'specs'} aria-controls="product-specifications" onClick={() => setTab('specs')}>مشخصات</button>
    </nav>
    <section id="product-about" className="market-sellers" aria-labelledby="product-about-tab" hidden={tab !== 'about'}>
      <h2>معرفی محصول</h2><p>{description}</p>
    </section>
    <ProductSellers hidden={tab !== 'sellers'} priority={priority} setPriority={value => {
      setPriority(value); selectSeller(null);
    }} selected={seller} selectSeller={selectSeller} />
    <ProductSpecifications product={product} category={category} description={selected.description || product.description}
      selected={selected} hidden={tab !== 'specs'} />
  </div>;
}
