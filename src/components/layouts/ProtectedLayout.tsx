
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { BusinessSettingsProvider } from '@/context/BusinessSettingsContext';
import { CartProvider } from '@/context/CartContext';
import { CustomerProvider } from '@/context/CustomerContext';

const ProtectedLayout = () => {
  return (
    <BusinessSettingsProvider>
      <CartProvider>
        <CustomerProvider>
          <div className="flex h-screen bg-gray-50 overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-0">
              <Header />
              <main className="flex-1 overflow-hidden">
                <Outlet />
              </main>
            </div>
          </div>
        </CustomerProvider>
      </CartProvider>
    </BusinessSettingsProvider>
  );
};

export default ProtectedLayout;
