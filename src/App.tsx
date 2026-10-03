import { StoreProvider, useStore } from './store';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MobileNav } from './components/MobileNav';
import { CartPanel } from './components/CartPanel';
import { ToastContainer } from './components/Toast';
import { HomePage } from './components/HomePage';
import { CatalogPage } from './components/CatalogPage';
import { ProductDetail } from './components/ProductDetail';
import { CheckoutPage } from './components/CheckoutPage';
import { AccountPage } from './components/AccountPage';
import { DealsPage } from './components/DealsPage';
import { RecipesPage } from './components/RecipesPage';
import { PrivacyPage } from './components/PrivacyPage';

function PageContent() {
  const { page } = useStore();

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
    case 'recipes':
      return <RecipesPage />;
    case 'privacy':
      return <PrivacyPage />;
    case 'cart':
      return <CheckoutPage />;
    default:
      return <HomePage />;
  }
}

function AppShell() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 pb-16 md:pb-0">
        <PageContent />
      </main>
      <Footer />
      <MobileNav />
      <CartPanel />
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
