'use client';

import React, { useState } from 'react';
import './Auth.css';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    email: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // تغییر بین لاگین و ثبت نام
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setFormData({
      name: '',
      phone: '',
      password: '',
      confirmPassword: '',
      email: ''
    });
  };

  // مدیریت تغییرات فیلدها
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // پاک کردن خطای مربوط به این فیلد
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // اعتبارسنجی فرم
  const validateForm = () => {
    const newErrors = {};

    if (!isLogin) {
      if (!formData.name.trim()) {
        newErrors.name = 'نام و نام خانوادگی الزامی است';
      } else if (formData.name.length < 3) {
        newErrors.name = 'نام باید حداقل 3 کاراکتر باشد';
      }
    }

    if (!formData.email) {
      newErrors.email = 'ایمیل الزامی است';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'ایمیل نامعتبر است';
    }

    if (!formData.password) {
      newErrors.password = 'رمز عبور الزامی است';
    } else if (formData.password.length < 6) {
      newErrors.password = 'رمز عبور باید حداقل 6 کاراکتر باشد';
    }

    if (!isLogin) {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'تکرار رمز عبور الزامی است';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'رمز عبور با تکرار آن مطابقت ندارد';
      }
    }

    if (!isLogin && formData.phone && !/^[0-9]{11}$/.test(formData.phone)) {
      newErrors.phone = 'شماره تلفن باید 11 رقم باشد';
    }

    return newErrors;
  };

  // ارسال فرم
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      
      // شبیه‌سازی درخواست به سرور
      setTimeout(() => {
        setIsLoading(false);
        if (isLogin) {
          alert('ورود با موفقیت انجام شد!');
          // هنا می‌توانید به صفحه اصلی هدایت کنید
          // window.location.href = '/';
        } else {
          alert('ثبت نام با موفقیت انجام شد!');
          setIsLogin(true); // بعد از ثبت نام به صفحه لاگین برو
        }
      }, 1500);
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-card">
          {/* Header with tabs */}
          <div className="auth-header">
            <div className="auth-tabs">
              <button
                className={`tab-btn ${isLogin ? 'active' : ''}`}
                onClick={() => setIsLogin(true)}
              >
                ورود
              </button>
              <button
                className={`tab-btn ${!isLogin ? 'active' : ''}`}
                onClick={() => setIsLogin(false)}
              >
                ثبت نام
              </button>
            </div>
            <div className="auth-title">
              <h2>{isLogin ? 'خوش آمدید!' : 'ایجاد حساب کاربری'}</h2>
              <p>
                {isLogin
                  ? 'وارد حساب خود شوید و از خدمات ما استفاده کنید'
                  : 'برای استفاده از خدمات ما ثبت نام کنید'}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="name">نام و نام خانوادگی</label>
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
            )}

            <div className="form-group">
              <label htmlFor="phone">شماره موبایل</label>
              <div className="input-wrapper">
                <input
                  type="phone"
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
              <label htmlFor="password">رمز عبور</label>
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
            </div>

            {!isLogin && (
              <>
                <div className="form-group">
                  <label htmlFor="confirmPassword">تکرار رمز عبور</label>
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

                <div className="form-group">
                  <label htmlFor="email">آدرس ایمیل (اختیاری)</label>
                  <div className="input-wrapper">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="example@gmail.com"
                      className={errors.email ? 'error' : ''}
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>
                </div>
              </>
            )}

            {isLogin && (
              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" /> مرا به خاطر بسپار
                </label>
                <a href="#" className="forgot-password">رمز عبور را فراموش کرده‌اید؟</a>
              </div>
            )}

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? (
                <span className="loader"></span>
              ) : (
                isLogin ? 'ورود به حساب' : 'ثبت نام'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            <p>
              {isLogin ? 'حساب کاربری ندارید؟' : 'حساب کاربری دارید؟'}
              <button onClick={toggleMode} className="switch-btn">
                {isLogin ? 'ثبت نام کنید' : 'وارد شوید'}
              </button>
            </p>
          </div>

          {/* Social Login */}
          <div className="social-login">
            <div className="divider">
              <span>یا</span>
            </div>
            <div className="social-buttons">
              <button className="social-btn google">
                <span>G</span> گوگل
              </button>
              <button className="social-btn github">
                <span>GH</span> گیت‌هاب
              </button>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="auth-decoration">
          <div className="leaf leaf-1"></div>
          <div className="leaf leaf-2"></div>
          <div className="leaf leaf-3"></div>
        </div>
      </div>
    </div>
  );
};

export default Auth;