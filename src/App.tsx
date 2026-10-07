import { StoreProvider, useStore } from './store';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MobileNav } from './components/MobileNav';
import { CartPanel } from './components/CartPanel';
import { ToastContainer } from './components/Toast';
import { BackToTop } from './components/BackToTop';
import { WhatsAppButton } from './components/WhatsAppButton';
import { TrackOrderPage } from './components/TrackOrderPage';
import { ForgotPasswordPage, ResetPasswordPage } from './components/PasswordReset';
import { HomePage } from './components/HomePage';
import { CatalogPage } from './components/CatalogPage';
import { ProductDetail } from './components/ProductDetail';
import { CheckoutPage } from './components/CheckoutPage';
import { AccountPage } from './components/AccountPage';
import { DealsPage } from './components/DealsPage';
import { RecipesPage } from './components/RecipesPage';
import { PrivacyPage } from './components/PrivacyPage';
import { NewArrivalsPage } from './components/NewArrivalsPage';
import { WishlistPage } from './components/WishlistPage';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { DeliveryPage } from './components/DeliveryPage';
import { StoreInfoPage } from './components/StoreInfoPage';
import { SectionSkeleton } from './components/LoadingState';
import { useEffect, useRef } from 'react';

const BRAND = 'FAMILY CHOICE SUPERMARKET';
function pageTitle(page: ReturnType<typeof useStore>['page']) {
  const names: Record<string, string> = { catalog: 'Shop groceries', product: 'Product details', checkout: 'Checkout', cart: 'Checkout', account: 'My account', deals: 'Deals', 'new-arrivals': 'New arrivals', wishlist: 'Wishlist', recipes: 'Recipes', privacy: 'Privacy notice', track: 'Track order', 'forgot-password': 'Forgot password', 'reset-password': 'Reset password' };
  const info: Record<string, string> = { about: 'About us', delivery: 'Delivery areas', help: 'Help & contact', 'how-it-works': 'How it works' };
  const label = page.name === 'info' ? info[page.section] : names[page.name];
  return label ? `${label} | ${BRAND}` : `${BRAND} | Groceries delivered in Tanzania`;
}

function PageContent() {
  const { page, catalogReady, catalogError, retryCatalog } = useStore();
  const needsCatalog = ['catalog', 'product', 'deals', 'new-arrivals', 'wishlist', 'recipes'].includes(page.name);
  if (needsCatalog && !catalogReady) return <div className="store-container py-8">{catalogError ? <div className="surface p-6"><h1 className="text-2xl font-bold">The catalogue is unavailable</h1><p role="alert" className="my-3">{catalogError}</p><button className="button-primary" onClick={retryCatalog}>Retry catalogue</button></div> : <SectionSkeleton />}</div>;

  switch (page.name) {
    case 'home':
      return <HomePage />;
    case 'catalog':
      return <CatalogPage />;
    case 'product':
      return <ProductDetail />;
    case 'checkout':
      return <CheckoutPage />;
    case 'account':
      return <AccountPage />;
    case 'deals':
      return <DealsPage />;
    case 'new-arrivals':
      return <NewArrivalsPage />;
    case 'wishlist':
      return <WishlistPage />;
    case 'info':
      return page.section === 'about' ? <AboutPage /> : page.section === 'help' ? <ContactPage /> : page.section === 'delivery' ? <DeliveryPage /> : <StoreInfoPage section={page.section} />;
    case 'recipes':
      return <RecipesPage />;
    case 'privacy':
      return <PrivacyPage />;
    case 'track':
      return <TrackOrderPage />;
    case 'forgot-password':
      return <ForgotPasswordPage />;
    case 'reset-password':
      return <ResetPasswordPage token={page.token} email={page.email} />;
    case 'cart':
      return <CheckoutPage />;
    default:
      return <HomePage />;
  }
}

function AppShell() {
  const { page, catalogReady, catalogLoading, catalogError, retryCatalog } = useStore();
  const main = useRef<HTMLElement>(null);
  const previousPage = useRef(page);
  useEffect(() => {
    if (previousPage.current !== page) { main.current?.focus({ preventScroll: true }); previousPage.current = page; }
    document.title = pageTitle(page);
  }, [page]);
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Header />
      <main ref={main} id="main-content" tabIndex={-1} className={`flex-1 pb-16 md:pb-0 ${['catalog','product','deals','new-arrivals','wishlist'].includes(page.name) ? '' : `fc-page fc-page-${page.name}`}`}>
        {catalogReady && catalogError && <div className="store-container py-3" role="status">Catalogue refresh failed. Displaying the last loaded products. <button className="underline" onClick={retryCatalog}>Retry</button></div>}
        {catalogReady && catalogLoading && <div className="store-container py-2 text-sm" role="status">Refreshing products…</div>}
        <PageContent />
      </main>
      <Footer />
      <MobileNav />
      <CartPanel />
      <WhatsAppButton />
      <BackToTop />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
}
