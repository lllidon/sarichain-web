import { cookies } from 'next/headers';
import { cartCookie, parseCart } from '../../components/Products/cartData';
import { readAccountCart } from '../../lib/accountCart';
import { readAccountWeeklyBasket } from '../../lib/accountWeeklyBasket';
import { readAccountMenu } from '../../lib/accountMenu';
import { AccountCartProvider } from '../../components/modals/AccountCartProvider';
import { AccountWeeklyBasketProvider } from '../../components/modals/AccountWeeklyBasketProvider';
import { partnerSessionCookie } from '../../lib/partnerBackend';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import BottomNavbar from '../../components/modules/BottomNavbar';

import { readCatalog } from '../../components/Products/catalog-data';
import { CatalogProvider } from '../../components/Products/CatalogProvider';

export default async function StorefrontLayout({ children }) {
  const jar = await cookies();
  const token = jar.get(partnerSessionCookie)?.value;
  const [catalog, accountCart, weeklyBasket, accountMenu] = await Promise.all([
    readCatalog(),
    token ? readAccountCart(token) : null,
    token ? readAccountWeeklyBasket(token) : null,
    token ? readAccountMenu(token) : null,
  ]);
  const session = Boolean(accountMenu?.profile);
  const initialCart = parseCart(jar.get(cartCookie)?.value);
  return (
    <AccountCartProvider initial={accountCart}>
      <AccountWeeklyBasketProvider initial={weeklyBasket}>
      <CatalogProvider value={{ ...catalog, initialCart }}>
        <Navbar session={session} profile={accountMenu?.profile} wallet={accountMenu?.wallet} />
        <main>{children}</main>
        <Footer />
        <BottomNavbar session={session} profile={accountMenu?.profile} wallet={accountMenu?.wallet} />
      </CatalogProvider>
      </AccountWeeklyBasketProvider>
    </AccountCartProvider>
  );
}
