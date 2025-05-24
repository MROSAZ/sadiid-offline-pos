
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NetworkProvider } from "./context/NetworkContext";
import { useEffect } from 'react';
import { initDB } from "./services/storage";

// Components
import ProtectedLayout from "./components/layouts/ProtectedLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import POS from "./pages/POS";
import Sales from "./pages/Sales";
import Settings from "./pages/Settings";

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
    <NetworkProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster position="top-right" />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes - wrapped with business-specific providers */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <ProtectedLayout />
                </ProtectedRoute>
              }
            >
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
      </AuthProvider>
    </NetworkProvider>
  );
};

export default App;
