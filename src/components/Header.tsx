
// We'll add our NetworkStatusIndicator to the existing Header

// src/components/Header.tsx - adding NetworkStatusIndicator
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Wifi, LogOut } from 'lucide-react';
import { useNetwork } from '@/context/NetworkContext';
import { syncData } from '@/services/syncService';
import NetworkStatusIndicator from './NetworkStatusIndicator';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { isOnline } = useNetwork();
  const [syncing, setSyncing] = useState(false);
  
  const handleSync = async () => {
    if (!isOnline) return;
    
    setSyncing(true);
    try {
      await syncData(true);
    } finally {
      setSyncing(false);
    }
  };
  
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-sadiid-600">Sadiid POS</h1>
          <NetworkStatusIndicator showText />
        </div>
        
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm text-gray-600">
              {user.name || user.email}
            </span>
          )}
          
          {isOnline && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1"
            >
              <Wifi className="h-4 w-4" />
              {syncing ? 'Syncing...' : 'Sync'}
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={logout}
            className="flex items-center gap-1"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
