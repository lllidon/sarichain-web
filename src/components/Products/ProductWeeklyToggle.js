'use client';

import { useAccountWeeklyBasket } from '../modals/AccountWeeklyBasketProvider';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faListCheck, faListUl } from '@fortawesome/free-solid-svg-icons';

export default function ProductWeeklyToggle({ productId, productName, className = '' }) {
  const weekly = useAccountWeeklyBasket();
  const selected = Boolean(weekly?.items?.some(item => item.productId === productId));

  async function toggle(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!weekly) {
      const returnTo = window.location.pathname + window.location.search;
      window.location.assign('/login?returnTo=' + encodeURIComponent(returnTo));
      return;
    }
    try {
      if (selected) await weekly.remove(productId);
      else await weekly.add(productId, 1);
    } catch {
      // Keep the current selection visible; the shared basket provider exposes the error state.
    }
  }

  return <button
    type="button"
    className={`product-weekly-toggle ${selected ? 'is-selected' : ''} ${className}`}
    title={selected ? 'حذف از سبد هفتگی' : 'افزودن به سبد هفتگی'}
    aria-label={selected ? `حذف ${productName} از سبد هفتگی` : `افزودن ${productName} به سبد هفتگی`}
    aria-pressed={selected}
    disabled={Boolean(weekly?.pending)}
    onClick={toggle}
  ><FontAwesomeIcon icon={selected ? faListCheck : faListUl} /></button>;
}
