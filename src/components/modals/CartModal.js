'use client';

import React, { useState } from 'react';
import './Modal.css';

const CartModal = ({ isOpen, onClose }) => {
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: 'بیو بوست',
      price: 250000,
      quantity: 2,
      image: 'https://placehold.co/200x150'
    },
    {
      id: 2,
      name: 'روت مکس',
      price: 320000,
      quantity: 1,
      image: 'https://placehold.co/200x150'
    },
    {
      id: 3,
      name: 'فرایت پرو',
      price: 280000,
      quantity: 3,
      image: 'https://placehold.co/200x150'
    },
    {
      id: 4,
      name: 'ویتا گرین',
      price: 190000,
      quantity: 1,
      image: 'https://placehold.co/200x150'
    }
  ]);

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    setCartItems(items =>
      items.map(item =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (id) => {
    setCartItems(items => items.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const formatPrice = (price) => {
    return price.toLocaleString('fa-IR') + ' تومان';
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container cart-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>سبد خرید</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {cartItems.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <p>سبد خرید شما خالی است</p>
            <button className="continue-shopping" onClick={onClose}>بازگشت به فروشگاه</button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cartItems.map(item => (
                <div key={item.id} className="cart-item">
                  <img src={item.image} alt={item.name} className="cart-item-image" />
                  <div className="cart-item-details">
                    <h4>{item.name}</h4>
                    <p className="cart-item-price">{formatPrice(item.price)}</p>
                    <div className="cart-item-actions">
                      <div className="quantity-control">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                      </div>
                      <button className="remove-item" onClick={() => removeItem(item.id)}>
                        حذف
                      </button>
                    </div>
                  </div>
                  <div className="cart-item-total">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div className="summary-row">
                <span>جمع کل:</span>
                <span className="summary-amount">{formatPrice(calculateTotal())}</span>
              </div>
              <div className="summary-row">
                <span>هزینه ارسال:</span>
                <span className="summary-shipping">رایگان</span>
              </div>
              <div className="summary-row total">
                <span>مبلغ قابل پرداخت:</span>
                <span className="total-amount">{formatPrice(calculateTotal())}</span>
              </div>
              <button className="checkout-btn">
                ثبت سفارش
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartModal;