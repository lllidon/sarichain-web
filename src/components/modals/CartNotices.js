import { formatPrice } from '../Products/price';

const price = value => formatPrice({ min: value, max: value });

export default function CartNotices({ changes, busy, acknowledge }) {
  if (!changes.length) return null;
  return <section className="checkout-confirm checkout-notices" aria-labelledby="cart-changes-title">
    <h2 id="cart-changes-title">تغییرات سبد خرید</h2>
    <ul>
      {changes.map(({ name, unitName, notice }) => <li key={notice.id}>
        <strong>{name} · {unitName}</strong>
        <span>{notice.unavailable ? 'موجودی کافی نیست یا عرضه دیگر در دسترس نیست.' :
          notice.previousPrice !== notice.price ? 'قیمت تغییر کرده است.' : 'عرضه دوباره قابل سفارش است.'}</span>
        {notice.previousPrice !== null && <span>قیمت قبلی <del>{price(notice.previousPrice)}</del></span>}
        {notice.price !== null && <span>قیمت فعلی {price(notice.price)}</span>}
      </li>)}
    </ul>
    <button type="button" disabled={busy} onClick={() => acknowledge(changes.map(item => item.notice.id))}>متوجه شدم</button>
  </section>;
}
