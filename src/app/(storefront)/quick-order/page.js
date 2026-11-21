import QuickOrder from '../../../components/Cart/QuickOrder';

export const metadata = { title: 'ثبت سفارش سریع' };

export default async function Page({ searchParams }) {
  const { product } = await searchParams;
  const initialCode = typeof product === 'string' && /^\d{4}$/.test(product) ? product : '';
  return <QuickOrder key={initialCode} initialCode={initialCode} />;
}
