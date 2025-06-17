
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import ViewportContainer from '@/components/layouts/ViewportContainer';
import { syncDataOnLogin, startBackgroundSync } from '../services/syncService';
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
    setSyncing(true);
    try {
      // Always perform sync operation - let the sync service handle network checks
      const result = await syncDataOnLogin(true); // Force sync with toasts
      if (result) {
        toast.success('Data synced successfully');
        await loadStats();
      } else {
        // If offline, still show positive feedback since data will sync when online
        if (!isOnline) {
          toast.info('You are offline. Data will sync automatically when connection is restored.');
        } else {
          toast.error('Sync failed');
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
      if (!isOnline) {
        toast.info('You are offline. Data will sync automatically when connection is restored.');
      } else {
        toast.error('Failed to sync data');
      }
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
    <ViewportContainer>
      {/* Header Section - Fixed */}
      <div className="viewport-header mb-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <Button 
            onClick={handleSync} 
            disabled={syncing || !isOnline}
            className="bg-sadiid-600 hover:bg-sadiid-700"
          >
            {syncing ? 'Syncing...' : 'Sync Data'}
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="space-y-6">
          {/* Network Status Card */}
          <div>
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
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Sync Queue Status</CardTitle>
                  <CardDescription>Status of operations waiting to be synchronized</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-4 gap-4">
                  <div className="flex flex-col items-center p-3 bg-gray-50 rounded-md">
                    <Badge variant="outline" className="mb-2">
                      {queueStats.pending} Pending
                    </Badge>
                    <span className="text-sm text-gray-500">Waiting to sync</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-blue-50 rounded-md">
                    <Badge variant="default" className="mb-2 bg-blue-600">
                      {queueStats.processing} Processing
                    </Badge>
                    <span className="text-sm text-gray-500">Currently syncing</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-red-50 rounded-md">
                    <Badge variant="destructive" className="mb-2">
                      {queueStats.failed} Failed
                    </Badge>
                    <span className="text-sm text-gray-500">Sync errors</span>
                  </div>
                  <div className="flex flex-col items-center p-3 bg-green-50 rounded-md">
                    <Badge variant="secondary" className="mb-2 bg-green-600 text-white">
                      {queueStats.completed} Completed
                    </Badge>
                    <span className="text-sm text-gray-500">Successfully synced</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <div>
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
      </ScrollArea>
    </ViewportContainer>
  );
};

export default Dashboard;
