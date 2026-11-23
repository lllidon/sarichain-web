'use client';

import { useEffect, useRef, useState } from 'react';
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

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
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
            {cartItems.map(item => (
              <div key={item.id} className="cart-item">
                <img src={item.image} alt="" className="cart-item-image" />
                <div className="cart-item-details">
                  <h4>{item.name}</h4>
                  {item.sellerName && <p>{item.sellerName} · {item.qualityName}</p>}
                  <p>{item.packName} {number.format(item.amount)} {item.unit}</p>
                  <p className="cart-item-price">{number.format(item.price)} تومان</p>
                  <div className="cart-item-actions">
                    <div className="quantity-control">
                      <button aria-label="کاهش تعداد" disabled={item.quantity === 1} onClick={() => update(item, item.quantity - 1)}>−</button>
                      <span>{number.format(item.quantity)}</span>
                      <button aria-label="افزایش تعداد" onClick={() => update(item, item.quantity + 1)}>+</button>
                    </div>
                    <button className="remove-item" onClick={() => update(item, 0)}>حذف</button>
                  </div>
                </div>
                <div className="cart-item-total">{number.format(item.price * item.quantity)} تومان</div>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            {cartItems.some(item => item.sellerId) && <p>پیشنهادهای آزمایشی فروشندگان در سفارش ثبت نمی‌شوند.</p>}
            <button type="button" className="continue-shopping" disabled={busy || !cartItems.some(item => !item.sellerId)} onClick={checkout}>ثبت سفارش</button>
            <div className="summary-row total">
              <span>جمع کالاها</span>
              <span className="total-amount">{number.format(total)} تومان</span>
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}
