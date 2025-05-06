import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { syncData } from '../services/syncService';
import { toast } from 'sonner';
import { useNetwork } from '../context/NetworkContext';
import { getProducts, getContacts, getUnSyncedSales } from '../services/storage';

const Dashboard = () => {
  const { isOnline } = useNetwork();
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState({
    products: 0,
    customers: 0,
    pendingSales: 0,
  });
  
  useEffect(() => {
    loadStats();
  }, []);
  
  const loadStats = async () => {
    try {
      const products = await getProducts();
      const contacts = await getContacts();
      const pendingSales = await getUnSyncedSales();
      
      setStats({
        products: products.length,
        customers: contacts.length,
        pendingSales: pendingSales.length,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };
  
  const handleSync = async () => {
    if (!isOnline) {
      toast.error('Cannot sync while offline');
      return;
    }
    
    setSyncing(true);
    try {
      const result = await syncData(true); // Pass true to show toasts
      if (result) {
        toast.success('Data synced successfully');
        await loadStats();
      } else {
        toast.error('Sync failed');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync data');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <Button 
          onClick={handleSync} 
          disabled={syncing || !isOnline}
          className="bg-sadiid-600 hover:bg-sadiid-700"
        >
          {syncing ? 'Syncing...' : 'Sync Data'}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Products</CardTitle>
            <CardDescription>Total products in catalog</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-sadiid-600">{stats.products}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Customers</CardTitle>
            <CardDescription>Total customers in database</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-sadiid-600">{stats.customers}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Pending Sales</CardTitle>
            <CardDescription>Sales waiting to be synced</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-sadiid-600">{stats.pendingSales}</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and actions</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button className="w-full">New Sale</Button>
            <Button variant="outline" className="w-full">Add Customer</Button>
            <Button variant="outline" className="w-full">View Reports</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
