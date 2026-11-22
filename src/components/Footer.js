'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPhone, 
  faEnvelope, 
  faMapMarkerAlt, 
  faPaperPlane,
  faLeaf,
  faTractor,
  faFlask,
  faSeedling
} from '@fortawesome/free-solid-svg-icons';
import { 
  faFacebook, 
  faTwitter, 
  faLinkedin, 
  faInstagram, 
  faYoutube 
} from '@fortawesome/free-brands-svg-icons';
import './Footer.css';

const Footer = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState('');

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail && /\S+@\S+\.\S+/.test(newsletterEmail)) {
      setNewsletterStatus('success');
      setNewsletterEmail('');
      setTimeout(() => setNewsletterStatus(''), 3000);
    } else {
      setNewsletterStatus('error');
      setTimeout(() => setNewsletterStatus(''), 3000);
    }
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Main Footer Grid */}
        <div className="footer-grid">
          
          {/* Column 1: Company Info */}
          <div className="footer-col">
            <div className="footer-logo">
              <img src="/logoWhite.png" className="logo-icon" />
              <h3>سارچین</h3>
            </div>
            <p className="company-desc">
              ارائه دهنده راهکارهای نوین بیواستی مولانت برای افزایش بهره‌وری و سلامت محصولات کشاورزی
            </p>
            <div className="contact-info">
              <div className="contact-item">
                <FontAwesomeIcon icon={faPhone} />
                <span>+98 21 1234 5678</span>
              </div>
              <div className="contact-item">
                <FontAwesomeIcon icon={faEnvelope} />
                <span>info@biostimulant.com</span>
              </div>
              <div className="contact-item">
                <FontAwesomeIcon icon={faMapMarkerAlt} />
                <span>تهران، خیابان آزادی، پلاک ۱۲۳</span>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="footer-col">
            <h4>دسترسی سریع</h4>
            <ul className="footer-links">
              <li><a href="#">محصولات</a></li>
              <li><Link href="/suppliers">معرفی تأمین‌کنندگان مواد اولیه</Link></li>
              <li><a href="#">راهکارها</a></li>
              <li><a href="#">درباره ما</a></li>
              <li><a href="#">وبلاگ</a></li>
              <li><a href="#">تماس با ما</a></li>
              <li><a href="#">سوالات متداول</a></li>
            </ul>
          </div>

          {/* Column 3: Products */}
          <div className="footer-col">
            <h4>محصولات</h4>
            <ul className="footer-links">
              <li><a href="#">بیواستی مولانت‌ها</a></li>
              <li><a href="#">بیوفرتیلایزرها</a></li>
              <li><a href="#">عصاره جلبک دریایی</a></li>
              <li><a href="#">اسیدهای آمینه</a></li>
              <li><a href="#">اسیدهای هیومیک</a></li>
              <li><a href="#">میکروبیال‌ها</a></li>
            </ul>
          </div>


          {/* Column 5: Newsletter */}
          <div className="footer-col newsletter-col">
            <h4>خبرنامه</h4>
            <p className="newsletter-text">
              برای دریافت آخرین اخبار و تخفیف‌ها عضو شوید
            </p>
            <form onSubmit={handleNewsletterSubmit} className="newsletter-form">
              <div className="newsletter-input-group">
                <input
                  type="email"
                  placeholder="ایمیل خود را وارد کنید"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                />
                <button type="submit">
                  <FontAwesomeIcon icon={faPaperPlane} />
                </button>
              </div>
              {newsletterStatus === 'success' && (
                <p className="newsletter-success">✓ با موفقیت عضو شدید!</p>
              )}
              {newsletterStatus === 'error' && (
                <p className="newsletter-error">✗ لطفا ایمیل معتبر وارد کنید</p>
              )}
            </form>
            <div className="social-links">
              <a href="#" aria-label="Facebook">
                <FontAwesomeIcon icon={faFacebook} />
              </a>
              <a href="#" aria-label="Twitter">
                <FontAwesomeIcon icon={faTwitter} />
              </a>
              <a href="#" aria-label="LinkedIn">
                <FontAwesomeIcon icon={faLinkedin} />
              </a>
              <a href="#" aria-label="Instagram">
                <FontAwesomeIcon icon={faInstagram} />
              </a>
              <a href="#" aria-label="YouTube">
                <FontAwesomeIcon icon={faYoutube} />
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <div className="copyright">
              <p>© 2024 BioStimulant. تمامی حقوق محفوظ است.</p>
            </div>
            <div className="legal-links">
              <a href="#">حریم خصوصی</a>
              <span className="separator">|</span>
              <a href="#">شرایط استفاده</a>
              <span className="separator">|</span>
              <a href="#">سیاست کوکی</a>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative leaf elements */}
      <div className="footer-decoration">
        <div className="decor-leaf leaf-1">
          <FontAwesomeIcon icon={faLeaf} />
        </div>
        <div className="decor-leaf leaf-2">
          <FontAwesomeIcon icon={faSeedling} />
        </div>
        <div className="decor-leaf leaf-3">
          <FontAwesomeIcon icon={faTractor} />
        </div>
        <div className="decor-leaf leaf-4">
          <FontAwesomeIcon icon={faFlask} />
        </div>
      </div>
    </footer>
  );
};

export default Footer;