import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import BottomNavbar from '../../components/modules/BottomNavbar';

export default function StorefrontLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <BottomNavbar />
    </>
  );
}
