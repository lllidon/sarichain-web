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
  { id: 9, code: '1009', name: 'پتاسیم بالا', category: 'specialty', price: 220000, unit: 'لیتر', stock: 30, detail: 'پتاسیم', form: 'مایع' },
  { id: 10, code: '1010', name: 'کلسیم بور', category: 'specialty', price: 195000, unit: 'لیتر', stock: 45, detail: 'کلسیم و بور', form: 'مایع' },
];

export function productImage(product) {
  return product.image ? `/img/catalog/${product.image}.webp` : null;
}
