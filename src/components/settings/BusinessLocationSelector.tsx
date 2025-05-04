import React, { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { BusinessLocation } from '@/services/businessSettings';
import { 
  getLocations, 
  saveSelectedLocationId, 
  formatLocationAddress 
} from '@/services/locationService';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { MapPin } from 'lucide-react';

const BusinessLocationSelector = () => {
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const { cart, setLocation } = useCart();
  
  useEffect(() => {
    const loadLocations = async () => {
      try {
        // Get active locations only
        const activeLocations = await getLocations(true);
        setLocations(activeLocations);
        setLoading(false);
      } catch (error) {
        console.error('Error loading business locations:', error);
        toast.error('Failed to load business locations');
        setLoading(false);
      }
    };
    
    loadLocations();
  }, []);
  
  const handleLocationChange = (locationId: string) => {
    const numericId = parseInt(locationId, 10);
    if (!isNaN(numericId)) {
      // Update cart context
      setLocation(numericId);
      
      // Store in localStorage via the service
      saveSelectedLocationId(numericId);
      
      toast.success('Business location updated');
    }
  };
  
  const getCurrentLocationName = () => {
    const location = locations.find(loc => loc.id === cart.location_id);
    return location ? location.name : 'Unknown location';
  };
  
  const currentLocation = locations.find(loc => loc.id === cart.location_id);
  const formattedAddress = formatLocationAddress(currentLocation || null);
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Location</CardTitle>
          <CardDescription>Select your active business location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-16">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (locations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Location</CardTitle>
          <CardDescription>Select your active business location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">No active business locations found</div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Location</CardTitle>
        <CardDescription>Select your active business location</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select 
          value={cart.location_id?.toString() || ''} 
          onValueChange={handleLocationChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select business location" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.id.toString()}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="bg-muted p-3 rounded-md">
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mr-2" />
            <span>Currently using: <strong>{getCurrentLocationName()}</strong></span>
          </div>
          {formattedAddress && (
            <div className="mt-1 text-xs text-muted-foreground">
              {formattedAddress}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessLocationSelector;
