'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faChevronDown, faLeaf } from '@fortawesome/free-solid-svg-icons';
import { useCatalog } from './CatalogProvider';
import { cheapestVariant, productHref, productImage } from './catalog';
import ProductPurchase from './ProductPurchase';

const fallbackImage = '/img/catalog/field.webp';
const fallbackBrandImage = '/img/sarichain-icon.svg';
const imageSource = value => value?.startsWith('/catalog-demo/') ? '/web' + value : value || fallbackImage;

export default function ProductMegaMenu() {
  const { catalog = [], categories = {}, brands = [] } = useCatalog();
  const menu = useRef(null);
  const timer = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');

  const roots = useMemo(() => Object.entries(categories)
    .filter(([, category]) => !category.parentId)
    .map(([id, category]) => ({ id, ...category })), [categories]);

  const selectedRoot = roots.find(item => item.id === activeCategory) || roots[0];
  const descendants = useMemo(() => {
    if (!selectedRoot) return [];
    const children = Object.entries(categories).filter(([, category]) => category.parentId === selectedRoot.id);
    return children.slice(0, 4).map(([id, category]) => ({
      id, ...category,
      children: Object.entries(categories).filter(([, child]) => child.parentId === id)
        .map(([childId, child]) => ({ id: childId, ...child })),
    }));
  }, [categories, selectedRoot]);

  const relatedProducts = useMemo(() => {
    if (!selectedRoot) return [];
    const ids = new Set([selectedRoot.id, ...descendants.flatMap(child => [child.id, ...child.children.map(item => item.id)])]);
    return catalog.filter(product => ids.has(product.category))
      .map(product => ({ product, listing: cheapestVariant(product) }))
      .sort((a, b) => Number(Boolean(b.listing.offer && b.listing.orderable)) - Number(Boolean(a.listing.offer && a.listing.orderable)))
      .slice(0, 6);
  }, [catalog, descendants, selectedRoot]);

  const categoryCounts = useMemo(() => {
    const counts = new Map();
    for (const product of catalog) {
      let current = product.category;
      for (let depth = 0; current && depth < 3; depth++) {
        counts.set(current, (counts.get(current) || 0) + 1);
        current = categories[current]?.parentId;
      }
    }
    return counts;
  }, [catalog, categories]);

  useEffect(() => {
    function closeOutside(event) {
      if (!menu.current?.contains(event.target)) { if (menu.current) menu.current.open = false; setIsOpen(false); }
    }
    function closeOnEscape(event) {
      if (event.key !== 'Escape' || !menu.current?.open) return;
      const restoreFocus = menu.current.contains(document.activeElement);
      menu.current.open = false;
      setIsOpen(false);
      if (restoreFocus) menu.current.querySelector('summary')?.focus();
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
    if (menu.current) menu.current.open = false;
    setIsOpen(false);
  }
  function openOnHover() {
    if (timer.current) clearTimeout(timer.current);
    if (window.innerWidth > 992) {
      if (menu.current) menu.current.open = true;
      setIsOpen(true);
      setActiveCategory(current => current || roots[0]?.id || '');
    }
  }
  function closeOnLeave() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (menu.current) menu.current.open = false;
      setIsOpen(false);
    }, 220);
  }

  return (
    <li className="nav-item nav-products" onMouseEnter={openOnHover} onMouseLeave={closeOnLeave} onFocus={openOnHover}>
      <details className="nav-products-disclosure" ref={menu} open={isOpen}
        onToggle={event => setIsOpen(event.currentTarget.open)} suppressHydrationWarning>
        <summary className="nav-link nav-products-toggle" aria-controls="nav-products-panel"
          onClick={event => {
            if (window.innerWidth > 992) {
              event.preventDefault();
              const next = !menu.current.open;
              menu.current.open = next;
              setIsOpen(next);
              if (next) setActiveCategory(current => current || roots[0]?.id || '');
            }
          }}>
          محصولات <FontAwesomeIcon icon={faChevronDown} />
        </summary>
        <div className="nav-products-panel" id="nav-products-panel" onMouseEnter={openOnHover} onMouseLeave={closeOnLeave}>
          <div className="nav-products-inner">
            <aside className="nav-products-sidebar" aria-label="دسته‌بندی محصولات">
              <div className="nav-products-sidebar-title">دسته‌بندی محصولات</div>
              {roots.map(category => (
                <button key={category.id} type="button" className={selectedRoot?.id === category.id ? 'is-active' : ''}
                  onMouseEnter={() => setActiveCategory(category.id)} onFocus={() => setActiveCategory(category.id)}
                  onClick={() => setActiveCategory(category.id)}>
                  <Image src={imageSource(category.image)} alt="" width={42} height={42} unoptimized />
                  <span>{category.name}</span>
                  <small>{(categoryCounts.get(category.id) || 0).toLocaleString('fa-IR')}</small>
                </button>
              ))}
              <Link className="nav-products-all" href="/categories" onClick={closeMenu}>همه محصولات <FontAwesomeIcon icon={faArrowLeft} /></Link>
            </aside>

            <section className="nav-products-content" aria-label={selectedRoot ? selectedRoot.name : 'محصولات'}>
              {selectedRoot ? <>
                <header className="nav-products-heading">
                  <div>
                    <span>دسته منتخب</span>
                    <h2>{selectedRoot.name}</h2>
                  </div>
                  <Link href={{ pathname: '/categories', query: { category: selectedRoot.id } }} onClick={closeMenu}>
                    مشاهده همه <FontAwesomeIcon icon={faArrowLeft} />
                  </Link>
                </header>
                {selectedRoot.description && <p className="nav-products-description">{selectedRoot.description}</p>}
                <div className="nav-products-columns">
                  <div className="nav-products-subcategories">
                    {descendants.map(child => (
                      <section key={child.id}>
                        <Link className="nav-products-category" href={{ pathname: '/categories', query: { category: child.id } }} onClick={closeMenu}>
                          {child.name}
                        </Link>
                        {child.children.slice(0, 3).map(grandchild => (
                          <Link key={grandchild.id} href={{ pathname: '/categories', query: { category: grandchild.id } }} onClick={closeMenu}>
                            {grandchild.name}
                          </Link>
                        ))}
                      </section>
                    ))}
                    {!descendants.length && <p>زیر‌دسته‌ای برای این گروه ثبت نشده است.</p>}
                  </div>

                  <div className="nav-products-featured">
                    <h3>محصولات ویژه این دسته</h3>
                    {relatedProducts.length ? relatedProducts.map(({ product, listing }) => (
                      <article className="nav-products-featured-card" key={product.id}>
                        <Link className="nav-products-featured-image" href={productHref(product)} onClick={closeMenu}>
                          <Image src={productImage(listing)} alt={listing.name} width={68} height={68} unoptimized />
                        </Link>
                        <div className="nav-products-featured-info">
                          <Link className="nav-products-featured-name" href={productHref(product)} onClick={closeMenu}>{product.name}</Link>
                          <ProductPurchase product={listing} className="nav-products-featured-purchase" />
                        </div>
                      </article>
                    )) : <p>محصولی در این دسته ثبت نشده است.</p>}
                    <Link className="nav-products-view-all" href={{ pathname: '/categories', query: { category: selectedRoot.id } }} onClick={closeMenu}>
                      مشاهده همه محصولات این دسته <FontAwesomeIcon icon={faArrowLeft} />
                    </Link>
                  </div>
                </div>
              </> : <p>دسته‌بندی فعالی ثبت نشده است.</p>}

              <div className="nav-products-brands">
                <div className="nav-products-brands-heading">
                  <h3><FontAwesomeIcon icon={faLeaf} /> برندهای محصولات</h3>
                  <Link href="/categories" onClick={closeMenu}>همه برندها</Link>
                </div>
                <div className="nav-products-brand-list">
                  {brands.slice(0, 12).map(brand => (
                    <Link key={brand._id} href={{ pathname: '/categories', query: { brand: brand._id } }} onClick={closeMenu}>
                      <Image src={imageSource(brand.thumbnailUrl || brand.imageUrl || fallbackBrandImage)} alt="" width={30} height={30} unoptimized />
                      <span>{brand.name}</span>
                    </Link>
                  ))}
                  {!brands.length && <span>برندی ثبت نشده است.</span>}
                </div>
              </div>
            </section>
          </div>
        </div>
      </details>
    </li>
  );
}
