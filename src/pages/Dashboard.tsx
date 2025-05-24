
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { syncData, startBackgroundSync } from '../services/syncService';
import { getQueueStats } from '@/services/syncQueue';
import { toast } from 'sonner';
import { useNetwork } from '../context/NetworkContext';
import { getProducts, getContacts, getUnSyncedSales } from '@/lib/storage';
import { CheckCircle, AlertCircle, WifiOff, RefreshCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { isOnline, connectionQuality } = useNetwork();
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState({
    products: 0,
    customers: 0,
    pendingSales: 0,
  });
  
  const [queueStats, setQueueStats] = useState({
    pending: 0,
    processing: 0,
    failed: 0,
    completed: 0,
    total: 0
  });
  
  const [lastSync, setLastSync] = useState<string | null>(null);
  
  useEffect(() => {
    loadStats();
    
    // Start background sync
    startBackgroundSync();
    
    // Set up interval to refresh stats
    const interval = setInterval(() => {
      loadStats();
    }, 60000); // Refresh every minute
    
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  useEffect(() => {
    // Load last sync timestamp from localStorage
    const timestamp = localStorage.getItem('last_sync_timestamp');
    if (timestamp) {
      const date = new Date(parseInt(timestamp));
      setLastSync(date.toLocaleString());
    }
  }, [syncing]);
  
  const loadStats = async () => {
    try {
      const products = await getProducts();
      const contacts = await getContacts();
      const pendingSales = await getUnSyncedSales();
      
      setStats({
        products: products?.length || 0,
        customers: contacts?.length || 0,
        pendingSales: pendingSales?.length || 0,
      });
      
      // Load queue stats
      const queue = await getQueueStats();
      setQueueStats(queue);
      
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

  const getNetworkStatusCard = () => {
    if (!isOnline) {
      return (
        <Card className="border-red-300 bg-red-50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <WifiOff className="text-red-500" size={18} />
              <CardTitle className="text-lg font-medium text-red-700">Offline Mode</CardTitle>
            </div>
            <CardDescription className="text-red-600">
              You are currently working offline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-red-800">
              Data will be saved locally and synced when you're back online.
            </p>
          </CardContent>
        </Card>
      );
    }
    
    if (stats.pendingSales > 0) {
      return (
        <Card className="border-amber-300 bg-amber-50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-amber-500" size={18} />
              <CardTitle className="text-lg font-medium text-amber-700">Pending Sync</CardTitle>
            </div>
            <CardDescription className="text-amber-600">
              You have data waiting to be synced
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <p className="text-sm text-amber-800">
                {stats.pendingSales} sales pending synchronization
              </p>
              <Button 
                size="sm" 
                className="bg-amber-600 hover:bg-amber-700"
                onClick={handleSync}
                disabled={syncing}
              >
                Sync Now
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card className="border-green-300 bg-green-50">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-green-500" size={18} />
            <CardTitle className="text-lg font-medium text-green-700">Data Synchronized</CardTitle>
          </div>
          <CardDescription className="text-green-600">
            All data is up to date
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <p className="text-sm text-green-800">
              Last sync: {lastSync || 'Never'}
            </p>
            <Button 
              size="sm" 
              variant="outline"
              className="text-green-700 border-green-700 hover:bg-green-100"
              onClick={handleSync}
              disabled={syncing}
            >
              <RefreshCcw className="mr-1" size={14} /> Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
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
      
      {/* Network Status Card */}
      <div className="mb-8">
        {getNetworkStatusCard()}
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
      
      {/* Sync Queue Stats */}
      {queueStats.total > 0 && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Sync Queue Status</CardTitle>
              <CardDescription>Status of operations waiting to be synchronized</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-4 gap-4">
              <div className="flex flex-col items-center p-3 bg-gray-50 rounded-md">
                <span className="text-lg font-bold text-yellow-600">{queueStats.pending}</span>
                <span className="text-sm text-gray-500">Pending</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-gray-50 rounded-md">
                <span className="text-lg font-bold text-blue-600">{queueStats.processing}</span>
                <span className="text-sm text-gray-500">Processing</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-gray-50 rounded-md">
                <span className="text-lg font-bold text-red-600">{queueStats.failed}</span>
                <span className="text-sm text-gray-500">Failed</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-gray-50 rounded-md">
                <span className="text-lg font-bold text-green-600">{queueStats.completed}</span>
                <span className="text-sm text-gray-500">Completed</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and actions</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button className="w-full" asChild>
              <Link to="/pos">New Sale</Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/customers">Manage Customers</Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/sales">View Sales</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
