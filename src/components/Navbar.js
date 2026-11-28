'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faBars, faXmark } from '@fortawesome/free-solid-svg-icons';
import './Navbar.css';
import SearchModal from './modals/SearchModal';
import ProductMegaMenu from './Products/ProductMegaMenu';
import SolutionsMegaMenu from './SolutionsMegaMenu';
import NavQuickActions from './NavQuickActions';

const Navbar = ({ session, profile = null, wallet = null }) => {
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

        {/* Mobile Menu Button */}
        <button type="button" className="menu-icon nav-mobile-toggle"
          aria-label={isOpen ? 'بستن منو' : 'باز کردن منو'}
          aria-expanded={isOpen}
          onClick={() => setIsOpen(value => !value)}>
          <FontAwesomeIcon icon={isOpen ? faXmark : faBars} />
        </button>

        {/* Navigation Menu */}
        <ul className={`nav-menu ${isOpen ? 'active' : ''}`}>
          <ProductMegaMenu />
          <SolutionsMegaMenu />
          
          <li className="nav-item">
            <Link href="/support" className="nav-link">پشتیبانی</Link>
          </li>
        </ul>

                  {/* Right side buttons */}
          <div className="nav-buttons">
            <button className="search-btn" onClick={() => setIsSearchOpen(true)}>
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </button>
            <NavQuickActions session={session} profile={profile} wallet={wallet} />
          </div>
        </div>
      </nav>

      {/* Modals */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};

export default Navbar;