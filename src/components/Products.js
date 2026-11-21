'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { catalog, productHref, productImage } from './Products/catalog';
import './Products.css';

const products = catalog.filter(product => product.stock > 0).slice(0, 5);

const Products = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  // Get visible products (3 at a time)
  const getVisibleProducts = () => {
    const visible = [];
    for (let i = 0; i < 3; i++) {
      const index = (currentIndex + i) % products.length;
      visible.push(products[index]);
    }
    return visible;
  };

  const visibleProducts = getVisibleProducts();

  // Auto-rotate every 5 seconds with progress tracking
  useEffect(() => {
    let interval;
    let startTime;
    let animationFrame;
    
    if (isAutoPlaying) {
      startTime = Date.now();
      setProgress(0);
      
      const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        const newProgress = (elapsed / 5000) * 100;
        if (newProgress <= 100) {
          setProgress(newProgress);
          animationFrame = requestAnimationFrame(updateProgress);
        }
      };
      
      animationFrame = requestAnimationFrame(updateProgress);
      
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % products.length);
        setProgress(0);
        startTime = Date.now();
      }, 5000);
    }
    
    return () => {
      clearInterval(interval);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isAutoPlaying, products.length]);

  // Navigation handlers
  const nextSlide = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % products.length);
    setProgress(0);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + products.length) % products.length);
    setProgress(0);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToSlide = (index) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
    setProgress(0);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  // Get dot indicators (based on all products)
  const getDotIndexes = () => {
    return products.map((_, idx) => idx);
  };

  // Calculate circle progress
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <section className="products">
      <h2>Our Biostimulants</h2>
      <p className="products-subtitle">Innovative solutions for modern agriculture</p>
      
      <div className="slider-container">
        <button className="slider-btn prev-btn" onClick={prevSlide}>
          &#10094;
        </button>
        
        <div className="products-slider">
          {visibleProducts.map((product) => (
            <div className="product-item" key={product.id}>
              <Link href={productHref(product)}>
                <Image src={productImage(product)} alt={product.name} width={320} height={320} unoptimized />
              </Link>
              <h3><Link href={productHref(product)}>{product.name}</Link></h3>
              <p>{product.detail}</p>
              <Link href={productHref(product)} className="product-btn">جزئیات محصول</Link>
            </div>
          ))}
        </div>
        
        <button className="slider-btn next-btn" onClick={nextSlide}>
          &#10095;
        </button>
      </div>

      {/* Dot indicators */}
      <div className="slider-dots">
        {getDotIndexes().map((idx) => (
          <button
            key={idx}
            className={`dot ${currentIndex === idx ? 'active' : ''}`}
            onClick={() => goToSlide(idx)}
          />
        ))}
      </div>

      {/* Circular Progress Bar */}
      <div className="circular-progress-container">
        <svg className="circular-progress" width="60" height="60" viewBox="0 0 60 60">
          <circle
            className="progress-bg"
            cx="30"
            cy="30"
            r={radius}
            stroke="#e0e0e0"
            strokeWidth="3"
            fill="none"
          />
          <circle
            className="progress-fill"
            cx="30"
            cy="30"
            r={radius}
            stroke="#2e7d32"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 30 30)"
          />
          <text x="30" y="35" textAnchor="middle" className="progress-text">
            {Math.floor(5 - (progress / 100) * 5)}s
          </text>
        </svg>
      </div>
    </section>
  );
};

export default Products;