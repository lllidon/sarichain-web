'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faBasketShopping, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import './Navbar.css';
import SearchModal from './modals/SearchModal';
import ProductMegaMenu from './Products/ProductMegaMenu';
import SolutionsMegaMenu from './SolutionsMegaMenu';
import { useCatalogCart } from './modals/cartStore';

const Navbar = ({ session }) => {
  const cartCount = useCatalogCart().reduce((count, item) => count + item.quantity, 0);
  const [isOpen, setIsOpen] = useState(false);
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

          <SolutionsMegaMenu />\n\n          <li className="nav-item">
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