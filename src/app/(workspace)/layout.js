import Image from 'next/image';
import Link from 'next/link';
import '../../components/Partners/PartnerDashboard.css';

export default function WorkspaceLayout({ children }) {
  return <div className="partner-workspace">
    <header className="partner-workspace-header">
      <Link href="/partners" className="partner-workspace-brand">
        <Image src="/img/logoSite.png" width={98} height={42} alt="" unoptimized />
        <span>پنل همکاران</span>
      </Link>
      <div className="partner-workspace-links"><Link href="/pilot">پیش‌نمایش پایلوت</Link><Link href="/">بازگشت به سایت</Link></div>
    </header>
    <main>{children}</main>
  </div>;
}
