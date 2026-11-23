import { redirect } from 'next/navigation';

export const metadata = {
  title: 'ورود',
  robots: { index: false },
};

export default async function LoginPage({ searchParams }) {
  const { returnTo } = await searchParams;
  redirect(returnTo === 'cart' ? '/partners?returnTo=cart' : '/partners');
}
