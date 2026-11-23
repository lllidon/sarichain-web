import CartPage from '../../../components/modals/CartPage';

export const metadata = { title: 'سبد خرید', robots: { index: false } };

const notices = {
  unavailable: 'دریافت کالا انجام نشد. دوباره تلاش کنید.',
  rejected: 'درخواست سبد خرید معتبر نبود.',
  limit: 'سقف خرید این محصول یا تعداد اقلام سبد تکمیل شده است.',
};

export default async function Page({ searchParams }) {
  const { notice } = await searchParams;
  const initialMessage = typeof notice === 'string' && Object.hasOwn(notices, notice) ? notices[notice] : '';
  return <CartPage initialMessage={initialMessage} />;
}
