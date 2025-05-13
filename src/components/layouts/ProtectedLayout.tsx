
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
          <div className="flex h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-auto p-4">
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
