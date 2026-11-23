'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faBasketShopping, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import './Navbar.css';
import SearchModal from './modals/SearchModal';
import ProductMegaMenu from './Products/ProductMegaMenu';
import { useCatalogCart } from './modals/cartStore';

const Navbar = ({ session }) => {
  const cartCount = useCatalogCart().reduce((count, item) => count + item.quantity, 0);
  const [isOpen, setIsOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
  return (
    <>
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        {/* Logo */}
        <div className="logo">
          <a href="/">
            <img src="/img/sarichain-logo.svg" alt="ساری‌چین" width="142" height="48" />
          </a>
        </div>

        <Link href="/partners" className="partner-link">همکاران</Link>

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
          <ProductMegaMenu />
          <li className="nav-item"><Link href="/pilot" className="nav-link">پیش‌نمایش پایلوت</Link></li>

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
            <Link className="cart-btn" href="/cart" aria-label={cartCount ? `سبد خرید، ${cartCount.toLocaleString('fa-IR')} کالا` : 'سبد خرید'}>
              <FontAwesomeIcon icon={faBasketShopping} />
              {cartCount > 0 && <span className="cart-badge">{cartCount.toLocaleString('fa-IR')}</span>}
            </Link>
            
            <Link href={session ? '/partners' : '/login'} className="contact-btn login-link">
              {session ? 'حساب کاربری' : 'ورود به حساب'}
            </Link>
          </div>
        </div>
      </nav>

      {/* Modals */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export default Navbar;