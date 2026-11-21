'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './Auth.css';

const Login = () => {
  const router = useRouter();
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    otpCode: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [generatedOtp, setGeneratedOtp] = useState(''); // برای تست

  // ارسال کد یکبار مصرف
  const sendOtpCode = async () => {
    // اعتبارسنجی شماره موبایل
    if (!formData.phone) {
      setErrors({ phone: 'شماره موبایل الزامی است' });
      return false;
    }
    if (!/^[0-9]{11}$/.test(formData.phone)) {
      setErrors({ phone: 'شماره موبایل باید 11 رقم باشد' });
      return false;
    }

    setErrors({});
    setIsLoading(true);

    // شبیه‌سازی ارسال پیامک
    setTimeout(() => {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(otp);
      setOtpSent(true);
      setCountdown(60);
      setIsLoading(false);
      
      // نمایش پیام تستی
      alert(`کد یکبار مصرف شما: ${otp}\n(این پیام برای تست نمایش داده شد)`);
      
      // شروع شمارش معکوس
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, 1500);

    return true;
  };

  // تغییر شماره موبایل
  const handlePhoneChange = (e) => {
    const { value } = e.target;
    setFormData({ ...formData, phone: value, otpCode: '' });
    if (otpSent) {
      setOtpSent(false);
      setCountdown(0);
    }
    if (errors.phone) {
      setErrors({ ...errors, phone: '' });
    }
  };

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

  // اعتبارسنجی فرم ورود با رمز عبور
  const validatePasswordForm = () => {
    const newErrors = {};

    if (!formData.phone) {
      newErrors.phone = 'شماره موبایل الزامی است';
    } else if (!/^[0-9]{11}$/.test(formData.phone)) {
      newErrors.phone = 'شماره موبایل باید 11 رقم باشد';
    }

    if (!formData.password) {
      newErrors.password = 'رمز عبور الزامی است';
    } else if (formData.password.length < 6) {
      newErrors.password = 'رمز عبور باید حداقل 6 کاراکتر باشد';
    }

    return newErrors;
  };

  // اعتبارسنجی فرم ورود با کد یکبار مصرف
  const validateOtpForm = () => {
    const newErrors = {};

    if (!formData.phone) {
      newErrors.phone = 'شماره موبایل الزامی است';
    } else if (!/^[0-9]{11}$/.test(formData.phone)) {
      newErrors.phone = 'شماره موبایل باید 11 رقم باشد';
    }

    if (!formData.otpCode) {
      newErrors.otpCode = 'کد یکبار مصرف الزامی است';
    } else if (!/^[0-9]{4}$/.test(formData.otpCode)) {
      newErrors.otpCode = 'کد یکبار مصرف باید 4 رقم باشد';
    } else if (formData.otpCode !== generatedOtp) {
      newErrors.otpCode = 'کد یکبار مصرف نامعتبر است';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let newErrors = {};
    if (loginMethod === 'password') {
      newErrors = validatePasswordForm();
    } else {
      newErrors = validateOtpForm();
    }
    
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      
      setTimeout(() => {
        setIsLoading(false);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userPhone', formData.phone);
        
        router.push('/');
      }, 1500);
    } else {
      setErrors(newErrors);
    }
  };

  const resendOtp = () => {
    if (countdown === 0) {
      sendOtpCode();
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
              <h2>خوش آمدید!</h2>
              <p>وارد حساب خود شوید و از خدمات ما استفاده کنید</p>
            </div>
          </div>

          {/* تب‌های انتخاب روش ورود */}
          <div className="login-method-tabs">
            <button
              type="button"
              className={`method-btn ${loginMethod === 'password' ? 'active' : ''}`}
              onClick={() => {
                setLoginMethod('password');
                setOtpSent(false);
                setErrors({});
              }}
            >
              ورود با رمز عبور
            </button>
            <button
              type="button"
              className={`method-btn ${loginMethod === 'otp' ? 'active' : ''}`}
              onClick={() => {
                setLoginMethod('otp');
                setOtpSent(false);
                setErrors({});
              }}
            >
              ورود با کد یکبار مصرف
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {/* شماره موبایل - مشترک برای هر دو روش */}
            <div className="form-group">
              <label htmlFor="phone">شماره موبایل <span className="required">*</span></label>
              <div className="input-wrapper">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  placeholder="09123456789"
                  className={errors.phone ? 'error' : ''}
                  disabled={loginMethod === 'otp' && otpSent}
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>
            </div>

            {/* فرم ورود با رمز عبور */}
            {loginMethod === 'password' && (
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
              </div>
            )}

            {/* فرم ورود با کد یکبار مصرف */}
            {loginMethod === 'otp' && (
              <>
                {!otpSent ? (
                  <button
                    type="button"
                    onClick={sendOtpCode}
                    className="send-otp-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? <span className="loader"></span> : 'ارسال کد یکبار مصرف'}
                  </button>
                ) : (
                  <div className="form-group">
                    <label htmlFor="otpCode">کد یکبار مصرف <span className="required">*</span></label>
                    <div className="input-wrapper">
                      <input
                        type="text"
                        id="otpCode"
                        name="otpCode"
                        value={formData.otpCode}
                        onChange={handleChange}
                        placeholder="کد 4 رقمی را وارد کنید"
                        maxLength="4"
                        className={errors.otpCode ? 'error' : ''}
                      />
                      {errors.otpCode && <span className="error-message">{errors.otpCode}</span>}
                    </div>
                    <div className="otp-actions">
                      <button
                        type="button"
                        onClick={resendOtp}
                        className="resend-otp-btn"
                        disabled={countdown > 0}
                      >
                        {countdown > 0 ? `ارسال مجدد (${countdown} ثانیه)` : 'ارسال مجدد کد'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="form-options">
              <label className="remember-me">
                <input type="checkbox" /> مرا به خاطر بسپار
              </label>
              {loginMethod === 'password' && (
                <Link href="/forgot-password" className="forgot-password">
                  رمز عبور را فراموش کرده‌اید؟
                </Link>
              )}
            </div>

            <button 
              type="submit" 
              className="submit-btn" 
              disabled={isLoading || (loginMethod === 'otp' && !otpSent)}
            >
              {isLoading ? (
                <span className="loader"></span>
              ) : (
                loginMethod === 'password' ? 'ورود به حساب' : 'تایید و ورود'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              حساب کاربری ندارید؟
              <Link href="/register" className="switch-btn">
                ثبت نام کنید
              </Link>
            </p>
          </div>

          <div className="social-login">
            <div className="divider">
              <span>یا</span>
            </div>
            <div className="social-buttons">
              <button className="social-btn google">
                <span>G</span> ورود با گوگل
              </button>
              <button className="social-btn github">
                <span>GH</span> ورود با گیت‌هاب
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

export default Login;