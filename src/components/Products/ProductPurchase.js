'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBasketShopping } from '@fortawesome/free-solid-svg-icons';
import { productPackages } from './catalog';
import { addCatalogItem } from '../modals/cartStore';

const number = new Intl.NumberFormat('fa-IR');

export default function ProductPurchase({ product, className, children, onMessage, offer }) {
  const [packId, setPackId] = useState('');
  const [message, setMessage] = useState('');
  const packages = productPackages(product);
  const pack = packages.find(option => option.id === packId);
  const unitPrice = offer?.unitPrice ?? product.price;
  const displayPrice = pack ? unitPrice * pack.amount : unitPrice;

  function report(value) {
    if (onMessage) onMessage(value);
    else setMessage(value);
  }

  function addToCart(event) {
    event.preventDefault();
    if (!pack) return;
    report(addCatalogItem(product, pack, offer)
      ? `${pack.name} ${product.name} به سبد خرید اضافه شد.`
      : 'تعداد از حداکثر مجاز سفارش بیشتر است.');
  }

  return (
    <>
      <form className={className} onSubmit={addToCart}>
        {children}
        {product.orderable ? (
          <>
            <select className="catalog-package-choice" required value={packId}
              aria-label={`واحد خرید ${product.name}`} onChange={event => setPackId(event.target.value)}>
              <option value="">انتخاب واحد خرید</option>
              {packages.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name} {number.format(option.amount)} {product.unit}
                </option>
              ))}
            </select>
            <div className="catalog-card-price">
              <strong>{number.format(displayPrice)}</strong>{' '}
              <small>تومان / {pack?.name ?? product.unit}</small>
            </div>
            <button className="catalog-order" type="submit" disabled={!pack} aria-label={`افزودن به سبد خرید ${product.name}`}>
              افزودن به سبد خرید <FontAwesomeIcon icon={faBasketShopping} />
            </button>
          </>
        ) : (
          <div className="catalog-card-price">
            {product.price === null ? 'قیمت اعلام نشده' : <strong>{number.format(product.price)} تومان</strong>}
          </div>
        )}
      </form>
      {!onMessage && <div role="status" className={message ? 'catalog-feedback' : undefined}>{message}</div>}
    </>
  );
}
