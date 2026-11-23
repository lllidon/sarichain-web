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
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import CartModal from '../modals/CartModal';
import SearchModal from '../modals/SearchModal';
import { useCatalog } from '../Products/CatalogProvider';
import { useCatalogCart } from '../modals/cartStore';
import './BottomNavbar.css';

const BottomNavbar = () => {
  const { categories } = useCatalog();
  const cartCount = useCatalogCart().reduce((count, item) => count + item.quantity, 0);
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
        router.push('/partners');
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
          <button type="button" aria-expanded={showCategoriesModal}
            className={`bottom-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => handleTabClick('categories')}
          >
            <span className="nav-icon">
              <FontAwesomeIcon icon={faThLarge} />
            </span>
            <span className="nav-label">دسته‌ها</span>
          </button>

          {/* سبد خرید */}
          <button type="button" aria-label="سبد خرید"
            className={`bottom-nav-item ${activeTab === 'cart' ? 'active' : ''}`}
            onClick={() => handleTabClick('cart')}
          >
            <span className="nav-icon cart-icon-wrapper">
              <FontAwesomeIcon icon={faShoppingCart} />
              {cartCount > 0 && <span className="cart-badge-mobile">{cartCount.toLocaleString('fa-IR')}</span>}
            </span>
            <span className="nav-label">سبد خرید</span>
          </button>

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
      <SearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />

      <CartModal isOpen={showCartModal} onClose={() => setShowCartModal(false)} />

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
                <Link href="/categories" className="category-item" onClick={() => setShowCategoriesModal(false)}>
                  کاتالوگ محصولات
                  <FontAwesomeIcon icon={faThLarge} className="category-arrow" />
                </Link>
                {Object.entries(categories).map(([id, category]) => (
                  <Link key={id} href={{ pathname: '/categories', query: { category: id } }} className="category-item"
                    onClick={() => setShowCategoriesModal(false)}>
                    {category.name}
                    <FontAwesomeIcon icon={faThLarge} className="category-arrow" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BottomNavbar;