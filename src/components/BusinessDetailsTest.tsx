import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { fetchBusinessDetails } from '@/services/api';
import { getBusinessSettings, getDefaultBusinessSettings } from '@/lib/businessSettings';
import { getToken } from '@/lib/storage';
import { useAuth } from '@/context/AuthContext';
import { useNetwork } from '@/context/NetworkContext';
import { syncData, syncDataOnLogin } from '@/services/syncService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const BusinessDetailsTest: React.FC = () => {
  const [apiResult, setApiResult] = useState<any>(null);
  const [settingsResult, setSettingsResult] = useState<any>(null);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<any>(null);
  const { user, isAuthenticated } = useAuth();
  const { isOnline } = useNetwork();

  useEffect(() => {
    // Check authentication status
    const token = getToken();
    setAuthStatus({
      hasToken: !!token,
      token: token ? { ...token, access_token: token.access_token?.substring(0, 20) + '...' } : null,
      isAuthenticated,
      user: user?.name || 'Unknown',
      isOnline: navigator.onLine
    });
  }, [isAuthenticated, user]);

  const testApiCall = async () => {
    try {
      setLoading(true);
      console.log('Testing direct API call...');
      const result = await fetchBusinessDetails();
      setApiResult(result);
      toast.success('API call successful');
      console.log('API result:', result);
    } catch (error) {
      console.error('API call failed:', error);
      toast.error('API call failed: ' + (error as Error).message);
      setApiResult({ error: (error as Error).message, details: error });
    } finally {
      setLoading(false);
    }
  };

  const testBusinessSettings = async () => {
    try {
      setLoading(true);
      console.log('Testing business settings...');
      const result = await getBusinessSettings(true);
      setSettingsResult(result);
      toast.success('Business settings loaded successfully');
      console.log('Business settings result:', result);
    } catch (error) {
      console.error('Business settings failed:', error);
      toast.error('Business settings failed: ' + (error as Error).message);
      setSettingsResult({ error: (error as Error).message, details: error });
    } finally {
      setLoading(false);
    }
  };

  const testDefaultSettings = () => {
    const defaultSettings = getDefaultBusinessSettings();
    setSettingsResult(defaultSettings);
    toast.success('Default settings loaded');
    console.log('Default settings:', defaultSettings);
  };

  const testRegularSync = async () => {
    try {
      setLoading(true);
      console.log('Testing regular sync...');
      const result = await syncData(true, false); // Show toasts, no force
      setSyncResult({ 
        type: 'regular', 
        success: result, 
        timestamp: new Date().toISOString() 
      });      if (result) {
        toast.success('Regular sync completed successfully');
      } else {
        toast.error('Regular sync completed but may have been skipped due to timing');
      }
      console.log('Regular sync result:', result);
    } catch (error) {
      console.error('Regular sync failed:', error);
      toast.error('Regular sync failed: ' + (error as Error).message);
      setSyncResult({ 
        type: 'regular', 
        success: false, 
        error: (error as Error).message, 
        timestamp: new Date().toISOString() 
      });
    } finally {
      setLoading(false);
    }
  };

  const testLoginSync = async () => {
    try {
      setLoading(true);
      console.log('Testing login sync (forced)...');
      const result = await syncDataOnLogin(true); // Show toasts, always force
      setSyncResult({ 
        type: 'login', 
        success: result, 
        timestamp: new Date().toISOString() 
      });
      if (result) {
        toast.success('Login sync completed successfully');
      } else {
        toast.error('Login sync failed');
      }
      console.log('Login sync result:', result);
    } catch (error) {
      console.error('Login sync failed:', error);
      toast.error('Login sync failed: ' + (error as Error).message);
      setSyncResult({ 
        type: 'login', 
        success: false, 
        error: (error as Error).message, 
        timestamp: new Date().toISOString() 
      });
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setApiResult(null);
    setSettingsResult(null);
    setSyncResult(null);
  };

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span>Has Token:</span>
                <Badge variant={authStatus?.hasToken ? 'default' : 'destructive'}>
                  {authStatus?.hasToken ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span>Authenticated:</span>
                <Badge variant={isAuthenticated ? 'default' : 'destructive'}>
                  {isAuthenticated ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span>Online:</span>
                <Badge variant={authStatus?.isOnline ? 'default' : 'secondary'}>
                  {authStatus?.isOnline ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div>User: <span className="font-mono text-sm">{authStatus?.user}</span></div>
            </div>
          </div>
          {authStatus?.token && (
            <div className="mt-2 text-sm text-gray-600">
              Token: <span className="font-mono">{authStatus.token.access_token}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Details API Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={testApiCall} disabled={loading || !isAuthenticated} variant="default">
              Test Direct API Call
            </Button>
            <Button onClick={testBusinessSettings} disabled={loading} variant="default">
              Test Business Settings
            </Button>
            <Button onClick={testDefaultSettings} disabled={loading} variant="outline">
              Get Default Settings
            </Button>
            <Button onClick={testRegularSync} disabled={loading || !isAuthenticated} variant="default">
              Test Regular Sync
            </Button>
            <Button onClick={testLoginSync} disabled={loading || !isAuthenticated} variant="default">
              Test Login Sync
            </Button>
            <Button onClick={clearResults} disabled={loading} variant="outline">
              Clear Results
            </Button>
          </div>

          {!isAuthenticated && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              ⚠️ Please login first to test the API calls. You can still test default settings and business settings logic.
            </div>
          )}

          {apiResult && (
            <div>
              <h3 className="font-semibold mb-2">Direct API Result:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-60">
                {JSON.stringify(apiResult, null, 2)}
              </pre>
            </div>
          )}

          {settingsResult && (
            <div>
              <h3 className="font-semibold mb-2">Business Settings Result:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-60">
                {JSON.stringify(settingsResult, null, 2)}
              </pre>
            </div>
          )}

          {syncResult && (
            <div>
              <h3 className="font-semibold mb-2">Sync Test Result:</h3>
              <div className="bg-gray-100 p-4 rounded text-sm space-y-2">
                <div><strong>Type:</strong> {syncResult.type} sync</div>
                <div><strong>Success:</strong> 
                  <Badge variant={syncResult.success ? 'default' : 'destructive'} className="ml-2">
                    {syncResult.success ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div><strong>Timestamp:</strong> {syncResult.timestamp}</div>
                {syncResult.error && (
                  <div><strong>Error:</strong> <span className="text-red-600">{syncResult.error}</span></div>
                )}
              </div>
            </div>
          )}

          {/* Network Status Warning */}
          {!isOnline && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              🔴 Currently offline - sync tests will fail
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessDetailsTest;
