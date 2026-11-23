const number = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 6 });
export const zeroPrice = { min: 0, max: 0 };

export function catalogPrice(price) {
  if (!Number.isFinite(price?.min) || !Number.isFinite(price?.max) || price.min < 0 || price.max < price.min) return zeroPrice;
  return { min: price.min, max: price.max };
}

export function formatPrice(price) {
  const { min, max } = catalogPrice(price);
  return (min === max ? number.format(min) : `${number.format(min)} تا ${number.format(max)}`) + ' کارسا';
}

export function scalePrice(price, quantity) {
  const { min, max } = catalogPrice(price);
  return { min: Math.round(min * 1e6) * quantity / 1e6, max: Math.round(max * 1e6) * quantity / 1e6 };
}

export function sumPrices(prices) {
  const sum = prices.reduce((total, price) => ({
    min: total.min + Math.round(price.min * 1e6),
    max: total.max + Math.round(price.max * 1e6),
  }), zeroPrice);
  return { min: sum.min / 1e6, max: sum.max / 1e6 };
}
