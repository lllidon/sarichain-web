import '@fortawesome/fontawesome-svg-core/styles.css';
import '../App.css';

export const metadata = {
  title: {
    default: 'ساری چین',
    template: '%s | ساری چین',
  },
  description: 'ساری چین، معرفی محصولات و راهکارهای کشاورزی',
  icons: {
    icon: '/img/sarichain-icon.svg',
    apple: '/img/sarichain-icon-180.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <div className="App">{children}</div>
      </body>
    </html>
  );
}
