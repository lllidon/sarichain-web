'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft, faBasketShopping, faBorderAll, faBoxOpen,
  faClipboardList, faImage, faRightFromBracket, faTruckFast, faUser, faUserPen, faWallet,
} from '@fortawesome/free-solid-svg-icons';
import { useCatalog } from './Products/CatalogProvider';
import { productHref, productImage } from './Products/catalog';
import { formatPrice, scalePrice, sumPrices } from './Products/price';
import { useAccountCart } from './modals/AccountCartProvider';
import { displayCart } from './modals/cartPresentation';
import { useCatalogCart } from './modals/cartStore';
import { leaveWorkspace } from '../app/(workspace)/partners/actions';

const number = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 6 });

function AccountLink({ href, icon, children, onClick, className = '' }) {
  return <Link href={href} className={'nav-account-menu-link ' + className} onClick={onClick}>
    <FontAwesomeIcon icon={icon} /><span>{children}</span><FontAwesomeIcon icon={faArrowLeft} className="nav-account-link-arrow" />
  </Link>;
}

export default function NavQuickActions({ session = false, profile = null, wallet = null, productImages = {} }) {
  const cart = useCatalogCart();
  const account = useAccountCart();
  const { catalog = [] } = useCatalog();
  const [cartOpen, setCartOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  const lines = useMemo(() => displayCart(cart, catalog, account), [cart, catalog, account]);
  const quantity = cart.reduce((total, item) => total + Number(item.quantity || 0), 0);
  const pricedLines = lines.filter(item => item.pack?.price && Number.isFinite(Number(item.pack.price.min)));
  const subtotal = sumPrices(pricedLines.map(item => scalePrice(item.pack.price, item.quantity)));
  const balance = wallet?.balance ?? profile?.karshaBalance ?? 0;
  const firstName = profile?.fullName?.trim().split(/\s+/)[0] || 'حساب کاربری';

  useEffect(() => {
    const closeOnOutside = event => {
      if (accountRef.current && !accountRef.current.contains(event.target)) setAccountOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutside);
    return () => document.removeEventListener('pointerdown', closeOnOutside);
  }, []);

  const closeMenus = () => {
    setCartOpen(false);
    setAccountOpen(false);
  };

  return <>
    <div className="nav-popover-anchor nav-cart-anchor"
      onMouseEnter={() => { setCartOpen(true); setAccountOpen(false); }}
      onMouseLeave={() => setCartOpen(false)}
      onFocusCapture={() => setCartOpen(true)}
      onBlurCapture={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setCartOpen(false);
      }}>
      <Link href="/cart" className="cart-btn nav-cart-trigger"
        aria-label={quantity ? `سبد خرید، ${number.format(quantity)} قلم` : 'سبد خرید'}
        aria-expanded={cartOpen}>
        <FontAwesomeIcon icon={faBasketShopping} />
        {quantity > 0 && <span className="cart-badge">{number.format(quantity)}</span>}
      </Link>

      {cartOpen && <section className="nav-cart-preview" aria-label="پیش‌نمایش سبد خرید">
        <header className="nav-cart-preview-header">
          <div><strong>خلاصه سبد خرید شما</strong><span>{number.format(quantity)} قلم کالا</span></div>
          <Link href="/cart" onClick={closeMenus}>مشاهده سبد <FontAwesomeIcon icon={faArrowLeft} /></Link>
        </header>

        {!lines.length ? <div className="nav-cart-empty">
          <FontAwesomeIcon icon={faBasketShopping} />
          <strong>سبد خرید شما خالی است</strong>
          <span>محصولات موردنیازتان را به سبد اضافه کنید.</span>
          <Link href="/categories" onClick={closeMenus}>مشاهده محصولات</Link>
        </div> : <>
          <ul className="nav-cart-preview-items">
            {lines.slice(0, 5).map(item => {
              const product = item.product;
              const name = product?.name || item.name || 'محصول';
              const catalogImage = product?.image && !product.image.endsWith('/img/catalog/field.webp')
                ? productImage(product) : null;
              const savedImage = item.image && !item.image.endsWith('/img/catalog/field.webp') ? item.image : null;
              const image = productImages?.[String(item.productId)] || savedImage || catalogImage;
              const href = product ? productHref(product) : '/categories';
              const lineTotal = item.pack?.price ? formatPrice(scalePrice(item.pack.price, item.quantity)) : 'قیمت اعلام نشده';
              return <li key={item.id}>
                <Link href={href} className="nav-cart-preview-image" onClick={closeMenus}>
                  {image
                    ? <img src={image} alt="" loading="lazy" />
                    : <span className="nav-cart-preview-image-placeholder" aria-label="تصویر محصول ثبت نشده"><FontAwesomeIcon icon={faImage} /></span>}
                </Link>
                <div className="nav-cart-preview-copy">
                  <Link href={href} className="nav-cart-preview-name" onClick={closeMenus}>{name}</Link>
                  <small>{item.pack?.name || item.packName || item.unitName || 'واحد اصلی'}</small>
                  {item.sellerName && <small>فروشنده: {item.sellerName}</small>}
                </div>
                <div className="nav-cart-preview-price">
                  <strong>{lineTotal}</strong>
                  <span>تعداد: {number.format(item.quantity)}</span>
                </div>
              </li>;
            })}
          </ul>
          {lines.length > 5 && <p className="nav-cart-preview-more">و {number.format(lines.length - 5)} قلم دیگر در سبد شما</p>}
          <footer className="nav-cart-preview-footer">
            <div><span>جمع اقلام قیمت‌دار</span><strong>{pricedLines.length ? formatPrice(subtotal) : '—'}</strong></div>
            <Link href="/cart" onClick={closeMenus}>مشاهده سبد و ثبت سفارش</Link>
          </footer>
        </>}
      </section>}
    </div>

    <div className="nav-popover-anchor nav-account-anchor" ref={accountRef}>
      {session ? <button type="button" className="contact-btn nav-account-trigger"
        aria-haspopup="true" aria-expanded={accountOpen}
        onClick={() => { setAccountOpen(value => !value); setCartOpen(false); }}>
        <FontAwesomeIcon icon={faUser} /><span>{firstName}</span>
      </button> : <Link href="/login" className="contact-btn nav-account-trigger">
        <FontAwesomeIcon icon={faUser} /><span>ورود به حساب</span>
      </Link>}

      {session && accountOpen && <section className="nav-account-menu" aria-label="منوی حساب کاربری">
        <header className="nav-account-menu-header">
          <span className="nav-account-avatar">{profile?.fullName?.trim().slice(0, 1) || 'س'}</span>
          <div><strong>{profile?.fullName || 'حساب ساری‌چین'}</strong><small>حساب کاربری ساری‌چین</small></div>
        </header>
        <Link href="/partners?section=wallet" className="nav-account-wallet" onClick={closeMenus}>
          <span><FontAwesomeIcon icon={faWallet} /> موجودی کارسا</span>
          <strong>{number.format(balance)} <small>کارسا</small></strong>
        </Link>
        <nav className="nav-account-menu-links" aria-label="دسترسی سریع">
          <AccountLink href="/partners" icon={faBorderAll} onClick={closeMenus}>داشبورد من</AccountLink>
          <AccountLink href="/partners?section=orders" icon={faClipboardList} onClick={closeMenus}>سفارش‌های من</AccountLink>
          <AccountLink href="/weekly-basket" icon={faBasketShopping} onClick={closeMenus}>سبد خرید هفتگی</AccountLink>
          {profile?.capabilities?.sell && <AccountLink href="/partners?section=products" icon={faBoxOpen} onClick={closeMenus}>محصولات من</AccountLink>}
          {profile?.capabilities?.drive && <AccountLink href="/partners?section=bulletin" icon={faTruckFast} onClick={closeMenus}>بولتن حمل‌ونقل</AccountLink>}
          <AccountLink href="/partners?section=profile" icon={faUserPen} onClick={closeMenus}>پروفایل و دسترسی‌ها</AccountLink>
        </nav>
        <form action={leaveWorkspace} className="nav-account-logout">
          <button type="submit"><FontAwesomeIcon icon={faRightFromBracket} /> خروج از حساب</button>
        </form>
      </section>}
    </div>
  </>;
}
