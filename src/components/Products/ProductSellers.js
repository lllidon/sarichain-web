'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardCheck, faLocationDot, faSeedling, faStar, faStore } from '@fortawesome/free-solid-svg-icons';
import { rankSellers, scores, sellerSorting } from './sellerPreview';

const number = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 });

export default function ProductSellers({ hidden, priority, setPriority, selected, selectSeller }) {
  return <section id="product-sellers" className="product-seller-board" aria-labelledby="product-sellers-tab" hidden={hidden}>
    <div className="product-board-heading">
      <div><h2>فروشندگان این محصول</h2><span className="product-example">دادهٔ نمونه · فاصله از مرکز ساری</span></div>
      <label>مرتب‌سازی <select value={priority} onChange={event => setPriority(event.target.value)}>
        {Object.entries(sellerSorting).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select></label>
    </div>
    <details className="seller-ranking-details"><summary>معیار پیشنهاد ساری‌چین</summary>
      <p>فاصله ۳۵٪، کیفیت ۲۵٪، پوشش نظارت ۲۰٪ و امتیاز کاربران ۲۰٪.</p>
    </details>
    <ol className="seller-comparison">
      {rankSellers(priority).map((seller, index) => <li key={seller.id} className={selected.id === seller.id ? 'is-picked' : undefined}>
        <div className="seller-identity">
          <span className="seller-logo"><FontAwesomeIcon icon={faStore} /></span>
          <div><strong>{seller.name}</strong><small>{seller.city} · رتبهٔ {number.format(index + 1)}</small></div>
        </div>
        <dl className="seller-metrics">
          <div><dt><FontAwesomeIcon icon={faLocationDot} /> فاصله</dt><dd>{number.format(seller.distance)} کیلومتر</dd></div>
          <div><dt><FontAwesomeIcon icon={faSeedling} /> کیفیت</dt><dd>{seller.grade} · {number.format(seller.quality)}٪</dd></div>
          <div><dt><FontAwesomeIcon icon={faClipboardCheck} /> پوشش نظارت</dt><dd>{number.format(seller.oversight)}٪</dd></div>
          <div><dt><FontAwesomeIcon icon={faStar} /> کاربران</dt><dd>{number.format(seller.rating)} از ۵ <small>({number.format(seller.reviews)} نظر)</small></dd></div>
        </dl>
        <div className="seller-select">
          <small>امتیاز ترکیبی {number.format(scores(seller))}</small>
          <button type="button" aria-pressed={selected.id === seller.id} onClick={() => selectSeller(seller.id)}>
            {selected.id === seller.id ? 'در کارت خرید' : 'نمایش در کارت خرید'}
          </button>
        </div>
      </li>)}
    </ol>
  </section>;
}
