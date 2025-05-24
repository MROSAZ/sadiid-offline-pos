import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { fetchBusinessDetails } from '@/services/api';
import { getBusinessSettings, getDefaultBusinessSettings } from '@/lib/businessSettings';
import { getToken } from '@/lib/storage';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const BusinessDetailsTest: React.FC = () => {
  const [apiResult, setApiResult] = useState<any>(null);
  const [settingsResult, setSettingsResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<any>(null);
  const { user, isAuthenticated } = useAuth();

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

  const clearResults = () => {
    setApiResult(null);
    setSettingsResult(null);
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
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessDetailsTest;
