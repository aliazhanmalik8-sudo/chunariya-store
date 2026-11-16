import { useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { WishlistPage } from './pages/WishlistPage';
import { AboutPage, ContactPage, PolicyPage } from './pages/InfoPages';
import { AdminDashboard } from './pages/AdminDashboard';

function StorefrontRouter() {
  const { currentPath, settings } = useStore();
  const cleanPath = currentPath.split('?')[0].replace(/\/+$/, '') || '/';

  useEffect(() => {
    const titleMap: Record<string, string> = {
      '/': `${settings.storeName} — ${settings.tagline}`,
      '/shop': `All Products | ${settings.storeName}`,
      '/new-arrivals': `New Arrivals | ${settings.storeName}`,
      '/best-sellers': `Best Sellers | ${settings.storeName}`,
      '/sale': `Special Offers & Sale | ${settings.storeName}`,
      '/cart': `Shopping Cart | ${settings.storeName}`,
      '/checkout': `WhatsApp Checkout | ${settings.storeName}`,
      '/wishlist': `Wishlist | ${settings.storeName}`,
      '/about': `About Us | ${settings.storeName}`,
      '/contact': `Contact Us | ${settings.storeName}`,
      '/faq': `FAQ | ${settings.storeName}`,
      '/shipping-policy': `Shipping Policy | ${settings.storeName}`,
      '/return-policy': `Return & Exchange Policy | ${settings.storeName}`,
      '/privacy-policy': `Privacy Policy | ${settings.storeName}`,
      '/terms': `Terms & Conditions | ${settings.storeName}`,
      '/admin': `Admin Dashboard | ${settings.storeName}`,
    };

    if (!cleanPath.startsWith('/product/')) {
      document.title = titleMap[cleanPath] || `${settings.storeName} — ${settings.tagline}`;
    }
  }, [cleanPath, settings.storeName, settings.tagline]);

  if (cleanPath === '/admin') {
    return <AdminDashboard />;
  }

  let pageContent: React.ReactNode = <HomePage />;

  if (cleanPath === '/') {
    pageContent = <HomePage />;
  } else if (cleanPath === '/shop') {
    pageContent = <CatalogPage mode="all" />;
  } else if (cleanPath === '/new-arrivals') {
    pageContent = <CatalogPage mode="new-arrivals" />;
  } else if (cleanPath === '/best-sellers') {
    pageContent = <CatalogPage mode="best-sellers" />;
  } else if (cleanPath === '/sale') {
    pageContent = <CatalogPage mode="sale" />;
  } else if (cleanPath === '/search') {
    pageContent = <CatalogPage mode="search" />;
  } else if (cleanPath.startsWith('/collections/')) {
    const slug = cleanPath.replace('/collections/', '');
    pageContent = <CatalogPage mode="category" categorySlug={slug} />;
  } else if (cleanPath.startsWith('/product/')) {
    const slug = cleanPath.replace('/product/', '');
    pageContent = <ProductDetailPage slug={slug} />;
  } else if (cleanPath === '/cart') {
    pageContent = <CartPage />;
  } else if (cleanPath === '/checkout') {
    pageContent = <CheckoutPage />;
  } else if (cleanPath === '/wishlist') {
    pageContent = <WishlistPage />;
  } else if (cleanPath === '/about') {
    pageContent = <AboutPage />;
  } else if (cleanPath === '/contact') {
    pageContent = <ContactPage />;
  } else if (cleanPath === '/faq') {
    pageContent = <PolicyPage type="faq" />;
  } else if (cleanPath === '/shipping-policy') {
    pageContent = <PolicyPage type="shipping" />;
  } else if (cleanPath === '/return-policy') {
    pageContent = <PolicyPage type="return" />;
  } else if (cleanPath === '/privacy-policy') {
    pageContent = <PolicyPage type="privacy" />;
  } else if (cleanPath === '/terms') {
    pageContent = <PolicyPage type="terms" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FCF9F6] text-[#23191B]">
      <Header />
      <main className="flex-1">{pageContent}</main>
      <Footer />
      <CartDrawer />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <StorefrontRouter />
    </StoreProvider>
  );
}
