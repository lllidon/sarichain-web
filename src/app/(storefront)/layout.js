import { cookies } from 'next/headers';
import { cartCookie, parseCart } from '../../components/Products/cartData';
import { readAccountCart } from '../../lib/accountCart';
import { AccountCartProvider } from '../../components/modals/AccountCartProvider';
import { partnerSessionCookie } from '../../lib/partnerBackend';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import BottomNavbar from '../../components/modules/BottomNavbar';

import { readCatalog } from '../../components/Products/catalog-data';
import { CatalogProvider } from '../../components/Products/CatalogProvider';

export default async function StorefrontLayout({ children }) {
  const jar = await cookies();
  const token = jar.get(partnerSessionCookie)?.value;
  const [catalog, accountCart] = await Promise.all([readCatalog(), token ? readAccountCart(token) : null]);
  const session = Boolean(accountCart);
  const initialCart = parseCart(jar.get(cartCookie)?.value);
  return (
    <AccountCartProvider initial={accountCart}>
      <CatalogProvider value={{ ...catalog, initialCart }}>
        <Navbar session={session} />
        <main>{children}</main>
        <Footer />
        <BottomNavbar session={session} />
      </CatalogProvider>
    </AccountCartProvider>
  );
}
