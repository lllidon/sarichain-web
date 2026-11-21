'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './Auth.css';

const Register = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // نام و نام خانوادگی
    if (!formData.name.trim()) {
      newErrors.name = 'نام و نام خانوادگی الزامی است';
    } else if (formData.name.length < 3) {
      newErrors.name = 'نام باید حداقل 3 کاراکتر باشد';
    }

    // شماره موبایل - اجباری
    if (!formData.phone) {
      newErrors.phone = 'شماره موبایل الزامی است';
    } else if (!/^[0-9]{11}$/.test(formData.phone)) {
      newErrors.phone = 'شماره موبایل باید 11 رقم باشد';
    }

    // ایمیل - اختیاری (فقط در صورت وارد شدن اعتبارسنجی شود)
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'ایمیل نامعتبر است';
    }

    // رمز عبور
    if (!formData.password) {
      newErrors.password = 'رمز عبور الزامی است';
    } else if (formData.password.length < 6) {
      newErrors.password = 'رمز عبور باید حداقل 6 کاراکتر باشد';
    }

    // تکرار رمز عبور
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'تکرار رمز عبور الزامی است';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'رمز عبور با تکرار آن مطابقت ندارد';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      
      setTimeout(() => {
        setIsLoading(false);
        alert('ثبت نام با موفقیت انجام شد! لطفاً وارد شوید.');
        router.push('/login');
      }, 1500);
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-card">
          <Link href="/" className="back-home">
            ← بازگشت به صفحه اصلی
          </Link>

          <div className="auth-header">
            <div className="auth-title">
              <h2>ایجاد حساب کاربری</h2>
              <p>برای استفاده از خدمات ما ثبت نام کنید</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="name">نام و نام خانوادگی <span className="required">*</span></label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="مثال: علی محمدی"
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phone">شماره موبایل <span className="required">*</span></label>
              <div className="input-wrapper">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="09123456789"
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">آدرس ایمیل <span className="optional">(اختیاری)</span></label>
              <div className="input-wrapper">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
              <small className="field-note">ایمیل برای دریافت اطلاعیه‌ها توصیه می‌شود</small>
            </div>

            <div className="form-group">
              <label htmlFor="password">رمز عبور <span className="required">*</span></label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={errors.password ? 'error' : ''}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>
              <small className="field-note">رمز عبور باید حداقل 6 کاراکتر باشد</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">تکرار رمز عبور <span className="required">*</span></label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={errors.confirmPassword ? 'error' : ''}
                />
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? (
                <span className="loader"></span>
              ) : (
                'ثبت نام'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              حساب کاربری دارید؟
              <Link href="/login" className="switch-btn">
                وارد شوید
              </Link>
            </p>
          </div>

          <div className="social-login">
            <div className="divider">
              <span>یا</span>
            </div>
            <div className="social-buttons">
              <button className="social-btn google">
                <span>G</span> ثبت نام با گوگل
              </button>
              <button className="social-btn github">
                <span>GH</span> ثبت نام با گیت‌هاب
              </button>
            </div>
          </div>
        </div>

        <div className="auth-decoration">
          <div className="leaf leaf-1"></div>
          <div className="leaf leaf-2"></div>
          <div className="leaf leaf-3"></div>
        </div>
      </div>
    </div>
  );
};

export default Register;