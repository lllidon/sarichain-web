export const sellerPreview = [
  { id: 'sari', name: 'باغداران ساری', city: 'ساری', distance: 4.2, quality: 91, grade: 'درجه یک', oversight: 94, rating: 4.7, reviews: 41 },
  { id: 'joybar', name: 'تعاونی محلی جویبار', city: 'جویبار', distance: 9.8, quality: 96, grade: 'ممتاز', oversight: 86, rating: 4.9, reviews: 58 },
  { id: 'babol', name: 'تأمین سبز بابل', city: 'بابل', distance: 15.5, quality: 86, grade: 'درجه دو', oversight: 97, rating: 4.5, reviews: 32 },
];

export const sellerSorting = {
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

export function rankSellers(priority) {
  return [...sellerPreview].sort((a, b) => {
    if (priority === 'distance') return a.distance - b.distance;
    if (priority !== 'score') return b[priority] - a[priority];
    return scores(b) - scores(a);
  });
}
