'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBasketShopping } from '@fortawesome/free-solid-svg-icons';
import { productPackages } from './catalog';
import { formatPrice } from './price';
import { addCatalogItem } from '../modals/cartStore';

export default function ProductPurchase({ product, className, children, onMessage, chooseUnit = false }) {
  const [message, setMessage] = useState('');
  const [unit, setUnit] = useState('unit');
  const packs = productPackages(product);
  const pack = packs.find(option => option.id === unit) ?? packs[0];

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
            {chooseUnit && packs.length > 1 && <label className="product-unit-picker">واحد خرید
              <select value={pack.id} onChange={event => setUnit(event.target.value)}>
                {packs.map(option => <option value={option.id} key={option.id}>{option.name}
                  {option.amount > 1 ? ` · ${option.amount.toLocaleString('fa-IR')} ${product.unit}` : ' · واحد اصلی'}
                </option>)}
              </select>
            </label>}
            <div className="catalog-card-price">
              <strong>{formatPrice(pack.price)}</strong>{' '}
              <small>/ {pack.name}</small>
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
