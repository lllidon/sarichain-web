'use client';

import { useId, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBasketShopping } from '@fortawesome/free-solid-svg-icons';
import { productPackages } from './catalog';
import { addCatalogItem } from '../modals/cartStore';

const number = new Intl.NumberFormat('fa-IR');

export default function ProductPurchase({ product, className, children, onMessage }) {
  const [packId, setPackId] = useState('');
  const [message, setMessage] = useState('');
  const requestDialog = useRef(null);
  const requestTitle = useId();
  const packages = productPackages(product);
  const pack = packages.find(option => option.id === packId);

  function report(value) {
    if (onMessage) onMessage(value);
    else setMessage(value);
  }

  function addToCart(event) {
    event.preventDefault();
    if (!pack) return;
    report(addCatalogItem(product, pack)
      ? `${pack.name} ${product.name} به سبد خرید اضافه شد.`
      : 'مقدار این بسته بیشتر از موجودی قابل خرید است.');
  }

  function confirmRequest(event) {
    event.preventDefault();
    try {
      window.localStorage.setItem(`sarichain-preorder-${product.code}`, new Date().toISOString());
      report(`درخواست آزمایشی سفارش ${product.name} در این مرورگر ثبت شد.`);
    } catch {
      report('ذخیره درخواست در این مرورگر امکان‌پذیر نیست.');
    }
    requestDialog.current.close();
  }

  return (
    <>
      <form className={className} onSubmit={addToCart}>
        {children}
        {product.stock > 0 ? (
          <>
            <select className="catalog-package-choice" required value={packId}
              aria-label={`واحد خرید ${product.name}`} onChange={event => setPackId(event.target.value)}>
              <option value="">انتخاب واحد خرید</option>
              {packages.map(option => (
                <option key={option.id} value={option.id} disabled={option.amount > product.stock}>
                  {option.name} {number.format(option.amount)} {product.unit}
                </option>
              ))}
            </select>
            <div className="catalog-card-price">
              <strong>{number.format(pack?.price ?? product.price)}</strong>{' '}
              <small>تومان / {pack?.name ?? product.unit}</small>
            </div>
            <button className="catalog-order" type="submit" disabled={!pack} aria-label={`افزودن به سبد خرید ${product.name}`}>
              افزودن به سبد خرید <FontAwesomeIcon icon={faBasketShopping} />
            </button>
          </>
        ) : (
          <button className="catalog-order catalog-request" type="button" onClick={() => requestDialog.current.showModal()}
            aria-label={`ثبت سفارش ${product.name}`}>ثبت سفارش</button>
        )}
      </form>
      {!onMessage && <div role="status" className={message ? 'catalog-feedback' : undefined}>{message}</div>}
      {product.stock === 0 && (
        <dialog ref={requestDialog} className="catalog-request-dialog" aria-labelledby={requestTitle}>
          <form onSubmit={confirmRequest}>
            <h2 id={requestTitle}>درخواست سفارش {product.name}</h2>
            <p>این محصول ناموجود است. درخواست آزمایشی در همین مرورگر ذخیره می‌شود.</p>
            <div>
              <button type="button" onClick={() => requestDialog.current.close()}>انصراف</button>
              <button type="submit">ثبت درخواست</button>
            </div>
          </form>
        </dialog>
      )}
    </>
  );
}
