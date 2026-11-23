import { cookies } from 'next/headers';
import { cartCookie, parseCart } from '../../components/Products/cartData';
import { partnerSessionCookie } from '../../lib/partnerBackend';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import BottomNavbar from '../../components/modules/BottomNavbar';

import { readCatalog } from '../../components/Products/catalog-data';
import { CatalogProvider } from '../../components/Products/CatalogProvider';

export default async function StorefrontLayout({ children }) {
  const [catalog, jar] = await Promise.all([readCatalog(), cookies()]);
  const session = jar.has(partnerSessionCookie);
  const initialCart = parseCart(jar.get(cartCookie)?.value);
  return (
    <CatalogProvider value={{ ...catalog, initialCart }}>
      <Navbar session={session} />
      <main>{children}</main>
      <Footer />
      <BottomNavbar session={session} />
    </CatalogProvider>
  );
}
