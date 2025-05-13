
import { useNetwork } from '@/context/NetworkContext';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NetworkStatusIndicatorProps {
  className?: string;
  showQuality?: boolean;
}

const NetworkStatusIndicator = ({
  className,
  showQuality = false
}: NetworkStatusIndicatorProps) => {
  const { isOnline, connectionQuality } = useNetwork();
  
  const getQualityColor = () => {
    switch (connectionQuality) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-green-500';
      case 'poor':
        return 'text-amber-500';
      default:
        return 'text-gray-500';
    }
  };
  
  const getQualityText = () => {
    switch (connectionQuality) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Good';
      case 'poor':
        return 'Poor';
      default:
        return 'Unknown';
    }
  };
  
  return (
    <div className={cn("flex items-center", className)}>
      {isOnline ? (
        <div className="flex items-center text-green-600">
          <Wifi className="h-4 w-4 mr-1" />
          <span className="text-sm">Online</span>
          
          {showQuality && (
            <span className={`ml-2 text-xs ${getQualityColor()}`}>
              ({getQualityText()})
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center text-amber-600">
          <WifiOff className="h-4 w-4 mr-1" />
          <span className="text-sm">Offline</span>
        </div>
      )}
    </div>
  );
};

export default NetworkStatusIndicator;
