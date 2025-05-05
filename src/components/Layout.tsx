
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useNetwork } from '../context/NetworkContext';
import { Home, ShoppingCart, ShoppingBag, Package, Users } from 'lucide-react';
import AppInitializer from './AppInitializer';

const navItems = [
  { to: '/dashboard', icon: <Home className="h-6 w-6" />, label: 'Dashboard' },
  { to: '/pos', icon: <ShoppingCart className="h-6 w-6" />, label: 'POS' },
  { to: '/sales', icon: <ShoppingBag className="h-6 w-6" />, label: 'Sales' },
  { to: '/products', icon: <Package className="h-6 w-6" />, label: 'Products' },
  { to: '/customers', icon: <Users className="h-6 w-6" />, label: 'Customers' },
];

const Layout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { isOnline } = useNetwork();

  if (!isAuthenticated) {
    return <Outlet />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <AppInitializer />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar />
        
        {!isOnline && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-amber-500">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-amber-700">
                  You are currently offline. Data will be saved locally and synced when you're back online.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
