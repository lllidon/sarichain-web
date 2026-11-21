'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faBasketShopping, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import './Navbar.css';
import SearchModal from './modals/SearchModal';
import CartModal from './modals/CartModal';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userPhone, setUserPhone] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('isAuthenticated') === 'true') {
      setUserPhone(localStorage.getItem('userPhone') || 'کاربر');
    }
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setActiveMegaMenu(null);
    }
  };

  const handleMegaMenuEnter = (menuName) => {
    if (window.innerWidth > 992) {
      setActiveMegaMenu(menuName);
    }
  };

  const handleMegaMenuLeave = () => {
    if (window.innerWidth > 992) {
      setActiveMegaMenu(null);
    }
  };

  const handleMegaMenuClick = (menuName) => {
    if (window.innerWidth <= 992) {
      setActiveMegaMenu(activeMegaMenu === menuName ? null : menuName);
    }
  };
  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('userEmail');
    setUserPhone(null);
    window.location.href = '/';
  };

  return (
    <>
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        {/* Logo */}
        <div className="logo">
          <a href="/">
            <img src="/img/logoSite.png" alt="BioStimulant" />
          </a>
        </div>

        {/* Mobile Menu Button */}
        <div className={`menu-icon `} >
          <Link href="/quick-order" className="login-link">
            <button className="contact-btn">
              ثبت سفارش

            </button>
          </Link>
        </div>

        {/* Navigation Menu */}
        <ul className={`nav-menu ${isOpen ? 'active' : ''}`}>
          {/* Products Mega Menu */}
          <li 
            className="nav-item mega-menu" 
            onMouseEnter={() => handleMegaMenuEnter('products')}
            onMouseLeave={handleMegaMenuLeave}
          >
            <Link href="/categories"
              className="nav-link"
              
            >
              محصولات 
              <FontAwesomeIcon icon={faChevronDown} className="dropdown-icon" />
            </Link>
            {activeMegaMenu === 'products' && (
              <div 
                className="mega-menu-content"
                onMouseEnter={() => handleMegaMenuEnter('products')}
                onMouseLeave={handleMegaMenuLeave}
              >
                <div className="mega-menu-grid">
                  <div className="mega-col">
                    <h4>بیواستی مولانت‌ها</h4>
                    <ul>
                      <li><a href="#">بیو بوست</a></li>
                      <li><a href="#">روت مکس</a></li>
                      <li><a href="#">فرایت پرو</a></li>
                      <li><a href="#">ویتا گرین</a></li>
                    </ul>
                  </div>
                  <div className="mega-col">
                    <h4>بیوفرتیلایزرها</h4>
                    <ul>
                      <li><a href="#">سویل لایف</a></li>
                      <li><a href="#">نیتروفیکس</a></li>
                      <li><a href="#">فوس سول</a></li>
                      <li><a href="#">پوتاس بوست</a></li>
                    </ul>
                  </div>
                  <div className="mega-col">
                    <h4>محصولات ویژه</h4>
                    <ul>
                      <li><a href="#">عصاره جلبک دریایی</a></li>
                      <li><a href="#">اسیدهای آمینه</a></li>
                      <li><a href="#">اسیدهای هیومیک</a></li>
                      <li><a href="#">میکروبیال‌ها</a></li>
                    </ul>
                  </div>
                  <div className="mega-col featured">
                    <div className="featured-product">
                      <img src="https://placehold.co/200x150" alt="Featured" />
                      <h4>محصول جدید</h4>
                      <p>بیو بوست پلاس - فرمول پیشرفته</p>
                      <button className="featured-btn">خرید کنید</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </li>

          {/* Solutions Mega Menu */}
          <li 
            className="nav-item mega-menu"
            onMouseEnter={() => handleMegaMenuEnter('solutions')}
            onMouseLeave={handleMegaMenuLeave}
          >
            <a 
              href="#" 
              className="nav-link"
              onClick={(e) => {
                e.preventDefault();
                handleMegaMenuClick('solutions');
              }}
            >
              راهکارها
              <FontAwesomeIcon icon={faChevronDown} className="dropdown-icon" />
            </a>
            {activeMegaMenu === 'solutions' && (
              <div 
                className="mega-menu-content"
                onMouseEnter={() => handleMegaMenuEnter('solutions')}
                onMouseLeave={handleMegaMenuLeave}
              >
                <div className="mega-menu-grid">
                  <div className="mega-col">
                    <h4>بر اساس نوع محصول</h4>
                    <ul>
                      <li><a href="#">غلات و دانه‌ها</a></li>
                      <li><a href="#">میوه‌ها و سبزیجات</a></li>
                      <li><a href="#">دانه‌های روغنی</a></li>
                      <li><a href="#">گیاهان زینتی</a></li>
                    </ul>
                  </div>
                  <div className="mega-col">
                    <h4>بر اساس چالش</h4>
                    <ul>
                      <li><a href="#">تنش خشکی</a></li>
                      <li><a href="#">تنش شوری</a></li>
                      <li><a href="#">کمبود مواد مغذی</a></li>
                      <li><a href="#">سلامت ضعیف خاک</a></li>
                    </ul>
                  </div>
                  <div className="mega-col">
                    <h4>بر اساس مرحله رشد</h4>
                    <ul>
                      <li><a href="#">جوانه‌زنی</a></li>
                      <li><a href="#">رشد رویشی</a></li>
                      <li><a href="#">گلدهی</a></li>
                      <li><a href="#">میوه‌دهی و رسیدگی</a></li>
                    </ul>
                  </div>
                  <div className="mega-col">
                    <h4>داستان‌های موفقیت</h4>
                    <ul>
                      <li><a href="#">مطالعات موردی</a></li>
                      <li><a href="#">توصیفات کشاورزان</a></li>
                      <li><a href="#">مقالات تحقیقاتی</a></li>
                      <li><a href="#">گالری ویدیوها</a></li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </li>

          <li className="nav-item">
            <a href="#" className="nav-link">وبلاگ</a>
          </li>
          
          <li className="nav-item">
            <a href="#" className="nav-link">پشتیبانی</a>
          </li>
        </ul>

                  {/* Right side buttons */}
          <div className="nav-buttons">
            <button className="search-btn" onClick={() => setIsSearchOpen(true)}>
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </button>
            <button className="cart-btn" onClick={() => setIsCartOpen(true)}>
              <FontAwesomeIcon icon={faBasketShopping} />
              <span className="cart-badge">4</span>
            </button>
            
            {userPhone ? (
              <div className="user-menu">
                <button className="user-btn">
                  👤 {userPhone}
                </button>
                <button onClick={handleLogout} className="logout-btn">
                  خروج
                </button>
              </div>
            ) : (
              <Link href="/login" className="login-link">
                <button className="contact-btn">
                  ورود / ثبت نام
                </button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Modals */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  );
};

export default Navbar;