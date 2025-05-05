import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogOut, Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNetwork } from '@/context/NetworkContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { isOnline } = useNetwork();
  
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-gray-800">Sadiid POS</h1>
        <div className={`ml-4 px-2 py-1 rounded-full text-xs ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {isOnline ? 'Online' : 'Offline'}
        </div>
      </div>
      
      {user && (
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <span>Welcome, </span>
            <span className="font-medium">{user.name}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </Button>
        </div>
      )}
    </header>
  );
};

export default Header;