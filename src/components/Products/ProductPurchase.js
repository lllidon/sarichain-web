'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBasketShopping } from '@fortawesome/free-solid-svg-icons';
import { productPackages } from './catalog';
import { formatPrice } from './price';
import { addCatalogItem } from '../modals/cartStore';

export default function ProductPurchase({ product, className, children, onMessage }) {
  const [message, setMessage] = useState('');
  const [pack] = productPackages(product);

  function report(value) {
    if (onMessage) onMessage(value);
    else setMessage(value);
  }

  function addToCart(event) {
    event.preventDefault();
    report(addCatalogItem(product, pack)
      ? `${pack.name} ${product.name} به سبد خرید اضافه شد.`
      : 'تعداد از حداکثر مجاز سفارش بیشتر است.');
  }

  return (
    <>
      <form className={className} onSubmit={addToCart}>
        {children}
        {product.orderable ? (
          <>
            <div className="catalog-card-price">
              <strong>{formatPrice(product.price)}</strong>{' '}
              <small>/ {product.unit}</small>
            </div>
            <button className="catalog-order" type="submit" aria-label={`افزودن به سبد خرید ${product.name}`}>
              افزودن به سبد خرید <FontAwesomeIcon icon={faBasketShopping} />
            </button>
          </>
        ) : (
          <div className="catalog-card-price">
            <strong>{formatPrice(product.price)}</strong>
          </div>
        )}
      </form>
      {!onMessage && <div role="status" className={message ? 'catalog-feedback' : undefined}>{message}</div>}
    </>
  );
}
