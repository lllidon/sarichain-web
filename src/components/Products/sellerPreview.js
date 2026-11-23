// Only comparison metrics are examples. Seller identity and commercial terms come from the offer.
const examples = [
  { distance: 4.2, quality: 91, grade: 'درجه یک', oversight: 94, rating: 4.7, reviews: 41 },
  { distance: 9.8, quality: 96, grade: 'ممتاز', oversight: 86, rating: 4.9, reviews: 58 },
  { distance: 15.5, quality: 86, grade: 'درجه دو', oversight: 97, rating: 4.5, reviews: 32 },
];

export function withExampleMetrics(offers) {
  return offers.map((offer, index) => ({ ...examples[index % examples.length], ...offer }));
}

export const sellerSorting = {
  price: 'کمترین قیمت',
  score: 'پیشنهاد ساری‌چین',
  distance: 'نزدیک‌ترین',
  quality: 'کیفیت بالاتر',
  oversight: 'پوشش نظارت بیشتر',
  rating: 'امتیاز کاربران',
};

export function scores(seller) {
  const proximity = 100 * Math.max(0, 1 - seller.distance / 30);
  return .35 * proximity + .25 * seller.quality + .20 * seller.oversight + .20 * (seller.rating / 5 * 100);
}

export function rankSellers(sellers, priority) {
  return [...sellers].sort((a, b) => {
    if (priority === 'distance' || priority === 'price') return a[priority] - b[priority];
    if (priority !== 'score') return b[priority] - a[priority];
    return scores(b) - scores(a);
  });
}
