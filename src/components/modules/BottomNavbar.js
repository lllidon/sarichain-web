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
  faWallet,
  faClipboardList,
  faBox,
  faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';
import SearchModal from '../modals/SearchModal';
import { useCatalog } from '../Products/CatalogProvider';
import { useCatalogCart } from '../modals/cartStore';
import './BottomNavbar.css';
import { leaveWorkspace } from '../../app/(workspace)/partners/actions';

const number = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 6 });

const BottomNavbar = ({ session, profile = null, wallet = null }) => {
  const { categories } = useCatalog();
  const cartCount = useCatalogCart().reduce((count, item) => count + item.quantity, 0);
  const router = useRouter();
  const path = usePathname();
  const [activeTab, setActiveTab] = useState('home');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  useEffect(() => {
    // تعیین تب فعال بر اساس مسیر فعلی
    if (path === '/') setActiveTab('home');
    else if (path === '/cart') setActiveTab('cart');
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
      case 'search':
        setShowSearchModal(true);
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
          <Link href="/cart" aria-current={path === '/cart' ? 'page' : undefined} aria-label={cartCount ? `سبد خرید، ${cartCount.toLocaleString('fa-IR')} کالا` : 'سبد خرید'}
            className={`bottom-nav-item ${activeTab === 'cart' ? 'active' : ''}`}
          >
            <span className="nav-icon cart-icon-wrapper">
              <FontAwesomeIcon icon={faShoppingCart} />
              {cartCount > 0 && <span className="cart-badge-mobile">{cartCount.toLocaleString('fa-IR')}</span>}
            </span>
            <span className="nav-label">سبد خرید</span>
          </Link>

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
          {session ? <button type="button" aria-expanded={showAccountModal}
            className="bottom-nav-item" onClick={() => setShowAccountModal(true)}>
            <span className="nav-icon"><FontAwesomeIcon icon={faUser} /></span>
            <span className="nav-label">حساب کاربری</span>
          </button> : <Link href="/login" className="bottom-nav-item">
            <span className="nav-icon"><FontAwesomeIcon icon={faSignInAlt} /></span>
            <span className="nav-label">ورود</span>
          </Link>}
        </div>
      </div>

      {/* مودال جستجو */}
      <SearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />


      {/* منوی سریع حساب کاربری */}
      {showAccountModal && (
        <div className="mobile-modal-overlay" onClick={() => setShowAccountModal(false)}>
          <div className="mobile-modal mobile-account-modal" onClick={event => event.stopPropagation()}>
            <div className="mobile-modal-header">
              <div className="mobile-account-heading">
                <strong>{profile?.fullName || 'حساب ساری‌چین'}</strong>
                <small>موجودی: {number.format(wallet?.balance ?? profile?.karshaBalance ?? 0)} کارسا</small>
              </div>
              <button type="button" aria-label="بستن منوی حساب" onClick={() => setShowAccountModal(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="mobile-modal-body">
              <nav className="mobile-account-links" aria-label="دسترسی سریع حساب">
                <Link href="/partners" onClick={() => setShowAccountModal(false)}><FontAwesomeIcon icon={faHome} /> داشبورد من</Link>
                <Link href="/partners?section=orders" onClick={() => setShowAccountModal(false)}><FontAwesomeIcon icon={faClipboardList} /> سفارش‌های من</Link>
                <Link href="/partners?section=wallet" onClick={() => setShowAccountModal(false)}><FontAwesomeIcon icon={faWallet} /> کیف پول کارسا</Link>
                {profile?.capabilities?.sell && <Link href="/partners?section=products" onClick={() => setShowAccountModal(false)}><FontAwesomeIcon icon={faBox} /> محصولات من</Link>}
                <Link href="/partners?section=profile" onClick={() => setShowAccountModal(false)}><FontAwesomeIcon icon={faUser} /> پروفایل و دسترسی‌ها</Link>
              </nav>
              <form action={leaveWorkspace} className="mobile-account-logout">
                <button type="submit"><FontAwesomeIcon icon={faSignOutAlt} /> خروج از حساب</button>
              </form>
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