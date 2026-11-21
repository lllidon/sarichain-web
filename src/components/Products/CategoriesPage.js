'use client';

import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faLeaf, 
  faTractor, 
  faFlask, 
  faSeedling,
  faWater,
  faBug,
  faChartLine,
  faShoppingCart,
  faHeart,
  faStar,
  faArrowLeft,
  faArrowRight,
  faChevronDown,
  faFilter,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import './CategoriesPage.css';

const CategoriesPage = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [showFilter, setShowFilter] = useState(false);
  const [sortBy, setSortBy] = useState('popular');
  
  // دیتای دسته‌بندی‌ها
  const categories = [
    { id: 'all', name: 'همه محصولات', icon: faLeaf, count: 24 },
    { id: 'biostimulant', name: 'بیواستی مولانت', icon: faLeaf, count: 12 },
    { id: 'biofertilizer', name: 'بیوفرتیلایزر', icon: faSeedling, count: 6 },
    { id: 'specialty', name: 'محصولات ویژه', icon: faFlask, count: 4 },
    { id: 'soil', name: 'بهبوددهنده خاک', icon: faTractor, count: 2 }
  ];

  // دیتای محصولات
  const products = [
    {
      id: 1,
      name: 'بیو بوست پلاس',
      category: 'biostimulant',
      price: '۲۵۰,۰۰۰',
      oldPrice: '۳۲۰,۰۰۰',
      rating: 4.8,
      reviews: 124,
      image: 'https://placehold.co/400x300/2e7d32/white?text=BioBoost',
      badge: 'پرفروش',
      description: 'افزایش مقاومت گیاه در برابر تنش‌های محیطی',
      inStock: true
    },
    {
      id: 2,
      name: 'روت مکس',
      category: 'biostimulant',
      price: '۳۲۰,۰۰۰',
      rating: 4.9,
      reviews: 98,
      image: 'https://placehold.co/400x300/4caf50/white?text=RootMax',
      badge: 'جدید',
      description: 'تقویت ریشه و جذب بهتر مواد مغذی',
      inStock: true
    },
    {
      id: 3,
      name: 'فرایت پرو',
      category: 'biostimulant',
      price: '۲۸۰,۰۰۰',
      rating: 4.7,
      reviews: 87,
      image: 'https://placehold.co/400x300/66bb6a/white?text=FruitPro',
      badge: 'تخفیف ویژه',
      description: 'افزایش کیفیت و کمیت میوه',
      inStock: true
    },
    {
      id: 4,
      name: 'سویل لایف',
      category: 'biofertilizer',
      price: '۳۵۰,۰۰۰',
      rating: 4.9,
      reviews: 156,
      image: 'https://placehold.co/400x300/388e3c/white?text=SoilLife',
      badge: 'پرفروش',
      description: 'احیای میکروبی خاک و افزایش حاصلخیزی',
      inStock: true
    },
    {
      id: 5,
      name: 'نیتروفیکس',
      category: 'biofertilizer',
      price: '۲۹۰,۰۰۰',
      rating: 4.6,
      reviews: 67,
      image: 'https://placehold.co/400x300/43a047/white?text=NitroFix',
      badge: '',
      description: 'تثبیت نیتروژن هوا و تأمین نیاز گیاه',
      inStock: false
    },
    {
      id: 6,
      name: 'آمینو گرو',
      category: 'specialty',
      price: '۳۸۰,۰۰۰',
      rating: 4.8,
      reviews: 112,
      image: 'https://placehold.co/400x300/2e7d32/white?text=AminoGro',
      badge: 'پرفروش',
      description: 'اسیدهای آمینه برای رشد رویشی',
      inStock: true
    },
    {
      id: 7,
      name: 'هیومیک اسید',
      category: 'soil',
      price: '۱۸۰,۰۰۰',
      rating: 4.7,
      reviews: 89,
      image: 'https://placehold.co/400x300/4caf50/white?text=HumicAcid',
      badge: '',
      description: 'بهبود ساختار خاک و جذب عناصر',
      inStock: true
    },
    {
      id: 8,
      name: 'سی ویند',
      category: 'specialty',
      price: '۴۲۰,۰۰۰',
      rating: 4.9,
      reviews: 203,
      image: 'https://placehold.co/400x300/66bb6a/white?text=SeaWeed',
      badge: 'جدید',
      description: 'عصاره جلبک دریایی فرآوری شده',
      inStock: true
    }
  ];

  // فیلتر کردن محصولات بر اساس دسته‌بندی
  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  // مرتب‌سازی محصولات
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return parseInt(a.price.replace(/,/g, '')) - parseInt(b.price.replace(/,/g, ''));
    if (sortBy === 'price-desc') return parseInt(b.price.replace(/,/g, '')) - parseInt(a.price.replace(/,/g, ''));
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0;
  });

  const formatPrice = (price) => {
    return price + ' تومان';
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FontAwesomeIcon 
          key={i} 
          icon={faStar} 
          className={i <= Math.floor(rating) ? 'star-filled' : 'star-empty'} 
        />
      );
    }
    return stars;
  };

  return (
    <div className="categories-page">
      {/* Hero Section */}
      <div className="categories-hero">
        <div className="categories-hero-content">
          <h1>محصولات بیواستی مولانت</h1>
          <p>راهکارهای نوین برای کشاورزی پایدار و محصولات باکیفیت</p>
          {/*<div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">۲۴+</span>
              <span className="stat-label">محصول تخصصی</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">۱۰۰۰+</span>
              <span className="stat-label">کشاورز راضی</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">۹۸%</span>
              <span className="stat-label">رضایت مشتری</span>
            </div>
          </div>*/}
        </div>
      </div>

      {/* Categories Section */}
      <div className="categories-nav">
        <div className="container">
          <div className="categories-scroll">
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                <FontAwesomeIcon icon={category.icon} />
                <span>{category.name}</span>
                <span className="category-count">{category.count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="container">
          <div className="filters-wrapper">
            <div className="results-info">
              <span>{sortedProducts.length} محصول یافت شد</span>
            </div>
            <div className="sort-wrapper">
              <label>مرتب‌سازی:</label>
              <div className="custom-select">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="popular">محبوب‌ترین</option>
                  <option value="price-asc">ارزان‌ترین</option>
                  <option value="price-desc">گران‌ترین</option>
                  <option value="rating">بالاترین امتیاز</option>
                </select>
                <FontAwesomeIcon icon={faChevronDown} className="select-icon" />
              </div>
            </div>
            <button className="filter-toggle" onClick={() => setShowFilter(!showFilter)}>
              <FontAwesomeIcon icon={faFilter} />
              <span>فیلتر</span>
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="products-section">
        <div className="container">
          <div className="products-grid">
            {sortedProducts.map(product => (
              <div key={product.id} className="product-card">
                {product.badge && (
                  <div className={`product-badge ${product.badge === 'تخفیف ویژه' ? 'discount' : ''}`}>
                    {product.badge}
                  </div>
                )}
                <div className="product-image">
                  <img src={product.image} alt={product.name} />
                  <div className="product-actions">
                    <button className="action-btn wishlist">
                      <FontAwesomeIcon icon={faHeart} />
                    </button>
                    <button className="action-btn cart">
                      <FontAwesomeIcon icon={faShoppingCart} />
                    </button>
                  </div>
                </div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="product-desc">{product.description}</p>
                  <div className="product-rating">
                    {renderStars(product.rating)}
                    <span>({product.reviews})</span>
                  </div>
                  <div className="product-price">
                    <span className="current-price">{formatPrice(product.price)}</span>
                    {product.oldPrice && (
                      <span className="old-price">{formatPrice(product.oldPrice)}</span>
                    )}
                  </div>
                  <button 
                    className={`buy-btn ${!product.inStock ? 'disabled' : ''}`}
                    disabled={!product.inStock}
                  >
                    {product.inStock ? 'افزودن به سبد خرید' : 'ناموجود'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Side Filter Modal for Mobile */}
      {showFilter && (
        <div className="filter-modal" onClick={() => setShowFilter(false)}>
          <div className="filter-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="filter-modal-header">
              <h3>فیلتر محصولات</h3>
              <button onClick={() => setShowFilter(false)}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="filter-modal-body">
              <div className="filter-group">
                <label>محدوده قیمت</label>
                <input type="range" min="0" max="500000" />
              </div>
              <div className="filter-group">
                <label>دسته‌بندی</label>
                {categories.map(cat => (
                  <label key={cat.id} className="filter-checkbox">
                    <input type="checkbox" /> {cat.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;