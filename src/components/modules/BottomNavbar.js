'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, 
  faSearch, 
  faShoppingCart, 
  faUser, 
  faSignInAlt,
  faThLarge,
  faTimes,
  faMinus,
  faPlus,
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import './BottomNavbar.css';

const BottomNavbar = () => {
  const router = useRouter();
  const path = usePathname();
  const [activeTab, setActiveTab] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated');
    setIsLoggedIn(authStatus === 'true');
    
    // تعیین تب فعال بر اساس مسیر فعلی
    if (path === '/') setActiveTab('home');
    else if (path === '/categories') setActiveTab('categories');
    else if (path === '/profile') setActiveTab('profile');
  }, [path]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    
    switch(tab) {
      case 'home':
        router.push('/');
        break;
      case 'categories':
        setShowCategoriesModal(true);
        break;
      case 'cart':
        setShowCartModal(true);
        break;
      case 'search':
        setShowSearchModal(true);
        break;
      case 'profile':
        if (isLoggedIn) {
          router.push('/profile');
        } else {
          router.push('/login');
        }
        break;
      default:
        break;
    }
  };

  return (
    <>
      <div className="bottom-navbar">
        <div className="bottom-nav-container">
          {/* خانه */}
          <div 
            className={`bottom-nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => handleTabClick('home')}
          >
            <div className="nav-icon">
              <FontAwesomeIcon icon={faHome} />
            </div>
            <span className="nav-label">خانه</span>
          </div>

          {/* دسته بندی ها */}
          <div 
            className={`bottom-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => handleTabClick('categories')}
          >
            <div className="nav-icon">
              <FontAwesomeIcon icon={faThLarge} />
            </div>
            <span className="nav-label">دسته‌ها</span>
          </div>

          {/* سبد خرید */}
          <div 
            className={`bottom-nav-item ${activeTab === 'cart' ? 'active' : ''}`}
            onClick={() => handleTabClick('cart')}
          >
            <div className="nav-icon cart-icon-wrapper">
              <FontAwesomeIcon icon={faShoppingCart} />
              <span className="cart-badge-mobile">4</span>
            </div>
            <span className="nav-label">سبد خرید</span>
          </div>

          {/* جستجو */}
          <div 
            className={`bottom-nav-item ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => handleTabClick('search')}
          >
            <div className="nav-icon">
              <FontAwesomeIcon icon={faSearch} />
            </div>
            <span className="nav-label">جستجو</span>
          </div>

          {/* پروفایل من/ورود */}
          <div 
            className={`bottom-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => handleTabClick('profile')}
          >
            <div className="nav-icon">
              <FontAwesomeIcon icon={isLoggedIn ? faUser : faSignInAlt} />
            </div>
            <span className="nav-label">
              {isLoggedIn ? 'پروفایل' : 'ورود'}
            </span>
          </div>
        </div>
      </div>

      {/* مودال جستجو */}
      {showSearchModal && (
        <div className="mobile-modal-overlay" onClick={() => setShowSearchModal(false)}>
          <div className="mobile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>جستجوی محصولات</h3>
              <button onClick={() => setShowSearchModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="mobile-modal-body">
              <input 
                type="text" 
                placeholder="نام محصول را جستجو کنید..." 
                className="mobile-search-input"
                autoFocus
              />
              <div className="mobile-search-results">
                <div className="search-suggestion-item">
                  <FontAwesomeIcon icon={faSearch} className="suggestion-icon" />
                  بیو بوست
                </div>
                <div className="search-suggestion-item">
                  <FontAwesomeIcon icon={faSearch} className="suggestion-icon" />
                  روت مکس
                </div>
                <div className="search-suggestion-item">
                  <FontAwesomeIcon icon={faSearch} className="suggestion-icon" />
                  فرایت پرو
                </div>
                <div className="search-suggestion-item">
                  <FontAwesomeIcon icon={faSearch} className="suggestion-icon" />
                  ویتا گرین
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* مودال سبد خرید */}
      {showCartModal && (
        <div className="mobile-modal-overlay" onClick={() => setShowCartModal(false)}>
          <div className="mobile-modal cart-modal-mobile" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>سبد خرید</h3>
              <button onClick={() => setShowCartModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="mobile-modal-body">
              <div className="mobile-cart-items">
                <div className="mobile-cart-item">
                  <img src="https://placehold.co/60x60" alt="product" />
                  <div className="cart-item-info">
                    <h4>بیو بوست</h4>
                    <p>۲۵۰,۰۰۰ تومان</p>
                    <div className="cart-item-qty">
                      <button>
                        <FontAwesomeIcon icon={faMinus} />
                      </button>
                      <span>۲</span>
                      <button>
                        <FontAwesomeIcon icon={faPlus} />
                      </button>
                    </div>
                  </div>
                  <div className="cart-item-price">۵۰۰,۰۰۰ تومان</div>
                  <button className="cart-item-remove">
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
                <div className="mobile-cart-item">
                  <img src="https://placehold.co/60x60" alt="product" />
                  <div className="cart-item-info">
                    <h4>روت مکس</h4>
                    <p>۳۲۰,۰۰۰ تومان</p>
                    <div className="cart-item-qty">
                      <button>
                        <FontAwesomeIcon icon={faMinus} />
                      </button>
                      <span>۱</span>
                      <button>
                        <FontAwesomeIcon icon={faPlus} />
                      </button>
                    </div>
                  </div>
                  <div className="cart-item-price">۳۲۰,۰۰۰ تومان</div>
                  <button className="cart-item-remove">
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
                <div className="mobile-cart-item">
                  <img src="https://placehold.co/60x60" alt="product" />
                  <div className="cart-item-info">
                    <h4>فرایت پرو</h4>
                    <p>۲۸۰,۰۰۰ تومان</p>
                    <div className="cart-item-qty">
                      <button>
                        <FontAwesomeIcon icon={faMinus} />
                      </button>
                      <span>۳</span>
                      <button>
                        <FontAwesomeIcon icon={faPlus} />
                      </button>
                    </div>
                  </div>
                  <div className="cart-item-price">۸۴۰,۰۰۰ تومان</div>
                  <button className="cart-item-remove">
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
              <div className="mobile-cart-total">
                <span>جمع کل:</span>
                <span>۱,۶۶۰,۰۰۰ تومان</span>
              </div>
              <button className="mobile-checkout-btn">
                تایید و ثبت سفارش
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال دسته‌بندی */}
      {showCategoriesModal && (
        <div className="mobile-modal-overlay" onClick={() => setShowCategoriesModal(false)}>
          <div className="mobile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-modal-header">
              <h3>دسته‌بندی محصولات</h3>
              <button onClick={() => setShowCategoriesModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="mobile-modal-body">
              <div className="mobile-categories">
                <Link href="/categories" className="category-item">
                  <div className="category-icon">🌿</div>
                  <span>بیواستی مولانت‌ها</span>
                  <FontAwesomeIcon icon={faThLarge} className="category-arrow" />
                </Link>
                <Link href="/categories" className="category-item">
                  <div className="category-icon">🧪</div>
                  <span>بیوفرتیلایزرها</span>
                  <FontAwesomeIcon icon={faThLarge} className="category-arrow" />
                </Link>
                <Link href="/categories" className="category-item">
                  <div className="category-icon">💧</div>
                  <span>محصولات ویژه</span>
                  <FontAwesomeIcon icon={faThLarge} className="category-arrow" />
                </Link>
                <Link href="/categories" className="category-item">
                  <div className="category-icon">🌱</div>
                  <span>تسهیل‌کننده‌های رشد</span>
                  <FontAwesomeIcon icon={faThLarge} className="category-arrow" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BottomNavbar;