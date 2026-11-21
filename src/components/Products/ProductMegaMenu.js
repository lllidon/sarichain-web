'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faChevronDown, faFlask, faLeaf, faSeedling, faWheatAwn } from '@fortawesome/free-solid-svg-icons';
import { catalog, categories } from './catalog';

const icons = {
  biostimulant: faLeaf,
  biofertilizer: faSeedling,
  specialty: faFlask,
  soil: faWheatAwn,
};

export default function ProductMegaMenu() {
  const [mode, setMode] = useState('');
  const item = useRef(null);
  const toggle = useRef(null);
  const isOpen = mode !== '';

  useEffect(() => {
    if (!isOpen) return;

    function closeOutside(event) {
      if (!item.current.contains(event.target)) setMode('');
    }

    function closeOnEscape(event) {
      if (event.key !== 'Escape') return;
      const restoreFocus = item.current.contains(document.activeElement);
      setMode('');
      if (restoreFocus) toggle.current.focus();
    }

    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  return (
    <li className="nav-item nav-products" ref={item}
      onPointerEnter={event => {
        if (event.pointerType === 'mouse' && window.matchMedia('(min-width: 993px)').matches) {
          setMode(current => current || 'hover');
        }
      }}
      onPointerLeave={() => {
        if (!item.current.contains(document.activeElement)) {
          setMode(current => current === 'hover' ? '' : current);
        }
      }}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setMode('');
      }}>
      <button ref={toggle} type="button" className="nav-link nav-products-toggle"
        aria-expanded={isOpen} aria-controls="nav-products-panel"
        onClick={() => setMode(current => current === 'clicked' ? '' : 'clicked')}>
        محصولات <FontAwesomeIcon icon={faChevronDown} />
      </button>

      <div className="nav-products-panel" id="nav-products-panel" hidden={!isOpen}>
        <div className="nav-products-inner">
          <div className="nav-products-heading">
            <h2>دسته‌بندی محصولات</h2>
            <Link href="/categories" onClick={() => setMode('')}>
              مشاهده کاتالوگ <FontAwesomeIcon icon={faArrowLeft} />
            </Link>
          </div>

          <ul className="nav-products-grid">
            {Object.entries(categories).map(([id, category]) => {
              const details = [...new Set(catalog.filter(product => product.category === id && product.stock > 0)
                .map(product => product.detail))].slice(0, 3);
              return (
                <li key={id}>
                  <Link className="nav-products-category" href={{ pathname: '/categories', query: { category: id } }}
                    onClick={() => setMode('')}>
                    <FontAwesomeIcon icon={icons[id]} />
                    {category.name}
                  </Link>
                  <ul>
                    {details.map(detail => (
                      <li key={detail}>
                        <Link href={{ pathname: '/categories', query: { category: id, detail } }} onClick={() => setMode('')}>
                          {detail}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </li>
  );
}
