export const sections = {
  overview: { label: 'داشبورد', icon: 'grid' },
  wallet: { label: 'کیف پول کارسا', icon: 'wallet' },
  orders: { label: 'خریدهای من', icon: 'orders' },
  fulfillment: { label: 'سفارش‌های قابل پردازش', icon: 'fulfillment' },
  products: { label: 'محصولات من', icon: 'products', entry: 'عرضهٔ محصول' },
  bulletin: { label: 'بولتن حمل‌ونقل', icon: 'bulletin', entry: 'آگهی حمل',
    help: 'آگهی برای همکاران واردشده قابل مشاهده است. شماره تماس یا نشانی دقیق را در متن نگذارید.', placeholder: 'شهر مبدأ و مقصد، نوع بار و زمان حمل' },
  orchards: { label: 'موقعیت‌های مکانی من', icon: 'orchards', entry: 'موقعیت مکانی' },
  advisory: { label: 'مشاوره کسب‌وکار', icon: 'advisory', entry: 'درخواست مشاوره',
    help: 'موضوعی را که برای آن به مشاوره نیاز دارید ثبت کنید.', placeholder: 'هدف و پرسش اصلی شما' },
  profile: { label: 'پروفایل من', icon: 'profile' },
};

export const locationTypes = {
  orchard: 'باغ', farmland: 'زمین کشاورزی', greenhouse: 'گلخانه',
  nursery: 'نهالستان', warehouse: 'انبار', other: 'سایر',
};

export function partnerHref(section) {
  return section === 'overview' ? '/partners' : '/partners?section=' + section;
}
