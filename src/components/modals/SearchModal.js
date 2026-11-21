'use client';

import React, { useState, useEffect } from 'react';
import './Modal.css';

const SearchModal = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // محصولات نمونه برای جستجو
  const products = [
    { id: 1, name: 'بیو بوست', category: 'بیواستی مولانت', price: '۲۵۰,۰۰۰ تومان', image: 'https://placehold.co/200x150' },
    { id: 2, name: 'روت مکس', category: 'بیواستی مولانت', price: '۳۲۰,۰۰۰ تومان', image: 'https://placehold.co/200x150' },
    { id: 3, name: 'فرایت پرو', category: 'بیواستی مولانت', price: '۲۸۰,۰۰۰ تومان', image: 'https://placehold.co/200x150' },
    { id: 4, name: 'ویتا گرین', category: 'بیواستی مولانت', price: '۱۹۰,۰۰۰ تومان', image: 'https://placehold.co/200x150' },
    { id: 5, name: 'سویل لایف', category: 'بیوفرتیلایزر', price: '۳۵۰,۰۰۰ تومان', image: 'https://placehold.co/200x150' },
    { id: 6, name: 'نیتروفیکس', category: 'بیوفرتیلایزر', price: '۲۹۰,۰۰۰ تومان', image: 'https://placehold.co/200x150' },
  ];

  useEffect(() => {
    if (searchTerm.length > 0) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        const results = products.filter(product =>
          product.name.includes(searchTerm) || 
          product.category.includes(searchTerm)
        );
        setSearchResults(results);
        setIsSearching(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  if (!isOpen) return null;

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.length > 0) {
      const results = products.filter(product =>
        product.name.includes(searchTerm) || 
        product.category.includes(searchTerm)
      );
      setSearchResults(results);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>جستجوی محصولات</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="نام محصول را وارد کنید..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            <button type="submit" className="search-submit">
              جستجو
            </button>
          </div>
        </form>

        <div className="search-results">
          {isSearching ? (
            <div className="search-loading">در حال جستجو...</div>
          ) : searchResults.length > 0 ? (
            <>
              <div className="results-count">{searchResults.length} نتیجه یافت شد</div>
              <div className="results-list">
                {searchResults.map(product => (
                  <div key={product.id} className="search-result-item">
                    <img src={product.image} alt={product.name} />
                    <div className="result-info">
                      <h4>{product.name}</h4>
                      <p className="result-category">{product.category}</p>
                      <p className="result-price">{product.price}</p>
                    </div>
                    <button className="result-add-btn">افزودن به سبد</button>
                  </div>
                ))}
              </div>
            </>
          ) : searchTerm.length > 0 ? (
            <div className="no-results">محصولی یافت نشد</div>
          ) : (
            <div className="search-suggestions">
              <p>محصولات محبوب:</p>
              <div className="suggestion-tags">
                <span>بیو بوست</span>
                <span>روت مکس</span>
                <span>فرایت پرو</span>
                <span>سویل لایف</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;