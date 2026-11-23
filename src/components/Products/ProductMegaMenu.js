'use client';

import { useEffect, useRef } from 'react';
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

  useEffect(() => {
    function closeOutside(event) {
      if (!menu.current.contains(event.target)) menu.current.open = false;
    }

    function closeOnEscape(event) {
      if (event.key !== 'Escape' || !menu.current.open) return;
      const restoreFocus = menu.current.contains(document.activeElement);
      menu.current.open = false;
      if (restoreFocus) menu.current.querySelector('summary').focus();
    }

    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  function closeMenu() {
    menu.current.open = false;
  }

  return (
    <li className="nav-item nav-products">
      <details className="nav-products-disclosure" ref={menu} suppressHydrationWarning>
        <summary className="nav-link nav-products-toggle" aria-controls="nav-products-panel">
          محصولات <FontAwesomeIcon icon={faChevronDown} />
        </summary>
        <div className="nav-products-panel" id="nav-products-panel">
          <div className="nav-products-inner">
            <div className="nav-products-heading">
              <h2>دسته‌بندی محصولات</h2>
              <Link href="/partners" onClick={closeMenu}>همکاری فروشندگان</Link>
              <Link href="/categories" onClick={closeMenu}>
                مشاهده کاتالوگ <FontAwesomeIcon icon={faArrowLeft} />
              </Link>
            </div>

            <ul className="nav-products-grid">
              {Object.entries(categories).map(([id, category]) => {
                const details = [...new Set(catalog.filter(product => product.category === id && product.orderable)
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
