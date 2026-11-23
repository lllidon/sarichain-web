import { cookies } from 'next/headers';
import PartnerProfile, { PartnerProfileEditor } from '../../../components/Partners/PartnerProfile';
import PartnerDashboard from '../../../components/Partners/PartnerDashboard';
import { sections } from '../../../components/Partners/workspaceSections';
import { partnerBackend, partnerSessionCookie } from '../../../lib/partnerBackend';

export const metadata = { title: 'فروشندگان و همکاران ساری‌چین', robots: { index: false, follow: true } };

const loginMessages = {
  credentials: 'شماره موبایل یا رمز ورود صحیح نیست.',
  'rate-limit': 'تعداد تلاش‌ها زیاد است. کمی بعد دوباره امتحان کنید.',
  unavailable: 'ارتباط با سامانه برقرار نشد. دوباره تلاش کنید.',
  rejected: 'درخواست ورود از این نشانی پذیرفته نشد. صفحه را دوباره باز کنید.',
};

export default async function PartnersPage({ searchParams }) {
  const { login, section: selected, page: requestedPage, result: feedback } = await searchParams;
  const section = typeof selected === 'string' && Object.hasOwn(sections, selected) ? selected : 'overview';
  const page = typeof requestedPage === 'string' && /^[1-9]\d{0,3}$/.test(requestedPage) ? Number(requestedPage) : 1;
  if (typeof login === 'string' && Object.hasOwn(loginMessages, login)) {
    return <PartnerProfile initialMessage={loginMessages[login]} />;
  }
  const token = (await cookies()).get(partnerSessionCookie)?.value;
  if (!token) return <PartnerProfile />;

  let profile;
  try {
    const result = await partnerBackend('/web/profile', { token });
    if (result.status === 401) return <PartnerProfile initialMessage="نشست پایان یافته است. دوباره وارد شوید." />;
    if (result.ok) profile = await result.json();
  } catch {
    // The login form offers a way to retry when the backend is unavailable.
  }
  if (!profile) return <PartnerProfile initialMessage="دریافت پروفایل انجام نشد. دوباره تلاش کنید." />;

  let data;
  const isList = section !== 'overview' && section !== 'profile';
  if (isList) {
    try {
      const path = section === 'orders' ? '/web/orders' : '/web/workspace/' + section;
      const result = await partnerBackend(path, { token, query: new URLSearchParams({ page, limit: 10 }).toString() });
      if (result.status === 401) return <PartnerProfile initialMessage="نشست پایان یافته است. دوباره وارد شوید." />;
      if (result.ok) data = await result.json();
    } catch {
      // Navigation remains usable if the selected section is unavailable.
    }
  }
  return <PartnerDashboard profile={profile} section={section} data={data} page={page} result={feedback} unavailable={isList && !data}>
    {section === 'profile' && <PartnerProfileEditor initialProfile={profile} />}
  </PartnerDashboard>;
}
