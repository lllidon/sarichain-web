import { cookies } from 'next/headers';
import PartnerProfile from '../../../components/Partners/PartnerProfile';
import { partnerBackend, partnerSessionCookie } from '../../../lib/partnerBackend';

export const metadata = { title: 'فروشندگان و همکاران ساری‌چین', robots: { index: false, follow: true } };

const loginMessages = {
  credentials: 'شماره موبایل یا رمز ورود صحیح نیست.',
  'rate-limit': 'تعداد تلاش‌ها زیاد است. کمی بعد دوباره امتحان کنید.',
  unavailable: 'ارتباط با سامانه برقرار نشد. دوباره تلاش کنید.',
  rejected: 'درخواست ورود از این نشانی پذیرفته نشد. صفحه را دوباره باز کنید.',
};

export default async function PartnersPage({ searchParams }) {
  const { login } = await searchParams;
  if (typeof login === 'string' && Object.hasOwn(loginMessages, login)) {
    return <PartnerProfile initialMessage={loginMessages[login]} />;
  }
  const token = (await cookies()).get(partnerSessionCookie)?.value;
  if (!token) return <PartnerProfile />;

  try {
    const result = await partnerBackend('/web/profile', { token });
    if (result.ok) return <PartnerProfile initialProfile={await result.json()} />;
    if (result.status === 401) return <PartnerProfile initialMessage="نشست پایان یافته است. دوباره وارد شوید." />;
  } catch {
    // Render a recoverable state if the backend is unavailable.
  }
  return <PartnerProfile initialMessage="دریافت پروفایل انجام نشد. دوباره تلاش کنید." />;
}
