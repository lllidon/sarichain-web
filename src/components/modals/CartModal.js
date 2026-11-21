'use client';

import { useEffect, useRef, useState } from 'react';
import { setCatalogQuantity, useCatalogCart } from './cartStore';
import './Modal.css';

const number = new Intl.NumberFormat('fa-IR');

export default function CartModal({ isOpen, onClose }) {
  const cartItems = useCatalogCart();
  const [message, setMessage] = useState('');
  const dialog = useRef(null);

  useEffect(() => {
    if (isOpen) dialog.current.showModal();
  }, [isOpen]);

  if (!isOpen) return null;

  function update(item, quantity) {
    setMessage(setCatalogQuantity(item, quantity) ? '' : 'تعداد بیشتر از موجودی محصول است.');
  }

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return (
    <dialog ref={dialog} className="modal-container cart-modal storefront-cart" aria-label="سبد خرید"
      onClose={() => { setMessage(''); onClose(); }}>
      <div className="modal-header">
        <h3>سبد خرید</h3>
        <button type="button" className="modal-close" aria-label="بستن سبد خرید" onClick={() => dialog.current.close()}>×</button>
      </div>

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
            {message && <p role="status">{message}</p>}
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
