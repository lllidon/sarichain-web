import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import BottomNavbar from '../../components/modules/BottomNavbar';

import { readCatalog } from '../../components/Products/catalog-data';
import { CatalogProvider } from '../../components/Products/CatalogProvider';

export default async function StorefrontLayout({ children }) {
  return (
    <CatalogProvider value={await readCatalog()}>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <BottomNavbar />
    </CatalogProvider>
  );
}
