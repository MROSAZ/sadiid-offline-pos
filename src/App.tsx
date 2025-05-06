import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NetworkProvider } from "./context/NetworkContext";
import { CartProvider } from "./context/CartContext";
import { CustomerProvider } from './context/CustomerContext';
import { RepositoryProvider } from './context/RepositoryContext';
import { useEffect } from 'react';
import { initDB } from "./services/storage";

// Components
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedLayout from "./components/ProtectedLayout";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import POS from "./pages/POS";
import Sales from "./pages/Sales";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Initialize the IndexedDB database
    const setupDB = async () => {
      try {
        await initDB();
        console.log('IndexedDB initialized successfully');
      } catch (error) {
        console.error('Error initializing IndexedDB:', error);
      }
    };
    
    setupDB();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <NetworkProvider>
            <RepositoryProvider>
              <TooltipProvider>
                <Toaster />
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<Login />} />
                  
                  {/* Protected routes - wrapped with business-specific providers */}
                  <Route path="/" element={
                    <ProtectedRoute>
                      <CartProvider>
                        <CustomerProvider>
                          <ProtectedLayout />
                        </CustomerProvider>
                      </CartProvider>
                    </ProtectedRoute>
                  }>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="products" element={<Products />} />
                    <Route path="customers" element={<Customers />} />
                    <Route path="pos" element={<POS />} />
                    <Route path="sales" element={<Sales />} />
                    <Route path="settings" element={<Settings />} />
                  </Route>
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </TooltipProvider>
            </RepositoryProvider>
          </NetworkProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
