
import React from 'react';
import { useNetwork } from '@/context/NetworkContext';
import { Wifi, WifiOff, CloudOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NetworkStatusIndicatorProps {
  className?: string;
  showText?: boolean;
}

const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  className,
  showText = false
}) => {
  const { isOnline, connectionQuality } = useNetwork();
  
  // Get appropriate icon and color based on status
  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: <WifiOff size={16} />,
        text: 'Offline',
        colorClass: 'bg-red-500 text-white'
      };
    }
    
    switch (connectionQuality) {
      case 'excellent':
        return {
          icon: <Wifi size={16} />,
          text: 'Excellent',
          colorClass: 'bg-green-500 text-white'
        };
      case 'good':
        return {
          icon: <Wifi size={16} />,
          text: 'Good',
          colorClass: 'bg-green-400 text-white'
        };
      case 'poor':
        return {
          icon: <CloudOff size={16} />,
          text: 'Poor',
          colorClass: 'bg-yellow-500 text-white'
        };
      case 'unknown':
      default:
        return {
          icon: <Wifi size={16} />,
          text: 'Online',
          colorClass: 'bg-blue-500 text-white'
        };
    }
  };
  
  const { icon, text, colorClass } = getStatusInfo();
  
  return (
    <div 
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs',
        colorClass,
        className
      )}
    >
      {icon}
      {showText && <span>{text}</span>}
    </div>
  );
};

export default NetworkStatusIndicator;
