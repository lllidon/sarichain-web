export const categories = {
  biostimulant: { name: 'محرک رشد', filter: 'مرحله مصرف' },
  biofertilizer: { name: 'کود زیستی', filter: 'کاربرد اصلی' },
  specialty: { name: 'تغذیه تخصصی', filter: 'ترکیب اصلی' },
  soil: { name: 'بهبوددهنده خاک', filter: 'هدف مصرف' },
};

export const catalog = [
  { id: 1, code: '1001', name: 'بیو بوست پلاس', category: 'biostimulant', price: 250000, unit: 'لیتر', stock: 50, detail: 'رشد رویشی', form: 'مایع', image: 'bio-boost' },
  { id: 2, code: '1002', name: 'روت مکس', category: 'biostimulant', price: 320000, unit: 'کیلوگرم', stock: 35, detail: 'ریشه‌زایی', form: 'پودری', image: 'root-max' },
  { id: 3, code: '1003', name: 'فرایت پرو', category: 'biostimulant', price: 280000, unit: 'لیتر', stock: 28, detail: 'رشد میوه', form: 'مایع', image: 'fruit-pro' },
  { id: 4, code: '1004', name: 'سویل لایف', category: 'soil', price: 350000, unit: 'کیلوگرم', stock: 42, detail: 'فعال‌سازی زیستی خاک', form: 'پودری', image: 'soil-life' },
  { id: 5, code: '1005', name: 'نیتروفیکس', category: 'biofertilizer', price: 290000, unit: 'لیتر', stock: 0, detail: 'تثبیت نیتروژن', form: 'مایع', image: 'nitro-fix' },
  { id: 6, code: '1006', name: 'آمینو گرو', category: 'specialty', price: 380000, unit: 'لیتر', stock: 22, detail: 'اسید آمینه', form: 'مایع', image: 'amino-grow' },
  { id: 7, code: '1007', name: 'هیومیک اسید', category: 'soil', price: 180000, unit: 'کیلوگرم', stock: 60, detail: 'بهبود ساختار خاک', form: 'پودری', image: 'humic-acid' },
  { id: 8, code: '1008', name: 'سی ویند', category: 'specialty', price: 420000, unit: 'لیتر', stock: 0, detail: 'عصاره جلبک', form: 'مایع', image: 'sea-wind' },
  { id: 9, code: '1009', name: 'پتاسیم بالا', category: 'specialty', price: 220000, unit: 'لیتر', stock: 30, detail: 'پتاسیم', form: 'مایع', image: 'potash' },
  { id: 10, code: '1010', name: 'کلسیم بور', category: 'specialty', price: 195000, unit: 'لیتر', stock: 45, detail: 'کلسیم و بور', form: 'مایع', image: 'cal-bor' },
  { id: 11, code: '1011', name: 'عصاره کلپ', category: 'biostimulant', price: 310000, unit: 'لیتر', stock: 33, detail: 'مقاومت به تنش', form: 'مایع', image: 'kelp' },
  { id: 12, code: '1012', name: 'بلوم اکتیو', category: 'biostimulant', price: 275000, unit: 'لیتر', stock: 0, detail: 'گل‌دهی', form: 'مایع', image: 'bloom' },
  { id: 13, code: '1013', name: 'فسفو بیو', category: 'biofertilizer', price: 240000, unit: 'کیلوگرم', stock: 38, detail: 'آزادسازی فسفر', form: 'پودری', image: 'phos-bio' },
  { id: 14, code: '1014', name: 'روت بیو', category: 'biofertilizer', price: 335000, unit: 'لیتر', stock: 21, detail: 'تقویت میکروبی ریشه', form: 'مایع', image: 'root-bio' },
  { id: 15, code: '1015', name: 'کمپوست غنی', category: 'soil', price: 150000, unit: 'کیلوگرم', stock: 48, detail: 'افزایش ماده آلی', form: 'پودری', image: 'compost' },
  { id: 16, code: '1016', name: 'بیوچار', category: 'soil', price: 210000, unit: 'کیلوگرم', stock: 0, detail: 'حفظ رطوبت خاک', form: 'پودری', image: 'biochar' },
  { id: 17, code: '1017', name: 'آهن کلاته', category: 'specialty', price: 265000, unit: 'لیتر', stock: 31, detail: 'آهن', form: 'مایع', image: 'iron' },
  { id: 18, code: '1018', name: 'روی مایع', category: 'specialty', price: 230000, unit: 'لیتر', stock: 25, detail: 'روی', form: 'مایع', image: 'zinc' },
  { id: 19, code: '1019', name: 'سیلیکا پلاس', category: 'specialty', price: 385000, unit: 'لیتر', stock: 22, detail: 'سیلیسیم', form: 'مایع', image: 'silica' },
  { id: 20, code: '1020', name: 'گچ کشاورزی', category: 'soil', price: 130000, unit: 'کیلوگرم', stock: 0, detail: 'اصلاح خاک شور', form: 'پودری', image: 'gypsum' },
];

export function productImage(product) {
  return product.image ? `/img/catalog/${product.image}.webp` : null;
}

const packaging = {
  bottle: { name: 'بطری', amount: 1 },
  bag: { name: 'کیسه', amount: 1 },
  box: { name: 'جعبه', amount: 4 },
  carton: { name: 'کارتن', amount: 6 },
  jug: { name: 'گالن', amount: 5 },
};

const packageCodes = {
  '1001': ['bottle', 'carton'],
  '1002': ['bag', 'box'],
  '1003': ['bottle', 'carton'],
  '1004': ['bag', 'box'],
  '1005': ['bottle', 'carton'],
  '1006': ['bottle', 'carton'],
  '1007': ['bag', 'box'],
  '1008': ['bottle', 'jug'],
};

export function productPackages(product) {
  return (packageCodes[product.code] ?? (product.form === 'پودری' ? ['bag', 'box'] : ['bottle', 'carton'])).map(id => ({
    id,
    ...packaging[id],
    price: product.price * packaging[id].amount,
  }));
}
