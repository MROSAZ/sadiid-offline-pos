import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { saveSelectedLocationId, formatLocationAddress } from '@/services/locationService';
import { BusinessLocation } from '@/lib/businessSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useBusinessSettings } from '@/context/BusinessSettingsContext';
import { toast } from 'sonner';

const BusinessLocationSelector = () => {
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const { cart, setLocation } = useCart();
  const { settings, loading } = useBusinessSettings();
  
  useEffect(() => {
    if (settings?.locations) {
      // Filter to only active locations
      const activeLocations = settings.locations.filter(loc => loc.is_active === 1);
      setLocations(activeLocations);
    }
  }, [settings]);
  
  const handleLocationChange = async (locationId: string) => {
    const numericId = parseInt(locationId, 10);
    if (!isNaN(numericId)) {
      setLocation(numericId); // Updates cart context
      try {
        await saveSelectedLocationId(numericId); // Now async save to IndexedDB
        toast.success(`Business location set to ${getCurrentLocationName()}`);
      } catch (error) {
        toast.error('Failed to save location setting');
      }
    }
  };
  
  const getCurrentLocationName = () => {
    const currentLocation = locations.find(loc => loc.id === cart.location_id);
    return currentLocation?.name || 'Default Location';
  };
  
  const currentLocation = locations.find(loc => loc.id === cart.location_id);
  const formattedAddress = formatLocationAddress(currentLocation || null);
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Location</CardTitle>
          <CardDescription>Select your primary business location</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-sadiid-600" />
        </CardContent>
      </Card>
    );
  }
  
  if (locations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Location</CardTitle>
          <CardDescription>No business locations available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            No business locations were found. Please make sure you have at least one location configured in your business settings.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Location</CardTitle>
        <CardDescription>Select your primary business location</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select 
          value={cart.location_id?.toString() || ''}
          onValueChange={handleLocationChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select location">
              {getCurrentLocationName()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.id.toString()}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {currentLocation && (
          <div className="bg-gray-50 p-3 rounded-md text-sm">
            <p className="font-medium text-gray-700">{currentLocation.name}</p>
            {formattedAddress && (
              <p className="text-gray-500 mt-1">{formattedAddress}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BusinessLocationSelector;
