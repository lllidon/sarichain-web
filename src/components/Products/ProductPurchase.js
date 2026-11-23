'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBasketShopping, faMinus, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { productPackages } from './catalog';
import { formatPrice } from './price';
import { cartLineLimit, isCartProduct } from './cartData';
import { useCatalog } from './CatalogProvider';
import { addCatalogItem, catalogQuantityLimit, setCatalogQuantity, useCatalogCart } from '../modals/cartStore';

const number = new Intl.NumberFormat('fa-IR');
const limitMessage = 'تعداد از سقف خرید این محصول بیشتر است.';

export default function ProductPurchase({ product, className, children, onMessage, chooseUnit = false, initialUnit = '' }) {
  const cart = useCatalogCart();
  const { catalog } = useCatalog();
  const [message, setMessage] = useState('');
  const [unit, setUnit] = useState(initialUnit);
  const packs = productPackages(product);
  const existingUnit = chooseUnit && cart.find(item => isCartProduct(item, product) && packs.some(option => option.id === item.packId));
  const pack = packs.find(option => option.id === (unit || existingUnit?.packId)) ?? packs[0];
  const line = cart.find(item => isCartProduct(item, product) && item.packId === pack.id);
  const max = catalogQuantityLimit(cart, product, pack, catalog);
  const quantity = line?.quantity ?? 0;
  const cartFull = !line && cart.length >= cartLineLimit;
  const canIncrease = quantity < max && !cartFull;

  function report(value) {
    if (onMessage) onMessage(value);
    else setMessage(value);
  }

  function addToCart(event) {
    event.preventDefault();
    report(addCatalogItem(product, pack, catalog)
      ? `${pack.name} ${product.name} به سبد خرید اضافه شد.`
      : limitMessage);
  }

  function changeQuantity(next) {
    report(setCatalogQuantity(line, next, product, catalog)
      ? next === 0 ? `${pack.name} ${product.name} از سبد خرید حذف شد.` : ''
      : limitMessage);
  }

  return (
    <>
      <form className={className} action="/web/cart" method="post" onSubmit={addToCart}>
        <input type="hidden" name="productId" value={product.id} />
        {(!chooseUnit || packs.length === 1) && <input type="hidden" name="unitId" value={pack.id} />}
        {children}
        {product.orderable ? (
          <>
            {chooseUnit && packs.length > 1 && <label className="product-unit-picker">واحد خرید
              <select name="unitId" value={pack.id} onChange={event => { setUnit(event.target.value); report(''); }}>
                {packs.map(option => <option value={option.id} key={option.id}>{option.name}
                  {option.amount > 1 ? ` · ${option.amount.toLocaleString('fa-IR')} ${product.unit}` : ' · واحد اصلی'}
                </option>)}
              </select>
            </label>}
            <div className="catalog-card-price">
              <strong>{formatPrice(pack.price)}</strong>{' '}
              <small>/ {pack.name}</small>
            </div>
            {line ? <div className="product-cart-control">
              <div role="group" className="product-cart-stepper" aria-label={`تعداد ${pack.name} ${product.name} در سبد`}>
                <button type="submit" name="operation" value="add" disabled={!canIncrease} aria-label={`افزایش تعداد ${product.name}`} onClick={event => { event.preventDefault(); changeQuantity(quantity + 1); }}>
                  <FontAwesomeIcon icon={faPlus} />
                </button>
                <div className="product-cart-count">
                  <output aria-live="polite">{number.format(quantity)}</output>
                  {!canIncrease && <small>حداکثر</small>}
                </div>
                <button type="submit" name="operation" value="reduce" aria-label={quantity === 1 ? `حذف ${product.name} از سبد خرید` : `کاهش تعداد ${product.name}`}
                  onClick={event => { event.preventDefault(); changeQuantity(quantity - 1); }}>
                  <FontAwesomeIcon icon={quantity === 1 ? faTrash : faMinus} />
                </button>
              </div>
              <div className="product-cart-state"><span>در سبد شما</span><Link href="/cart">مشاهدهٔ سبد خرید</Link></div>
            </div> : <>
              <button className="catalog-order" type="submit" name="operation" value="add" disabled={!canIncrease} aria-label={`افزودن به سبد خرید ${product.name}`}>
                افزودن به سبد خرید <FontAwesomeIcon icon={faBasketShopping} />
              </button>
              {!canIncrease && <small className="product-cart-limit">{cartFull ? 'ظرفیت سبد برای اقلام جدید تکمیل شده است.' : 'این واحد با سقف خرید فعلی قابل افزودن نیست.'}</small>}
            </>}
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
