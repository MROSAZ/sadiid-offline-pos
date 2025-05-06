import React from 'react';
import { Outlet } from 'react-router-dom';
import { BusinessSettingsProvider } from '@/context/BusinessSettingsContext';
import { CartProvider } from '@/context/CartContext';
import { CustomerProvider } from '@/context/CustomerContext';
import Layout from './Layout';

/**
 * ProtectedLayout wraps authenticated routes with business-specific providers
 * This ensures these providers are only mounted for authenticated users
 * and prevents unnecessary rendering/loading on the login page
 */
const ProtectedLayout: React.FC = () => {
  return (
    <BusinessSettingsProvider>
      <CartProvider>
        <CustomerProvider>
          <Layout>
            <Outlet />
          </Layout>
        </CustomerProvider>
      </CartProvider>
    </BusinessSettingsProvider>
  );
};

export default ProtectedLayout;