
import React from 'react';
import { useNetwork } from '@/context/NetworkContext';
import { Wifi, WifiOff, CloudOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
        variant: 'destructive' as const
      };
    }
    
    switch (connectionQuality) {
      case 'excellent':
        return {
          icon: <Wifi size={16} />,
          text: 'Excellent',
          variant: 'default' as const
        };
      case 'good':
        return {
          icon: <Wifi size={16} />,
          text: 'Good',
          variant: 'secondary' as const
        };
      case 'poor':
        return {
          icon: <CloudOff size={16} />,
          text: 'Poor',
          variant: 'outline' as const
        };
      case 'unknown':
      default:
        return {
          icon: <Wifi size={16} />,
          text: 'Online',
          variant: 'secondary' as const
        };
    }
  };
  
  const { icon, text, variant } = getStatusInfo();
  
  return (
    <Badge 
      variant={variant}
      className={cn(
        'flex items-center gap-1.5 text-xs',
        className
      )}
    >
      {icon}
      {showText && <span>{text}</span>}
    </Badge>
  );
};

export default NetworkStatusIndicator;
