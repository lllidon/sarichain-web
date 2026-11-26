'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faChevronDown, faFlask, faLeaf, faSeedling, faWheatAwn } from '@fortawesome/free-solid-svg-icons';
import { useCatalog } from './CatalogProvider';

const icons = {
  biostimulant: faLeaf,
  biofertilizer: faSeedling,
  specialty: faFlask,
  soil: faWheatAwn,
};

export default function ProductMegaMenu() {
  const { catalog, categories } = useCatalog();
  const menu = useRef(null);
  const timer = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function closeOutside(event) {
      if (!menu.current?.contains(event.target)) { menu.current.open = false; setIsOpen(false); }
    }

    function closeOnEscape(event) {
      if (event.key !== 'Escape' || !menu.current.open) return;
      const restoreFocus = menu.current.contains(document.activeElement);
      menu.current.open = false;
      setIsOpen(false);
      if (restoreFocus) menu.current.querySelector('summary').focus();
    }

    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function closeMenu() {
    menu.current.open = false;
    setIsOpen(false);
  }

  function openOnHover() {
    if (timer.current) clearTimeout(timer.current);
    if (window.innerWidth > 992) { menu.current.open = true; setIsOpen(true); }
  }

  function closeOnLeave() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { if (menu.current) menu.current.open = false; setIsOpen(false); }, 220);
  }

  return (
    <li className="nav-item nav-products" onMouseEnter={openOnHover} onMouseLeave={closeOnLeave} onFocus={openOnHover}>
      <details className="nav-products-disclosure" ref={menu} open={isOpen} onToggle={event => setIsOpen(event.currentTarget.open)} suppressHydrationWarning>
        <summary className="nav-link nav-products-toggle" aria-controls="nav-products-panel" onClick={event => { if (window.innerWidth > 992) { event.preventDefault(); menu.current.open = !menu.current.open; setIsOpen(menu.current.open); } }}>
          محصولات <FontAwesomeIcon icon={faChevronDown} />
        </summary>
        <div className="nav-products-panel" id="nav-products-panel" onMouseEnter={openOnHover} onMouseLeave={closeOnLeave}>
          <div className="nav-products-inner">
            <div className="nav-products-heading">
              <h2>دسته‌بندی محصولات</h2>
              <Link href="/categories" onClick={closeMenu}>
                مشاهده کاتالوگ <FontAwesomeIcon icon={faArrowLeft} />
              </Link>
            </div>

            <ul className="nav-products-grid">
              {Object.entries(categories).map(([id, category]) => {
                const details = [...new Set(catalog.filter(product => product.category === id)
                  .map(product => product.detail))].slice(0, 3);
                return (
                  <li key={id}>
                    <Link className="nav-products-category" href={{ pathname: '/categories', query: { category: id } }}
                      onClick={closeMenu}>
                      <FontAwesomeIcon icon={icons[id] || faLeaf} />
                      {category.name}
                    </Link>
                    <ul>
                      {details.map(detail => (
                        <li key={detail}>
                          <Link href={{ pathname: '/categories', query: { category: id, detail } }} onClick={closeMenu}>
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
      </details>
    </li>
  );
}
