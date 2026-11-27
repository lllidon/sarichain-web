'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowRight, faMagnifyingGlass, faPause, faPlay } from '@fortawesome/free-solid-svg-icons';

const slides = [
  {
    eyebrow: 'از ریشه تا سفره',
    title: 'تازه‌ترین محصولات،\nمستقیم از تولیدکننده',
    description: 'باغداران، کشاورزان و دامداران را پیدا کنید؛ محصولات را مقایسه کنید و با اطمینان خرید کنید.',
    image: '/img/home/seasonal-market.webp',
    imageAlt: 'بازار محصولات تازه کشاورزی',
    cta: 'مشاهده محصولات',
    href: '/categories',
    tone: 'field',
  },
  {
    eyebrow: 'بازار حرفه‌ای کشاورزی',
    title: 'برای هر مزرعه،\nیک راهکار هوشمند',
    description: 'از نهاده و تجهیزات تا خدمات تخصصی؛ نیازهای کسب‌وکار کشاورزی را یکجا پیدا کنید.',
    image: '/img/sliderFade.jpg',
    imageAlt: 'فعالیت و تولید در مزرعه',
    cta: 'کشف راهکارها',
    href: '/solutions',
    tone: 'solutions',
  },
  {
    eyebrow: 'همراه تولیدکنندگان ایرانی',
    title: 'محصول خوب،\nبازار بزرگ‌تری می‌خواهد',
    description: 'عرضه محصولات خود را معرفی کنید و به خریداران عمده و مصرف‌کنندگان دسترسی داشته باشید.',
    image: '/img/catalog/field.webp',
    imageAlt: 'مزرعه و کشت محصولات کشاورزی',
    cta: 'همکاری با ساری‌چین',
    href: '/partners',
    tone: 'growers',
  },
];

export default function HomeHeroCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const move = useCallback((step) => setActive(index => (index + step + slides.length) % slides.length), []);

  useEffect(() => {
    if (paused) return undefined;
    const timer = window.setInterval(() => setActive(index => (index + 1) % slides.length), 6500);
    return () => window.clearInterval(timer);
  }, [paused]);

  const slide = slides[active];
  return <section className="market-home-carousel" aria-roledescription="اسلایدر" aria-label="معرفی ساری‌چین"
    onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
    onFocusCapture={() => setPaused(true)} onBlurCapture={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
    }}>
    <div className="market-home-slide-image" key={slide.image}>
      <img src={slide.image} alt={slide.imageAlt} fetchPriority={active === 0 ? 'high' : 'auto'} />
    </div>
    <div className="market-home-slide-shade" />
    <div className="market-home-slide-content" key={active}>
      <span className="market-home-slide-eyebrow">{slide.eyebrow}</span>
      <h1>{slide.title.split('\n').map((line, index) => <span key={index}>{line}</span>)}</h1>
      <p>{slide.description}</p>
      <form action="/categories" method="get" role="search" className="market-home-search market-home-search-hero">
        <label className="market-home-visually-hidden" htmlFor="home-hero-search">جستجوی محصول یا دسته‌بندی</label>
        <FontAwesomeIcon icon={faMagnifyingGlass} />
        <input type="search" id="home-hero-search" name="q" placeholder="چه محصولی دنبالش هستید؟" maxLength={80} />
        <button type="submit">جستجو</button>
      </form>
      <Link className="market-home-slide-cta" href={slide.href}>{slide.cta}<FontAwesomeIcon icon={faArrowLeft}/></Link>
    </div>
    <div className="market-home-carousel-controls">
      <div className="market-home-carousel-dots" role="group" aria-label="انتخاب اسلاید">
        {slides.map((item, index) => <button key={item.tone} type="button" className={active === index ? 'active' : ''}
          aria-label={'نمایش اسلاید ' + (index + 1)} aria-pressed={active === index} onClick={() => setActive(index)} />)}
      </div>
      <div className="market-home-carousel-arrows">
        <button type="button" onClick={() => move(-1)} aria-label="اسلاید قبلی"><FontAwesomeIcon icon={faArrowRight}/></button>
        <button type="button" onClick={() => move(1)} aria-label="اسلاید بعدی"><FontAwesomeIcon icon={faArrowLeft}/></button>
        <button type="button" onClick={() => setPaused(value => !value)} aria-label={paused ? 'ادامه اسلایدر' : 'توقف اسلایدر'}>
          <FontAwesomeIcon icon={paused ? faPlay : faPause}/>
        </button>
      </div>
    </div>
    <span className="market-home-slide-count"><b>0{active + 1}</b><i />0{slides.length}</span>
  </section>;
}
