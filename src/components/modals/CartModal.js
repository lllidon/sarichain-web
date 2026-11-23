'use client';

import { useEffect, useRef, useState } from 'react';
import { formatPrice, scalePrice, sumPrices } from '../Products/price';
import { productImage } from '../Products/catalog';
import { useCatalog } from '../Products/CatalogProvider';
import { submitOrder } from '../Products/submitOrder';
import { removeOrderedItems, setCatalogQuantity, useCatalogCart } from './cartStore';
import './Modal.css';

const number = new Intl.NumberFormat('fa-IR');

export default function CartModal({ isOpen, onClose }) {
  const { catalog } = useCatalog();
  const [busy, setBusy] = useState(false);
  const orderRequest = useRef(null);
  const cartItems = useCatalogCart();
  const [message, setMessage] = useState('');
  const dialog = useRef(null);

  useEffect(() => {
    if (isOpen) dialog.current.showModal();
  }, [isOpen]);

  if (!isOpen) return null;

  function update(item, quantity) {
    setMessage(setCatalogQuantity(item, quantity, catalog.find(product => product.code === item.code)) ? '' : 'این مقدار برای محصول قابل سفارش نیست.');
  }

  async function checkout() {
    if (busy) return;
    const direct = cartItems.filter(item => !item.sellerId);
    const quantities = new Map();
    for (const item of direct) {
      const product = catalog.find(product => product.code === item.code && product.orderable);
      if (!product) {
        setMessage('یکی از اقلام سبد در کاتالوگ فعال نیست.');
        return;
      }
      quantities.set(product.id, (quantities.get(product.id) || 0) + item.quantity * item.amount);
    }
    if (!quantities.size) return;
    setBusy(true);
    try {
      const result = await submitOrder(Array.from(quantities, ([productId, quantity]) => ({ productId, quantity })), orderRequest);
      removeOrderedItems(direct.map(item => item.id));
      setMessage('درخواست ثبت شد. کد پیگیری ' + result.id);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  const currentItems = cartItems.map(item => ({
    ...item, product: catalog.find(product => product.code === item.code && product.orderable),
  }));
  const total = sumPrices(currentItems.map(item => scalePrice(item.product?.price, item.quantity)));
  const containsInactive = currentItems.some(item => !item.product);
  return (
    <dialog ref={dialog} className="modal-container cart-modal storefront-cart" aria-label="سبد خرید"
      onClose={() => { setMessage(''); onClose(); }}>
      <div className="modal-header">
        <h3>سبد خرید</h3>
        <button type="button" className="modal-close" aria-label="بستن سبد خرید" onClick={() => dialog.current.close()}>×</button>
      </div>

      {message && <p role="status">{message}</p>}
      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <p>سبد خرید شما خالی است.</p>
          <button className="continue-shopping" onClick={() => dialog.current.close()}>ادامه خرید</button>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {currentItems.map(item => (
              <div key={item.id} className="cart-item">
                <img src={item.product ? productImage(item.product) : item.image} alt="" className="cart-item-image" />
                <div className="cart-item-details">
                  <h4>{item.product?.name ?? item.name}</h4>
                  <p>{item.product?.unit ?? item.unit}</p>
                  <p className="cart-item-price">{item.product ? formatPrice(item.product.price) : 'محصول در دسترس نیست'}</p>
                  <div className="cart-item-actions">
                    <div className="quantity-control">
                      <button aria-label="کاهش تعداد" disabled={item.quantity === 1} onClick={() => update(item, item.quantity - 1)}>−</button>
                      <span>{number.format(item.quantity)}</span>
                      <button aria-label="افزایش تعداد" disabled={!item.product || busy} onClick={() => update(item, item.quantity + 1)}>+</button>
                    </div>
                    <button className="remove-item" onClick={() => update(item, 0)}>حذف</button>
                  </div>
                </div>
                <div className="cart-item-total">{item.product && formatPrice(scalePrice(item.product.price, item.quantity))}</div>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            {containsInactive && <p>برای ثبت سفارش، محصول غیرفعال را از سبد حذف کنید.</p>}
            <button type="button" className="continue-shopping" disabled={busy || containsInactive} onClick={checkout}>ثبت سفارش</button>
            <div className="summary-row total">
              <span>جمع کالاها</span>
              <span className="total-amount">{formatPrice(total)}</span>
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}
