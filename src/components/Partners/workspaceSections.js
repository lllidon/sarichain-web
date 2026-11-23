export const sections = {
  overview: { label: 'داشبورد', icon: 'grid' },
  orders: { label: 'سفارش‌های جاری من', icon: 'orders' },
  products: { label: 'محصولات من', icon: 'products', entry: 'عرضهٔ محصول' },
  transport: { label: 'حمل‌ونقل من', icon: 'transport', entry: 'درخواست حمل',
    help: 'درخواست‌های شخصی حمل‌ونقل را اینجا نگه دارید.', placeholder: 'مبدأ، مقصد، نوع بار و زمان پیشنهادی' },
  bulletin: { label: 'بولتن حمل‌ونقل', icon: 'bulletin', entry: 'آگهی حمل',
    help: 'آگهی برای همکاران واردشده قابل مشاهده است. شماره تماس یا نشانی دقیق را در متن نگذارید.', placeholder: 'شهر مبدأ و مقصد، نوع بار و زمان حمل' },
  orchards: { label: 'باغ‌های من', icon: 'orchards', entry: 'باغ',
    help: 'مشخصات باغ‌های خود را در حساب ثبت کنید.', placeholder: 'شهر، مساحت و محصول اصلی' },
  advisory: { label: 'مشاوره کسب‌وکار', icon: 'advisory', entry: 'درخواست مشاوره',
    help: 'موضوعی را که برای آن به مشاوره نیاز دارید ثبت کنید.', placeholder: 'هدف و پرسش اصلی شما' },
  profile: { label: 'ویرایش اطلاعات', icon: 'profile' },
};

export function partnerHref(section) {
  return section === 'overview' ? '/partners' : '/partners?section=' + section;
}
