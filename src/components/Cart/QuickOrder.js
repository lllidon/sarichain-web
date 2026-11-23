'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faTrash, 
  faPlus, 
  faMinus,
  faShoppingCart,
  faSave,
  faTimes,
  faBarcode,
  faBox
} from '@fortawesome/free-solid-svg-icons';
import { formatPrice, scalePrice, sumPrices } from '../Products/price';
import { productImage } from '../Products/catalog';
import { useCatalog } from '../Products/CatalogProvider';
import { submitOrder } from '../Products/submitOrder';
import './QuickOrder.css';

const QuickOrder = ({ initialCode = '' }) => {
  const { catalog, categories, unavailable } = useCatalog();
  const productsDatabase = useMemo(() => catalog.filter(product => product.orderable).map(product => ({
    ...product, category: categories[product.category].name, image: productImage(product),
  })), [catalog, categories]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const orderRequest = useRef(null);
  const [productCode, setProductCode] = useState(initialCode);
  const [cartItems, setCartItems] = useState([]);
  const [scanMode, setScanMode] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  // فوکوس خودکار روی ورودی
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // جستجوی زنده با حداقل 3 کاراکتر
  useEffect(() => {
    if (productCode.length >= 3) {
      searchProducts(productCode);
      setShowResults(true);
      setSelectedIndex(-1);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [productCode]);

  // جستجو در محصولات
  const searchProducts = (query) => {
    const lowerQuery = query.toLowerCase();
    const results = productsDatabase.filter(product => 
      product.code.includes(query) || 
      product.name.includes(lowerQuery) ||
      product.category.includes(lowerQuery)
    );
    setSearchResults(results.slice(0, 5)); // حداکثر 5 نتیجه
  };

  // جستجوی محصول با کد دقیق
  const findProductByCode = (code) => {
    return productsDatabase.find(product => product.code.toLowerCase() === code.toLowerCase());
  };

  // انتخاب محصول از لیست جستجو
  const selectProduct = (product) => {
    addToCartByProduct(product);
    setProductCode('');
    setShowResults(false);
    setSearchResults([]);
    inputRef.current.focus();
  };

  // افزودن به سبد خرید با محصول
  const addToCartByProduct = (product) => {
    const existingItem = cartItems.find(item => item.code === product.code);
    
    if (existingItem) {
      if (existingItem.quantity + 1 > Math.min(product.maxOrderQuantity ?? Number.MAX_SAFE_INTEGER, product.offer.stock)) {
        alert('تعداد از سقف خرید این محصول بیشتر است.');
        return;
      }
      setCartItems(cartItems.map(item =>
        item.code === product.code
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, {
        ...product,
        quantity: 1,
      }]);
    }
  };

  // افزودن با دکمه (کد محصول)
  const addToCart = () => {
    if (!productCode.trim()) {
      alert('لطفاً کد محصول را وارد کنید');
      return;
    }

    const product = findProductByCode(productCode);
    if (!product) {
      alert('کد محصول نامعتبر است');
      setProductCode('');
      inputRef.current.focus();
      return;
    }

    addToCartByProduct(product);
    setProductCode('');
    setShowResults(false);
    inputRef.current.focus();
  };

  // حذف از سبد خرید
  const removeFromCart = (code) => {
    setCartItems(cartItems.filter(item => item.code !== code));
  };

  // تغییر تعداد محصول
  const updateQuantity = (code, newQuantity) => {
    if (newQuantity < 1) return;
    const item = cartItems.find(item => item.code === code);
    if (!item) return;
    if (newQuantity > Math.min(item.maxOrderQuantity ?? Number.MAX_SAFE_INTEGER, item.offer.stock) && newQuantity > item.quantity) {
      alert('تعداد از سقف خرید این محصول بیشتر است.');
      return;
    }
    
    setCartItems(cartItems.map(item =>
      item.code === code
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  // محاسبه جمع کل
  const calculateTotal = () => {
    return sumPrices(cartItems.map(item => scalePrice(item.price, item.quantity)));
  };

  // محاسبه تعداد کل اقلام
  const calculateTotalItems = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  // خالی کردن سبد خرید
  const clearCart = () => {
    if (window.confirm('آیا از خالی کردن سبد خرید اطمینان دارید؟')) {
      setCartItems([]);
    }
  };

  // ثبت نهایی سفارش
  async function checkout() {
    if (busy || !cartItems.length) return;
    setBusy(true);
    try {
      const order = await submitOrder(cartItems.map(item => ({ productId: item.id, quantity: item.quantity, offerId: item.offer.id })), orderRequest);
      setCartItems([]);
      setMessage('درخواست ثبت شد. کد پیگیری ' + order.id);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  // هندل کردن کلیدهای صفحه کلید برای نتایج جستجو
  const handleKeyDown = (e) => {
    if (showResults && searchResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % searchResults.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        selectProduct(searchResults[selectedIndex]);
      }
    } else if (e.key === 'Enter') {
      addToCart();
    }
  };

  // بستن نتایج جستجو با کلیک خارج
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target) && 
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="quick-order-page">
      <div className="quick-order-container">
        {unavailable && <p role="alert">ارتباط با کاتالوگ برقرار نشد.</p>}
        {message && <p role="status">{message}</p>}
        {/* Header */}
        <div className="order-header">
          <h1>
            <FontAwesomeIcon icon={faShoppingCart} />
            ثبت سفارش سریع
          </h1>
          <p>سیستم ثبت سفارش هوشمند - جستجوی زنده با کد یا نام محصول</p>
        </div>

        <div className="order-content">
          {/* بخش ورودی کد محصول */}
          <div className="input-section">
            <div className="input-card">
              <div className="input-title">
                <FontAwesomeIcon icon={faBarcode} />
                <h3>ورود کد یا نام محصول</h3>
                <span className="input-hint">حداقل 3 کاراکتر برای جستجو</span>
              </div>
              <div className="product-input-group">
                <div className="input-wrapper" ref={resultsRef}>
                  <FontAwesomeIcon icon={faSearch} className="input-icon" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={productCode}
                    onChange={(e) => setProductCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="کد محصول یا نام را وارد کنید (مثال: 1001 یا بیو بوست)"
                    className="product-input"
                    autoComplete="off"
                  />
                  {productCode.length >= 3 && (
                    <div className="searching-indicator">
                      <FontAwesomeIcon icon={faSearch} spin />
                    </div>
                  )}
                  
                  {/* لیست نتایج جستجو */}
                  {showResults && searchResults.length > 0 && (
                    <div className="search-results-dropdown">
                      <div className="results-header">
                        <span>نتایج جستجو ({searchResults.length})</span>
                        <small>جهت انتخاب با ↑ ↓ و Enter</small>
                      </div>
                      {searchResults.map((product, index) => (
                        <div 
                          key={product.id}
                          className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
                          onClick={() => selectProduct(product)}
                          onMouseEnter={() => setSelectedIndex(index)}
                        >
                          <div className="result-image">
                            <img src={product.image} alt={product.name} />
                          </div>
                          <div className="result-details">
                            <div className="result-title">
                              <span className="result-code">{product.code}</span>
                              <span className="result-name">{product.name}</span>
                            </div>
                            <div className="result-info">
                              <span className="result-category">{product.category}</span>
                              <span className="result-unit">{product.unit}</span>
                            </div>
                          </div>
                          <div className="result-price">
                            <span className="price-amount">{formatPrice(product.price)}</span>
                            <button className="result-add" onClick={(e) => {
                              e.stopPropagation();
                              selectProduct(product);
                            }}>
                              <FontAwesomeIcon icon={faPlus} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* پیام عدم وجود نتیجه */}
                  {showResults && searchResults.length === 0 && productCode.length >= 3 && (
                    <div className="search-results-dropdown no-results">
                      <div className="no-results-message">
                        <FontAwesomeIcon icon={faBox} />
                        <span>محصولی با این مشخصات یافت نشد</span>
                        <small>کد محصول را بررسی کنید</small>
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={addToCart} className="add-btn">
                  <FontAwesomeIcon icon={faPlus} />
                  افزودن به سبد
                </button>
              </div>
              <div className="quick-actions">
                <button onClick={() => setScanMode(!scanMode)} className="quick-btn">
                  <FontAwesomeIcon icon={faBarcode} />
                  اسکن بارکد
                </button>
              </div>
            </div>
          </div>

          {/* جدول سبد خرید */}
          <div className="cart-section">
            <div className="cart-card">
              <div className="cart-header">
                <h3>
                  <FontAwesomeIcon icon={faShoppingCart} />
                  سبد خرید
                  <span className="items-count">{calculateTotalItems()} قلم</span>
                </h3>
                {cartItems.length > 0 && (
                  <button onClick={clearCart} className="clear-cart-btn">
                    <FontAwesomeIcon icon={faTrash} />
                    خالی کردن سبد
                  </button>
                )}
              </div>

              {cartItems.length === 0 ? (
                <div className="empty-cart">
                  <div className="empty-cart-icon">🛒</div>
                  <p>سبد خرید خالی است</p>
                  <small>کد محصول را وارد کنید یا از جستجو استفاده کنید</small>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="cart-table">
                      <thead>
                        <tr>
                          <th>ردیف</th>
                          <th>تصویر</th>
                          <th>کد</th>
                          <th>نام محصول</th>
                          <th>دسته‌بندی</th>
                          <th>واحد</th>
                          <th>قیمت واحد</th>
                          <th>تعداد</th>
                          <th>جمع</th>
                          <th>عملیات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cartItems.map((item, index) => (
                          <tr key={item.code}>
                            <td>{index + 1}</td>
                            <td className="cart-item-image">
                              <img src={item.image} alt={item.name} />
                            </td>
                            <td className="code-cell">{item.code}</td>
                            <td className="name-cell">{item.name}</td>
                            <td>{item.category}</td>
                            <td>{item.unit}</td>
                            <td className="price-cell">{formatPrice(item.price)}</td>
                            <td>
                              <div className="quantity-control">
                                <button onClick={() => updateQuantity(item.code, item.quantity - 1)}>
                                  <FontAwesomeIcon icon={faMinus} />
                                </button>
                                <span>{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.code, item.quantity + 1)}>
                                  <FontAwesomeIcon icon={faPlus} />
                                </button>
                              </div>
                            </td>
                            <td className="total-cell">{formatPrice(scalePrice(item.price, item.quantity))}</td>
                            <td>
                              <button 
                                onClick={() => removeFromCart(item.code)}
                                className="remove-btn"
                              >
                                <FontAwesomeIcon icon={faTimes} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="8" className="total-label">جمع کل:</td>
                          <td className="grand-total">{formatPrice(calculateTotal())}</td>
                          <td></td>
                        </tr>
                        <tr>
                          <td colSpan="8" className="total-label">تعداد اقلام:</td>
                          <td className="items-total">{calculateTotalItems()} عدد</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="cart-actions">
                    <button onClick={clearCart} className="secondary-btn">
                      <FontAwesomeIcon icon={faTrash} />
                      پاک کردن سبد
                    </button>
                    <button onClick={checkout} disabled={busy} className="submit-btn">
                      <FontAwesomeIcon icon={faSave} />
                      ثبت نهایی سفارش
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickOrder;
